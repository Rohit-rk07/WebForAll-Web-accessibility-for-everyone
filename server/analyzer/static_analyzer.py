"""Static analyzer for accessibility checks."""

from bs4 import BeautifulSoup
import time
import re
from typing import List, Dict, Any, Tuple
from .models import AnalysisResult, AccessibilityIssue, AnalysisSummary

def parse_color(color: str) -> Tuple[int, int, int]:
    """Parse color string to RGB values."""
    # Handle hex colors
    if color.startswith('#'):
        if len(color) == 4:  # Short form #RGB
            r = int(color[1] + color[1], 16)
            g = int(color[2] + color[2], 16)
            b = int(color[3] + color[3], 16)
        else:  # Full form #RRGGBB
            r = int(color[1:3], 16)
            g = int(color[3:5], 16)
            b = int(color[5:7], 16)
        return (r, g, b)
    
    # Handle rgb() format
    rgb_match = re.match(r'rgb\((\d+),\s*(\d+),\s*(\d+)\)', color)
    if rgb_match:
        return tuple(map(int, rgb_match.groups()))
    
    return (0, 0, 0)  # Default to black if parsing fails

def calculate_relative_luminance(r: int, g: int, b: int) -> float:
    """Calculate relative luminance according to WCAG 2.0."""
    def normalize(c: int) -> float:
        c = c / 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    
    rs, gs, bs = normalize(r), normalize(g), normalize(b)
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs

def calculate_contrast_ratio(color1: Tuple[int, int, int], color2: Tuple[int, int, int]) -> float:
    """Calculate contrast ratio according to WCAG 2.0."""
    l1 = calculate_relative_luminance(*color1)
    l2 = calculate_relative_luminance(*color2)
    
    lighter = max(l1, l2)
    darker = min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)

