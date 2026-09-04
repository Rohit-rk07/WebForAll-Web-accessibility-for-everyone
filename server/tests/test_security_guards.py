import pytest
from pydantic import ValidationError

from main import validate_public_url
from models.analysis_models import ChatCompletionRequest, HTMLAnalysisRequest


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
