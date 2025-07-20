"""AI service module for Gemini API integration."""

import os
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai

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
        # Convert messages to Gemini format
        conversation_text = ""
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
        Dict containing explanation, fix instructions, and code examples
    """
    if not GEMINI_CONFIGURED:
        return generate_fallback_explanation(issue)
    
    try:
        # Extract issue details
        rule_id = issue.get('id', 'Unknown')
        description = issue.get('help', issue.get('description', 'No description available'))
        impact = issue.get('impact', issue.get('severity', 'unknown'))
        help_url = issue.get('helpUrl', '')
        
        # Get HTML code from nodes if available
        html_code = ""
        if issue.get('nodes') and len(issue['nodes']) > 0:
            html_code = issue['nodes'][0].get('html', '')
        
        # Create prompt for Gemini
        prompt = f"""
        As an accessibility expert, explain this accessibility issue and provide a fix:

        Rule: {rule_id}
        Description: {description}
        Impact: {impact}
        HTML Code: {html_code}
        Help URL: {help_url}

        Please provide:
        1. A clear explanation of what this accessibility issue means
        2. Why it's important for users with disabilities
        3. Step-by-step instructions to fix it
        4. Before and after code examples (if applicable)

        Keep the explanation concise but comprehensive. Focus on practical solutions.
        """
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Parse response to extract sections
        response_text = response.text
        
        # Try to extract before/after code if HTML was provided
        before_code = html_code if html_code else "No HTML code available"
        after_code = "Fixed code would be provided based on the specific issue"
        
        return {
            "explanation": response_text,
            "fix": "Please refer to the explanation above for detailed fix instructions.",
            "beforeCode": before_code,
            "afterCode": after_code,
            "impact": impact,
            "ruleId": rule_id
        }
        
    except Exception as e:
        logger.error(f"Error generating AI explanation: {str(e)}")
        return generate_fallback_explanation(issue)

def generate_accessibility_summary(results: Dict[str, Any]) -> str:
    """
    Generate a summary report of accessibility issues.
    
    Args:
        results: Analysis results from accessibility scanner
        
    Returns:
        String containing the summary report
    """
    if not GEMINI_CONFIGURED:
        return generate_fallback_summary(results)
    
    try:
        # Extract key information from results
        violations = results.get('violations', []) if isinstance(results.get('violations'), list) else []
        passes = results.get('passes', []) if isinstance(results.get('passes'), list) else []
        incomplete = results.get('incomplete', []) if isinstance(results.get('incomplete'), list) else []
        
        # Count issues by severity
        severity_counts = {'critical': 0, 'serious': 0, 'moderate': 0, 'minor': 0}
        for violation in violations:
            impact = violation.get('impact', violation.get('severity', 'minor')).lower()
            if impact in severity_counts:
                severity_counts[impact] += 1
            else:
                severity_counts['minor'] += 1
        
        # Create prompt for summary
        prompt = f"""
        Create a concise accessibility analysis summary for this website:

        Results:
        - Total Violations: {len(violations)}
        - Critical Issues: {severity_counts['critical']}
        - Serious Issues: {severity_counts['serious']}
        - Moderate Issues: {severity_counts['moderate']}
        - Minor Issues: {severity_counts['minor']}
        - Tests Passed: {len(passes)}
        - Incomplete Tests: {len(incomplete)}

        Top Issues:
        {chr(10).join([f"- {v.get('id', 'Unknown')}: {v.get('help', 'No description')}" for v in violations[:5]])}

        Provide:
        1. Overall accessibility score assessment
        2. Priority areas for improvement
        3. Key recommendations
        4. Impact on users with disabilities

        Keep it concise and actionable.
        """
        
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        return response.text
        
    except Exception as e:
        logger.error(f"Error generating AI summary: {str(e)}")
        return generate_fallback_summary(results)

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

def generate_fallback_summary(results: Dict[str, Any]) -> str:
    """Generate a fallback summary when AI is unavailable."""
    violations = results.get('violations', []) if isinstance(results.get('violations'), list) else []
    passes = results.get('passes', []) if isinstance(results.get('passes'), list) else []
    
    return f"""
    Accessibility Analysis Summary:
    
    • Total Issues Found: {len(violations)}
    • Tests Passed: {len(passes)}
    
    The analysis has been completed. Please review the detailed results for specific issues and recommendations.
    
    Note: AI-powered insights are currently unavailable. Please refer to individual issue descriptions for guidance.
    """
