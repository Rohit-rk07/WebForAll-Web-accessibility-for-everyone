"""Content filtering service for AI safety and accessibility topic restriction."""

import re
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class ContentFilterResult:
    """Result of content filtering."""
    is_safe: bool
    reason: Optional[str]
    filtered_content: Optional[str]
    confidence: float

class ContentFilter:
    """
    Content filtering service to ensure AI responses stay within accessibility topics
    and filter out harmful content.
    """
    
    # Accessibility-related keywords (allow-list)
    ACCESSIBILITY_KEYWORDS = [
        'accessibility', 'wcag', 'ada', '508', 'screen reader', 'aria', 'alt text',
        'keyboard navigation', 'focus management', 'color contrast', 'semantic html',
        'assistive technology', 'caption', 'transcript', 'landmark', 'heading',
        'alt', 'title', 'label', 'role', 'tabindex', 'skip link', 'error message',
        'form validation', 'landmark', 'region', 'navigation', 'main', 'header',
        'footer', 'aside', 'section', 'article', 'ul', 'ol', 'dl', 'table',
        'caption', 'th', 'scope', 'aria-live', 'aria-atomic', 'aria-busy',
        'aria-controls', 'aria-current', 'aria-describedby', 'aria-details',
        'aria-disabled', 'aria-dropeffect', 'aria-errormessage', 'aria-flowto',
        'aria-grabbed', 'aria-haspopup', 'aria-hidden', 'aria-invalid', 'aria-keyshortcuts',
        'aria-label', 'aria-labelledby', 'aria-level', 'aria-live', 'aria-modal',
        'aria-multiline', 'aria-multiselectable', 'aria-orientation', 'aria-owns',
        'aria-placeholder', 'aria-polite', 'aria-posinset', 'aria-pressed',
        'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
        'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected', 'aria-setsize',
        'aria-sort', 'aria-valuemax', 'aria-valuemin', 'aria-valuenow', 'aria-valuetext'
    ]
    
    # Potentially harmful content patterns (block-list)
    HARMFUL_PATTERNS = [
        r'malware', r'virus', r'trojan', r'phishing', r'scam', r'fraud',
        r'illegal', r'criminal', r'drug', r'weapon', r'violence',
        r'(?:cause|causing|inflict)\s+harm',
        r'racist', r'sexist', r'discriminat', r'hate\s', r'extremist'
    ]
    
    # Code execution patterns (block-list)
    CODE_EXECUTION_PATTERNS = [
        r'eval\s*\(', r'exec\s*\(', r'system\s*\(', r'shell_exec\s*\(',
        r'passthru\s*\(', r'backtick\s*\(', r'popen\s*\(', r'proc_open\s*\(',
        r'<script[^>]*>', r'on\w+\s*=', r'javascript\s*:', r'data\s*:\s*text/html'
    ]
    
    def __init__(self):
        """Initialize the content filter."""
        self.accessibility_pattern = re.compile(
            r'\b(' + '|'.join(re.escape(kw) for kw in self.ACCESSIBILITY_KEYWORDS) + r')\b',
            re.IGNORECASE
        )
        self.harmful_pattern = re.compile(
            r'\b(' + '|'.join(self.HARMFUL_PATTERNS) + r')\b',
            re.IGNORECASE
        )
        self.code_execution_pattern = re.compile(
            '|'.join(self.CODE_EXECUTION_PATTERNS),
            re.IGNORECASE
        )
    
    def is_accessibility_related(self, text: str) -> bool:
        """
        Check if text is related to accessibility topics.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains accessibility-related keywords
        """
        return bool(self.accessibility_pattern.search(text))
    
    def contains_harmful_content(self, text: str) -> bool:
        """
        Check if text contains potentially harmful content.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains harmful patterns
        """
        return bool(self.harmful_pattern.search(text))
    
    def contains_code_execution(self, text: str) -> bool:
        """
        Check if text contains code execution patterns.
        
        Args:
            text: Text to check
            
        Returns:
            True if text contains code execution patterns
        """
        return bool(self.code_execution_pattern.search(text))
    
    def filter_ai_response(self, response: str, user_query: str) -> ContentFilterResult:
        """
        Filter AI response for safety and topic compliance.
        
        Args:
            response: AI response to filter
            user_query: Original user query for context
            
        Returns:
            ContentFilterResult with filtering status
        """
        # Check for harmful content
        if self.contains_harmful_content(response):
            logger.warning("AI response contains harmful content")
            return ContentFilterResult(
                is_safe=False,
                reason="Response contains potentially harmful content",
                filtered_content=None,
                confidence=0.9
            )
        
        # Check for code execution patterns
        if self.contains_code_execution(response):
            logger.warning("AI response contains code execution patterns")
            return ContentFilterResult(
                is_safe=False,
                reason="Response contains potentially dangerous code execution patterns",
                filtered_content=None,
                confidence=0.85
            )
        
        # Check if response is accessibility-related
        if not self.is_accessibility_related(response):
            logger.warning("AI response is not accessibility-related")
            return ContentFilterResult(
                is_safe=False,
                reason="Response is not related to accessibility topics",
                filtered_content=None,
                confidence=0.7
            )
        
        # Response passes all checks
        return ContentFilterResult(
            is_safe=True,
            reason=None,
            filtered_content=response,
            confidence=0.8
        )
    
    def filter_user_query(self, query: str) -> ContentFilterResult:
        """
        Filter user query for safety and topic compliance.
        
        Args:
            query: User query to filter
            
        Returns:
            ContentFilterResult with filtering status
        """
        # Check for harmful content
        if self.contains_harmful_content(query):
            logger.warning("User query contains harmful content")
            return ContentFilterResult(
                is_safe=False,
                reason="Query contains potentially harmful content",
                filtered_content=None,
                confidence=0.9
            )
        
        # Check if query is accessibility-related
        if not self.is_accessibility_related(query):
            logger.info("User query is not accessibility-related")
            return ContentFilterResult(
                is_safe=False,
                reason="Query is not related to accessibility topics",
                filtered_content=None,
                confidence=0.6
            )
        
        # Query passes all checks
        return ContentFilterResult(
            is_safe=True,
            reason=None,
            filtered_content=query,
            confidence=0.8
        )
    
    def sanitize_html_output(self, html: str) -> str:
        """
        Sanitize HTML output to remove potentially dangerous elements.
        
        Args:
            html: HTML string to sanitize
            
        Returns:
            Sanitized HTML string
        """
        # Remove script tags
        html = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove iframe tags
        html = re.sub(r'<iframe[^>]*>.*?</iframe>', '', html, flags=re.IGNORECASE | re.DOTALL)
        
        # Remove on* event handlers
        html = re.sub(r'\s+on\w+\s*=\s*["\'][^"\']*["\']', '', html, flags=re.IGNORECASE)
        
        # Remove javascript: protocols
        html = re.sub(r'javascript\s*:', '', html, flags=re.IGNORECASE)
        
        # Remove data:text/html
        html = re.sub(r'data\s*:\s*text/html', '', html, flags=re.IGNORECASE)
        
        return html.strip()

# Global content filter instance
content_filter = ContentFilter()