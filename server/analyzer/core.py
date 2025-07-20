"""Core analyzer module for accessibility testing."""

import logging
from bs4 import BeautifulSoup
import requests
from typing import Dict, Any, Optional
import re
import math
from wcag_contrast_ratio import contrast

logger = logging.getLogger(__name__)

def analyze_static(html_content):
    """
    Perform static analysis of HTML content.
    
    Args:
        html_content (str): HTML content to analyze
        
    Returns:
        dict: Analysis results
    """
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        issues = []
        
        # Check for basic accessibility issues
        
        # 1. Check for alt text on images
        for img in soup.find_all('img'):
            if not img.get('alt'):
                issues.append({
                    'id': 'image-alt',
                    'impact': 'critical',
                    'description': 'Image missing alt text',
                    'help': 'Images must have alt text',
                    'nodes': [{
                        'html': str(img),
                        'failureSummary': 'Add alt text to image',
                        'impact': 'critical'
                    }],
                    'tags': ['wcag2a', 'images']
                })
            
        # 2. Check for form labels
        for input_tag in soup.find_all(['input', 'select', 'textarea']):
            if input_tag.get('type') != 'hidden' and not input_tag.get('aria-label'):
                label = input_tag.find_previous('label')
                if not label or not label.get('for') == input_tag.get('id'):
                    issues.append({
                        'id': 'form-label',
                        'impact': 'serious',
                        'description': 'Form control missing label',
                        'help': 'Form controls must have labels',
                        'nodes': [{
                            'html': str(input_tag),
                            'failureSummary': 'Add label or aria-label',
                            'impact': 'serious'
                        }],
                        'tags': ['wcag2a', 'forms']
                    })
        
        # 3. Check for heading hierarchy
        headings = soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
        prev_level = 0
        for heading in headings:
            current_level = int(heading.name[1])
            if current_level > prev_level + 1:
                issues.append({
                    'id': 'heading-order',
                    'impact': 'moderate',
                    'description': 'Heading levels should only increase by one',
                    'help': 'Maintain proper heading hierarchy',
                    'nodes': [{
                        'html': str(heading),
                        'failureSummary': f'Heading jumps from h{prev_level} to h{current_level}',
                        'impact': 'moderate'
                    }],
                    'tags': ['wcag2a', 'structure']
                })
            prev_level = current_level
        
        # 4. Check for color contrast issues
        text_elements = soup.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'a', 'button', 'label', 'li'])
        for element in text_elements:
            # Skip empty elements or those with no text
            if not element.text.strip():
                continue
                
            # Extract inline styles for foreground and background colors
            fg_color = extract_color(element.get('style', ''), 'color')
            bg_color = extract_color(element.get('style', ''), 'background-color')
            
            # If no inline styles, try to find computed styles (limited in static analysis)
            # This is a simplified approach and won't catch all cases
            if not fg_color:
                fg_color = "#000000"  # Default text color in browsers
            if not bg_color:
                bg_color = "#FFFFFF"  # Default background color in browsers
            
            # Check if we have colors to analyze
            if fg_color and bg_color:
                # Determine if it's large text (18pt or 14pt bold)
                font_size = extract_font_size(element.get('style', ''))
                font_weight = extract_font_weight(element.get('style', ''))
                
                is_large_text = False
                if font_size and font_weight:
                    is_large_text = (font_size >= 24) or (font_size >= 19 and font_weight >= 700)
                
                # Calculate contrast ratio
                try:
                    ratio = calculate_contrast_ratio(fg_color, bg_color)
                    
                    # Check against WCAG AA standards
                    passes_aa = (is_large_text and ratio >= 3.0) or (not is_large_text and ratio >= 4.5)
                    
                    if not passes_aa:
                        issues.append({
                            'id': 'color-contrast',
                            'impact': 'serious',
                            'description': 'Insufficient color contrast',
                            'help': f'Text elements must have sufficient color contrast ratio of at least {4.5 if not is_large_text else 3.0}:1',
                            'nodes': [{
                                'html': str(element),
                                'failureSummary': f'Element has contrast ratio of {ratio:.2f}:1, which is less than required',
                                'impact': 'serious',
                                'data': {
                                    'foreground': fg_color,
                                    'background': bg_color,
                                    'contrast_ratio': ratio,
                                    'is_large_text': is_large_text
                                }
                            }],
                            'tags': ['wcag2aa', 'color']
                        })
                except Exception as e:
                    logger.warning(f"Could not analyze contrast for element: {e}")
        
        return {
            "success": True,
            "results": {
                "violations": issues
            }
        }
    except Exception as e:
        logger.error(f"Static analysis failed: {e}")
        return {
            "success": False,
            "error": str(e)
        }

