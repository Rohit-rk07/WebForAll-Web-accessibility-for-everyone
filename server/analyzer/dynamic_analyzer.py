"""Dynamic analyzer module for accessibility testing."""

import json
import asyncio
import sys
import os
import platform
import traceback
from pathlib import Path
import logging
import time
from typing import Optional, Dict, Any
import importlib.util

logger = logging.getLogger(__name__)

class DynamicAnalyzer:
    """Handles dynamic analysis of web pages using Playwright."""
    
    def __init__(self, max_retries: int = 3, retry_delay: float = 1.0):
        """
        Initialize the dynamic analyzer.
        
        Args:
            max_retries (int): Maximum number of retries for failed operations
            retry_delay (float): Delay between retries in seconds
        """
        self.is_windows = platform.system() == "Windows"
        self._initialized = False
        self.max_retries = max_retries
        self.retry_delay = retry_delay
        
    async def initialize(self) -> bool:
        """Initialize Playwright if not already done."""
        if self._initialized:
            return True
            
        for attempt in range(self.max_retries):
            try:
                # We'll check if Playwright is installed by importing it
                import playwright
                from playwright.async_api import async_playwright
                
                # Test browser availability
                logger.info("Testing browser availability...")
                async with async_playwright() as p:
                    try:
                        logger.info("Launching browser...")
                        browser = await p.chromium.launch(
                            args=['--no-sandbox', '--disable-dev-shm-usage'],
                            headless=True
                        )
                        logger.info("Browser launched successfully")
                        await browser.close()
                        logger.info("Browser closed successfully")
                    except Exception as e:
                        logger.error(f"Failed to launch browser: {e}")
                        logger.error(traceback.format_exc())
                        return False
                
                self._initialized = True
                logger.info("Playwright initialized successfully")
                return True
            except ImportError as e:
                logger.error(f"Playwright not installed: {e}")
                return False
            except Exception as e:
                logger.error(f"Failed to initialize Playwright (attempt {attempt + 1}/{self.max_retries}): {e}")
                logger.error(traceback.format_exc())
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                else:
                    return False
    
    async def _run_analysis_directly(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run Playwright analysis directly in this process.
        
        Args:
            input_data (dict): Data to analyze
            
        Returns:
            dict: Analysis results
        """
        # Import the run_analysis function from playwright_process.py
        script_path = Path(__file__).parent / "playwright_process.py"
        
        try:
            # Import the module dynamically
            spec = importlib.util.spec_from_file_location("playwright_process", script_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            
            # Run the analysis function
            logger.info("Running analysis directly")
            result = module.run_analysis(input_data)
            return result
        except Exception as e:
            logger.error(f"Error running analysis directly: {e}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": str(e),
                "mode": "static_only"
            }
    
    async def analyze_url(self, url: str) -> Dict[str, Any]:
        """
        Analyze a URL using Playwright.
        
        Args:
            url (str): The URL to analyze
            
        Returns:
            dict: Analysis results
        """
        if not await self.initialize():
            return {
                "success": False,
                "error": "Playwright not initialized",
                "mode": "static_only"
            }
            
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Analyzing URL (attempt {attempt + 1}/{self.max_retries}): {url}")
                result = await self._run_analysis_directly({
                    "url": url,
                    "is_url": True
                })
                return result
            except Exception as e:
                logger.error(f"URL analysis failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                logger.error(traceback.format_exc())
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                else:
                    return {
                        "success": False,
                        "error": str(e),
                        "mode": "static_only"
                    }
    
    async def analyze_html(self, html_content: str, base_url: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze HTML content using Playwright.
        
        Args:
            html_content (str): The HTML content to analyze
            base_url (str, optional): Base URL for relative paths
            
        Returns:
            dict: Analysis results
        """
        if not await self.initialize():
            return {
                "success": False,
                "error": "Playwright not initialized",
                "mode": "static_only"
            }
            
        for attempt in range(self.max_retries):
            try:
                logger.info(f"Analyzing HTML content (attempt {attempt + 1}/{self.max_retries})")
                result = await self._run_analysis_directly({
                    "html": html_content,
                    "base_url": base_url,
                    "is_url": False
                })
                return result
            except Exception as e:
                logger.error(f"HTML analysis failed (attempt {attempt + 1}/{self.max_retries}): {e}")
                logger.error(traceback.format_exc())
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay)
                else:
                    return {
                        "success": False,
                        "error": str(e),
                        "mode": "static_only"
                    } 