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
    
    # Accessibility-related keyword stems (allow-list).
    # Stems are intentionally broad so normal accessibility language such as
    # "accessible", "readability" or "screen readers" is never blocked.
    # The list includes common misspellings and squashed variants so that
    # typo'd queries ("accesibility", "screenreader") are still recognized.
    ACCESSIBILITY_KEYWORDS = [
        # Core concepts (includes typos on purpose to stay permissive)
        'accessib', 'accesib', 'accesibiliti', 'accesibilty', 'accessibilty',
        'a11y', 'wcag', 'ada', '508 compliance', 'screen reader', 'screenread',
        'screenreader', 'screen-reader', 'aria', 'alt text', 'alt tex',
        'keyboard', 'keyboad', 'navigat', 'navg', 'tab order', 'focus',
        'focusable', 'disabled', 'disabl', 'impair', 'assistive', 'usability',
        # Visual / content aspects
        'contrast', 'color', 'colour', 'readab', 'legib', 'visib', 'font',
        'font size', 'dyslex', 'zoom', 'magnif', 'prefers', 'reduced motion',
        # Structure
        'semantic', 'caption', 'transcript', 'landmark', 'heading', 'header',
        'footer', 'alt', 'title', 'label', 'role', 'tabindex', 'skip link',
        'error message', 'form validation', 'region', 'navigation', 'main',
        'aside', 'section', 'article', 'table', 'scope',
        # ARIA attributes
        'aria-live', 'aria-atomic', 'aria-busy', 'aria-controls',
        'aria-current', 'aria-describedby', 'aria-details', 'aria-disabled',
        'aria-dropeffect', 'aria-errormessage', 'aria-flowto', 'aria-grabbed',
        'aria-haspopup', 'aria-hidden', 'aria-invalid', 'aria-keyshortcuts',
        'aria-label', 'aria-labelledby', 'aria-level', 'aria-live', 'aria-modal',
        'aria-multiline', 'aria-multiselectable', 'aria-orientation', 'aria-owns',
        'aria-placeholder', 'aria-polite', 'aria-posinset', 'aria-pressed',
        'aria-readonly', 'aria-relevant', 'aria-required', 'aria-roledescription',
        'aria-rowcount', 'aria-rowindex', 'aria-rowspan', 'aria-selected',
        'aria-setsize', 'aria-sort', 'aria-valuemax', 'aria-valuemin',
        'aria-valuenow', 'aria-valuetext', 'visib',
        # General web/page vocabulary (an accessibility chat practically always
        # involves one of these)
        'button', 'link', 'image', 'img', 'style', 'css', 'html', 'web',
        'page', 'website', 'site', 'app', 'report', 'result', 'fix', 'issue',
        'violation', 'test', 'check', 'rule', 'element', 'tag', 'attribute',
        'content', 'design', 'user', 'help', 'how', 'voice', 'speech',
        'motion', 'animation', 'language', 'lang', 'screen', 'blind', 'deaf',
        'hearing', 'visual', 'motor', 'cognitive', 'mobile', 'responsive',
    ]
    
    # Topic indicators that are clearly NOT about web accessibility. A query is
    # rejected only when it matches one of these AND carries no accessibility
    # signal at all. This keeps the guard permissive without accepting anything.
    UNRELATED_TOPICS = [
        r'\bweather\b', r'\bforecast\b', r'\btemperature\b', r'\bclimate\b',
        r'\bcricket\b', r'\bfootball\b', r'\bsoccer\b', r'\bbasketball\b',
        r'\bbaseball\b', r'\btennis\b', r'\brugby\b', r'\bgolf\b',
        r'\bwho won\b', r'\bmatch (?:score|result)\b', r'\bchampionship\b',
        r'\bstock (?:price|market)\b', r'\bshare price\b', r'\bcrypto\b',
        r'\bbitcoin\b', r'\binvestment\b', r'\btrading\b',
        r'\bpoem\b', r'\bpoetry\b', r'\brhyme\b', r'\bsong lyrics\b',
        r'\bmovie\b', r'\bfilm\b', r'\btv show\b', r'\bseries\b',
        r'\brecipe\b', r'\bcooking\b', r'\bbaking\b', r'\bdiet\b',
        r'\bfitness\b', r'\bworkout\b', r'\bsports\b',
        r'\bcelebrity\b', r'\bgossip\b', r'\bnews today\b', r'\bpolitics\b',
        r'\belection\b', r'\bpresident\b', r'\bwar\b', r'\bhiking\b',
        r'\bjoke\b', r'\bhoroscope\b', r'\btravel itinerary\b',
    ]
    
    # Potentially harmful content patterns (block-list)
    HARMFUL_PATTERNS = [
        r'malware', r'virus', r'trojan', r'phishing', r'scam', r'fraud',
        r'illegal', r'criminal', r'drug', r'weapon', r'violence',
        r'(?:cause|causing|inflict)\s+harm',
        r'racist', r'sexist', r'discriminat', r'hate\s', r'extremist'
    ]
    
    # Code execution patterns (block-list).
    # Event-handler names are enumerated so innocuous text such as "one=",
    # "caption" or "button" is never mis-flagged as executable code.
    CODE_EXECUTION_PATTERNS = [
        r'eval\s*\(', r'exec\s*\(', r'system\s*\(', r'shell_exec\s*\(',
        r'passthru\s*\(', r'popen\s*\(', r'proc_open\s*\(',
        r'<script[^>]*>', r'javascript\s*:', r'data\s*:\s*text/html',
        r'\bon(?:click|dblclick|load|error|change|submit|focus|blur|mouseover|mouseout|mousedown|mouseup|keydown|keyup|keypress|input|select|reset|resize|scroll|unload|contextmenu)\s*=',
    ]
    
    # Very generic short words that must match as a whole word (never as a
    # prefix), so "app" does not match "apple" or "fix" does not match
    # "fixture" when deciding whether a query is accessibility-related.
    WORD_ONLY_KEYWORDS = {
        'app', 'fix', 'web', 'site', 'test', 'check', 'rule', 'tag', 'img',
        'user', 'how', 'help', 'page', 'link',
    }

    # Accessibility-specific stems used for fuzzy (typo) matching. Restricting
    # fuzzy matching to these parts of speech avoids false positives from very
    # generic keywords (e.g. "main", "site") that would match ordinary words.
    FUZZY_ANCHORS = {
        'accessib', 'screenreader', 'assistiv', 'contrast', 'keyboard',
        'tabindex', 'landmark', 'caption', 'heading', 'readabl', 'legib',
        'navigat', 'magnif', 'focusable', 'visib',
    }
    
    def __init__(self):
        """Initialize the content filter."""
        # Stem-based allow-list: match at a word start without requiring a word
        # boundary afterwards so inflections (accessible, captions, headings...)
        # are recognized. The most generic short words use a full word boundary.
        prefix_keywords = [kw for kw in self.ACCESSIBILITY_KEYWORDS if kw not in self.WORD_ONLY_KEYWORDS]
        word_only_keywords = [kw for kw in self.ACCESSIBILITY_KEYWORDS if kw in self.WORD_ONLY_KEYWORDS]
        self.accessibility_pattern = re.compile(
            r'\b('
            + '|'.join(re.escape(kw) for kw in prefix_keywords)
            + '|'
            + '|'.join(re.escape(kw) + r'\b' for kw in word_only_keywords)
            + ')',
            re.IGNORECASE
        )
        self.unrelated_pattern = re.compile(
            '(' + '|'.join(self.UNRELATED_TOPICS) + ')',
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
    
    @staticmethod
    def _normalize(text: str) -> str:
        """Lowercase, drop punctuation and collapse whitespace."""
        if not text:
            return ""
        cleaned = re.sub(r"[^a-z0-9\s]", " ", text.lower())
        return re.sub(r"\s+", " ", cleaned).strip()
    
    @staticmethod
    def _levenshtein(a: str, b: str, max_dist: Optional[int] = None) -> int:
        """Edit distance between two short strings with an early-abort bound."""
        if a == b:
            return 0
        la, lb = len(a), len(b)
        if max_dist is None:
            max_dist = max(la, lb)
        if abs(la - lb) > max_dist:
            return max_dist + 1
        prev = list(range(lb + 1))
        for i in range(1, la + 1):
            cur = [i] + [0] * lb
            row_min = cur[0]
            for j in range(1, lb + 1):
                cost = 0 if a[i - 1] == b[j - 1] else 1
                cur[j] = min(cur[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost)
                if cur[j] < row_min:
                    row_min = cur[j]
            if row_min > max_dist:
                return max_dist + 1
            prev = cur
        return prev[lb]
    
    def _fuzzy_word_match(self, keyword: str, word: str) -> bool:
        """True when a token is a plausible typo/colloquial form of a keyword."""
        if len(keyword) < 4:
            return word == keyword
        # Allow roughly one typo per 4 characters, capped for safety.
        tolerance = max(1, min(3, len(keyword) // 4 + 1))
        if word[0] != keyword[0] and abs(len(word) - len(keyword)) > tolerance:
            return False
        return self._levenshtein(keyword, word, tolerance) <= tolerance
    
    def _contains_keyword(self, normalized: str, keyword: str) -> bool:
        """Exact substring OR (for specific anchors) fuzzy token matching."""
        kw = keyword.strip().lower()
        if not kw:
            return False
        # Whole-word-only generic terms are matched against the token set so a
        # prefix inside another word (e.g. "app" in "apple") never counts.
        if kw in self.WORD_ONLY_KEYWORDS:
            return kw in normalized.split()
        if kw in normalized:
            return True
        # Multi-word keywords: accept when every word appears nearby.
        kw_words = kw.split()
        if len(kw_words) > 1:
            return all(w in normalized for w in kw_words)
        # Short and/or generic keywords are matched exactly only, so unrelated
        # queries cannot slip through via a coincidental near-miss.
        if len(kw) < 7 or kw not in self.FUZZY_ANCHORS:
            return False
        return any(
            self._fuzzy_word_match(kw, token)
            for token in normalized.split()
            if token
        )
    
    def is_accessibility_related(self, text: str) -> bool:
        """
        Tolerant check for web-accessibility relevance.
        
        Falls back to fuzzy token matching so typos, missing spaces and
        squashed words ("accesibility", "screenreader") are still accepted.
        """
        if not text:
            return False
        if self.accessibility_pattern.search(text):
            return True
        normalized = self._normalize(text)
        if not normalized:
            return False
        return any(
            self._contains_keyword(normalized, kw)
            for kw in self.ACCESSIBILITY_KEYWORDS
        )
    
    def has_unrelated_topic_signal(self, text: str) -> bool:
        """True when the query points to a clearly non-accessibility topic."""
        if not text:
            return False
        return bool(self.unrelated_pattern.search(text))
    
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
        
        # Topic gate: the response only needs to be on-topic if the ORIGINAL
        # query was not. This stops brittle rejections of correctly-worded
        # accessibility answers (which may not repeat an obvious keyword).
        if not (self.is_accessibility_related(response) or self.is_accessibility_related(user_query)):
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
    
    def filter_user_query(self, query: str, context: Optional[List[str]] = None) -> ContentFilterResult:
        """
        Filter user query for safety and topic compliance.
        
        Deliberately permissive: ambiguous or loosely-worded questions are
        accepted rather than blocked. Rejection happens only for queries that
        are clearly unrelated (explicit off-topic signals with no
        accessibility signal) or potentially harmful.
        
        Args:
            query: User query to filter
            context: Earlier user messages in the conversation (used so short
                follow-ups like "why is this important?" stay on-topic).
        """
        # Check for harmful content first (safety check always wins).
        if self.contains_harmful_content(query):
            logger.warning("User query contains harmful content")
            return ContentFilterResult(
                is_safe=False,
                reason="That request doesn't look safe, so I can't help with it. Feel free to ask me about web accessibility instead.",
                filtered_content=None,
                confidence=0.9
            )
        
        # Direct accessibility signal (keywords, typos, squashed words).
        if self.is_accessibility_related(query):
            return ContentFilterResult(
                is_safe=True,
                reason=None,
                filtered_content=query,
                confidence=0.9
            )
        
        # Clearly unrelated topic (only evaluated once accessibility fails).
        if self.has_unrelated_topic_signal(query):
            logger.info("User query is clearly unrelated to accessibility")
            return ContentFilterResult(
                is_safe=False,
                reason="That question doesn't appear to be about web accessibility. I can help with WCAG, ARIA, keyboard navigation, screen readers, contrast, and accessibility testing — what would you like to know?",
                filtered_content=None,
                confidence=0.65
            )
        
        # Conversational follow-up inside an accessibility discussion: the
        # current message lacks explicit keywords but the conversation is
        # on-topic, so keep the thread alive.
        if context:
            recent = [c for c in context[-3:] if c]
            if any(self.is_accessibility_related(c) for c in recent):
                return ContentFilterResult(
                    is_safe=True,
                    reason=None,
                    filtered_content=query,
                    confidence=0.75
                )
        
        # Ambiguous / generic utterance with no off-topic signal: accept it.
        # The model is still instructed to stay on accessibility topics, so a
        # permissive gate here only helps, never harms.
        return ContentFilterResult(
            is_safe=True,
            reason=None,
            filtered_content=query,
            confidence=0.6
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