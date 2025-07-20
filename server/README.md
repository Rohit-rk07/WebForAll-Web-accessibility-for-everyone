# Accessibility Analyzer Server

A FastAPI-based server for analyzing web pages for accessibility issues.

## Features

- **URL Analysis**: Analyze accessibility of any public URL
- **HTML Analysis**: Analyze raw HTML content
- **Dynamic Analysis**: Uses Playwright for JavaScript-rendered content analysis
- **Static Analysis**: Falls back to static analysis when dynamic analysis is not possible
- **WCAG Standards**: Checks against WCAG 2.0 A, AA, and WCAG 2.1 A, AA standards

## Requirements

- Python 3.8+
- Playwright (for dynamic analysis)
- FastAPI and dependencies

## Installation

1. Create and activate a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Install Playwright browser:

```bash
python setup_playwright.py
```

4. Verify the installation:

```bash
python test_playwright.py
```

## Running the Server

Start the server with:

```bash
uvicorn main:app --reload
```

The API will be available at http://127.0.0.1:8000.

## API Endpoints

### Analyze URL

```
POST /analyze/url
```

Request body:
```json
{
  "url": "https://example.com"
}
```

### Analyze HTML

```
POST /analyze/html
```

Request body:
```json
{
  "content": "<html>...</html>",
  "base_url": "https://example.com" // Optional
}
```

## Troubleshooting

If you encounter issues with Playwright:

1. Make sure you've run `python setup_playwright.py` to install browser binaries
2. Run `python test_playwright.py` to verify the installation
3. Check logs for specific error messages
4. On Windows, ensure you have the necessary Visual C++ redistributables installed

## Architecture

The analyzer uses a two-tier approach:

1. **Dynamic Analysis**: Uses Playwright to render the page with JavaScript and run axe-core for comprehensive analysis
2. **Static Analysis**: Falls back to BeautifulSoup-based analysis when dynamic analysis fails

Dynamic analysis is performed in a separate process to avoid asyncio issues, especially on Windows. 