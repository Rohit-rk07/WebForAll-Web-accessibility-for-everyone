"""AI service module for Gemini API integration."""

import os
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
import re

logger = logging.getLogger(__name__)

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_CONFIGURED = False

def initialize_gemini():
    """Initialize Gemini AI configuration."""
    global GEMINI_CONFIGURED
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. AI features will not work.")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Test the API key by creating a simple model instance
        test_model = genai.GenerativeModel("gemini-1.5-flash")
        GEMINI_CONFIGURED = True
        logger.info("Gemini AI configured successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini AI: {str(e)}")
        GEMINI_CONFIGURED = False
        return False

def chat_completion(messages: List[Dict[str, str]], model: str = "gemini-1.5-flash", 
                   temperature: float = 0.7, max_tokens: Optional[int] = None) -> Dict[str, Any]:
    """
    Generate chat completion using Gemini API.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: Model name (defaults to gemini-1.5-flash)
        temperature: Response randomness (0.0 to 1.0)
        max_tokens: Maximum tokens in response
        
    Returns:
        Dict containing the response or error information
    """
    if not GEMINI_CONFIGURED:
        return {
            "error": "Gemini AI is not configured. Please check your API key.",
            "content": "AI service is currently unavailable."
        }
    
    try:
        # Restrict to accessibility topics only
        system_prompt = (
            "You are an AI assistant specialized in web accessibility,following WCAG guidelines."
            "Only answer questions related to accessibility, WCAG, and accessibility issues."
            "If asked about anything else, reply politely that you can only assist with accessibility topics."
        )
        conversation_text = system_prompt + "\n"
        for message in messages:
            role = message.get("role", "user")
            content = message.get("content", "")
            if role == "user":
                conversation_text += f"User: {content}\n"
            elif role == "assistant":
                conversation_text += f"Assistant: {content}\n"
            elif role == "system":
                conversation_text = f"System: {content}\n" + conversation_text
        
        # Create model instance
        model_instance = genai.GenerativeModel(model)
        
        # Generate response
        response = model_instance.generate_content(
            conversation_text,
            generation_config=genai.types.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens
            )
        )
        
        return {
            "content": response.text,
            "model": model,
            "usage": {
                "total_tokens": len(response.text.split()) if response.text else 0
            }
        }
        
    except Exception as e:
        logger.error(f"Gemini API error: {str(e)}")
        return {
            "error": f"Gemini API error: {str(e)}",
            "content": "Sorry, I'm having trouble processing your request right now."
        }

