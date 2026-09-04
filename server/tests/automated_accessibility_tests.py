"""Automated accessibility testing system for the Accessibility Analyzer UI."""

import pytest
import asyncio
from playwright.async_api import async_playwright, Page, Browser
from typing import Dict, List, Any, Optional
import json

class AutomatedAccessibilityTester:
    """
    Automated accessibility testing system that validates the UI itself
    meets WCAG 2.1 AA standards using Playwright and axe-core.
    """
    
    def __init__(self, base_url: str = "http://localhost:5173"):
        """
        Initialize the automated accessibility tester.
        
        Args:
            base_url: Base URL of the application to test
        """
        self.base_url = base_url
        self.test_results: List[Dict[str, Any]] = []
        
    async def test_page_accessibility(
        self, 
        page: Page, 
        page_name: str,
        wcag_level: str = "AA"
    ) -> Dict[str, Any]:
        """
        Test a single page for accessibility compliance.
        
        Args:
            page: Playwright page object
            page_name: Name/identifier of the page being tested
            wcag_level: WCAG conformance level to test against
            
        Returns:
            Dict containing accessibility test results
        """
        # Inject axe-core
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js")
        
        # Run axe-core analysis
        results = await page.evaluate(f"""
            async () => {{
                return await axe.run(document, {{
                    runOnly: {{
                        type: 'tag',
                        values: ['wcag2{wcag_level.lower()}']
                    }}
                }});
            }}
        """)
        
        # Process results
        test_result = {
            "page_name": page_name,
            "url": page.url,
            "wcag_level": wcag_level,
            "violations": results.get("violations", []),
            "passes": results.get("passes", []),
            "incomplete": results.get("incomplete", []),
            "timestamp": asyncio.get_event_loop().time()
        }
        
        self.test_results.append(test_result)
        return test_result
    
    async def test_keyboard_navigation(self, page: Page, page_name: str) -> Dict[str, Any]:
        """
        Test keyboard navigation accessibility.
        
        Args:
            page: Playwright page object
            page_name: Name of the page being tested
            
        Returns:
            Dict containing keyboard navigation test results
        """
        keyboard_issues = []
        
        # Test tab navigation
        try:
            await page.keyboard.press('Tab')
            focused_element = await page.evaluate('document.activeElement.tagName')
            
            if focused_element == 'BODY':
                keyboard_issues.append({
                    "type": "keyboard_navigation",
                    "description": "Tab key does not move focus to interactive elements",
                    "severity": "serious"
                })
        except Exception as e:
            keyboard_issues.append({
                "type": "keyboard_navigation",
                "description": f"Keyboard navigation test failed: {str(e)}",
                "severity": "moderate"
            })
        
        # Test focus indicators
        focus_indicator_issues = await page.evaluate("""
            () => {
                const issues = [];
                const focusableElements = document.querySelectorAll(
                    'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                
                focusableElements.forEach(el => {
                    el.focus();
                    const computedStyle = window.getComputedStyle(el);
                    const hasFocusIndicator = 
                        computedStyle.outline !== 'none' ||
                        computedStyle.boxShadow !== 'none' ||
                        el.getAttribute('class')?.includes('focus');
                    
                    if (!hasFocusIndicator) {
                        issues.push({
                            element: el.tagName,
                            missing: 'focus indicator'
                        });
                    }
                });
                
                return issues;
            }
        """)
        
        for issue in focus_indicator_issues:
            keyboard_issues.append({
                "type": "focus_indicator",
                "description": f"{issue['element']} element missing focus indicator",
                "severity": "moderate"
            })
        
        return {
            "page_name": page_name,
            "keyboard_issues": keyboard_issues,
            "total_issues": len(keyboard_issues)
        }
    
    async def test_screen_reader_compatibility(self, page: Page, page_name: str) -> Dict[str, Any]:
        """
        Test screen reader compatibility.
        
        Args:
            page: Playwright page object
            page_name: Name of the page being tested
            
        Returns:
            Dict containing screen reader compatibility test results
        """
        sr_issues = []
        
        # Test ARIA labels
        aria_issues = await page.evaluate("""
            () => {
                const issues = [];
                
                // Check for interactive elements without labels
                const interactiveElements = document.querySelectorAll(
                    'button:not([aria-label]):not([aria-labelledby]), a:not([aria-label]):not([aria-labelledby]):not([textContent])'
                );
                
                interactiveElements.forEach(el => {
                    issues.push({
                        element: el.tagName,
                        issue: 'missing ARIA label or text content',
                        severity: 'serious'
                    });
                });
                
                // Check for images without alt text
                const images = document.querySelectorAll('img:not([alt])');
                images.forEach(img => {
                    issues.push({
                        element: 'img',
                        issue: 'missing alt attribute',
                        severity: 'critical'
                    });
                });
                
                // Check for form inputs without labels
                const inputs = document.querySelectorAll(
                    'input:not([aria-label]):not([aria-labelledby]):not([id])'
                );
                inputs.forEach(input => {
                    issues.push({
                        element: 'input',
                        issue: 'missing label or aria-label',
                        severity: 'serious'
                    });
                });
                
                return issues;
            }
        """)
        
        sr_issues.extend(aria_issues)
        
        return {
            "page_name": page_name,
            "screen_reader_issues": sr_issues,
            "total_issues": len(sr_issues)
        }
    
    async def test_color_contrast(self, page: Page, page_name: str) -> Dict[str, Any]:
        """
        Test color contrast ratios.
        
        Args:
            page: Playwright page object
            page_name: Name of the page being tested
            
        Returns:
            Dict containing color contrast test results
        """
        contrast_issues = []
        
        # Use axe-core for color contrast testing
        await page.add_script_tag(url="https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.8.2/axe.min.js")
        
        contrast_results = await page.evaluate("""
            async () => {
                return await axe.run(document, {
                    runOnly: {
                        type: 'tag',
                        values: ['wcag2aa']
                    },
                    rules: {
                        'color-contrast': { enabled: true }
                    }
                });
            }
        """)
        
        color_contrast_violations = [
            v for v in contrast_results.get("violations", [])
            if v['id'] == 'color-contrast'
        ]
        
        for violation in color_contrast_violations:
            contrast_issues.append({
                "type": "color_contrast",
                "description": violation.get("description", "Color contrast issue"),
                "nodes": violation.get("nodes", []),
                "severity": "serious"
            })
        
        return {
            "page_name": page_name,
            "contrast_issues": contrast_issues,
            "total_issues": len(contrast_issues)
        }
    
    async def run_comprehensive_test(
        self, 
        pages_to_test: List[str],
        wcag_level: str = "AA"
    ) -> Dict[str, Any]:
        """
        Run comprehensive accessibility tests on multiple pages.
        
        Args:
            pages_to_test: List of page paths to test (e.g., ["/", "/login", "/dashboard"])
            wcag_level: WCAG conformance level
            
        Returns:
            Dict containing comprehensive test results
        """
        comprehensive_results = {
            "total_pages_tested": len(pages_to_test),
            "pages": [],
            "summary": {
                "total_violations": 0,
                "total_keyboard_issues": 0,
                "total_screen_reader_issues": 0,
                "total_contrast_issues": 0,
                "overall_compliance": True
            }
        }
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context()
            
            for page_path in pages_to_test:
                page = await context.new_page()
                await page.goto(f"{self.base_url}{page_path}")
                
                # Run all tests
                accessibility_result = await self.test_page_accessibility(page, page_path, wcag_level)
                keyboard_result = await self.test_keyboard_navigation(page, page_path)
                sr_result = await self.test_screen_reader_compatibility(page, page_path)
                contrast_result = await self.test_color_contrast(page, page_path)
                
                page_result = {
                    "path": page_path,
                    "accessibility": accessibility_result,
                    "keyboard": keyboard_result,
                    "screen_reader": sr_result,
                    "color_contrast": contrast_result,
                    "total_issues": (
                        len(accessibility_result["violations"]) +
                        keyboard_result["total_issues"] +
                        sr_result["total_issues"] +
                        contrast_result["total_issues"]
                    )
                }
                
                comprehensive_results["pages"].append(page_result)
                
                # Update summary
                comprehensive_results["summary"]["total_violations"] += len(accessibility_result["violations"])
                comprehensive_results["summary"]["total_keyboard_issues"] += keyboard_result["total_issues"]
                comprehensive_results["summary"]["total_screen_reader_issues"] += sr_result["total_issues"]
                comprehensive_results["summary"]["total_contrast_issues"] += contrast_result["total_issues"]
                
                await page.close()
            
            await browser.close()
        
        # Determine overall compliance
        comprehensive_results["summary"]["overall_compliance"] = (
            comprehensive_results["summary"]["total_violations"] == 0 and
            comprehensive_results["summary"]["total_keyboard_issues"] == 0 and
            comprehensive_results["summary"]["total_screen_reader_issues"] == 0 and
            comprehensive_results["summary"]["total_contrast_issues"] == 0
        )
        
        return comprehensive_results
    
    def generate_test_report(self) -> str:
        """
        Generate a human-readable test report.
        
        Returns:
            Formatted test report string
        """
        if not self.test_results:
            return "No test results available."
        
        report = "# Automated Accessibility Test Report\n\n"
        
        for result in self.test_results:
            report += f"## Page: {result['page_name']}\n"
            report += f"URL: {result['url']}\n"
            report += f"WCAG Level: {result['wcag_level']}\n\n"
            
            report += f"### Violations ({len(result['violations'])})\n"
            for violation in result['violations']:
                report += f"- **{violation['id']}**: {violation['description']}\n"
                report += f"  Impact: {violation['impact']}\n\n"
            
            report += f"### Passes ({len(result['passes'])})\n"
            report += f"### Incomplete ({len(result['incomplete'])})\n\n"
            report += "---\n\n"
        
        return report

# Global automated accessibility tester instance
automated_tester = AutomatedAccessibilityTester()

# Pytest fixtures
@pytest.fixture
async def accessibility_page():
    """Fixture for creating a Playwright page for accessibility testing."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        yield page
        await browser.close()

@pytest.mark.asyncio
async def test_home_page_accessibility(accessibility_page):
    """Test home page accessibility."""
    await accessibility_page.goto("http://localhost:5173/")
    result = await automated_tester.test_page_accessibility(accessibility_page, "home")
    
    # Assert no critical violations
    critical_violations = [v for v in result['violations'] if v['impact'] == 'critical']
    assert len(critical_violations) == 0, f"Found {len(critical_violations)} critical violations"

@pytest.mark.asyncio
async def test_keyboard_navigation(accessibility_page):
    """Test keyboard navigation."""
    await accessibility_page.goto("http://localhost:5173/")
    result = await automated_tester.test_keyboard_navigation(accessibility_page, "home")
    
    # Assert keyboard navigation works
    assert result['total_issues'] == 0, f"Found {result['total_issues']} keyboard navigation issues"