"""Data models for accessibility analysis."""

from pydantic import BaseModel, HttpUrl
from typing import List, Dict, Any, Optional, Literal

class HTMLInput(BaseModel):
    """Input model for HTML content."""
    html: str

class URLInput(BaseModel):
    """Input model for URL analysis."""
    url: HttpUrl

class AccessibilityIssue(BaseModel):
    """Model for individual accessibility issues."""
    severity: Literal["error", "warning", "info"]
    category: str
    title: str
    description: str
    element: str
    recommendation: str
    wcag_criterion: Optional[str] = None
    impact: Optional[str] = None
    help_url: Optional[HttpUrl] = None

class AnalysisSummary(BaseModel):
    """Summary of accessibility analysis results."""
    errors: int
    warnings: int
    notices: int
    passed: int
    total_checks: int
    axe_violations: int = 0
    best_practices_violations: int = 0
    score: float

class AnalysisResult(BaseModel):
    """Complete analysis result model."""
    issues: List[AccessibilityIssue]
    summary: AnalysisSummary
    score: float
    metadata: Dict[str, Any] 