class StaticAnalyzer:
    """Analyzes accessibility using BeautifulSoup4 and static analysis."""
    
    def __init__(self):
        self.valid_landmarks = {
            'banner', 'complementary', 'contentinfo', 'form', 'main',
            'navigation', 'region', 'search'
        }
        
        self.interactive_elements = {
            'a', 'button', 'input', 'select', 'textarea', 'details',
            'audio[controls]', 'video[controls]'
        }
    
    async def analyze(self, html: str) -> AnalysisResult:
        """
        Analyzes HTML content using static analysis.
        
        Args:
            html: HTML content to analyze
            
        Returns:
            Analysis results
        """
        start_time = time.time()
        soup = BeautifulSoup(html, 'html.parser')
        issues = []
        
        # Run all checks
        issues.extend(self._check_document_structure(soup))
        issues.extend(self._check_aria_attributes(soup))
        issues.extend(self._check_form_accessibility(soup))
        issues.extend(self._check_semantic_elements(soup))
        issues.extend(self._check_color_contrast(soup))
        issues.extend(self._check_language_attributes(soup))
        
        analysis_time = time.time() - start_time
        
        return AnalysisResult(
            issues=issues,
            summary=self._create_summary(issues),
            score=self._calculate_score(issues),
            metadata={
                "analysis_time": analysis_time,
                "html_size": len(html),
                "static_checks_performed": True
            }
        )
    
    def _check_document_structure(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Checks document structure and landmarks."""
        issues = []
        
        # Check for single main landmark
        main_elements = soup.find_all('main')
        if len(main_elements) > 1:
            issues.append(AccessibilityIssue(
                severity="error",
                category="Structure",
                title="Multiple main landmarks",
                description="Page must have exactly one main landmark",
                element="<multiple main elements>",
                recommendation="Keep only one <main> element",
                wcag_criterion="1.3.1",
                impact="serious"
            ))
        elif len(main_elements) == 0:
            issues.append(AccessibilityIssue(
                severity="error",
                category="Structure",
                title="Missing main landmark",
                description="Page should have a main landmark",
                element="<body>",
                recommendation="Add a <main> element",
                wcag_criterion="1.3.1",
                impact="serious"
            ))
        
        # Check heading hierarchy
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        prev_level = 0
        for heading in headings:
            level = int(heading.name[1])
            if prev_level > 0 and level - prev_level > 1:
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="Structure",
                    title="Skipped heading level",
                    description=f"Heading levels should not skip (h{prev_level} to h{level})",
                    element=str(heading),
                    recommendation=f"Use h{prev_level + 1} instead",
                    wcag_criterion="2.4.6",
                    impact="moderate"
                ))
            prev_level = level
        
        return issues
    
    def _check_aria_attributes(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Validates ARIA attributes and roles."""
        issues = []
        
        # Check for invalid ARIA roles
        elements_with_role = soup.find_all(attrs={"role": True})
        for element in elements_with_role:
            role = element["role"]
            if role not in self.valid_landmarks and role not in {"button", "link", "checkbox", "radio"}:
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="ARIA",
                    title="Invalid ARIA role",
                    description=f"Role '{role}' is not a valid ARIA role",
                    element=str(element),
                    recommendation="Use a valid ARIA role",
                    wcag_criterion="4.1.2",
                    impact="critical"
                ))
        
        # Check for required ARIA attributes
        elements_with_expanded = soup.find_all(attrs={"aria-expanded": True})
        for element in elements_with_expanded:
            if not element.get("role") and element.name not in {"button", "details"}:
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="ARIA",
                    title="Missing role for aria-expanded",
                    description="Elements with aria-expanded need a role",
                    element=str(element),
                    recommendation="Add appropriate role attribute",
                    wcag_criterion="4.1.2",
                    impact="serious"
                ))
        
        return issues
    
    def _check_form_accessibility(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Checks form-related accessibility issues."""
        issues = []
        
        # Check form controls have labels
        for input_element in soup.find_all('input'):
            input_type = input_element.get('type', '').lower()
            if input_type not in ['submit', 'button', 'hidden']:
                if not (input_element.get('id') and soup.find('label', attrs={'for': input_element['id']})):
                    issues.append(AccessibilityIssue(
                        severity="error",
                        category="Forms",
                        title="Input missing label",
                        description="Form controls must have associated labels",
                        element=str(input_element),
                        recommendation="Add a label with matching 'for' attribute",
                        wcag_criterion="3.3.2",
                        impact="critical"
                    ))
        
        # Check fieldset/legend for groups
        for fieldset in soup.find_all('fieldset'):
            if not fieldset.find('legend'):
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="Forms",
                    title="Fieldset missing legend",
                    description="Fieldsets must have legends",
                    element=str(fieldset),
                    recommendation="Add a legend element",
                    wcag_criterion="1.3.1",
                    impact="serious"
                ))
        
        return issues
    
    def _check_semantic_elements(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Checks semantic HTML usage."""
        issues = []
        
        # Check for semantic list markup
        list_items = soup.find_all('li')
        for item in list_items:
            if not item.parent or item.parent.name not in ['ul', 'ol']:
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="Semantics",
                    title="List item without list",
                    description="List items must be contained in ul/ol",
                    element=str(item),
                    recommendation="Wrap in appropriate list element",
                    wcag_criterion="1.3.1",
                    impact="moderate"
                ))
        
        # Check table structure
        for table in soup.find_all('table'):
            if not table.find('th') and not table.find('caption'):
                issues.append(AccessibilityIssue(
                    severity="error",
                    category="Semantics",
                    title="Table missing headers/caption",
                    description="Tables need headers or captions",
                    element=str(table),
                    recommendation="Add th elements or caption",
                    wcag_criterion="1.3.1",
                    impact="serious"
                ))
        
        return issues
    
    def _check_color_contrast(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Checks color contrast ratios."""
        issues = []
        
        # Check elements with color styles
        for element in soup.find_all(style=True):
            style = element.get('style', '').lower()
            
            # Extract colors from style attribute
            color_match = re.search(r'color:\s*(#[0-9a-f]{3,6}|rgb\(\d+,\s*\d+,\s*\d+\))', style)
            bg_match = re.search(r'background-color:\s*(#[0-9a-f]{3,6}|rgb\(\d+,\s*\d+,\s*\d+\))', style)
            
            if color_match and bg_match:
                fg_color = parse_color(color_match.group(1))
                bg_color = parse_color(bg_match.group(1))
                
                contrast = calculate_contrast_ratio(fg_color, bg_color)
                if contrast < 4.5:  # WCAG AA standard for normal text
                    issues.append(AccessibilityIssue(
                        severity="error",
                        category="Colors",
                        title="Insufficient color contrast",
                        description=f"Color contrast ratio {contrast:.1f}:1 is below WCAG AA standard (4.5:1)",
                        element=str(element),
                        recommendation="Adjust colors to meet minimum contrast requirements",
                        wcag_criterion="1.4.3",
                        impact="serious"
                    ))
        
        return issues
    
    def _check_language_attributes(self, soup: BeautifulSoup) -> List[AccessibilityIssue]:
        """Checks language-related attributes."""
        issues = []
        
        # Check html lang attribute
        html_tag = soup.find('html')
        if not html_tag or not html_tag.get('lang'):
            issues.append(AccessibilityIssue(
                severity="error",
                category="Language",
                title="Missing language declaration",
                description="Page language must be specified",
                element="<html>",
                recommendation="Add lang attribute to html element",
                wcag_criterion="3.1.1",
                impact="serious"
            ))
        
        return issues
    
    def _create_summary(self, issues: List[AccessibilityIssue]) -> AnalysisSummary:
        """Creates analysis summary from issues."""
        return AnalysisSummary(
            errors=len([i for i in issues if i.severity == "error"]),
            warnings=len([i for i in issues if i.severity == "warning"]),
            notices=len([i for i in issues if i.severity == "info"]),
            passed=len(self._get_passed_checks(issues)),
            total_checks=self._get_total_checks(),
            best_practices_violations=len([i for i in issues if "best-practice" in (i.wcag_criterion or "")]),
            score=self._calculate_score(issues)
        )
    
    def _calculate_score(self, issues: List[AccessibilityIssue]) -> float:
        """Calculates accessibility score."""
        weights = {
            "error": 10,
            "warning": 5,
            "info": 2
        }
        
        total_deductions = sum(weights[issue.severity] for issue in issues)
        max_score = 100
        
        return max(0, max_score - min(total_deductions, max_score))
    
    def _get_total_checks(self) -> int:
        """Returns total number of checks performed."""
        return 20  # Update this as checks are added
    
    def _get_passed_checks(self, issues: List[AccessibilityIssue]) -> List[str]:
        """Returns list of passed check IDs."""
        all_checks = {
            "document_structure",
            "aria_attributes",
            "form_accessibility",
            "semantic_elements",
            "color_contrast",
            "language_attributes"
        }
        
        failed_checks = {issue.category.lower() for issue in issues}
        return list(all_checks - failed_checks) 