def extract_color(style_str, property_name):
    """
    Extract color value from inline style string.
    
    Args:
        style_str (str): Inline style string
        property_name (str): CSS property name ('color' or 'background-color')
        
    Returns:
        str: Color in hex format or None if not found
    """
    if not style_str:
        return None
        
    # Match CSS color patterns
    pattern = fr'{property_name}\s*:\s*(#[0-9a-fA-F]{{3,8}}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)'
    match = re.search(pattern, style_str)
    
    if match:
        color = match.group(1).strip()
        # Convert to hex format for consistency
        return convert_to_hex(color)
    
    return None

def convert_to_hex(color):
    """
    Convert various color formats to hex.
    This is a simplified version and doesn't handle all cases.
    
    Args:
        color (str): Color in various formats
        
    Returns:
        str: Color in hex format
    """
    # If already hex, return as is
    if color.startswith('#'):
        return color
        
    # Handle basic named colors
    color_map = {
        'black': '#000000',
        'white': '#FFFFFF',
        'red': '#FF0000',
        'green': '#008000',
        'blue': '#0000FF',
        'yellow': '#FFFF00',
        'purple': '#800080',
        'gray': '#808080',
        'grey': '#808080'
    }
    
    if color.lower() in color_map:
        return color_map[color.lower()]
    
    # Handle rgb/rgba format (simplified)
    if color.startswith('rgb'):
        try:
            # Extract RGB values
            values = re.search(r'rgba?\(([^)]+)\)', color).group(1).split(',')
            r = int(values[0].strip())
            g = int(values[1].strip())
            b = int(values[2].strip())
            
            # Convert to hex
            return f'#{r:02x}{g:02x}{b:02x}'
        except Exception:
            pass
    
    # Return default if can't parse
    return '#000000'

def extract_font_size(style_str):
    """
    Extract font size from inline style string.
    
    Args:
        style_str (str): Inline style string
        
    Returns:
        int: Font size in pixels or None if not found
    """
    if not style_str:
        return None
        
    # Match font-size patterns
    pattern = r'font-size\s*:\s*(\d+)(px|pt|rem|em)'
    match = re.search(pattern, style_str)
    
    if match:
        size = float(match.group(1))
        unit = match.group(2)
        
        # Convert to pixels (approximate)
        if unit == 'pt':
            return size * 1.333  # 1pt ≈ 1.333px
        elif unit == 'rem' or unit == 'em':
            return size * 16  # Assuming 1rem/em = 16px
        else:
            return size  # Already in px
    
    return None

def extract_font_weight(style_str):
    """
    Extract font weight from inline style string.
    
    Args:
        style_str (str): Inline style string
        
    Returns:
        int: Font weight or None if not found
    """
    if not style_str:
        return None
        
    # Match font-weight patterns
    pattern = r'font-weight\s*:\s*(\d+|bold|normal)'
    match = re.search(pattern, style_str)
    
    if match:
        weight = match.group(1)
        
        if weight == 'bold':
            return 700
        elif weight == 'normal':
            return 400
        else:
            return int(weight)
    
    return None

def calculate_contrast_ratio(fg_color, bg_color):
    """
    Calculate the contrast ratio between two colors.
    
    Args:
        fg_color (str): Foreground color in hex format
        bg_color (str): Background color in hex format
        
    Returns:
        float: Contrast ratio
    """
    # Convert hex to RGB
    try:
        # Use the wcag_contrast_ratio library if available
        return contrast(fg_color, bg_color)
    except ImportError:
        # Fallback to manual calculation
        fg_rgb = hex_to_rgb(fg_color)
        bg_rgb = hex_to_rgb(bg_color)
        
        # Calculate luminance
        fg_luminance = calculate_luminance(fg_rgb)
        bg_luminance = calculate_luminance(bg_rgb)
        
        # Calculate contrast ratio
        lighter = max(fg_luminance, bg_luminance)
        darker = min(fg_luminance, bg_luminance)
        
        return (lighter + 0.05) / (darker + 0.05)

def hex_to_rgb(hex_color):
    """
    Convert hex color to RGB.
    
    Args:
        hex_color (str): Color in hex format
        
    Returns:
        tuple: RGB values
    """
    hex_color = hex_color.lstrip('#')
    
    if len(hex_color) == 3:
        # Expand 3-digit hex to 6-digit
        hex_color = ''.join([c*2 for c in hex_color])
    
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_luminance(rgb):
    """
    Calculate relative luminance of an RGB color.
    
    Args:
        rgb (tuple): RGB values
        
    Returns:
        float: Relative luminance
    """
    # Convert RGB to sRGB
    srgb = [val / 255.0 for val in rgb]
    
    # Apply gamma correction
    srgb = [val / 12.92 if val <= 0.03928 else ((val + 0.055) / 1.055) ** 2.4 for val in srgb]
    
    # Calculate luminance
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2]