"""Playwright process handler for accessibility analysis."""

import sys
import json
import logging
import traceback
from typing import Dict, Any, Optional
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
DEFAULT_TIMEOUT = 90000  # 90 seconds
NAVIGATION_TIMEOUT = 60000  # 60 seconds
SCRIPT_TIMEOUT = 45000  # 45 seconds

def run_analysis(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Run accessibility analysis using Playwright in sync mode.
    This function runs in a separate process to avoid asyncio conflicts.
    
    Args:
        data (dict): Input data containing either URL or HTML content
        
    Returns:
        dict: Analysis results
    """
    browser = None
    context = None
    page = None
    
    try:
        logger.info("Starting Playwright analysis")
        with sync_playwright() as p:
            # Launch browser with appropriate options
            logger.info("Launching browser")
            browser = p.chromium.launch(
                args=['--no-sandbox', '--disable-dev-shm-usage'],
                timeout=DEFAULT_TIMEOUT
            )
            logger.info("Browser launched successfully")
            
            # Create context with viewport
            logger.info("Creating browser context")
            context = browser.new_context(
                viewport={'width': 1280, 'height': 720}
            )
            
            # Create page with error handling
            logger.info("Creating new page")
            page = context.new_page()
            page.set_default_timeout(DEFAULT_TIMEOUT)
            
            try:
                # Handle URL or HTML content
                if data.get("is_url"):
                    url = data.get("url")
                    if not url:
                        logger.error("No URL provided for URL analysis")
                        return {
                            "success": False,
                            "error": "No URL provided for URL analysis"
                        }
                    
                    logger.info(f"Navigating to URL: {url}")
                    try:
                        page.goto(
                            url,
                            wait_until="networkidle",
                            timeout=NAVIGATION_TIMEOUT
                        )
                        logger.info("Navigation completed successfully")
                    except PlaywrightTimeout:
                        # Try again with domcontentloaded instead of networkidle
                        logger.info("Retrying with domcontentloaded wait strategy")
                        page.goto(
                            url,
                            wait_until="domcontentloaded",
                            timeout=NAVIGATION_TIMEOUT
                        )
                        logger.info("Navigation completed with domcontentloaded")
                else:
                    html = data.get("html")
                    if not html:
                        logger.error("No HTML content provided for HTML analysis")
                        return {
                            "success": False,
                            "error": "No HTML content provided for HTML analysis"
                        }
                    
                    logger.info("Setting HTML content")
                    try:
                        page.set_content(
                            html,
                            wait_until="networkidle",
                            timeout=NAVIGATION_TIMEOUT
                        )
                        logger.info("HTML content set successfully")
                    except PlaywrightTimeout:
                        # Try again with domcontentloaded instead of networkidle
                        logger.info("Retrying with domcontentloaded wait strategy")
                        page.set_content(
                            html,
                            wait_until="domcontentloaded",
                            timeout=NAVIGATION_TIMEOUT
                        )
                        logger.info("HTML content set with domcontentloaded")
                        
                    # Set base URL if provided
                    base_url = data.get("base_url")
                    if base_url:
                        logger.info(f"Setting base URL: {base_url}")
                        page.set_base_url(base_url)
                
                # Inject and run Axe-core
                logger.info("Injecting Axe-core")
                page.add_script_tag(
                    url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js",
                    timeout=SCRIPT_TIMEOUT
                )
                
                # Wait for Axe to be available
                logger.info("Waiting for Axe to load")
                page.wait_for_function(
                    "() => window.axe !== undefined",
                    timeout=SCRIPT_TIMEOUT
                )
                
                # Run Axe analysis
                logger.info("Running Axe analysis")
                results = page.evaluate("""() => {
                    return new Promise((resolve) => {
                        axe.run(document, {
                            runOnly: {
                                type: 'tag',
                                values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
                            }
                        }).then(resolve);
                    });
                }""", timeout=DEFAULT_TIMEOUT)
                logger.info("Axe analysis completed")
                
                # Check keyboard navigation
                logger.info("Testing keyboard navigation")
                page.keyboard.press('Tab')
                focused = page.evaluate("""() => {
                    const active = document.activeElement;
                    return {
                        hasFocus: active !== document.body && active !== document,
                        element: active.outerHTML
                    };
                }""")
                
                # Add keyboard navigation issue if needed
                if not focused['hasFocus']:
                    logger.info("No focusable elements found, adding keyboard navigation issue")
                    if 'violations' not in results:
                        results['violations'] = []
                    results['violations'].append({
                        'id': 'keyboard-nav',
                        'impact': 'critical',
                        'description': 'No focusable elements can be reached via keyboard',
                        'help': 'Ensure interactive elements are keyboard accessible',
                        'nodes': [{
                            'html': 'N/A',
                            'failureSummary': 'Add keyboard navigation support',
                            'impact': 'critical'
                        }],
                        'tags': ['wcag2a', 'keyboard']
                    })
                
                logger.info("Analysis completed successfully")
                return {
                    "success": True,
                    "results": results
                }
                
            except PlaywrightTimeout as e:
                logger.error(f"Timeout during analysis: {e}")
                logger.error(traceback.format_exc())
                return {
                    "success": False,
                    "error": f"Operation timed out: {str(e)}"
                }
            except Exception as e:
                logger.error(f"Error during page analysis: {e}")
                logger.error(traceback.format_exc())
                return {
                    "success": False,
                    "error": str(e)
                }
                
    except Exception as e:
        logger.error(f"Error setting up Playwright: {e}")
        logger.error(traceback.format_exc())
        return {
            "success": False,
            "error": str(e)
        }
        
    finally:
        # Clean up resources
        try:
            if page:
                logger.info("Closing page")
                page.close()
            if context:
                logger.info("Closing context")
                context.close()
            if browser:
                logger.info("Closing browser")
                browser.close()
        except Exception as e:
            logger.error(f"Error during cleanup: {e}")
            logger.error(traceback.format_exc())

if __name__ == "__main__":
    try:
        # Read input from stdin
        logger.info("Reading input from stdin")
        input_data = sys.stdin.read()
        if not input_data:
            logger.error("No input data received")
            print(json.dumps({
                "success": False,
                "error": "No input data received"
            }))
            sys.exit(1)
            
        logger.info("Parsing input data")
        data = json.loads(input_data)
        logger.info("Running analysis")
        result = run_analysis(data)
        logger.info("Analysis completed, sending results")
        print(json.dumps(result))
    except Exception as e:
        logger.error(f"Process error: {e}")
        logger.error(traceback.format_exc())
        print(json.dumps({
            "success": False,
            "error": f"Process error: {str(e)}"
        })) 