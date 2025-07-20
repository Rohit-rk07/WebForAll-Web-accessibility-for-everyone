#!/usr/bin/env python
"""
Test script to verify Playwright installation and functionality.
"""

import sys
import logging
import json
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_basic_playwright():
    """Test basic Playwright functionality."""
    try:
        logger.info("Testing basic Playwright functionality...")
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            logger.info("Launching browser...")
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            logger.info("Creating context and page...")
            context = browser.new_context()
            page = context.new_page()
            
            logger.info("Navigating to example.com...")
            page.goto("https://example.com/", wait_until="domcontentloaded")
            
            logger.info("Getting page title...")
            title = page.title()
            logger.info(f"Page title: {title}")
            
            logger.info("Closing browser...")
            browser.close()
            
            logger.info("Basic Playwright test successful!")
            return True
    except Exception as e:
        logger.error(f"Error testing Playwright: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def test_axe_integration():
    """Test Playwright with axe-core integration."""
    try:
        logger.info("Testing Playwright with axe-core integration...")
        from playwright.sync_api import sync_playwright
        
        with sync_playwright() as p:
            logger.info("Launching browser...")
            browser = p.chromium.launch(
                headless=True,
                args=['--no-sandbox', '--disable-dev-shm-usage']
            )
            
            logger.info("Creating context and page...")
            context = browser.new_context()
            page = context.new_page()
            
            logger.info("Navigating to example.com...")
            page.goto("https://example.com/", wait_until="domcontentloaded")
            
            logger.info("Injecting axe-core...")
            page.add_script_tag(
                url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js"
            )
            
            logger.info("Running axe analysis...")
            results = page.evaluate("""() => {
                return new Promise((resolve) => {
                    axe.run(document, {
                        runOnly: {
                            type: 'tag',
                            values: ['wcag2a', 'wcag2aa']
                        }
                    }).then(resolve);
                });
            }""")
            
            logger.info("Closing browser...")
            browser.close()
            
            # Print a summary of results
            violations = results.get("violations", [])
            logger.info(f"Found {len(violations)} accessibility violations")
            for i, v in enumerate(violations[:3]):  # Show first 3
                logger.info(f"{i+1}. {v.get('id')}: {v.get('description')}")
                
            logger.info("Axe integration test successful!")
            return True
    except Exception as e:
        logger.error(f"Error testing axe integration: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def test_helper_script():
    """Test the helper script."""
    try:
        logger.info("Testing helper script...")
        
        # Import the analyze_url function
        sys.path.append(str(Path(__file__).parent))
        from analyzer.simple_playwright import analyze_url
        
        # Test with example.com
        logger.info("Analyzing example.com...")
        results = analyze_url("https://example.com")
        
        if results.get("success"):
            logger.info("Helper script test successful!")
            violations = results.get("results", {}).get("violations", [])
            logger.info(f"Found {len(violations)} accessibility violations")
            return True
        else:
            logger.error(f"Helper script test failed: {results.get('error')}")
            return False
    except Exception as e:
        logger.error(f"Error testing helper script: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Main test function."""
    logger.info("Starting Playwright tests...")
    
    # Test 1: Basic Playwright
    if test_basic_playwright():
        logger.info("✅ Basic Playwright test passed")
    else:
        logger.error("❌ Basic Playwright test failed")
        return 1
    
    # Test 2: Axe Integration
    if test_axe_integration():
        logger.info("✅ Axe integration test passed")
    else:
        logger.error("❌ Axe integration test failed")
        return 1
    
    # Test 3: Helper Script
    if test_helper_script():
        logger.info("✅ Helper script test passed")
    else:
        logger.error("❌ Helper script test failed")
        return 1
    
    logger.info("All tests passed successfully!")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 