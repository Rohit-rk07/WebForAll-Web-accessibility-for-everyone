"""Browser Pool for Playwright to optimize resource usage."""

import asyncio
import logging
from typing import Optional
from playwright.async_api import async_playwright, Browser, BrowserContext, Page

logger = logging.getLogger(__name__)

class BrowserPool:
    """
    Manages a pool of Playwright browser instances for efficient resource usage.
    Reduces browser launch overhead for repeated accessibility analyses.
    """
    
    def __init__(self, max_browsers: int = 3, timeout: int = 30000):
        """
        Initialize the browser pool.
        
        Args:
            max_browsers: Maximum number of browsers in the pool
            timeout: Browser launch timeout in milliseconds
        """
        self.max_browsers = max_browsers
        self.timeout = timeout
        self.pool: asyncio.Queue = asyncio.Queue(maxsize=max_browsers)
        self._lock = asyncio.Lock()
        self._initialized = False
        
    async def initialize(self):
        """Initialize the browser pool with pre-launched browsers."""
        if self._initialized:
            return
            
        async with self._lock:
            if self._initialized:
                return
                
            logger.info(f"Initializing browser pool with {self.max_browsers} browsers")
            
            try:
                async with async_playwright() as p:
                    for i in range(self.max_browsers):
                        browser = await p.chromium.launch(
                            headless=True,
                            args=['--no-sandbox', '--disable-dev-shm-usage'],
                            timeout=self.timeout
                        )
                        await self.pool.put(browser)
                        logger.info(f"Browser {i+1}/{self.max_browsers} launched and added to pool")
                
                self._initialized = True
                logger.info("Browser pool initialization completed")
            except Exception as e:
                logger.error(f"Failed to initialize browser pool: {e}")
                raise

    async def get_browser(self) -> Browser:
        """
        Get a browser from the pool.
        
        Returns:
            Browser instance from the pool
        """
        if not self._initialized:
            await self.initialize()
        
        try:
            browser = await asyncio.wait_for(self.pool.get(), timeout=10.0)
            logger.debug("Browser acquired from pool")
            return browser
        except asyncio.TimeoutError:
            logger.warning("Browser pool empty, launching temporary browser")
            # Fallback: launch a temporary browser if pool is empty
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=['--no-sandbox', '--disable-dev-shm-usage'],
                    timeout=self.timeout
                )
            return browser

    async def return_browser(self, browser: Browser):
        """
        Return a browser to the pool.
        
        Args:
            browser: Browser instance to return
        """
        try:
            # Check if this is a pool browser (not temporary)
            if self.pool.qsize() < self.max_browsers:
                await self.pool.put(browser)
                logger.debug("Browser returned to pool")
            else:
                # Pool is full, close the browser
                await browser.close()
                logger.debug("Browser closed (pool full)")
        except Exception as e:
            logger.error(f"Error returning browser to pool: {e}")
            try:
                await browser.close()
            except:
                pass

    async def close_all(self):
        """Close all browsers in the pool and clean up resources."""
        logger.info("Closing all browsers in pool")
        
        while not self.pool.empty():
            try:
                browser = await self.pool.get()
                await browser.close()
            except Exception as e:
                logger.error(f"Error closing browser: {e}")
        
        self._initialized = False
        logger.info("Browser pool closed")

    async def __aenter__(self):
        """Async context manager entry."""
        await self.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close_all()

# Global browser pool instance
browser_pool = BrowserPool(max_browsers=3, timeout=30000)