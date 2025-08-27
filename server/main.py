"""FastAPI server for accessibility analysis - Refactored and modularized."""

import os
import platform
import logging
import uuid
import json
from datetime import timedelta, datetime

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
    initialize_default_users,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from services.db import users as users_col, password_reset_tokens as prt_col, analyses as analyses_col
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
from bson import ObjectId
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
    
    # Initialize authentication system (indexes + seed)
    await initialize_default_users()

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
    allow_origins=["https://web-for-all-web-accessibility-for-e.vercel.app","http://localhost:5173", "http://localhost:5174"],
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
    user = await authenticate_user(None, form_data.username, form_data.password)

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
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    from auth.auth_utils import get_password_hash
    await users_col.insert_one({
        "email": user.email,
        "full_name": user.full_name,
        "hashed_password": get_password_hash(user.password),
        "disabled": False,
        "created_at": datetime.utcnow(),
    })
    
    # Send welcome email
    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    
    return {"message": "User registered successfully", "email": user.email}

@app.post("/forgot-password", tags=["Authentication"])
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request password reset."""
    existing = await users_col.find_one({"email": request.email})
    if not existing:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Cooldown: prevent spamming reset emails
    try:
        # Find the most recent token for this email
        last = await prt_col.find_one({"email": request.email}, sort=[("created_at", -1)])
    except Exception:
        last = None

    cooldown_minutes = int(os.environ.get("RESET_EMAIL_COOLDOWN_MINUTES", "2"))
    now = datetime.utcnow()

    if last and last.get("created_at") and (now - last["created_at"]) < timedelta(minutes=cooldown_minutes):
        # Respect cooldown: do not create a new token or send a new email
        return {"message": "If the email exists, a password reset link has been sent"}

    # Generate reset token
    reset_token = str(uuid.uuid4())
    await prt_col.insert_one({
        "token": reset_token,
        "email": request.email,
        # TTL index on expiresAt will auto-delete
        "expiresAt": now + timedelta(hours=1),
        "created_at": now,
    })
    
    # Send reset email
    background_tasks.add_task(send_password_reset_email, request.email, reset_token)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@app.post("/reset-password", tags=["Authentication"])
async def reset_password(reset_data: PasswordReset):
    """Reset user password using token."""
    token_doc = await prt_col.find_one({"token": reset_data.token})
    if not token_doc or token_doc.get("expiresAt") < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    email = token_doc["email"]
    user_doc = await users_col.find_one({"email": email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

    # Update password
    from auth.auth_utils import get_password_hash
    await users_col.update_one({"email": email}, {"$set": {"hashed_password": get_password_hash(reset_data.new_password)}})

    # Remove used token
    await prt_col.delete_one({"token": reset_data.token})
    
    return {"message": "Password reset successfully"}

@app.get("/users/me", response_model=User, tags=["Authentication"])
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

# ============================================================================
# ANALYSIS ENDPOINTS
# ============================================================================

@app.post("/analyze/url", tags=["Analysis"])
async def analyze_url(request: URLAnalysisRequest, current_user: User = Depends(get_current_active_user)):
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
        
        # Persist analysis for the authenticated user and return its id
        try:
            violations_count = (
                result.get("violations_count")
                if isinstance(result, dict)
                else None
            )
            if violations_count is None and isinstance(result, dict):
                violations = result.get("violations") or []
                violations_count = len(violations) if isinstance(violations, list) else 0
            insert_doc = {
                "owner_email": current_user.email,
                "input_type": "url",
                "input_ref": str(request.url),
                "wcag_options": wcag_options,
                "violations_count": violations_count,
                "summary": result.get("summary") if isinstance(result, dict) else None,
                "result": result if isinstance(result, dict) else {"raw": result},
                "created_at": datetime.utcnow(),
            }
            insert_res = await analyses_col.insert_one(insert_doc)
            return {"id": str(insert_res.inserted_id), **result}
        except Exception as e:
            logger.warning(f"Failed to persist analysis history: {e}")
            # Even if persistence fails, return the analysis result without id
            return result
        
    except Exception as e:
        logger.error(f"Error analyzing URL {request.url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze/html", tags=["Analysis"])
async def analyze_html(request: HTMLAnalysisRequest, current_user: User = Depends(get_current_active_user)):
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
        
        # Persist + return id
        try:
            violations = result.get("violations") if isinstance(result, dict) else []
            violations_count = len(violations) if isinstance(violations, list) else result.get("violations_count", 0)
            insert_doc = {
                "owner_email": current_user.email,
                "input_type": "html",
                "input_ref": "inline_html",
                "wcag_options": wcag_options,
                "violations_count": violations_count,
                "summary": result.get("summary") if isinstance(result, dict) else None,
                "result": result if isinstance(result, dict) else {"raw": result},
                "created_at": datetime.utcnow(),
            }
            insert_res = await analyses_col.insert_one(insert_doc)
            return {"id": str(insert_res.inserted_id), **result}
        except Exception as e:
            logger.warning(f"Failed to persist HTML analysis history: {e}")
            return result
        
    except Exception as e:
        logger.error(f"Error analyzing HTML content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/analyze/file", tags=["Analysis"])
async def analyze_file(current_user: User = Depends(get_current_active_user), file: UploadFile = File(...), wcag_options: str = Form(None)):
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
        
        # Persist + return id
        try:
            violations = result.get("violations") if isinstance(result, dict) else []
            violations_count = len(violations) if isinstance(violations, list) else result.get("violations_count", 0)
            insert_doc = {
                "owner_email": current_user.email,
                "input_type": "file",
                "input_ref": file.filename,
                "wcag_options": parsed_wcag_options,
                "violations_count": violations_count,
                "summary": result.get("summary") if isinstance(result, dict) else None,
                "result": result if isinstance(result, dict) else {"raw": result},
                "created_at": datetime.utcnow(),
            }
            insert_res = await analyses_col.insert_one(insert_doc)
            return {"id": str(insert_res.inserted_id), **result}
        except Exception as e:
            logger.warning(f"Failed to persist file analysis history: {e}")
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

# ============================================================================
# HISTORY ENDPOINTS (Authenticated)
# ============================================================================

@app.get("/history", tags=["History"])
async def list_history(limit: int = 50, current_user: User = Depends(get_current_active_user)):
    """List recent analyses for the current user."""
    cursor = analyses_col.find({"owner_email": current_user.email}).sort("created_at", -1).limit(max(1, min(limit, 200)))
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        items.append(doc)
    return {"items": items}

@app.get("/history/{item_id}", tags=["History"])
async def get_history_item(item_id: str, current_user: User = Depends(get_current_active_user)):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    doc = await analyses_col.find_one({"_id": oid, "owner_email": current_user.email})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["id"] = str(doc.pop("_id"))
    return doc

@app.delete("/history/{item_id}", tags=["History"])
async def delete_history_item(item_id: str, current_user: User = Depends(get_current_active_user)):
    try:
        oid = ObjectId(item_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await analyses_col.delete_one({"_id": oid, "owner_email": current_user.email})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"deleted": True}

@app.get("/health/playwright", tags=["System"])
def playwright_health_check():
    """Check if Playwright browsers are properly installed."""
    import subprocess
    import sys
    from datetime import datetime
    
    try:
        # Test if playwright can launch a browser
        test_data = {
            "url": "data:text/html,<html><body><h1>Test</h1></body></html>",
            "wcag_options": {"wcag_version": "wcag2", "level": "aa"}
        }
        
        # Run a simple test analysis
        result = playwright_analyze_url(test_data["url"], test_data["wcag_options"])
        
        # Additional debugging info
        import subprocess
        try:
            # Check if playwright browsers are installed
            browser_check = subprocess.run(["playwright", "install", "--dry-run"], 
                                         capture_output=True, text=True, timeout=10)
            browser_status = f"Exit code: {browser_check.returncode}, Output: {browser_check.stdout[:200]}"
        except Exception as e:
            browser_status = f"Browser check failed: {str(e)}"
        
        return {
            "status": "healthy" if result.get("success") else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "playwright_available": result.get("success", False),
            "error": result.get("error") if not result.get("success") else None,
            "browser_error": result.get("browser_error", False),
            "navigation_error": result.get("navigation_error", False),
            "axe_error": result.get("axe_error", False),
            "analysis_error": result.get("analysis_error", False),
            "violations_found": result.get("violations_count", 0),
            "browser_status": browser_status,
            "result_details": {
                "success": result.get("success"),
                "mode": result.get("mode"),
                "tags_used": result.get("tags_used", [])
            },
            "environment_vars": {
                "PLAYWRIGHT_BROWSERS_PATH": os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "Not set"),
                "PATH": os.environ.get("PATH", "Not set")[:200] + "..." if len(os.environ.get("PATH", "")) > 200 else os.environ.get("PATH", "Not set")
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "playwright_available": False,
            "error": str(e),
            "environment_vars": {
                "PLAYWRIGHT_BROWSERS_PATH": os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "Not set"),
                "PATH": os.environ.get("PATH", "Not set")[:200] + "..." if len(os.environ.get("PATH", "")) > 200 else os.environ.get("PATH", "Not set")
            }
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)
