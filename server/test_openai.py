"""
Test script for Google Gemini API integration
"""

import os
import sys
import google.generativeai as genai

def test_gemini_connection():
    """Test connection to Google Gemini API"""
    # Get API key
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY environment variable not set.")
        print("Please set it in your .env file or environment variables.")
        sys.exit(1)
    
    # Set API key
    genai.configure(api_key=api_key)
    
    try:
        # Simple test request
        response = genai.generate_content(
            model="gemini-pro",
            contents=[
                {"role": "user", "parts": [{"text": "What is WCAG?"}]}
            ],
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=100
            )
        )
        
        # Print response
        print("✅ Gemini API connection successful!")
        print("\nResponse from Gemini:")
        print(response.text)
        return True
        
    except Exception as e:
        print(f"❌ Error connecting to Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    test_gemini_connection() 