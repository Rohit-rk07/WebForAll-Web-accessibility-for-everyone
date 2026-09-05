"""Coverage for checklist sections 4-10: input validation, DB isolation,
analyzer failure behavior, AI/content-filter behavior, rate-limit retry info."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient

import services.ai_service as ai_service
from main import app, generate_csrf_token, rate_limited_response
from auth.auth_utils import get_current_active_user
from services.content_filter import content_filter

client = TestClient(app)


def csrf_headers():
    return {"X-CSRF-Token": generate_csrf_token()}


@pytest.fixture
def mock_auth():
    mock_user = MagicMock()
    mock_user.email = "test@example.com"
    mock_user.full_name = "Test User"
    mock_user.disabled = False
    app.dependency_overrides[get_current_active_user] = lambda: mock_user
    yield mock_user
    app.dependency_overrides.pop(get_current_active_user, None)


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


class TestUploadValidation:
    def test_non_html_extension_rejected(self, mock_auth):
        response = client.post(
            "/analyze/file",
            files={"file": ("notes.txt", b"<html></html>", "text/html")},
            headers=csrf_headers(),
        )
        assert response.status_code == 400
        assert "HTML" in response.json()["detail"]

    def test_non_utf8_content_rejected(self, mock_auth):
        response = client.post(
            "/analyze/file",
            files={"file": ("bad.html", b"\xff\xfe\x00\x00binary\x00", "text/html")},
            headers=csrf_headers(),
        )
        assert response.status_code == 400
        assert "UTF-8" in response.json()["detail"]

    def test_malformed_wcag_options_rejected(self, mock_auth):
        with patch("main.run_analysis_with_timeout", new=AsyncMock(return_value={"success": True, "violations": []})):
            response = client.post(
                "/analyze/file",
                files={"file": ("ok.html", b"<html><body>hi</body></html>", "text/html")},
                data={"wcag_options": "not-json"},
                headers=csrf_headers(),
            )
        assert response.status_code == 400


class TestInputValidationEdges:
    def test_invalid_history_id_never_touches_db(self, mock_auth):
        with patch("main.analyses_col") as mock_analyses:
            response = client.get("/history/not-an-objectid")
            assert response.status_code == 400
            mock_analyses.find_one.assert_not_called()

    def test_history_pagination_is_bounded(self, mock_auth):
        with patch("main.analyses_col") as mock_analyses:
            mock_analyses.find.return_value = EmptyCursor()
            mock_analyses.count_documents = AsyncMock(return_value=0)
            response = client.get("/history?limit=1000&skip=-5")
            assert response.status_code == 200
            pagination = response.json()["pagination"]
            assert pagination["limit"] == 100
            assert pagination["skip"] == 0


class TestCrossUserIsolation:
    """Ownership filters must be present on every user-owned query."""

    def test_history_list_is_filtered_by_owner(self, mock_auth):
        with patch("main.analyses_col") as mock_analyses:
            mock_analyses.find.return_value = EmptyCursor()
            mock_analyses.count_documents = AsyncMock(return_value=0)
            client.get("/history")
            query = mock_analyses.find.call_args.args[0]
            assert query.get("owner_email") == "test@example.com"

    def test_history_read_is_filtered_by_owner(self, mock_auth):
        with patch("main.analyses_col") as mock_analyses:
            mock_analyses.find_one = AsyncMock(return_value=None)
            response = client.get("/history/507f1f77bcf86cd799439011")
            assert response.status_code == 404
            query = mock_analyses.find_one.call_args[0][0]
            assert query.get("owner_email") == "test@example.com"

    def test_history_delete_is_filtered_by_owner(self, mock_auth):
        with patch("main.analyses_col") as mock_analyses:
            mock_analyses.delete_one = AsyncMock(return_value=MagicMock(deleted_count=0))
            response = client.delete(
                "/history/507f1f77bcf86cd799439011",
                headers=csrf_headers(),
            )
            assert response.status_code == 404
            query = mock_analyses.delete_one.call_args[0][0]
            assert query.get("owner_email") == "test@example.com"


class TestAnalyzerFailureIsNot200:
    def test_html_analysis_failure_returns_502(self, mock_auth):
        with patch("main.run_analysis_with_timeout", new=AsyncMock(return_value={"success": False, "error": "boom"})):
            response = client.post(
                "/analyze/html",
                json={"content": "<html><body>hi</body></html>"},
                headers=csrf_headers(),
            )
        assert response.status_code == 502
        assert "failed" in response.json()["detail"].lower()


class TestContentFilter:
    def test_normal_accessibility_query_allowed(self):
        result = content_filter.filter_user_query("How can I improve alt text for images?")
        assert result.is_safe is True

    def test_off_topic_query_blocked(self):
        result = content_filter.filter_user_query("What is the weather today in Paris?")
        assert result.is_safe is False

    def test_harmful_query_blocked(self):
        result = content_filter.filter_user_query("How do I deploy this malware?")
        assert result.is_safe is False

    def test_executable_snippet_blocked_in_response(self):
        result = content_filter.filter_ai_response(
            "<img src=x onerror=alert(1)>", "help with images"
        )
        assert result.is_safe is False

    def test_sanitize_strips_event_handlers_and_scripts(self):
        html = '<script>alert(1)</script><a href="#" onclick="x()">link</a>'
        out = content_filter.sanitize_html_output(html)
        assert "<script" not in out
        assert "onclick" not in out


class TestAIEndpoints:
    def test_chat_requires_auth(self):
        with patch("main.chat_completion", return_value={"content": "x"}):
            # CSRF token present but no Authorization header -> 401
            response = client.post(
                "/ai/chat",
                json={"messages": [{"role": "user", "content": "what is alt text?"}]},
                headers=csrf_headers(),
            )
        assert response.status_code == 401

    def test_chat_success(self, mock_auth):
        payload = {"content": "Use descriptive alt text."}
        with patch("main.chat_completion", return_value=payload):
            response = client.post(
                "/ai/chat",
                json={
                    "messages": [{"role": "user", "content": "what is alt text?"}],
                    "model": "gemini-2.5-flash",
                    "temperature": 0.5,
                },
                headers=csrf_headers(),
            )
        assert response.status_code == 200
        assert response.json() == payload

    def test_chat_rejects_unknown_model(self, mock_auth):
        response = client.post(
            "/ai/chat",
            json={"messages": [{"role": "user", "content": "hi"}], "model": "gpt-999"},
            headers=csrf_headers(),
        )
        assert response.status_code == 422

    def test_chat_rejects_oversized_message_list(self, mock_auth):
        messages = [{"role": "user", "content": f"m{i}"} for i in range(40)]
        response = client.post(
            "/ai/chat",
            json={"messages": messages},
            headers=csrf_headers(),
        )
        assert response.status_code == 422

    def test_explain_success(self, mock_auth):
        payload = {"fixedCode": "<img alt='x'>", "explanation": "Add alt text."}
        with patch("main.explain_accessibility_issue", return_value=payload):
            response = client.post(
                "/ai/explain",
                json={"issue": {"id": "image-alt", "help": "Add alt", "nodes": []}},
                headers=csrf_headers(),
            )
        assert response.status_code == 200
        assert response.json() == payload

    def test_summary_success(self, mock_auth):
        with patch("main.run_analysis_with_timeout"):
            response = client.post(
                "/ai/summary",
                json={
                    "results": {
                        "violations": [{"impact": "critical"}, {"impact": "serious"}],
                        "passes": [{"id": "a"}],
                        "incomplete": [],
                        "inapplicable": [],
                    }
                },
                headers=csrf_headers(),
            )
        assert response.status_code == 200
        data = response.json()
        assert data["counts"]["violations"] == 2
        assert data["score"] == 100 - 20 - 12


class TestRateLimitRetryInfo:
    def test_handler_includes_retry_after_header(self):
        from collections import namedtuple
        fake_limit = namedtuple("Limit", ["granularity"])(60)

        class FakeRequest:
            state = None

        class FakeState:
            view_rate_limit = fake_limit

        req = FakeRequest()
        req.state = FakeState()
        response = rate_limited_response(req, None)
        assert response.status_code == 429
        assert response.headers.get("Retry-After") == "60"


class TestAIMetricsAccuracy:
    def _reset_metrics(self):
        ai_service.AI_METRICS.clear()
        ai_service.AI_METRICS.update({
            "total_requests": 0,
            "successful_requests": 0,
            "failed_requests": 0,
            "cached_responses": 0,
            "average_response_time_ms": 0,
            "response_times": [],
        })

    def test_metrics_count_requests_and_failures(self):
        self._reset_metrics()
        ai_service.record_ai_metric("request_started", 1)
        ai_service.record_ai_metric("request_started", 1)
        ai_service.record_ai_metric("failed_request", 1)
        metrics = ai_service.get_ai_metrics()
        assert metrics["total_requests"] == 2
        assert metrics["failed_requests"] == 1

    def test_metrics_track_success_latency(self):
        self._reset_metrics()
        ai_service.record_ai_metric("request_started", 1)
        ai_service.record_ai_metric("response_time", 100)
        ai_service.record_ai_metric("successful_request", 1)
        metrics = ai_service.get_ai_metrics()
        assert metrics["successful_requests"] == 1
        assert metrics["average_response_time_ms"] == 100