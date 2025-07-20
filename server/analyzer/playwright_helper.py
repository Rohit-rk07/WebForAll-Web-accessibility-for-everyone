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
        
        with sync_playwright() as p:
            # Launch browser
            browser = p.chromium.launch(
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            # Create context and page
            context = browser.new_context(viewport={'width': 1280, 'height': 720})
            page = context.new_page()
            
            # Navigate to URL with better timing for consistency
            page.goto(url, wait_until="networkidle", timeout=60000)
            
            # Wait for JavaScript to settle and dynamic content to load
            page.wait_for_timeout(2000)
            page.wait_for_load_state("networkidle")
            
            # Inject Axe
            page.add_script_tag(
                url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js"
            )
            
            # Run Axe analysis with selected tags
            results = page.evaluate(f"""() => {{
                return new Promise((resolve) => {{
                    axe.run(document, {{
                        runOnly: {{
                            type: 'tag',
                            values: {json.dumps(tags)}
                        }}
                    }}).then(resolve);
                }});
            }}""")
            
            # Close everything
            page.close()
            context.close()
            browser.close()
            
            return {
                "success": True,
                "results": results,
                "mode": "full",
                "tags_used": tags
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