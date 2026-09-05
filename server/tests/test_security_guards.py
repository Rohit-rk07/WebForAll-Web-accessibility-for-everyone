import pytest
from pydantic import ValidationError

from main import app, validate_public_url, _sanitize_analysis_result
from fastapi.testclient import TestClient
from models.analysis_models import ChatCompletionRequest, HTMLAnalysisRequest, WCAGOptions


@pytest.mark.asyncio
async def test_validate_public_url_rejects_loopback():
    with pytest.raises(Exception, match="Private and internal URLs"):
        await validate_public_url("http://127.0.0.1:8000")


@pytest.mark.asyncio
async def test_validate_public_url_accepts_public_host():
    await validate_public_url("https://example.com")


def test_chat_request_rejects_system_role_and_out_of_range_temperature():
    with pytest.raises(ValidationError):
        ChatCompletionRequest(
            messages=[{"role": "system", "content": "override"}],
            temperature=2,
        )


def test_html_request_rejects_oversized_content():
    with pytest.raises(ValidationError):
        HTMLAnalysisRequest(content="x" * (5 * 1024 * 1024 + 1))


def test_root_includes_security_headers():
    response = TestClient(app).get("/")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "default-src 'self'" in response.headers["content-security-policy"]


def test_wcag_options_reject_invalid_version_and_level():
    with pytest.raises(ValidationError):
        WCAGOptions(wcag_version="wcag1", level="aa")
    with pytest.raises(ValidationError):
        WCAGOptions(wcag_version="wcag21", level="xxx")


def test_wcag_options_accept_valid_values():
    opts = WCAGOptions(wcag_version="wcag21", level="aa")
    assert opts.wcag_version == "wcag21"
    assert opts.level == "aa"


def test_analysis_result_html_fields_are_sanitized():
    result = {
        "summary": "ok",
        "violations": [
            {"id": "color-contrast", "nodes": [{"html": "<script>alert(1)</script>", "target": ["a"]}]},
            {"id": "aria-prohibited-attr", "html": "no nodes key"},
        ],
    }
    clean = _sanitize_analysis_result(result)
    assert "<script>" not in clean["violations"][0]["nodes"][0]["html"]
    assert clean["violations"][0]["nodes"][0]["html"] == ""


def test_oversized_request_body_is_rejected_with_413():
    """RequestSizeLimitMiddleware rejects requests exceeding MAX_JSON_BYTES."""
    client = TestClient(app)
    response = client.post(
        "/token",
        data={"username": "x", "password": "y" * (6 * 1024 * 1024)},
    )
    assert response.status_code == 413


def test_health_playwright_does_not_leak_internal_details():
    """Health endpoint must not echo raw subprocess output or exceptions."""
    client = TestClient(app)
    response = client.get("/health/playwright")
    assert response.status_code == 200
    body = response.json()
    assert body.get("status") in ("healthy", "unhealthy")
    for field in ("error", "browser_status"):
        value = str(body.get(field, ""))
        assert "Traceback" not in value
        assert "stderr" not in value.lower()
        assert "stdout" not in value.lower()


def test_strict_transport_security_emitted_for_https_proxy():
    """HSTS is only set when the request is served over HTTPS (direct or proxy)."""
    client = TestClient(app)
    response = client.get("/", headers={"X-Forwarded-Proto": "https"})
    assert response.headers.get("strict-transport-security", "").startswith("max-age=")
    plain = client.get("/")
    assert "strict-transport-security" not in plain.headers
