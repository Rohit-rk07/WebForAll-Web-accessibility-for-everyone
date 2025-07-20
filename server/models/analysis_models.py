"""Analysis request and response models."""

from pydantic import BaseModel, HttpUrl
from typing import Optional, Dict, List, Any

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
    content: str
    base_url: Optional[str] = None
    wcag_options: Optional[WCAGOptions] = None

class ChatMessage(BaseModel):
    """Chat message model."""
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    """Chat completion request model."""
    messages: List[ChatMessage]
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: Optional[int] = None

class ExplainRequest(BaseModel):
    """Request model for explaining accessibility issues."""
    issue: Dict[str, Any]

class SummaryRequest(BaseModel):
    """Request model for generating accessibility summaries."""
    results: Dict[str, Any]
