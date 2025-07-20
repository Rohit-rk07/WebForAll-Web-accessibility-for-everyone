"""Test script for the accessibility analyzer API."""

import requests
import json

API_BASE_URL = "http://localhost:8000"

def test_url_analysis():
    """Test URL analysis endpoint."""
    print("\n=== Testing URL Analysis ===")
    
    url = "https://example.com"
    payload = {"url": url}
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/analyze/url",
            json=payload
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success! Analysis mode: {result.get('mode', 'unknown')}")
            print(f"Found {len(result.get('results', {}).get('violations', []))} violations")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

def test_html_analysis():
    """Test HTML analysis endpoint."""
    print("\n=== Testing HTML Analysis ===")
    
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Page</title>
    </head>
    <body>
        <h1>Test Page</h1>
        <img src="test.jpg">
        <input type="text">
    </body>
    </html>
    """
    
    payload = {"content": html_content}
    
    try:
        response = requests.post(
            f"{API_BASE_URL}/analyze/html",
            json=payload
        )
        
        print(f"Status code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Success! Analysis mode: {result.get('mode', 'unknown')}")
            print(f"Found {len(result.get('results', {}).get('violations', []))} violations")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    print("Testing Accessibility Analyzer API...")
    test_url_analysis()
    test_html_analysis() 