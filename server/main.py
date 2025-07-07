from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel, HttpUrl
from fastapi.middleware.cors import CORSMiddleware
from bs4 import BeautifulSoup
import requests
from typing import Optional, Union, Dict, Any

app = FastAPI()

# CORS: Allow React frontend or Postman to access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For now allow all
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class HTMLInput(BaseModel):
    html: str

class URLInput(BaseModel):
    url: HttpUrl

# Helper function for analyzing HTML content
def analyze_html_content(html: str) -> Dict[str, Any]:
    soup = BeautifulSoup(html, 'html.parser')
    issues = []
    
    # Group issues by category for better organization
    accessibility_issues = {
        "Images": [],
        "Forms": [],
        "Structure": [],
        "Navigation": [],
        "Semantics": [],
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

    # Flatten issues for the response
    all_issues = []
    for category, issues_list in accessibility_issues.items():
        for issue in issues_list:
            issue["category"] = category
            all_issues.append(issue)

    # Calculate error, warning and notice counts
    errors = sum(1 for issue in all_issues if issue["severity"] == "error")
    warnings = sum(1 for issue in all_issues if issue["severity"] == "warning")
    notices = sum(1 for issue in all_issues if issue["severity"] == "info")
    
    # Calculate passed checks (simplified)
    total_checks = 10  # Total number of checks we perform
    passed = total_checks - len(set(issue["title"] for issue in all_issues))
    
    # Accessibility Score - weighted by severity
    score = max(0, 100 - (errors * 10 + warnings * 5 + notices * 2))

    return {
        "issues": all_issues,
        "score": score,
        "summary": {
            "errors": errors,
            "warnings": warnings,
            "notices": notices,
            "passed": passed
        }
    }

@app.post("/analyze")
async def analyze_html(data: HTMLInput):
    """Analyze HTML content directly provided in the request"""
    try:
        return analyze_html_content(data.html)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing HTML: {str(e)}")

@app.post("/analyze/file")
async def analyze_html_file(file: UploadFile = File(...)):
    """Analyze HTML content from an uploaded file"""
    try:
        content = await file.read()
        html_content = content.decode("utf-8")
        return analyze_html_content(html_content)
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 encoded text")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")

@app.post("/analyze/url")
async def analyze_url(data: URLInput):
    """Analyze HTML content from a URL"""
    try:
        # Fetch the URL content
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(str(data.url), headers=headers, timeout=10)
        response.raise_for_status()  # Raise exception for 4XX/5XX responses
        
        # Analyze the fetched HTML
        return analyze_html_content(response.text)
    except requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing URL: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Accessibility Analyzer API is running"}
