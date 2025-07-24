#!/usr/bin/env python
# playwright_helper.py - Runs Playwright in a separate process

import sys
import json
from typing import Dict, Any, List
from playwright.sync_api import sync_playwright

def get_wcag_tags(wcag_options: Dict[str, Any]) -> List[str]:
    """
    Convert WCAG options to axe-core tags.
    
    Args:
        wcag_options (dict): WCAG options from the request
        
    Returns:
        list: List of axe-core tags to include with strict version and level selection
    """
    tags = []
    
    # Get the selected version and level
    version = wcag_options.get("wcag_version", "wcag2")
    level = wcag_options.get("level", "aa").lower()
    
    # Process WCAG 2.0 tags
    if version == "wcag2":
        # Only include level A tags
        tags.append("wcag2a")
        
        # Add AA tags only if level is AA or AAA
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        
        # Add AAA tags only if level is AAA
        if level == "aaa":
            tags.append("wcag2aaa")
    
    # Process WCAG 2.1 tags (includes 2.0)
    elif version == "wcag21":
        # WCAG 2.0 tags (included in 2.1)
        tags.append("wcag2a")
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        if level == "aaa":
            tags.append("wcag2aaa")
            
        # WCAG 2.1 specific tags
        tags.append("wcag21a")
        if level in ["aa", "aaa"]:
            tags.append("wcag21aa")
        if level == "aaa":
            tags.append("wcag21aaa")
    
    # Process WCAG 2.2 tags (includes 2.0 and 2.1)
    elif version == "wcag22":
        # WCAG 2.0 tags (included in 2.2)
        tags.append("wcag2a")
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        if level == "aaa":
            tags.append("wcag2aaa")
            
        # WCAG 2.1 tags (included in 2.2)
        tags.append("wcag21a")
        if level in ["aa", "aaa"]:
            tags.append("wcag21aa")
        if level == "aaa":
            tags.append("wcag21aaa")
            
        # WCAG 2.2 specific tags
        tags.append("wcag22a")
        if level in ["aa", "aaa"]:
            tags.append("wcag22aa")
        if level == "aaa":
            tags.append("wcag22aaa")
    
    # Include best practices if requested
    if wcag_options.get("best_practice", True):
        tags.append("best-practice")
    
    # If no tags were selected, use defaults
    if not tags:
        tags = ["wcag2a", "wcag2aa", "best-practice"]
    
    return tags

def max_level(level1: str, level2: str) -> str:
    """
    Returns the higher of two WCAG levels.
    
    Args:
        level1 (str): First WCAG level
        level2 (str): Second WCAG level
        
    Returns:
        str: The higher level
    """
    level_rank = {"none": 0, "a": 1, "aa": 2, "aaa": 3}
    return level1 if level_rank.get(level1, 0) >= level_rank.get(level2, 0) else level2

def run_analysis(data: Dict[str, Any]):
    import logging
    import os
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    try:
        url = data.get("url")
        if not url:
            return {
                "success": False,
                "error": "No URL provided",
                "mode": "static_only"
            }
        
        wcag_options = data.get("wcag_options", {})
        tags = get_wcag_tags(wcag_options)
        
        logger.info(f"Starting analysis for URL: {url}")
        logger.info(f"Using WCAG tags: {tags}")
        logger.info(f"Environment: PLAYWRIGHT_BROWSERS_PATH={os.environ.get('PLAYWRIGHT_BROWSERS_PATH', 'Not set')}")
        
        with sync_playwright() as p:
            # Launch browser with additional args for deployment environments
            browser_args = [
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor',
                '--no-first-run',
                '--disable-extensions',
                '--disable-default-apps'
            ]
            
            logger.info("Launching Chromium browser...")
            try:
                browser = p.chromium.launch(
                    headless=True,
                    args=browser_args
                )
                logger.info("Browser launched successfully")
            except Exception as browser_error:
                logger.error(f"Failed to launch browser: {browser_error}")
                return {
                    "success": False,
                    "error": f"Browser launch failed: {str(browser_error)}",
                    "mode": "static_only",
                    "browser_error": True
                }
            
            # Create context and page
            logger.info("Creating browser context...")
            context = browser.new_context(viewport={'width': 1280, 'height': 720})
            page = context.new_page()
            
            # Navigate to URL with better timing for consistency
            logger.info(f"Navigating to URL: {url}")
            try:
                page.goto(url, wait_until="networkidle", timeout=60000)
                logger.info("Page loaded successfully")
            except Exception as nav_error:
                logger.error(f"Navigation failed: {nav_error}")
                page.close()
                context.close()
                browser.close()
                return {
                    "success": False,
                    "error": f"Navigation failed: {str(nav_error)}",
                    "mode": "static_only",
                    "navigation_error": True
                }
            
            # Wait for JavaScript to settle and dynamic content to load
            logger.info("Waiting for page to settle...")
            page.wait_for_timeout(2000)
            page.wait_for_load_state("networkidle")
            
            # Inject Axe
            logger.info("Injecting axe-core library...")
            try:
                page.add_script_tag(
                    url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js"
                )
                # Wait for axe to load
                page.wait_for_function("typeof axe !== 'undefined'")
                logger.info("Axe-core loaded successfully")
            except Exception as axe_error:
                logger.error(f"Failed to load axe-core: {axe_error}")
                page.close()
                context.close()
                browser.close()
                return {
                    "success": False,
                    "error": f"Failed to load axe-core: {str(axe_error)}",
                    "mode": "static_only",
                    "axe_error": True
                }
            
            # Run Axe analysis with selected tags
            logger.info(f"Running axe analysis with tags: {tags}")
            try:
                results = page.evaluate(f"""() => {{
                    return new Promise((resolve, reject) => {{
                        try {{
                            axe.run(document, {{
                                runOnly: {{
                                    type: 'tag',
                                    values: {json.dumps(tags)}
                                }}
                            }}).then(resolve).catch(reject);
                        }} catch (error) {{
                            reject(error);
                        }}
                    }});
                }}""")
                logger.info(f"Analysis completed. Found {len(results.get('violations', []))} violations")
            except Exception as analysis_error:
                logger.error(f"Axe analysis failed: {analysis_error}")
                page.close()
                context.close()
                browser.close()
                return {
                    "success": False,
                    "error": f"Axe analysis failed: {str(analysis_error)}",
                    "mode": "static_only",
                    "analysis_error": True
                }
            
            # Close everything
            logger.info("Cleaning up browser resources...")
            page.close()
            context.close()
            browser.close()
            
            return {
                "success": True,
                "results": results,
                "mode": "full",
                "tags_used": tags,
                "violations_count": len(results.get('violations', []))
            }
    except Exception as e:
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "mode": "static_only"
        }

if __name__ == "__main__":
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            # Fallback to command line argument for backward compatibility
            if len(sys.argv) > 1:
                data = {"url": sys.argv[1]}
            else:
                print(json.dumps({
                    "success": False,
                    "error": "No input data provided",
                    "mode": "static_only"
                }))
                sys.exit(1)
        else:
            data = json.loads(input_data)
        
        result = run_analysis(data)
        print(json.dumps(result))
    except Exception as e:
        import traceback
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "mode": "static_only"
        })) 