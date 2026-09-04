"""AI service module for Gemini API integration with quality metrics and safety measures."""

import os
import logging
from typing import Dict, List, Any, Optional
import google.generativeai as genai
import re
from datetime import datetime
from services.cache_service import cache_ai_explanation, get_cached_ai_explanation
from services.content_filter import content_filter, ContentFilterResult

logger = logging.getLogger(__name__)

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_CONFIGURED = False

# AI Quality Metrics
AI_METRICS = {
    "total_requests": 0,
    "successful_requests": 0,
    "failed_requests": 0,
    "cached_responses": 0,
    "average_response_time_ms": 0,
    "response_times": []
}

def initialize_gemini():
    """Initialize Gemini AI configuration."""
    global GEMINI_CONFIGURED
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY is not set. AI features will not work.")
        return False
    
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Test the API key by creating a simple model instance
        # Using gemini-2.5-flash which is more widely available
        test_model = genai.GenerativeModel("gemini-2.5-flash")
        GEMINI_CONFIGURED = True
        logger.info("Gemini AI configured successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to configure Gemini AI: {str(e)}")
        GEMINI_CONFIGURED = False
        return False

def record_ai_metric(metric_name: str, value: float) -> None:
    """Record AI performance metric."""
    global AI_METRICS
    if metric_name == "request_started":
        AI_METRICS["total_requests"] += 1
    elif metric_name == "response_time":
        AI_METRICS["response_times"].append(value)
        AI_METRICS["average_response_time_ms"] = sum(AI_METRICS["response_times"]) / len(AI_METRICS["response_times"])
    elif metric_name == "successful_request":
        AI_METRICS["successful_requests"] += 1
    elif metric_name == "failed_request":
        AI_METRICS["failed_requests"] += 1
    elif metric_name == "cached_response":
        AI_METRICS["cached_responses"] += 1

def get_ai_metrics() -> Dict[str, Any]:
    """Get current AI performance metrics."""
    return AI_METRICS.copy()

def chat_completion(messages: List[Dict[str, str]], model: str = "gemini-2.5-flash", 
                   temperature: float = 0.7, max_tokens: Optional[int] = None) -> Dict[str, Any]:
    """
    Generate chat completion using Gemini API with quality metrics and content filtering.
    
    Args:
        messages: List of message dictionaries with 'role' and 'content'
        model: Model name (defaults to gemini-2.5-flash)
        temperature: Response randomness (0.0 to 1.0)
        max_tokens: Maximum tokens in response
        
    Returns:
        Dict containing the response or error information
    """
    start_time = datetime.utcnow()
    record_ai_metric("request_started", 1)
    
    # Filter user query for safety and topic compliance
    user_messages = [m for m in messages if m.get("role") == "user"]
    if user_messages:
        last_user_query = user_messages[-1].get("content", "")
        filter_result = content_filter.filter_user_query(last_user_query)
        if not filter_result.is_safe:
            record_ai_metric("failed_request", 1)
            return {
                "error": filter_result.reason,
                "content": "I can only assist with accessibility-related questions. Please ask about web accessibility, WCAG guidelines, or accessibility issues."
            }
    
    if not GEMINI_CONFIGURED:
        record_ai_metric("failed_request", 1)
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
        
        # Filter AI response for safety
        filter_result = content_filter.filter_ai_response(response.text, last_user_query if user_messages else "")
        if not filter_result.is_safe:
            record_ai_metric("failed_request", 1)
            return {
                "error": filter_result.reason,
                "content": "I apologize, but I cannot provide that response. Please try asking a different accessibility-related question."
            }
        
        # Record metrics
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000  # Convert to ms
        record_ai_metric("response_time", response_time)
        record_ai_metric("successful_request", 1)
        
        return {
            "content": filter_result.filtered_content,
            "model": model,
            "usage": {
                "total_tokens": len(response.text.split()) if response.text else 0
            },
            "metrics": {
                "response_time_ms": response_time,
                "filter_confidence": filter_result.confidence
            }
        }
        
    except Exception as e:
        record_ai_metric("failed_request", 1)
        logger.error(f"Gemini API error: {str(e)}")
        return {
            "error": f"Gemini API error: {str(e)}",
            "content": "Sorry, I'm having trouble processing your request right now."
        }

def explain_accessibility_issue(issue: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generate explanation and fix for an accessibility issue with caching and metrics.
    
    Args:
        issue: Accessibility issue data from axe-core
        
    Returns:
        Dict containing fixed code and brief explanation
    """
    start_time = datetime.utcnow()
    record_ai_metric("total_requests", 1)
    
    # Check cache first
    issue_id = issue.get('id', 'unknown')
    cached_explanation = get_cached_ai_explanation(issue_id, issue)
    if cached_explanation:
        record_ai_metric("cached_response", 1)
        logger.info(f"Returning cached explanation for issue {issue_id}")
        return cached_explanation
    
    if not GEMINI_CONFIGURED:
        record_ai_metric("failed_request", 1)
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
        
        model = genai.GenerativeModel("gemini-2.5-flash")
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
        
        result = {
            "fixedCode": fixed_code,
            "explanation": explanation,
            "ruleId": rule_id,
            "impact": impact,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Cache the result
        cache_ai_explanation(issue_id, issue, result, ttl=7200)  # 2 hours
        
        # Record metrics
        response_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        record_ai_metric("response_time", response_time)
        record_ai_metric("successful_request", 1)
        
        return result
        
    except Exception as e:
        record_ai_metric("failed_request", 1)
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
