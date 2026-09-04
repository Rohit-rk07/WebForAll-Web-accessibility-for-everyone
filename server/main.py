"""FastAPI server for accessibility analysis - Refactored and modularized."""

import os
import platform
import logging
import uuid
import secrets
import json
import asyncio
import sys
import ipaddress
import socket
import hashlib
from datetime import timedelta, datetime
from urllib.parse import urlsplit

from contextlib import asynccontextmanager
from dotenv import load_dotenv

# Playwright's async transport requires subprocess support on Windows.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# Load environment variables from .env file
load_dotenv()
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status, BackgroundTasks, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from itsdangerous import URLSafeTimedSerializer
from bs4 import BeautifulSoup
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
    ExplainRequest, SummaryRequest
)

# Analysis import (keeping the existing dynamic analysis)
from analyzer.simple_playwright import analyze_url as playwright_analyze_url
from bson import ObjectId

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure rate limiting
# Behind a reverse proxy the client IP is only trusted when the request arrives
# from an explicitly configured proxy IP; X-Forwarded-For from arbitrary clients
# is ignored to prevent header spoofing.
TRUSTED_PROXY_IPS = {
    ip.strip()
    for ip in os.environ.get("TRUSTED_PROXY_IPS", "").split(",")
    if ip.strip()
}


def get_client_ip(request: Request) -> str:
    """Return the real client IP for rate limiting, ignoring spoofable headers by default."""
    if request.client:
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded and request.client.host in TRUSTED_PROXY_IPS:
            return forwarded.split(",")[0].strip()
        return request.client.host
    return "unknown"


limiter = Limiter(key_func=get_client_ip)

# Configure CSRF protection using signed tokens
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY must be set in environment variables")

CSRF_SECRET = os.environ.get("CSRF_SECRET", SECRET_KEY)
csrf_serializer = URLSafeTimedSerializer(CSRF_SECRET)

def generate_csrf_token():
    """Generate a CSRF token for state-changing operations."""
    return csrf_serializer.dumps({"csrf": "protection"}, salt="csrf-salt")

def validate_csrf_token(token: str) -> bool:
    """Validate a CSRF token."""
    try:
        csrf_serializer.loads(
            token, 
            salt="csrf-salt", 
            max_age=3600  # Token valid for 1 hour
        )
        return True
    except Exception:
        return False

# CSRF Protection Middleware
class CSRFMiddleware(BaseHTTPMiddleware):
    """Middleware to protect against CSRF attacks."""
    
    async def dispatch(self, request: Request, call_next):
        # Skip CSRF for GET, HEAD, OPTIONS, TRACE
        if request.method in ["GET", "HEAD", "OPTIONS", "TRACE"]:
            return await call_next(request)
        
        # Skip CSRF for authenticated endpoints (JWT provides protection)
        if request.url.path.startswith("/token") or request.url.path.startswith("/demo-login"):
            return await call_next(request)
        
        # For other state-changing operations, check CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token or not validate_csrf_token(csrf_token):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="CSRF token validation failed"
            )
        
        return await call_next(request)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application."""
    # Startup
    logger.info(f"Running on {platform.system()}")
    
    # Initialize authentication system (indexes + seed) in background
    import asyncio
    asyncio.create_task(initialize_default_users())
    logger.info("Authentication system initialization started in background")
    
    # Initialize AI services in background
    asyncio.create_task(initialize_gemini_async())
    logger.info("AI services initialization started in background")
    
    yield
    
    # Shutdown - Clean up resources
    logger.info("Application shutting down")
    
    # Close MongoDB connection
    from services.db import client
    client.close()
    logger.info("MongoDB connection closed")
    
    # Close Playwright browser if running
    try:
        from analyzer.playwright_helper import close_browser
        await close_browser()
        logger.info("Playwright browser closed")
    except Exception as e:
        logger.warning(f"Error closing Playwright browser: {e}")

async def initialize_gemini_async():
    """Async wrapper for Gemini initialization."""
    configured = await asyncio.to_thread(initialize_gemini)
    if configured:
        logger.info("AI services initialized successfully")
    else:
        logger.warning("AI services initialization failed")

# Initialize FastAPI app
app = FastAPI(
    title="Accessibility Analyzer API",
    description="A comprehensive accessibility analysis tool with AI-powered insights",
    version="2.0.0",
    lifespan=lifespan
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Assigns a request ID to every request and logs structured metadata."""

    async def dispatch(self, request: Request, call_next):
        request_id = request.headers.get("X-Request-ID") or uuid.uuid4().hex
        request.state.request_id = request_id
        start = datetime.utcnow()
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        duration_ms = (datetime.utcnow() - start).total_seconds() * 1000
        logger.info(
            f"{request.method} {request.url.path} -> {response.status_code} "
            f"({duration_ms:.1f}ms) request_id={request_id}"
        )
        return response


