"""Caching service for AI responses and commonly accessed data."""

import hashlib
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class CacheService:
    """
    In-memory caching service with TTL support for AI responses and other data.
    Uses a simple dictionary-based cache with expiration tracking.
    """
    
    def __init__(self, default_ttl: int = 3600):
        """
        Initialize the cache service.
        
        Args:
            default_ttl: Default time-to-live for cache entries in seconds
        """
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
        
    def _generate_key(self, prefix: str, data: Dict[str, Any]) -> str:
        """Generate a consistent cache key from data."""
        key_data = json.dumps(data, sort_keys=True)
        hash_obj = hashlib.sha256(key_data.encode())
        return f"{prefix}:{hash_obj.hexdigest()[:16]}"
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if a cache entry has expired."""
        expiry = entry.get('expiry')
        if expiry is None:
            return False
        return datetime.utcnow() > expiry
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from the cache."""
        entry = self.cache.get(key)
        if entry is None:
            return None
        if self._is_expired(entry):
            del self.cache[key]
            return None
        return entry.get('value')
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """
        Set a value in the cache with optional TTL.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time-to-live in seconds (uses default if not specified)
        """
        expiry = None
        if ttl is not None:
            expiry = datetime.utcnow() + timedelta(seconds=ttl)
        elif self.default_ttl > 0:
            expiry = datetime.utcnow() + timedelta(seconds=self.default_ttl)
        
        self.cache[key] = {
            'value': value,
            'expiry': expiry,
            'created_at': datetime.utcnow()
        }
    
    def delete(self, key: str) -> bool:
        """Delete a key from the cache."""
        if key in self.cache:
            del self.cache[key]
            return True
        return False
    
    def clear(self) -> int:
        """Clear all cache entries and return count of cleared items."""
        count = len(self.cache)
        self.cache.clear()
        return count
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count of removed items."""
        expired_keys = [
            key for key, entry in self.cache.items()
            if self._is_expired(entry)
        ]
        for key in expired_keys:
            del self.cache[key]
        return len(expired_keys)

# Global cache service instance
cache_service = CacheService(default_ttl=3600)  # 1 hour default TTL

# AI-specific caching functions
def get_ai_explanation_cache_key(issue_id: str, issue_data: Dict[str, Any], user_scope: str = "") -> str:
    """Generate cache key for AI issue explanations.

    ``user_scope`` (e.g. a user identifier hash) keeps one user's private scan
    data out of another user's cache entries.
    """
    return cache_service._generate_key("ai_explanation", {
        'issue_id': issue_id,
        'issue_data': issue_data,
        'user_scope': user_scope
    })

def cache_ai_explanation(issue_id: str, issue_data: Dict[str, Any], explanation: Dict[str, Any], user_scope: str = "", ttl: int = 7200) -> None:
    """Cache AI explanation with 2-hour TTL."""
    cache_key = get_ai_explanation_cache_key(issue_id, issue_data, user_scope)
    cache_service.set(cache_key, explanation, ttl=ttl)

def get_cached_ai_explanation(issue_id: str, issue_data: Dict[str, Any], user_scope: str = "") -> Optional[Dict[str, Any]]:
    """Get cached AI explanation if available."""
    cache_key = get_ai_explanation_cache_key(issue_id, issue_data, user_scope)
    return cache_service.get(cache_key)