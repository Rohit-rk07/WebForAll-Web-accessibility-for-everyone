"""FastAPI server for accessibility analysis - Refactored and modularized."""

import os
import platform
import logging
import uuid
import json
from datetime import timedelta
from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
import uvicorn

# Import our modular components
from auth import (
    Token, User, UserCreate, PasswordResetRequest, PasswordReset,
    authenticate_user, create_access_token, get_current_active_user,
    initialize_default_users, fake_users_db, password_reset_tokens,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from services import (
    send_welcome_email, send_password_reset_email,
    initialize_gemini, chat_completion, explain_accessibility_issue,
)
from models import (
    URLAnalysisRequest, HTMLAnalysisRequest, ChatCompletionRequest,
    ExplainRequest
)

# Analysis import (keeping the existing dynamic analysis)
from analyzer.simple_playwright import analyze_url as playwright_analyze_url
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application."""
    # Startup
    logger.info(f"Running on {platform.system()}")
    
    # Initialize authentication system
    initialize_default_users()
    logger.info("Authentication system initialized")
    
    # Initialize AI services
    if initialize_gemini():
        logger.info("AI services initialized successfully")
    else:
        logger.warning("AI services initialization failed")
    
    yield
    
    # Shutdown
    logger.info("Application shutting down")

# Initialize FastAPI app
app = FastAPI(
    title="Accessibility Analyzer API",
    description="A comprehensive accessibility analysis tool with AI-powered insights",
    version="2.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://webforall-web-accessibility-for-everyone-production.up.railway.app","http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "message": "WebForAll is running 🚀"}

@app.get("/favicon.ico")
async def favicon():
    return {}

@app.post("/token", response_model=Token, tags=["Authentication"])
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """Authenticate user and return access token."""
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", tags=["Authentication"])
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    """Register a new user."""
    # Check if user already exists
    if user.email in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    from auth.auth_utils import get_password_hash
    fake_users_db[user.email] = {
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": get_password_hash(user.password),
        "disabled": False
    }
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    
    return {"message": "User registered successfully", "email": user.email}

@app.post("/forgot-password", tags=["Authentication"])
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request password reset."""
    if request.email not in fake_users_db:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    password_reset_tokens[reset_token] = {
        "email": request.email,
        "expires": timedelta(hours=1)  # Token expires in 1 hour
    }
    
    # Send reset email
    background_tasks.add_task(send_password_reset_email, request.email, reset_token)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@app.post("/reset-password", tags=["Authentication"])
async def reset_password(reset_data: PasswordReset):
    """Reset user password using token."""
    if reset_data.token not in password_reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    token_data = password_reset_tokens[reset_data.token]
    email = token_data["email"]
    
    if email not in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Update password
    from auth.auth_utils import get_password_hash
    fake_users_db[email]["hashed_password"] = get_password_hash(reset_data.new_password)
    
    # Remove used token
    del password_reset_tokens[reset_data.token]
    
    return {"message": "Password reset successfully"}

@app.get("/users/me", response_model=User, tags=["Authentication"])
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/analyze/url", tags=["Analysis"])
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze a URL for accessibility issues.
    
    Args:
        request (URLAnalysisRequest): The analysis request containing the URL
        
    Returns:
        dict: Analysis results
    """
    try:
        logger.info(f"Analyzing URL: {request.url}")
        
        # Convert wcag_options to dict if provided
        wcag_options = None
        if request.wcag_options:
            wcag_options = {
                "wcag_version": request.wcag_options.wcag_version,
                "level": request.wcag_options.level,
                "best_practice": request.wcag_options.best_practice
            }
        
        # Use dynamic analysis only
        result = playwright_analyze_url(str(request.url), wcag_options)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed - unable to analyze the URL"
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing URL {request.url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze/html", tags=["Analysis"])
async def analyze_html(request: HTMLAnalysisRequest):
    """
    Analyze HTML content for accessibility issues.
    
    Args:
        request (HTMLAnalysisRequest): The analysis request containing HTML content
        
    Returns:
        dict: Analysis results
    """
    try:
        logger.info("Analyzing HTML content")
        
        # Convert wcag_options to dict if provided
        wcag_options = None
        if request.wcag_options:
            wcag_options = {
                "wcag_version": request.wcag_options.wcag_version,
                "level": request.wcag_options.level,
                "best_practice": request.wcag_options.best_practice
            }
        
        # Create data URL for dynamic analysis
        import base64
        html_bytes = request.content.encode('utf-8')
        html_b64 = base64.b64encode(html_bytes).decode('utf-8')
        data_url = f"data:text/html;base64,{html_b64}"
        
        # Use dynamic analysis with data URL
        result = playwright_analyze_url(data_url, wcag_options)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed - unable to analyze the HTML content"
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing HTML content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze/file", tags=["Analysis"])
async def analyze_file(file: UploadFile = File(...), wcag_options: str = Form(None)):
    """
    Analyze an uploaded HTML file for accessibility issues.
    
    Args:
        file (UploadFile): The HTML file to analyze
        wcag_options (str, optional): JSON string with WCAG options
        
    Returns:
        dict: Analysis results
    """
    try:
        logger.info(f"Analyzing uploaded file: {file.filename}")
        
        # Validate file type
        if not file.filename.lower().endswith(('.html', '.htm')):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only HTML files are supported"
            )
        
        # Read file content
        content = await file.read()
        html_content = content.decode('utf-8')
        
        # Parse WCAG options if provided
        parsed_wcag_options = None
        if wcag_options:
            try:
                parsed_wcag_options = json.loads(wcag_options)
            except json.JSONDecodeError:
                logger.warning("Invalid WCAG options JSON, using defaults")
        
        # Create data URL for dynamic analysis
        import base64
        html_bytes = html_content.encode('utf-8')
        html_b64 = base64.b64encode(html_bytes).decode('utf-8')
        data_url = f"data:text/html;base64,{html_b64}"
        
        # Use dynamic analysis with data URL
        result = playwright_analyze_url(data_url, parsed_wcag_options)
        
        if result is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Analysis failed - unable to analyze the uploaded file"
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Error analyzing file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

# ============================================================================
# AI ENDPOINTS
# ============================================================================

@app.post("/ai/chat", tags=["AI"])
async def ai_chat_completion(request: ChatCompletionRequest):
    """Proxy for Gemini's chat completion API."""
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in request.messages]
        response = chat_completion(
            messages=messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens
        )
        return response
    except Exception as e:
        logger.error(f"AI chat error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )

@app.post("/ai/explain", tags=["AI"])
async def ai_explain_issue(request: ExplainRequest):
    """Generate an explanation and fix for an accessibility issue."""
    try:
        response = explain_accessibility_issue(request.issue)
        return response
    except Exception as e:
        logger.error(f"AI explain error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service error: {str(e)}"
        )

# ============================================================================
# HEALTH CHECK
# ============================================================================

@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "platform": platform.system()
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
