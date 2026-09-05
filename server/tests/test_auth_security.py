"""Security-focused tests: CSRF, JWT validation, auth non-enumeration, password policy."""

import datetime

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from main import app
from auth.auth_models import PasswordReset, UserCreate
from auth.auth_utils import JWT_AUDIENCE, JWT_ISSUER, SECRET_KEY, ALGORITHM, get_current_user
from tests.test_api_endpoints import csrf_headers

client = TestClient(app)


def _make_token(**claims_override):
    claims = {
        "sub": "test@example.com",
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30),
        "iss": JWT_ISSUER,
        "aud": JWT_AUDIENCE,
    }
    claims.update(claims_override)
    return pyjwt.encode(claims, SECRET_KEY, algorithm=ALGORITHM)


class TestCSRFOnUnauthenticatedStateChangingRoutes:
    """Every unauthenticated state-changing route requires a CSRF token.

    /token and /demo-login are deliberately exempt (documented in API_DOCUMENTATION.md):
    browsers submit the login form directly, and demo-login consumes no user data.
    """

    @pytest.mark.parametrize("path,payload", [
        ("/register", {"email": "new@example.com", "full_name": "T", "password": "password123"}),
        ("/forgot-password", {"email": "new@example.com"}),
        ("/reset-password", {"token": "whatever", "new_password": "password123"}),
    ])
    def test_missing_csrf_token_is_rejected(self, path, payload):
        response = client.post(path, json=payload)
        assert response.status_code == 403
        assert "CSRF" in response.json()["detail"]

    def test_valid_csrf_token_passes_forgot_password(self):
        import main as main_module
        from unittest.mock import AsyncMock, patch
        with patch.object(main_module.users_col, "find_one", new=AsyncMock(return_value=None)):
            response = client.post(
                "/forgot-password",
                json={"email": "new@example.com"},
                headers=csrf_headers(),
            )
        # 200 = endpoint handled; 429 = CSRF passed but rate limit hit first.
        assert response.status_code in (200, 429)


class TestJWTValidation:
    def test_tampered_signature_rejected(self):
        token = _make_token() + "tampered"
        response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_expired_token_rejected(self):
        token = _make_token(exp=datetime.datetime.utcnow() - datetime.timedelta(minutes=1))
        response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_wrong_audience_rejected(self):
        token = _make_token(aud="some-other-client")
        response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_wrong_issuer_rejected(self):
        token = _make_token(iss="some-other-issuer")
        response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_missing_subject_rejected(self):
        token = _make_token(sub=None)
        response = client.get("/users/me", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401

    def test_disabled_user_rejected(self):
        """A disabled account must not receive data even with a valid token."""
        from auth.auth_models import UserInDB
        mock_user = UserInDB(
            email="disabled@example.com",
            full_name="Disabled",
            hashed_password="x",
            disabled=True,
        )
        app.dependency_overrides[get_current_user] = lambda: mock_user
        try:
            response = client.get("/users/me", headers={"Authorization": f"Bearer {_make_token()}"})
            assert response.status_code == 401
        finally:
            app.dependency_overrides.pop(get_current_user, None)


class TestAuthenticationNonEnumeration:
    def test_login_response_is_identical_for_unknown_email_and_wrong_password(self):
        """Unknown email and wrong password return the exact same 401 body."""
        from unittest.mock import AsyncMock, patch
        with patch("main.authenticate_user", new=AsyncMock(return_value=False)):
            unknown = client.post(
                "/token", data={"username": "nobody@example.com", "password": "password123"}
            )
            wrong = client.post(
                "/token", data={"username": "real@example.com", "password": "definitelywrong"}
            )
        assert unknown.status_code == wrong.status_code == 401
        assert unknown.json() == wrong.json()


class TestPasswordPolicy:
    @pytest.mark.parametrize("password", [
        "short1",      # too short
        "abcdefgh",    # no digit
        "12345678",    # no letter
        "a1" * 65,     # too long (>128)
    ])
    def test_weak_passwords_rejected_on_register(self, password):
        with pytest.raises(ValidationError):
            UserCreate(email="u@example.com", full_name="U", password=password)

    def test_strong_password_accepted_on_register(self):
        user = UserCreate(email="u@example.com", full_name="U", password="securepass123")
        assert user.password == "securepass123"

    @pytest.mark.parametrize("password", ["abcdefgh", "12345678", "short1"])
    def test_weak_passwords_rejected_on_reset(self, password):
        with pytest.raises(ValidationError):
            PasswordReset(token="tok", new_password=password)

    def test_strong_password_accepted_on_reset(self):
        reset = PasswordReset(token="tok", new_password="securepass123")
        assert reset.new_password == "securepass123"