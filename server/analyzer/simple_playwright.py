"""Simple Playwright analyzer for accessibility testing that avoids asyncio issues on Windows."""

import sys
import logging
import json
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Path to the helper script that will run in a separate process
HELPER_SCRIPT = Path(__file__).parent / "playwright_helper.py"

def analyze_url(url: str, wcag_options: Optional[Dict[str, Any]] = None):
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
        # Check if helper script exists
        if not HELPER_SCRIPT.exists():
            logger.error(f"Helper script not found at {HELPER_SCRIPT}")
            return {
                "success": False,
                "error": f"Helper script not found at {HELPER_SCRIPT}",
                "mode": "static_only"
            }
        
        # Create data object to pass to helper script
        data = {
            "url": url,
            "wcag_options": wcag_options or {}
        }
        
        # Run the helper script as a separate process
        cmd = [sys.executable, str(HELPER_SCRIPT)]
        logger.info(f"Running command: {' '.join(cmd)}")
        
        # Use subprocess.run to completely avoid asyncio
        result = subprocess.run(
            cmd,
            input=json.dumps(data),
            capture_output=True,
            text=True,
            check=False  # Don't raise exception on non-zero exit
        )
        
        if result.returncode != 0:
            logger.error(f"Helper script failed with exit code {result.returncode}")
            logger.error(f"STDERR: {result.stderr}")
            return {
                "success": False,
                "error": result.stderr or "Unknown error in helper script",
                "mode": "static_only"
            }
        
        # Parse the JSON output
        try:
            return json.loads(result.stdout)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse helper script output: {e}")
            logger.error(f"Output: {result.stdout}")
            return {
                "success": False,
                "error": f"Failed to parse results: {str(e)}",
                "mode": "static_only"
            }
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