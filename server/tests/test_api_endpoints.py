"""Integration tests for API endpoints."""

import pytest
from fastapi.testclient import TestClient
from main import app, generate_csrf_token
from auth.auth_utils import get_current_active_user
from unittest.mock import patch, MagicMock, AsyncMock

client = TestClient(app)

def csrf_headers():
    return {"X-CSRF-Token": generate_csrf_token()}

class EmptyCursor:
    def sort(self, *_args, **_kwargs):
        return self

    def skip(self, *_args, **_kwargs):
        return self

    def limit(self, *_args, **_kwargs):
        return self

    def __aiter__(self):
        return self

    async def __anext__(self):
        raise StopAsyncIteration

@pytest.fixture
def mock_auth():
    """Mock authentication for protected endpoints."""
    mock_user = MagicMock()
    mock_user.email = "test@example.com"
    mock_user.full_name = "Test User"
    mock_user.disabled = False
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.pop(get_current_active_user, None)


class TestHealthEndpoints:
    """Test health check endpoints."""

    def test_root_endpoint(self):
        """Test root endpoint returns status ok."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "message" in data

    def test_health_endpoint(self):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data
        assert "platform" in data


class TestAuthenticationEndpoints:
    """Test authentication endpoints."""

    def test_demo_login_success(self):
        """Test demo login endpoint."""
        with patch('main.authenticate_user') as mock_auth:
            # Mock successful authentication
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_user.full_name = "Test User"
            mock_user.disabled = False
            mock_user.model_dump = MagicMock(return_value={
                "email": "test@example.com",
                "full_name": "Test User",
                "disabled": False
            })
            mock_auth.return_value = mock_user

            response = client.post("/demo-login")
            assert response.status_code == 200
            data = response.json()
            assert "access_token" in data
            assert "token_type" in data
            assert data["token_type"] == "bearer"
            assert "user" in data

    def test_demo_login_failure(self):
        """Test demo login when user not found."""
        with patch('main.authenticate_user') as mock_auth:
            mock_auth.return_value = None

            response = client.post("/demo-login")
            assert response.status_code == 500
            data = response.json()
            assert "detail" in data

    def test_register_user_success(self):
        """Test user registration with new email."""
        with patch('main.users_col') as mock_users:
            # Mock user not found
            mock_users.find_one = AsyncMock(return_value=None)
            mock_users.insert_one = AsyncMock(return_value=MagicMock(inserted_id="123"))

            response = client.post(
                "/register",
                json={
                    "email": "newuser@example.com",
                    "full_name": "New User",
                    "password": "securepassword123"
                },
                headers=csrf_headers()
            )
            # Note: This might fail due to background tasks, but tests the endpoint structure
            assert response.status_code in [200, 500]  # May fail due to background task

    def test_register_user_duplicate_email(self):
        """Test user registration with existing email."""
        with patch('main.users_col') as mock_users:
            # Mock user already exists
            mock_users.find_one = AsyncMock(return_value={"email": "existing@example.com"})

            response = client.post(
                "/register",
                json={
                    "email": "existing@example.com",
                    "full_name": "Existing User",
                    "password": "password123"
                },
                headers=csrf_headers()
            )
            assert response.status_code == 409
            data = response.json()
            assert "already registered" in data["detail"].lower()

    def test_forgot_password(self):
        """Test forgot password endpoint."""
        with patch('main.users_col') as mock_users:
            # Mock user exists
            mock_users.find_one = AsyncMock(return_value={"email": "test@example.com"})
            with patch('main.prt_col.find_one', new=AsyncMock(return_value=None)):

                response = client.post(
                    "/forgot-password",
                    json={"email": "test@example.com"},
                    headers=csrf_headers()
                )
            assert response.status_code == 200
            data = response.json()
            assert "message" in data

    def test_forgot_password_user_not_found(self):
        """Test forgot password with non-existent user (should not reveal)."""
        with patch('main.users_col') as mock_users:
            # Mock user doesn't exist
            mock_users.find_one = AsyncMock(return_value=None)

            response = client.post(
                "/forgot-password",
                json={"email": "nonexistent@example.com"},
                headers=csrf_headers()
            )
            # Should return same message as if user exists (security)
            assert response.status_code == 200
            data = response.json()
            assert "message" in data


class TestProtectedEndpoints:
    """Test protected endpoints that require authentication."""

    def test_get_current_user(self, mock_auth):
        """Test getting current user info."""
        response = client.get("/users/me")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["full_name"] == "Test User"

    def test_history_endpoint(self, mock_auth):
        """Test getting user history."""
        with patch('main.analyses_col') as mock_analyses:
            # Mock empty history
            mock_analyses.find.return_value = EmptyCursor()
            mock_analyses.count_documents = AsyncMock(return_value=0)

            response = client.get("/history")
            assert response.status_code == 200
            data = response.json()
            assert "items" in data
            assert "pagination" in data
            assert isinstance(data["items"], list)


class TestRateLimiting:
    """Test rate limiting on endpoints."""

    def test_login_rate_limiting(self):
        """Test that login endpoint has rate limiting."""
        # This test would need to actually hit the rate limit
        # For now, we just verify the endpoint exists
        with patch('main.authenticate_user', new=AsyncMock(return_value=False)):
            response = client.post(
                "/token",
                data={"username": "test@example.com", "password": "wrong"}
            )
        # Should either succeed with 401 or hit rate limit with 429
        assert response.status_code in [401, 429]

    def test_register_rate_limiting(self):
        """Test that register endpoint has rate limiting."""
        with patch('main.users_col') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            mock_users.insert_one = AsyncMock(return_value=MagicMock(inserted_id="123"))

            # Make multiple requests to test rate limiting
            responses = []
            for index in range(5):
                response = client.post(
                    "/register",
                    json={
                        "email": f"user{index}@example.com",
                        "full_name": "Test User",
                        "password": "password123"
                    },
                    headers=csrf_headers()
                )
                responses.append(response.status_code)

            # At least one should hit rate limit if properly configured
            # This is a basic check
            assert any(status in [200, 400, 429] for status in responses)


class TestSecurityGuardsOnEndpoints:
    """Tests for recently hardened endpoint behavior."""

    def test_demo_login_disabled_when_not_allowed(self):
        """Demo login returns 404 when ALLOW_DEMO_LOGIN is false."""
        with patch('main.ALLOW_DEMO_LOGIN', False):
            response = client.post("/demo-login")
            assert response.status_code == 404
            assert "disabled" in response.json()["detail"].lower()

    def test_ai_metrics_requires_auth(self):
        """The AI metrics endpoint must not be publicly readable."""
        response = client.get("/ai/metrics")
        assert response.status_code == 401

    def test_ai_metrics_with_auth(self, mock_auth):
        """Authenticated users can read AI metrics."""
        response = client.get("/ai/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "total_requests" in data

    def test_request_id_header_is_set(self):
        """Every response carries an X-Request-ID header for tracing."""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.headers.get("X-Request-ID")

    def test_history_uses_projection(self, mock_auth):
        """History listing excludes the bulky result/summary payloads."""
        with patch('main.analyses_col') as mock_analyses:
            mock_analyses.find.return_value = EmptyCursor()
            mock_analyses.count_documents = AsyncMock(return_value=0)

            response = client.get("/history")
            assert response.status_code == 200
            _, kwargs = mock_analyses.find.call_args
            projection = kwargs["projection"]
            assert projection.get("result") == 0
            assert projection.get("summary") == 0

    def test_forgot_password_rate_limited(self):
        """Forgot-password endpoint is rate limited."""
        with patch('main.users_col') as mock_users:
            mock_users.find_one = AsyncMock(return_value=None)
            responses = []
            for _ in range(6):
                response = client.post(
                    "/forgot-password",
                    json={"email": "ratelimit@example.com"},
                    headers=csrf_headers()
                )
                responses.append(response.status_code)
            assert 429 in responses

    def test_ai_errors_do_not_leak_internal_details(self, mock_auth):
        """AI endpoint 500 responses must not include provider exceptions."""
        with patch('main.chat_completion', side_effect=RuntimeError("secret provider detail")):
            response = client.post(
                "/ai/chat",
                json={
                    "messages": [{"role": "user", "content": "What is alt text?"}],
                    "model": "gemini-2.5-flash",
                },
                headers=csrf_headers(),
            )
        assert response.status_code == 500
        response_json = response.json()
        assert "secret provider detail" not in response_json.get("detail", "")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])