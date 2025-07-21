"""Services module."""

from .email_service import (
    send_email,
    send_welcome_email,
    send_password_reset_email
)

from .ai_service import (
    initialize_gemini,
    chat_completion,
    explain_accessibility_issue,
    generate_fallback_explanation,
    GEMINI_CONFIGURED
)

__all__ = [
    # Email services
    "send_email",
    "send_welcome_email", 
    "send_password_reset_email",
    # AI services
    "initialize_gemini",
    "chat_completion",
    "explain_accessibility_issue",
    "generate_fallback_explanation",
    "GEMINI_CONFIGURED"
]