async def unhandled_exception_handler(request: Request, exc: Exception):
    """Return a generic, safe 500 response for any unhandled error."""
    request_id = getattr(request.state, "request_id", None) or uuid.uuid4().hex
    logger.error(
        f"Unhandled error for request_id={request_id}: {exc}",
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    from starlette.responses import JSONResponse
    return JSONResponse(
        status_code=500,
        content={"detail": f"An unexpected error occurred. Reference: {request_id}"},
    )


app.add_exception_handler(Exception, unhandled_exception_handler)
app.add_middleware(RequestContextMiddleware)

# Add CORS middleware
# Add CORS middleware
# In production, restrict to specific domains only
allowed_origins = os.environ.get(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,https://web-for-all-web-accessibility-for-e.vercel.app"
).split(",")
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

APP_ENV = os.environ.get("APP_ENV", "development").lower()
ALLOW_DEMO_LOGIN = os.environ.get("ALLOW_DEMO_LOGIN", "true" if APP_ENV != "production" else "false").lower() == "true"

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*", "X-CSRF-Token"],
)

# Add GZip compression for responses > 1000 bytes
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add caching middleware for static responses
class CacheMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Add caching headers for static-like responses
        if request.url.path in ["/", "/favicon.ico", "/health"]:
            response.headers["Cache-Control"] = "public, max-age=300"  # 5 minutes
        elif request.url.path.startswith("/history") and request.method == "GET":
            response.headers["Cache-Control"] = "private, max-age=60"  # 1 minute for history
        
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("Content-Security-Policy", "default-src 'self'")
        if request.url.scheme == "https":
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        return response

app.add_middleware(CacheMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

# Add CSRF protection middleware
app.add_middleware(CSRFMiddleware)

MAX_HTML_BYTES = 5 * 1024 * 1024
MAX_UPLOAD_BYTES = 5 * 1024 * 1024

async def validate_public_url(url: str) -> None:
    """Reject non-public destinations before launching the browser."""
    parsed = urlsplit(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Only public HTTP(S) URLs are supported")

    try:
        addresses = await asyncio.to_thread(
            socket.getaddrinfo, parsed.hostname, parsed.port, type=socket.SOCK_STREAM
        )
    except socket.gaierror:
        raise HTTPException(status_code=400, detail="The URL hostname could not be resolved")

    for address in {item[4][0] for item in addresses}:
        ip = ipaddress.ip_address(address)
        if not ip.is_global:
            raise HTTPException(status_code=400, detail="Private and internal URLs are not allowed")

def require_successful_analysis(result):
    if not isinstance(result, dict) or result.get("success") is False:
        raise HTTPException(status_code=502, detail="The accessibility analysis failed")
    return result

# ============================================================================
# AUTHENTICATION ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    return {"status": "ok", "message": "WebForAll is running"}

@app.get("/favicon.ico")
async def favicon():
    return {}

@app.post("/token", response_model=Token, tags=["Authentication"])
@limiter.limit("5/minute")
async def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends()):
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
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.model_dump(exclude={"hashed_password"}),
    }

