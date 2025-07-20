#!/usr/bin/env python
"""
Script to install Playwright browser binaries.
Run this after installing the Python dependencies.
"""

import os
import sys
import subprocess
import platform
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, 
                   format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def install_playwright():
    """Install Playwright package if not already installed."""
    try:
        import playwright
        # Get version using pip instead of direct attribute
        result = subprocess.run(
            [sys.executable, "-m", "pip", "show", "playwright"],
            capture_output=True,
            text=True
        )
        version = next((line.split(": ")[1] for line in result.stdout.splitlines() if line.startswith("Version")), "unknown")
        logger.info(f"Playwright version {version} already installed")
        return True
    except ImportError:
        logger.info("Installing Playwright package...")
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", "playwright"], check=True)
            logger.info("Playwright package installed successfully")
            return True
        except subprocess.SubprocessError as e:
            logger.error(f"Failed to install Playwright: {e}")
            return False

def install_browser():
    """Install Playwright browser binaries."""
    try:
        # Use playwright CLI directly
        logger.info("Installing Chromium browser...")
        
        # On Windows, we need to use python -m
        if platform.system() == 'Windows':
            cmd = [sys.executable, "-m", "playwright", "install", "chromium", "--with-deps"]
        else:
            # Get the path to playwright executable
            playwright_executable = os.path.join(os.path.dirname(sys.executable), 'playwright')
        if not os.path.exists(playwright_executable):
                logger.warning(f"Playwright executable not found at {playwright_executable}, using module invocation")
                cmd = [sys.executable, "-m", "playwright", "install", "chromium", "--with-deps"]
            else:
                cmd = [playwright_executable, "install", "chromium", "--with-deps"]
            
        logger.info(f"Running command: {' '.join(cmd)}")
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=True,
            text=True
        )
        
        logger.info(result.stdout)
        if result.stderr:
            logger.warning(result.stderr)
            
        return True
        
    except subprocess.SubprocessError as e:
        logger.error(f"Failed to install browser: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error during browser installation: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Main setup function."""
    logger.info("Starting Playwright setup...")
    
    # Step 1: Install Playwright package
    if not install_playwright():
        logger.error("Failed to install Playwright package")
        return 1
        
    # Step 2: Install browser binaries
    if not install_browser():
        logger.error("Failed to install browser binaries")
        return 1
        
    logger.info("Playwright setup completed successfully!")
    logger.info("Run 'python test_playwright.py' to verify the installation.")
    return 0

if __name__ == "__main__":
    sys.exit(main()) 