def explain_accessibility_issue(issue: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate explanation and fix for an accessibility issue.
    
    Args:
        issue: Accessibility issue data from axe-core
        
    Returns:
        Dict containing fixed code and brief explanation
    """
    if not GEMINI_CONFIGURED:
        return generate_fallback_explanation(issue)
    
    try:
        # Extract issue details
        rule_id = issue.get('id', 'Unknown')
        description = issue.get('help', issue.get('description', 'No description available'))
        impact = issue.get('impact', issue.get('severity', 'unknown'))
        
        # Get HTML code from nodes if available
        html_code = ""
        if issue.get('nodes') and len(issue['nodes']) > 0:
            html_code = issue['nodes'][0].get('html', '')
        elif issue.get('element'):
            html_code = issue.get('element', '')
        
        # Create prompt for complete fix
        prompt = (
            f"You are an expert in web accessibility. "
            f"Below is an HTML snippet with an accessibility issue:\n\n"
            f"{html_code}\n\n"
            "1. Briefly explain the accessibility issue and its impact.\n"
            "2. Provide a corrected HTML snippet that fully resolves the issue, following WCAG guidelines.\n"
            "Format your response exactly as:\n"
            "EXPLANATION: <your explanation>\n"
            "FIXED_CODE:\n<your fixed HTML code only>\n"
            "Do NOT include highlight.js classes, markdown code blocks, or any extra formatting. "
            "Only output plain HTML in FIXED_CODE."
        )
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        response_text = response.text
        
        # Parse the simple response
        fixed_code = html_code  # fallback to original
        explanation = "Fixed accessibility issue."  # fallback
        
        lines = response_text.split('\n')
        current_section = None
        fixed_code_lines = []
        
        for line in lines:
            line = line.strip()
            if line.startswith(('FIXED_CODE:', 'FIXED_SNIPPET:')):
                current_section = 'fixed_code'
                continue
            elif line.startswith('EXPLANATION:'):
                current_section = 'explanation'
                continue

            if current_section == 'fixed_code' and line and not line.startswith('```'):
                cleaned_line = line
                # Remove highlight.js and markdown artifacts
                cleaned_line = re.sub(r'class="[^"]*hljs[^"]*"', '', cleaned_line)
                cleaned_line = re.sub(r'hljs-[a-zA-Z-]*', '', cleaned_line)
                cleaned_line = re.sub(r'`{3,}\w*', '', cleaned_line)  # Remove code block markers
                cleaned_line = re.sub(r'\s+', ' ', cleaned_line)
                cleaned_line = re.sub(r'>\s*<', '><', cleaned_line)
                cleaned_line = cleaned_line.strip()
                if cleaned_line:
                    fixed_code_lines.append(cleaned_line)
            elif current_section == 'explanation' and line:
                explanation = line
                break  # Only take the first explanation line
        
        # Join all fixed code lines
        if fixed_code_lines:
            fixed_code = ' '.join(fixed_code_lines)
        
        # Additional cleanup for the final fixed code
        if fixed_code:
            # Remove any remaining hljs artifacts
            fixed_code = re.sub(r'"hljs-[^"]*"[>\s]*', '', fixed_code)
            fixed_code = re.sub(r'hljs-[a-zA-Z-]*[>\s]*', '', fixed_code)
            fixed_code = re.sub(r'class="[^"]*hljs[^"]*"', '', fixed_code)
            # Clean up malformed quotes and spaces
            fixed_code = re.sub(r'"\s*"', '"', fixed_code)
            fixed_code = re.sub(r'\s+', ' ', fixed_code)
            fixed_code = re.sub(r'>\s*<', '><', fixed_code)
            fixed_code = fixed_code.strip()
        
        # Validate the fixed code - ensure it's not just a fragment or incomplete
        if fixed_code and len(fixed_code.strip()) > 10:
            # Check if it's just a closing tag or fragment
            if fixed_code.strip().startswith('</') and len(fixed_code.strip()) < 20:
                fixed_code = html_code  # Use original if AI gave incomplete response
                explanation = "AI provided incomplete fix. Please refer to the original code and accessibility guidelines."
            # Check if it's meaningful HTML
            elif not any(char in fixed_code for char in ['<', '>', 'aria-', 'alt=', 'role=', 'tabindex']):
                fixed_code = html_code  # Use original if no HTML attributes
                explanation = "AI provided non-HTML response. Please refer to the original code and accessibility guidelines."
        else:
            # If fixed code is too short or empty, use original
            fixed_code = html_code
            explanation = "AI provided incomplete response. Please refer to the original code and accessibility guidelines."
        
        return {
            "fixedCode": fixed_code,
            "explanation": explanation,
            "ruleId": rule_id,
            "impact": impact
        }
        
    except Exception as e:
        logger.error(f"Error generating AI explanation: {str(e)}")
        return generate_fallback_explanation(issue)


def generate_fallback_explanation(issue: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a fallback explanation when AI is unavailable."""
    rule_id = issue.get('id', 'Unknown Rule')
    description = issue.get('help', issue.get('description', 'No description available'))
    impact = issue.get('impact', issue.get('severity', 'unknown'))
    
    return {
        "explanation": f"This is a {impact} level accessibility issue related to {rule_id}. {description}",
        "fix": "Please refer to the WCAG guidelines and the help URL for detailed fix instructions.",
        "beforeCode": issue.get('nodes', [{}])[0].get('html', 'No HTML code available') if issue.get('nodes') else 'No HTML code available',
        "afterCode": "AI service is currently unavailable for code suggestions.",
        "impact": impact,
        "ruleId": rule_id
    }
