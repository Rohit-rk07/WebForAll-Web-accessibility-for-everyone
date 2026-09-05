"""Simple Playwright analyzer for accessibility testing."""

import sys
import asyncio
import logging
import json
import threading
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the helper implementation directly to avoid subprocess overhead.
HELPER_SCRIPT = Path(__file__).parent / "playwright_helper.py"
class _ScanLoop:
    """Persistent Proactor loop hosting the browser so Windows scans reuse it."""

    def __init__(self):
        self._loop = None
        self._ready = threading.Event()
        self._thread = threading.Thread(target=self._entry, name="scan-loop", daemon=True)
        self._thread.start()
        self._ready.wait()

    def _entry(self):
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        self._loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self._loop)
        self._ready.set()
        try:
            self._loop.run_forever()
        finally:
            self._loop.close()

    @property
    def loop(self):
        return self._loop

    def submit(self, coro_factory):
        return asyncio.run_coroutine_threadsafe(coro_factory(), self._loop)


_SCAN_LOOP = None


def _get_scan_loop():
    global _SCAN_LOOP
    if _SCAN_LOOP is None:
        _SCAN_LOOP = _ScanLoop()
    return _SCAN_LOOP


async def _run_on_scan_loop(data: Dict[str, Any]):
    """Schedule a scan on the dedicated Windows loop and await its completion."""
    from analyzer.playwright_helper import run_analysis

    future = _get_scan_loop().submit(lambda: run_analysis(data))
    return await asyncio.wrap_future(future)

async def analyze_url(url: str, wcag_options: Optional[Dict[str, Any]] = None):
    """
    Analyze a URL for accessibility issues using Playwright with browser pooling.
    
    Args:
        url (str): The URL to analyze
        wcag_options (dict, optional): WCAG version and level options
        
    Returns:
        dict: Analysis results
    """
    logger.info(f"Analyzing URL: {url}")
    
    try:
        if not HELPER_SCRIPT.exists():
            logger.error(f"Helper script not found at {HELPER_SCRIPT}")
            return {
                "success": False,
                "error": f"Helper script not found at {HELPER_SCRIPT}",
                "mode": "static_only"
            }

        data = {
            "url": url,
            "wcag_options": wcag_options or {}
        }

        # Uvicorn's Windows loop cannot drive Playwright's async transport,
        # so scans run on a dedicated Proactor loop that keeps the browser
        # warm between scans instead of relaunching it per scan.
        if sys.platform == "win32":
            return await _run_on_scan_loop(data)

        # Import lazily so the module stays light until analysis is requested.
        from analyzer.playwright_helper import run_analysis
        return await run_analysis(data)
    except Exception as e:
        logger.error(f"Error analyzing URL: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return {
            "success": False,
            "error": str(e),
            "mode": "static_only"
        }

if __name__ == "__main__":
    # Simple command-line interface
    if len(sys.argv) > 1:
        url = sys.argv[1]
        results = analyze_url(url)
        
        if results["success"]:
            violations = results["results"].get("violations", [])
            print(f"Analysis successful! Found {len(violations)} violations")
            for i, v in enumerate(violations[:3]):  # Show first 3
                print(f"{i+1}. {v.get('id')}: {v.get('description')}")
        else:
            print(f"Analysis failed: {results.get('error')}")
    else:
        # Read from stdin for JSON input
        input_data = json.loads(sys.stdin.read())
        url = input_data.get("url")
        wcag_options = input_data.get("wcag_options")
        results = analyze_url(url, wcag_options)
        print(json.dumps(results)) 