@app.post("/register", tags=["Authentication"])
@limiter.limit("3/minute")
async def register_user(request: Request, user: UserCreate, background_tasks: BackgroundTasks):
    """Register a new user."""
    # Check if user already exists
    existing = await users_col.find_one({"email": user.email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
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
@limiter.limit("5/minute")
async def forgot_password(request: Request, reset_request: PasswordResetRequest, background_tasks: BackgroundTasks):
    """Request password reset."""
    existing = await users_col.find_one({"email": reset_request.email})
    if not existing:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a password reset link has been sent"}
    
    # Cooldown: prevent spamming reset emails
    try:
        # Find the most recent token for this email
        last = await prt_col.find_one({"email": reset_request.email}, sort=[("created_at", -1)])
    except Exception:
        last = None

    cooldown_minutes = int(os.environ.get("RESET_EMAIL_COOLDOWN_MINUTES", "2"))
    now = datetime.utcnow()

    if last and last.get("created_at") and (now - last["created_at"]) < timedelta(minutes=cooldown_minutes):
        # Respect cooldown: do not create a new token or send a new email
        return {"message": "If the email exists, a password reset link has been sent"}

    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    reset_token_hash = hashlib.sha256(reset_token.encode("utf-8")).hexdigest()
    await prt_col.insert_one({
        "token_hash": reset_token_hash,
        "email": reset_request.email,
        # TTL index on expiresAt will auto-delete
        "expiresAt": now + timedelta(hours=1),
        "created_at": now,
    })
    
    # Send reset email
    background_tasks.add_task(send_password_reset_email, reset_request.email, reset_token)
    
    return {"message": "If the email exists, a password reset link has been sent"}

@app.post("/reset-password", tags=["Authentication"])
@limiter.limit("10/minute")
async def reset_password(request: Request, reset_data: PasswordReset):
    """Reset user password using token."""
    token_hash = hashlib.sha256(reset_data.token.encode("utf-8")).hexdigest()
    token_doc = await prt_col.find_one_and_delete({
        "token_hash": token_hash,
        "expiresAt": {"$gt": datetime.utcnow()},
    })
    if not token_doc:
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

    return {"message": "Password reset successfully"}

@app.get("/users/me", response_model=User, tags=["Authentication"])
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    """Get current user information."""
    return current_user

@app.get("/csrf-token", tags=["Security"])
async def get_csrf_token():
    """
    Get a CSRF token for state-changing operations.
    Clients should include this token in the X-CSRF-Token header for POST/PUT/DELETE requests.
    """
    token = generate_csrf_token()
    return {"csrf_token": token}

@app.get("/ai/metrics", tags=["AI"])
async def get_ai_metrics(current_user: User = Depends(get_current_active_user)):
    """
    Get AI service performance metrics.
    Provides insights into AI usage, response times, and cache effectiveness.
    """
    from services.ai_service import get_ai_metrics
    return get_ai_metrics()

@app.post("/demo-login", response_model=Token, tags=["Authentication"])
@limiter.limit("5/minute")
async def demo_login(request: Request):
    """Demo login endpoint that generates a temporary demo token without exposing credentials.

    Uses the seeded test user from the database. Disabled unless ALLOW_DEMO_LOGIN=true.
    """
    if not ALLOW_DEMO_LOGIN:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Demo login is disabled")

    demo_email = os.environ.get("DEMO_USER_EMAIL", "test@example.com")
    demo_password = os.environ.get("DEMO_USER_PASSWORD", "password123")
    try:
        # Authenticate with the seeded demo user
        demo_user = await authenticate_user(None, demo_email, demo_password)

        if not demo_user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Demo user not found. Please ensure the database is properly seeded."
            )

        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": demo_user.email}, expires_delta=access_token_expires
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": demo_user.model_dump(exclude={"hashed_password"}),
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Demo login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Demo login failed. Please try again later."
        )

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
        await validate_public_url(str(request.url))
        
        # Convert wcag_options to dict if provided
        wcag_options = None
        if request.wcag_options:
            wcag_options = {
                "wcag_version": request.wcag_options.wcag_version,
                "level": request.wcag_options.level,
                "best_practice": request.wcag_options.best_practice
            }
        
        # Use dynamic analysis only
        result = await playwright_analyze_url(str(request.url), wcag_options)
        result = require_successful_analysis(result)
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing URL {request.url}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed. Please try again later."
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
        html_document = request.content
        if request.base_url:
            soup = BeautifulSoup(html_document, "html.parser")
            base_tag = soup.new_tag("base", href=str(request.base_url))
            if soup.head:
                soup.head.insert(0, base_tag)
            else:
                head = soup.new_tag("head")
                head.insert(0, base_tag)
                if soup.html:
                    soup.html.insert(0, head)
                else:
                    soup.insert(0, head)
            html_document = str(soup)
        html_bytes = html_document.encode('utf-8')
        html_b64 = base64.b64encode(html_bytes).decode('utf-8')
        data_url = f"data:text/html;base64,{html_b64}"
        
        # Use dynamic analysis with data URL
        result = await playwright_analyze_url(data_url, wcag_options)
        result = require_successful_analysis(result)
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing HTML content: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Analysis failed. Please try again later."
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
        
        # Read file content in bounded chunks so oversized uploads are rejected
        # before the entire file is buffered in memory.
        content = b""
        while True:
            chunk = await file.read(64 * 1024)
            if not chunk:
                break
            content += chunk
            if len(content) > MAX_UPLOAD_BYTES:
                raise HTTPException(status_code=413, detail="HTML files must be 5 MB or smaller")
        try:
            html_content = content.decode('utf-8')
        except UnicodeDecodeError:
            raise HTTPException(status_code=400, detail="The HTML file must be UTF-8 encoded")
        
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
        result = await playwright_analyze_url(data_url, parsed_wcag_options)
        result = require_successful_analysis(result)
        
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
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing file {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File analysis failed. Please try again later."
        )

# ============================================================================
# AI ENDPOINTS
# ============================================================================

