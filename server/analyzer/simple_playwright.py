"""Simple Playwright analyzer for accessibility testing."""

import sys
import logging
import json
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import the helper implementation directly to avoid subprocess overhead.
HELPER_SCRIPT = Path(__file__).parent / "playwright_helper.py"

async def analyze_url(url: str, wcag_options: Optional[Dict[str, Any]] = None):
    """
    Analyze a URL for accessibility issues using Playwright in a separate process.
    
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

        # Import lazily so the module stays light until analysis is requested.
        from analyzer.playwright_helper import run_analysis

        data = {
            "url": url,
            "wcag_options": wcag_options or {}
        }
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
