from bs4 import BeautifulSoup
from typing import Dict, Any
import re
from wcag_contrast_ratio import contrast_ratio  # We'll need to add this to requirements.txt

def validate_aria_role(role: str) -> bool:
    """Validates if an ARIA role is valid according to WAI-ARIA spec"""
    valid_roles = {
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 'cell',
        'checkbox', 'columnheader', 'combobox', 'complementary', 'contentinfo',
        'definition', 'dialog', 'directory', 'document', 'feed', 'figure', 'form',
        'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list', 'listbox',
        'listitem', 'log', 'main', 'marquee', 'math', 'menu', 'menubar', 'menuitem',
        'menuitemcheckbox', 'menuitemradio', 'navigation', 'none', 'note', 'option',
        'presentation', 'progressbar', 'radio', 'radiogroup', 'region', 'row',
        'rowgroup', 'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 'tablist',
        'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 'tooltip', 'tree',
        'treegrid', 'treeitem'
    }
    return role in valid_roles

def analyze_html_content(html: str) -> Dict[str, Any]:
    """
    Analyzes HTML content for accessibility issues
    
    Args:
        html: HTML content as a string
        
    Returns:
        Dictionary with analysis results including issues, score, and summary
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    accessibility_issues = {
        "Images": [],
        "Forms": [],
        "Structure": [],
        "Navigation": [],
        "Semantics": [],
        "ARIA": [],
        "Media": [],
        "Keyboard": [],
        "Other": []
    }

    # 1. Missing alt on <img>
    for img in soup.find_all('img'):
        if not img.get('alt'):
            accessibility_issues["Images"].append({
                "severity": "error",
                "title": "Missing alt attribute",
                "description": "Images must have alt text for screen readers.",
                "element": str(img),
                "recommendation": "Add descriptive alt text that conveys the purpose of the image."
            })

    # 2. Inputs without <label>
    inputs = soup.find_all('input')
    labels = soup.find_all('label')
    labeled_ids = [label.get('for') for label in labels if label.get('for')]

    for input_ in inputs:
        input_id = input_.get('id')
        input_type = input_.get('type', '').lower()
        
        # Skip hidden inputs and submit/button types
        if input_type in ['hidden', 'submit', 'button', 'reset']:
            continue
            
        if input_id is None or input_id not in labeled_ids:
            accessibility_issues["Forms"].append({
                "severity": "error",
                "title": "Input without label",
                "description": "Form inputs need labels for screen reader users.",
                "element": str(input_),
                "recommendation": f"Add a <label for=\"{input_id or 'input-id'}\"> element that describes this input."
            })

    # 3. Improper heading order
    headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
    prev_level = 0
    for heading in headings:
        level = int(heading.name[1])
        if prev_level and (level - prev_level) > 1:
            accessibility_issues["Structure"].append({
                "severity": "warning",
                "title": "Improper heading order",
                "description": f"Heading levels should not skip (from h{prev_level} to h{level}).",
                "element": str(heading),
                "recommendation": f"Use proper heading hierarchy. Consider using h{prev_level + 1} instead."
            })
        prev_level = level

    # 4. Empty anchor tags
    for a in soup.find_all('a'):
        if not a.get_text(strip=True) and not a.get('aria-label'):
            accessibility_issues["Navigation"].append({
                "severity": "error",
                "title": "Empty anchor tag",
                "description": "Links must have descriptive text for screen readers.",
                "element": str(a),
                "recommendation": "Add text content or aria-label to the link."
            })
    
    # 5. Button without accessible label
    for button in soup.find_all('button'):
        if not button.get_text(strip=True) and not button.get('aria-label'):
            accessibility_issues["Forms"].append({
                "severity": "error",
                "title": "Button without label",
                "description": "Buttons must have text content or aria-label for screen readers.",
                "element": str(button),
                "recommendation": "Add text content or aria-label to the button."
            })

    # 6. Inline styles for font/color
    for tag in soup.find_all(style=True):
        style = tag['style'].lower()
        if 'font-size' in style or 'color' in style:
            accessibility_issues["Semantics"].append({
                "severity": "warning",
                "title": "Inline styling for font/color",
                "description": "Inline styles may override user's accessibility settings.",
                "element": str(tag),
                "recommendation": "Move styles to external CSS and use relative units."
            })

    # 7. Missing lang attribute in <html>
    html_tag = soup.find('html')
    if html_tag and not html_tag.get('lang'):
        accessibility_issues["Semantics"].append({
            "severity": "error",
            "title": "Missing lang attribute on <html>",
            "description": "The lang attribute helps screen readers pronounce content correctly.",
            "element": str(html_tag),
            "recommendation": "Add lang attribute to the html tag, e.g. <html lang=\"en\">."
        })
    
    # 8. Low contrast text (simplified check)
    for tag in soup.find_all(['p', 'span', 'div', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']):
        if tag.get('style') and ('color:' in tag.get('style').lower()):
            accessibility_issues["Semantics"].append({
                "severity": "warning",
                "title": "Potential low contrast text",
                "description": "Custom text colors may have insufficient contrast.",
                "element": str(tag),
                "recommendation": "Ensure text has sufficient contrast ratio (4.5:1 for normal text)."
            })

    # 9. Missing form labels
    for form in soup.find_all('form'):
        if not form.get('aria-label') and not form.find('legend'):
            accessibility_issues["Forms"].append({
                "severity": "warning",
                "title": "Form without label",
                "description": "Forms should have descriptive labels or legends.",
                "element": str(form)[:100] + "..." if len(str(form)) > 100 else str(form),
                "recommendation": "Add a legend or aria-label to describe the form's purpose."
            })
    
    # 10. Tables without headers
    for table in soup.find_all('table'):
        if not table.find('th') and not table.find('thead'):
            accessibility_issues["Structure"].append({
                "severity": "error",
                "title": "Table without headers",
                "description": "Tables need headers for screen reader navigation.",
                "element": str(table)[:100] + "..." if len(str(table)) > 100 else str(table),
                "recommendation": "Add <th> elements or a <thead> section with column headers."
            })

    # New checks:
    
    # 11. ARIA role validation
    for element in soup.find_all(attrs={'role': True}):
        role = element.get('role')
        if not validate_aria_role(role):
            accessibility_issues["ARIA"].append({
                "severity": "error",
                "title": "Invalid ARIA role",
                "description": f"The ARIA role '{role}' is not valid.",
                "element": str(element),
                "recommendation": "Use a valid ARIA role from the WAI-ARIA specification."
            })

    # 12. Keyboard navigation - tabindex validation
    for element in soup.find_all(attrs={'tabindex': True}):
        tabindex = element.get('tabindex')
        try:
            if int(tabindex) > 0:
                accessibility_issues["Keyboard"].append({
                    "severity": "warning",
                    "title": "Positive tabindex",
                    "description": "Positive tabindex values create custom tab order that may confuse users.",
                    "element": str(element),
                    "recommendation": "Avoid positive tabindex values. Use 0 for focusable elements."
                })
        except ValueError:
            accessibility_issues["Keyboard"].append({
                "severity": "error",
                "title": "Invalid tabindex",
                "description": "tabindex must be a valid integer.",
                "element": str(element),
                "recommendation": "Use a valid integer for tabindex."
            })

    # 13. Media accessibility
    for media in soup.find_all(['video', 'audio']):
        if not media.find('track', attrs={'kind': 'captions'}):
            accessibility_issues["Media"].append({
                "severity": "error",
                "title": "Missing captions",
                "description": f"<{media.name}> element lacks captions.",
                "element": str(media),
                "recommendation": "Add <track> element with captions for media content."
            })

    # 14. Focus management
    interactive_elements = soup.find_all(['button', 'a', 'input', 'select', 'textarea'])
    for element in interactive_elements:
        outline_style = element.get('style', '').lower()
        if 'outline: none' in outline_style or 'outline:none' in outline_style:
            accessibility_issues["Keyboard"].append({
                "severity": "error",
                "title": "Removed focus indicator",
                "description": "Focus indicators are essential for keyboard navigation.",
                "element": str(element),
                "recommendation": "Keep focus outlines or provide visible alternative focus indicators."
            })

    # 15. Form field groups
    fieldsets = soup.find_all('fieldset')
    for fieldset in fieldsets:
        if not fieldset.find('legend'):
            accessibility_issues["Forms"].append({
                "severity": "warning",
                "title": "Fieldset without legend",
                "description": "Fieldsets should have legends to describe the group.",
                "element": str(fieldset),
                "recommendation": "Add a <legend> element to describe the form field group."
            })

    # 16. Document outline
    main_elements = soup.find_all('main')
    if len(main_elements) > 1:
        accessibility_issues["Structure"].append({
            "severity": "error",
            "title": "Multiple main elements",
            "description": "A page should have only one main landmark.",
            "element": "Multiple <main> elements found",
            "recommendation": "Keep only one <main> element per page."
        })

    # 17. SVG accessibility
    for svg in soup.find_all('svg'):
        if not svg.get('role') and not svg.get('aria-label'):
            accessibility_issues["Images"].append({
                "severity": "warning",
                "title": "SVG without accessible name",
                "description": "SVGs need accessible names for screen readers.",
                "element": str(svg),
                "recommendation": "Add role='img' and aria-label or <title> element."
            })

    # Flatten issues for the response
    all_issues = []
    for category, issues_list in accessibility_issues.items():
        for issue in issues_list:
            issue["category"] = category
            all_issues.append(issue)

    # Update scoring weights based on new checks
    error_weight = 10
    warning_weight = 5
    notice_weight = 2
    
    # Flatten issues and calculate score
    errors = sum(1 for issue in all_issues if issue["severity"] == "error")
    warnings = sum(1 for issue in all_issues if issue["severity"] == "warning")
    notices = sum(1 for issue in all_issues if issue["severity"] == "info")
    
    total_checks = 17  # Updated number of checks
    passed = total_checks - len(set(issue["title"] for issue in all_issues))
    
    # More nuanced scoring system
    max_score = 100
    error_deduction = min(50, errors * error_weight)  # Cap error deductions
    warning_deduction = min(30, warnings * warning_weight)  # Cap warning deductions
    notice_deduction = min(20, notices * notice_weight)  # Cap notice deductions
    
    score = max(0, max_score - error_deduction - warning_deduction - notice_deduction)

    return {
        "issues": all_issues,
        "score": score,
        "summary": {
            "errors": errors,
            "warnings": warnings,
            "notices": notices,
            "passed": passed,
            "total_checks": total_checks
        }
    } 