@app.post("/ai/chat", tags=["AI"])
@limiter.limit("30/minute")
async def ai_chat_completion(request: Request, payload: ChatCompletionRequest, current_user: User = Depends(get_current_active_user)):
    """Proxy for Gemini's chat completion API."""
    request_id = getattr(request.state, "request_id", "unknown")
    try:
        messages = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        response = await asyncio.to_thread(
            chat_completion,
            messages=messages,
            model=payload.model,
            temperature=payload.temperature,
            max_tokens=payload.max_tokens,
        )
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI chat error (request_id={request_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service is temporarily unavailable. Reference: {request_id}"
        )

@app.post("/ai/explain", tags=["AI"])
@limiter.limit("30/minute")
async def ai_explain_issue(request: Request, payload: ExplainRequest, current_user: User = Depends(get_current_active_user)):
    """Generate an explanation and fix for an accessibility issue."""
    request_id = getattr(request.state, "request_id", "unknown")
    try:
        response = await asyncio.to_thread(explain_accessibility_issue, payload.issue)
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI explain error (request_id={request_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service is temporarily unavailable. Reference: {request_id}"
        )

@app.post("/ai/summary", tags=["AI"])
@limiter.limit("30/minute")
async def ai_summary(request: Request, payload: SummaryRequest, current_user: User = Depends(get_current_active_user)):
    """Generate a simple summary for accessibility results."""
    request_id = getattr(request.state, "request_id", "unknown")
    try:
        results = payload.results
        violations = results.get("violations", []) if isinstance(results, dict) else []
        passes = results.get("passes", []) if isinstance(results, dict) else []
        incomplete = results.get("incomplete", []) if isinstance(results, dict) else []
        inapplicable = results.get("inapplicable", []) if isinstance(results, dict) else []

        severity_counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
        for violation in violations:
            impact = (violation.get("impact") or "").lower()
            if impact in severity_counts:
                severity_counts[impact] += 1

        total_issues = len(violations)
        score = max(
            0,
            100
            - (severity_counts["critical"] * 20)
            - (severity_counts["serious"] * 12)
            - (severity_counts["moderate"] * 6)
            - (severity_counts["minor"] * 2),
        )

        return {
            "summary": (
                f"Found {total_issues} violations, {len(passes)} passes, "
                f"{len(incomplete)} incomplete checks, and {len(inapplicable)} inapplicable checks."
            ),
            "score": score,
            "counts": {
                "violations": total_issues,
                "passes": len(passes),
                "incomplete": len(incomplete),
                "inapplicable": len(inapplicable),
            },
            "severity": severity_counts,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI summary error (request_id={request_id}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI service is temporarily unavailable. Reference: {request_id}"
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
async def list_history(limit: int = 50, skip: int = 0, current_user: User = Depends(get_current_active_user)):
    """List recent analyses for the current user with pagination."""
    # Validate and clamp parameters
    limit = max(1, min(limit, 100))  # Max 100 items per page
    skip = max(0, skip)
    
    # Omit the bulky result/summary payloads from the list view
    projection = {
        "_id": 1,
        "owner_email": 0,
        "input_type": 1,
        "input_ref": 1,
        "wcag_options": 1,
        "violations_count": 1,
        "created_at": 1,
        "result": 0,
        "summary": 0,
    }
    cursor = analyses_col.find(
        {"owner_email": current_user.email},
        projection=projection,
    ).sort("created_at", -1).skip(skip).limit(limit)
    items = []
    async for doc in cursor:
        doc["id"] = str(doc.get("_id"))
        doc.pop("_id", None)
        items.append(doc)
    
    # Get total count for pagination metadata
    total_count = await analyses_col.count_documents({"owner_email": current_user.email})
    
    return {
        "items": items,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "skip": skip,
            "has_more": skip + limit < total_count
        }
    }

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
    from datetime import datetime

    try:
        # Lightweight browser availability check only; avoid running a full analysis on health probes.
        try:
            import subprocess
            browser_check = subprocess.run(
                ["playwright", "install", "--dry-run"],
                capture_output=True,
                text=True,
                timeout=10,
            )
            browser_status = f"Exit code: {browser_check.returncode}, Output: {browser_check.stdout[:200]}"
        except Exception as e:
            browser_status = f"Browser check failed: {str(e)}"

        return {
            "status": "healthy" if "failed" not in browser_status.lower() else "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "playwright_available": True,
            "error": None,
            "browser_error": False,
            "navigation_error": False,
            "axe_error": False,
            "analysis_error": False,
            "violations_found": 0,
            "browser_status": browser_status,
            "result_details": {
                "success": True,
                "mode": "health_check",
                "tags_used": []
            },
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.utcnow().isoformat(),
            "playwright_available": False,
            "error": str(e),
        }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

