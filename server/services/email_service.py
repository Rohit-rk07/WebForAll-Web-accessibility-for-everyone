"""Email service module for sending notifications."""

import os
import logging
import smtplib
from email.message import EmailMessage

logger = logging.getLogger(__name__)

# Email settings (replace with actual SMTP settings in production)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "1025"))  # Default to MailHog port
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@accessibilityanalyzer.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5175")

def send_email(to_email: str, subject: str, body: str) -> bool:
    """
    Send an email (mock implementation for development).
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        body (str): Email body content
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    try:
        msg = EmailMessage()
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        msg.set_content(body)
        
        # Log for observability in all environments
        logger.info(f"Email to: {to_email}, Subject: {subject}")
        
        # Send email via SMTP (supports local dev like MailHog or real SMTP)
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            try:
                # Try STARTTLS if server supports it
                server.starttls()
            except Exception:
                # Some dev servers (e.g., MailHog) do not support STARTTLS; ignore
                pass
            if EMAIL_USER and EMAIL_PASSWORD:
                try:
                    server.login(EMAIL_USER, EMAIL_PASSWORD)
                except Exception:
                    # If login not required (MailHog), continue
                    pass
            server.send_message(msg)
        
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_welcome_email(email: str, name: str) -> bool:
    """
    Send welcome email to new user.
    
    Args:
        email (str): User's email address
        name (str): User's full name
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = "Welcome to Accessibility Analyzer"
    body = f"""
    Hello {name},

    Welcome to Accessibility Analyzer! Your account has been created successfully.

    You can now log in and start analyzing websites for accessibility issues.

    Visit: {FRONTEND_URL}

    Best regards,
    The Accessibility Analyzer Team
    """
    
    return send_email(email, subject, body)

def send_password_reset_email(email: str, token: str) -> bool:
    """
    Send password reset email.
    
    Args:
        email (str): User's email address
        token (str): Password reset token
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    subject = "Password Reset - Accessibility Analyzer"
    reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
    
    body = f"""
    Hello,

    You have requested to reset your password for Accessibility Analyzer.

    Click the link below to reset your password:
    {reset_url}

    This link will expire in 1 hour.

    If you did not request this password reset, please ignore this email.

    Best regards,
    The Accessibility Analyzer Team
    """
    
    return send_email(email, subject, body)
