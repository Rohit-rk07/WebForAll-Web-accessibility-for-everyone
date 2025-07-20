"""Cache system for analysis results."""

import time
import json
import hashlib
from typing import Dict, Any, Optional
from pathlib import Path
import aiofiles
import asyncio
from datetime import datetime, timedelta

class AnalysisCache:
    """Caches analysis results with TTL and size limits."""
    
    def __init__(self, cache_dir: str = ".cache", ttl_hours: int = 24, max_size_mb: int = 100):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.ttl = timedelta(hours=ttl_hours)
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.lock = asyncio.Lock()
    
    def _get_cache_key(self, content: str) -> str:
        """Generate cache key from content."""
        return hashlib.sha256(content.encode()).hexdigest()
    
    async def get(self, content: str) -> Optional[Dict[str, Any]]:
        """
        Get cached analysis result.
        
        Args:
            content: HTML content to analyze
            
        Returns:
            Cached result or None if not found/expired
        """
        cache_key = self._get_cache_key(content)
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        if not cache_file.exists():
            return None
        
        async with self.lock:
            try:
                async with aiofiles.open(cache_file, 'r') as f:
                    cached_data = json.loads(await f.read())
                
                # Check TTL
                cached_time = datetime.fromisoformat(cached_data['cached_at'])
                if datetime.now() - cached_time > self.ttl:
                    await self._remove_cache_file(cache_file)
                    return None
                
                return cached_data['result']
            except (json.JSONDecodeError, KeyError):
                await self._remove_cache_file(cache_file)
                return None
    
    async def set(self, content: str, result: Dict[str, Any]) -> None:
        """
        Cache analysis result.
        
        Args:
            content: HTML content analyzed
            result: Analysis result to cache
        """
        cache_key = self._get_cache_key(content)
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        cache_data = {
            'cached_at': datetime.now().isoformat(),
            'result': result
        }
        
        async with self.lock:
            # Check cache size before writing
            await self._ensure_cache_size()
            
            async with aiofiles.open(cache_file, 'w') as f:
                await f.write(json.dumps(cache_data))
    
    async def _ensure_cache_size(self) -> None:
        """Removes old cache files if total size exceeds limit."""
        total_size = 0
        cache_files = []
        
        for file in self.cache_dir.glob('*.json'):
            stats = file.stat()
            total_size += stats.st_size
            cache_files.append((file, stats.st_mtime))
        
        if total_size > self.max_size_bytes:
            # Sort by modification time (oldest first)
            cache_files.sort(key=lambda x: x[1])
            
            # Remove files until under limit
            for file, _ in cache_files:
                await self._remove_cache_file(file)
                total_size -= file.stat().st_size
                if total_size <= self.max_size_bytes:
                    break
    
    async def _remove_cache_file(self, file: Path) -> None:
        """Safely remove a cache file."""
        try:
            file.unlink()
        except (OSError, FileNotFoundError):
            pass
    
    async def clear(self) -> None:
        """Clear all cached results."""
        async with self.lock:
            for file in self.cache_dir.glob('*.json'):
                await self._remove_cache_file(file)

class URLRateLimiter:
    """Rate limits URL analysis requests."""
    
    def __init__(self, requests_per_minute: int = 60):
        self.rate_limit = requests_per_minute
        self.window_size = 60  # 1 minute
        self.requests = {}
        self.lock = asyncio.Lock()
    
    async def can_process(self, url: str) -> bool:
        """
        Check if URL can be processed under rate limit.
        
        Args:
            url: URL to check
            
        Returns:
            True if URL can be processed, False if rate limited
        """
        now = time.time()
        domain = url.split('/')[2]  # Get domain from URL
        
        async with self.lock:
            # Clean old requests
            self._clean_old_requests(now)
            
            # Check domain requests
            domain_requests = self.requests.get(domain, [])
            if len(domain_requests) >= self.rate_limit:
                return False
            
            # Add new request
            self.requests[domain] = domain_requests + [now]
            return True
    
    def _clean_old_requests(self, now: float) -> None:
        """Remove requests older than window size."""
        cutoff = now - self.window_size
        for domain in list(self.requests.keys()):
            self.requests[domain] = [t for t in self.requests[domain] if t > cutoff]
            if not self.requests[domain]:
                del self.requests[domain] 