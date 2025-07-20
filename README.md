# Accessibility Analyzer

A comprehensive web accessibility analysis tool that helps identify and fix accessibility issues in websites and web applications.

## Overview

The Accessibility Analyzer is a full-stack application that provides automated accessibility testing for web content. It helps developers and content creators ensure their websites are accessible to users with disabilities and comply with accessibility standards like WCAG.

![Accessibility Analyzer Screenshot](https://via.placeholder.com/800x400?text=Accessibility+Analyzer)

## Features

- **Multiple Input Methods**: Analyze URLs, upload HTML files, or paste HTML code directly
- **Comprehensive Analysis**: Combines static and dynamic analysis techniques
- **WCAG Compliance**: Checks against Web Content Accessibility Guidelines
- **AI-Powered Assistance**: Gemini AI integration for intelligent explanations and guidance
- **Real-time Chat Support**: Interactive AI assistant for accessibility questions
- **Detailed Reports**: Provides detailed reports with severity levels and recommendations
- **Score Visualization**: Visual representation of accessibility score
- **Issue Categorization**: Groups issues by category for easier remediation

## Project Structure

The project consists of two main components:

- **Client**: React-based frontend application
- **Server**: FastAPI-based backend service

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- Python 3.8 or higher
- npm or yarn
- pip (Python package manager)

### Setup Instructions

#### 1. Clone the repository

```bash
git clone https://github.com/yourusername/accessibility-analyzer.git
cd accessibility-analyzer
```

#### 2. Set up the server

```bash
cd server

# Create and activate virtual environment
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Install Playwright browser binaries (for dynamic analysis)
python setup_playwright.py

# Start the server
uvicorn main:app --reload
```

The server will be available at http://localhost:8000.

#### 3. Set up the client

```bash
cd ../client

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env
echo "VITE_APP_ENV=development" >> .env

# Start the development server
npm run dev
```

The client will be available at http://localhost:5173.

## Usage

1. Access the application at http://localhost:5173
2. Choose an input method:
   - Enter a URL
   - Upload an HTML file
   - Paste HTML code directly
3. Click "Analyze" to start the accessibility analysis
4. Review the detailed report with accessibility issues and recommendations

## License

[MIT License](LICENSE)

## Acknowledgments

- [axe-core](https://github.com/dequelabs/axe-core) - Accessibility testing engine
- [Playwright](https://playwright.dev/) - Browser automation library
- [FastAPI](https://fastapi.tiangolo.com/) - Web framework for building APIs
- [React](https://reactjs.org/) - JavaScript library for building user interfaces
- [Material-UI](https://mui.com/) - React UI framework
