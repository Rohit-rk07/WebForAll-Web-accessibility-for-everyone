"""Analysis request and response models."""

from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional, Dict, List, Any, Literal
import json

class WCAGOptions(BaseModel):
    """Options for WCAG version and level selection."""
    wcag_version: str = "wcag21"
    level: str = "aa"
    best_practice: bool = True

class URLAnalysisRequest(BaseModel):
    """Request model for URL-based accessibility analysis."""
    url: HttpUrl
    wcag_options: Optional[WCAGOptions] = None

class HTMLAnalysisRequest(BaseModel):
    """Request model for HTML-based accessibility analysis."""
    content: str = Field(min_length=1, max_length=5 * 1024 * 1024)
    base_url: Optional[HttpUrl] = None
    wcag_options: Optional[WCAGOptions] = None

class ChatMessage(BaseModel):
    """Chat message model."""
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=10000)

class ChatCompletionRequest(BaseModel):
    """Chat completion request model."""
    messages: List[ChatMessage] = Field(min_length=1, max_length=30)
    model: Literal["gemini-2.5-flash"] = "gemini-2.5-flash"
    temperature: float = Field(default=0.7, ge=0, le=1)
    max_tokens: Optional[int] = Field(default=None, ge=1, le=4096)

class ExplainRequest(BaseModel):
    """Request model for explaining accessibility issues."""
    issue: Dict[str, Any] = Field(min_length=1)

    @field_validator("issue")
    @classmethod
    def limit_issue_size(cls, value):
        if len(json.dumps(value)) > 100_000:
            raise ValueError("Issue payload is too large")
        return value

class SummaryRequest(BaseModel):
    """Request model for generating accessibility summaries."""
    results: Dict[str, Any] = Field(min_length=1)
