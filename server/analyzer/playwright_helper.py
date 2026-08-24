#!/usr/bin/env python
# playwright_helper.py - Reusable Playwright helper for accessibility testing

import sys
import json
import logging
import traceback
from typing import Dict, Any, List

from playwright.sync_api import sync_playwright

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_PLAYWRIGHT = None
_BROWSER = None


def get_wcag_tags(wcag_options: Dict[str, Any]) -> List[str]:
    tags = []

    version = wcag_options.get("wcag_version", "wcag2")
    level = wcag_options.get("level", "aa").lower()

    if version == "wcag2":
        tags.append("wcag2a")
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        if level == "aaa":
            tags.append("wcag2aaa")
    elif version == "wcag21":
        tags.append("wcag2a")
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        if level == "aaa":
            tags.append("wcag2aaa")
        tags.append("wcag21a")
        if level in ["aa", "aaa"]:
            tags.append("wcag21aa")
        if level == "aaa":
            tags.append("wcag21aaa")
    elif version == "wcag22":
        tags.append("wcag2a")
        if level in ["aa", "aaa"]:
            tags.append("wcag2aa")
        if level == "aaa":
            tags.append("wcag2aaa")
        tags.append("wcag21a")
        if level in ["aa", "aaa"]:
            tags.append("wcag21aa")
        if level == "aaa":
            tags.append("wcag21aaa")
        tags.append("wcag22a")
        if level in ["aa", "aaa"]:
            tags.append("wcag22aa")
        if level == "aaa":
            tags.append("wcag22aaa")

    if wcag_options.get("best_practice", True):
        tags.append("best-practice")

    if not tags:
        tags = ["wcag2a", "wcag2aa", "best-practice"]

    return tags


def get_browser():
    global _PLAYWRIGHT, _BROWSER

    if _BROWSER is not None:
        return _BROWSER

    browser_args = [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--no-first-run",
        "--disable-extensions",
        "--disable-default-apps",
    ]

    _PLAYWRIGHT = sync_playwright().start()
    _BROWSER = _PLAYWRIGHT.chromium.launch(headless=True, args=browser_args)
    return _BROWSER


def close_browser():
    global _PLAYWRIGHT, _BROWSER

    if _BROWSER is not None:
        _BROWSER.close()
        _BROWSER = None

    if _PLAYWRIGHT is not None:
        _PLAYWRIGHT.stop()
        _PLAYWRIGHT = None


def run_analysis(data: Dict[str, Any]):
    import os
    import traceback

    try:
        url = data.get("url")
        if not url:
            return {"success": False, "error": "No URL provided", "mode": "static_only"}

        wcag_options = data.get("wcag_options", {})
        tags = get_wcag_tags(wcag_options)

        logger.info(f"Starting analysis for URL: {url}")
        logger.info(f"Using WCAG tags: {tags}")
        logger.info(f"Environment: PLAYWRIGHT_BROWSERS_PATH={os.environ.get('PLAYWRIGHT_BROWSERS_PATH', 'Not set')}")

        try:
            browser = get_browser()
        except Exception as browser_error:
            logger.error(f"Failed to launch browser: {browser_error}")
            return {
                "success": False,
                "error": f"Browser launch failed: {str(browser_error)}",
                "mode": "static_only",
                "browser_error": True,
            }

        context = None
        page = None
        try:
            logger.info("Creating browser context...")
            context = browser.new_context(viewport={"width": 1280, "height": 720})
            page = context.new_page()

            logger.info(f"Navigating to URL: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=45000)

            logger.info("Waiting for page to settle...")
            page.wait_for_timeout(300)
            try:
                page.wait_for_load_state("networkidle", timeout=3000)
            except Exception:
                logger.info("Skipping networkidle wait because the page stayed busy")

            logger.info("Injecting axe-core library...")
            page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js")
            page.wait_for_function("typeof axe !== 'undefined'")

            logger.info(f"Running axe analysis with tags: {tags}")
            results = page.evaluate(
                f"""() => {{
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
                }}"""
            )

            return {
                "success": True,
                "results": results,
                "mode": "full",
                "tags_used": tags,
                "violations_count": len(results.get("violations", [])),
            }
        except Exception as analysis_error:
            logger.error(f"Axe analysis failed: {analysis_error}")
            return {
                "success": False,
                "error": f"Axe analysis failed: {str(analysis_error)}",
                "mode": "static_only",
                "analysis_error": True,
            }
        finally:
            if page is not None:
                page.close()
            if context is not None:
                context.close()
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "mode": "static_only",
        }


if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        if not input_data:
            if len(sys.argv) > 1:
                data = {"url": sys.argv[1]}
            else:
                print(json.dumps({"success": False, "error": "No input data provided", "mode": "static_only"}))
                sys.exit(1)
        else:
            data = json.loads(input_data)

        result = run_analysis(data)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc(),
            "mode": "static_only",
        }))
    finally:
        close_browser()
