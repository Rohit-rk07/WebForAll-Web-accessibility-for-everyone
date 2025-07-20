"""FastAPI server for accessibility analysis."""

import os
import platform
import logging
import asyncio
import secrets
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, UploadFile, File, Depends, status, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, HttpUrl, EmailStr, field_validator
from typing import Optional, Dict, List, Any, Union
import uvicorn
import jwt
from passlib.context import CryptContext
import uuid
import json

from analyzer.core import analyze_static
from analyzer.simple_playwright import analyze_url as playwright_analyze_url
from dotenv import load_dotenv


# Add Google Generative AI import
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Authentication settings
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Email settings (replace with actual SMTP settings in production)
EMAIL_HOST = os.environ.get("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "1025"))  # Default to MailHog port
EMAIL_USER = os.environ.get("EMAIL_USER", "")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "")
EMAIL_FROM = os.environ.get("EMAIL_FROM", "noreply@accessibilityanalyzer.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5175")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# In-memory user database (replace with a real database in production)
fake_users_db = {}

# In-memory password reset tokens
password_reset_tokens = {}

# Gemini API Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_CONFIGURED = False

if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY is not set. AI features will not work.")
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Test the API key by creating a simple model instance
        test_model = genai.GenerativeModel("gemini-1.5-flash")
        GEMINI_CONFIGURED = True
        logger.info("Gemini AI configured successfully")
    except Exception as e:
        logger.error(f"Failed to configure Gemini AI: {str(e)}")
        GEMINI_CONFIGURED = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application."""
    # Startup
    logger.info(f"Running on {platform.system()}")
    
    # Create default users if they don't exist
    if "test@example.com" not in fake_users_db:
        fake_users_db["test@example.com"] = {
            "email": "test@example.com",
            "full_name": "Test User",
            "hashed_password": get_password_hash("password123"),
            "disabled": False
        }
        logger.info("Created default test user: test@example.com / password123")
    
    if "admin@example.com" not in fake_users_db:
        fake_users_db["admin@example.com"] = {
            "email": "admin@example.com",
            "full_name": "Admin User",
            "hashed_password": get_password_hash("admin123"),
            "disabled": False
        }
        logger.info("Created default admin user: admin@example.com / admin123")
    
    yield
    # Shutdown
    # Add any cleanup code here if needed

# Initialize FastAPI app
app = FastAPI(
    title="Accessibility Analyzer API",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str

class User(BaseModel):
    email: EmailStr
    full_name: str
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    
    @field_validator('password')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str
    
    @field_validator('new_password')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

# Analysis request models
class WCAGOptions(BaseModel):
    """Options for WCAG version and level selection."""
    wcag_version: str = "wcag21"  # "wcag2", "wcag21", "wcag22"
    level: str = "aa"  # "a", "aa", "aaa"
    best_practice: bool = True

class URLAnalysisRequest(BaseModel):
    """Request model for URL-based accessibility analysis."""
    url: HttpUrl
    wcag_options: Optional[WCAGOptions] = None

class HTMLAnalysisRequest(BaseModel):
    """Request model for HTML-based accessibility analysis."""
    content: str
    base_url: Optional[str] = None
    wcag_options: Optional[WCAGOptions] = None

# Email functions
def send_email(to_email: str, subject: str, body: str):
    """Send an email (mock implementation for development)"""
    try:
        msg = EmailMessage()
        msg.set_content(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_FROM
        msg["To"] = to_email
        
        # For development, just log the email
        logger.info(f"Email to: {to_email}, Subject: {subject}, Body: {body}")
        
        # In production, uncomment this to send actual emails
        # with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        #     if EMAIL_USER and EMAIL_PASSWORD:
        #         server.login(EMAIL_USER, EMAIL_PASSWORD)
        #     server.send_message(msg)
        
        return True
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        return False

def send_welcome_email(email: str, name: str):
    """Send welcome email to new user"""
    subject = "Welcome to Accessibility Analyzer"
    body = f"""
    Hello {name},
    
    Welcome to Accessibility Analyzer! Your account has been created successfully.
    
    You can now log in and start analyzing web pages for accessibility issues.
    
    Best regards,
    The Accessibility Analyzer Team
    """
    return send_email(email, subject, body)

def send_password_reset_email(email: str, token: str):
    """Send password reset email"""
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    subject = "Password Reset Request"
    body = f"""
    Hello,
    
    We received a request to reset your password. Please click the link below to reset your password:
    
    {reset_link}
    
    This link will expire in 30 minutes.
    
    If you did not request a password reset, please ignore this email.
    
    Best regards,
    The Accessibility Analyzer Team
    """
    return send_email(email, subject, body)

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db, email: str):
    """Get user by email"""
    if email in db:
        user_dict = db[email]
        return UserInDB(**user_dict)
    return None

def authenticate_user(fake_db, email: str, password: str):
    """Authenticate user by email"""
    user = get_user(fake_db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    user = get_user(fake_users_db, email=token_data.email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Authentication endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
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

@app.post("/users/register", response_model=User)
async def register_user(user: UserCreate, background_tasks: BackgroundTasks):
    try:
        # Check if email exists
        if user.email in fake_users_db:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create user
        hashed_password = get_password_hash(user.password)
        user_dict = user.model_dump()
        user_dict.pop("password")
        user_dict["hashed_password"] = hashed_password
        user_dict["disabled"] = False
        
        fake_users_db[user.email] = user_dict
        
        # Send welcome email in background
        background_tasks.add_task(send_welcome_email, user.email, user.full_name)
        
        logger.info(f"User registered successfully: {user.email}")
        return User(**user_dict)
    except ValueError as ve:
        # Handle validation errors from Pydantic
        logger.error(f"Validation error during registration: {str(ve)}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(ve)
        )
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle other errors
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@app.post("/users/forgot-password")
async def forgot_password(request: PasswordResetRequest, background_tasks: BackgroundTasks):
    email = request.email
    user = get_user(fake_users_db, email)
    
    # Always return success to prevent email enumeration attacks
    if not user:
        logger.warning(f"Password reset requested for non-existent user: {email}")
        return {"message": "If your email is registered, you will receive a password reset link"}
    
    # Generate a unique token
    reset_token = str(uuid.uuid4())
    
    # Store the token with expiration time (30 minutes)
    expiration = datetime.utcnow() + timedelta(minutes=30)
    password_reset_tokens[reset_token] = {
        "email": email,
        "expires": expiration
    }
    
    # Send reset email in background
    background_tasks.add_task(send_password_reset_email, email, reset_token)
    
    logger.info(f"Password reset requested for: {email}")
    return {"message": "If your email is registered, you will receive a password reset link"}

@app.post("/users/reset-password")
async def reset_password(reset_data: PasswordReset):
    token = reset_data.token
    new_password = reset_data.new_password
    
    # Check if token exists and is valid
    if token not in password_reset_tokens:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired token"
        )
    
    token_data = password_reset_tokens[token]
    
    # Check if token is expired
    if datetime.utcnow() > token_data["expires"]:
        # Remove expired token
        password_reset_tokens.pop(token)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token has expired"
        )
    
    email = token_data["email"]
    
    # Update user password
    if email in fake_users_db:
        fake_users_db[email]["hashed_password"] = get_password_hash(new_password)
        
        # Remove used token
        password_reset_tokens.pop(token)
        
        logger.info(f"Password reset successful for: {email}")
        return {"message": "Password has been reset successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

# Analysis endpoints
@app.post("/analyze/url")
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze a URL for accessibility issues.
    
    Args:
        request (URLAnalysisRequest): The analysis request containing the URL
        
    Returns:
        dict: Analysis results
    """
    try:
        url = str(request.url)
        logger.info(f"Analyzing URL: {url}")
        
        # Extract WCAG options
        wcag_options = None
        if request.wcag_options:
            wcag_options = request.wcag_options.model_dump()
            logger.info(f"Using custom WCAG options: {wcag_options}")
        
        # First try dynamic analysis - run in a separate thread to avoid asyncio issues
        try:
            # Use the simplified Playwright analyzer in a thread to avoid asyncio issues
            loop = asyncio.get_event_loop()
            dynamic_results = await loop.run_in_executor(
                None, 
                lambda: playwright_analyze_url(url, wcag_options)
            )
            
            if dynamic_results.get("success"):
                logger.info("Dynamic analysis succeeded")
                return dynamic_results
            else:
                logger.warning(f"Dynamic analysis failed: {dynamic_results.get('error')}")
        except Exception as e:
            logger.error(f"Error in dynamic analysis: {e}")
        
        # Fall back to static analysis
        logger.info("Falling back to static analysis")
        import requests
        try:
            response = requests.get(url)
            html_content = response.text
            static_results = analyze_static(html_content)
            static_results["mode"] = "static_only"
            return static_results
        except Exception as e:
            logger.error(f"Static analysis failed: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to analyze URL: {str(e)}")
    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/html")
async def analyze_html(request: HTMLAnalysisRequest):
    """
    Analyze HTML content for accessibility issues.
    
    Args:
        request (HTMLAnalysisRequest): The analysis request containing HTML content
        
    Returns:
        dict: Analysis results
    """
    try:
        # Extract WCAG options
        wcag_options = None
        if request.wcag_options:
            wcag_options = request.wcag_options.model_dump()
            logger.info(f"Using custom WCAG options: {wcag_options}")
        
        # Use static analysis directly
        results = analyze_static(request.content)
        results["mode"] = "static_only"
        
        # Add WCAG options used to the results
        if wcag_options:
            results["wcag_options_used"] = wcag_options
        
        return results
    except Exception as e:
        logger.error(f"HTML analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze/file")
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
        # Read file content
        content = await file.read()
        html_content = content.decode("utf-8")
        
        # Parse WCAG options if provided
        options_dict = None
        if wcag_options:
            try:
                options_dict = json.loads(wcag_options)
                logger.info(f"Using custom WCAG options: {options_dict}")
            except json.JSONDecodeError:
                logger.warning("Failed to parse WCAG options, using defaults")
        
        # Use static analysis
        results = analyze_static(html_content)
        results["mode"] = "static_only"
        
        # Ensure the response has the expected structure
        if "results" not in results:
            results["results"] = {"violations": []}
        
        # Add WCAG options used to the results
        if options_dict:
            results["wcag_options_used"] = options_dict
        
        return results
    except UnicodeDecodeError:
        logger.error("File is not valid UTF-8 text")
        raise HTTPException(status_code=400, detail="File must be a valid HTML text file")
    except Exception as e:
        logger.error(f"File analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ChatGPT API Models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    messages: List[ChatMessage]
    model: str = "gpt-3.5-turbo"
    temperature: float = 0.7
    max_tokens: Optional[int] = None
    
class ExplainRequest(BaseModel):
    issue: Dict[str, Any]
    
class SummaryRequest(BaseModel):
    results: Dict[str, Any]

@app.post("/api/chat/completion")
async def chat_completion(request: ChatCompletionRequest):
    """
    Proxy for Gemini's chat completion API
    """
    # Check if Gemini is properly configured
    if not GEMINI_CONFIGURED:
        return {
            "content": "AI service is currently unavailable. Please contact support if this persists.",
            "finish_reason": "error",
            "error": "Gemini AI not configured"
        }
    
    try:
        # Call the Gemini API with proper error handling
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash"  # Use available model name
        )
        
        # Convert messages to simple text format for Gemini
        conversation_text = ""
        for msg in request.messages:
            if msg.role == "system":
                conversation_text += f"Instructions: {msg.content}\n\n"
            elif msg.role == "user":
                conversation_text += f"User: {msg.content}\n\n"
            elif msg.role == "assistant":
                conversation_text += f"Assistant: {msg.content}\n\n"
        
        # Add the current user message prompt
        conversation_text += "Please respond as a helpful accessibility assistant. Be CONCISE (under 150 words), use plain text with line breaks, and structure your response clearly. Do NOT use asterisks or markdown symbols."
        
        response = model.generate_content(
            conversation_text,
            generation_config=genai.GenerationConfig(
                temperature=request.temperature,
                max_output_tokens=request.max_tokens if request.max_tokens else 1000
            )
        )
        
        # Extract and return the response content
        if response.text:
            return {
                "content": response.text,
                "finish_reason": "stop"
            }
        else:
            raise Exception("Empty response from Gemini API")
    except Exception as e:
        # Log the error with more details
        logger.error(f"Gemini API error: {str(e)}")
        
        # Determine error type and provide appropriate response
        error_message = "I'm sorry, but I'm currently experiencing connectivity issues with my AI service."
        
        if "API_KEY" in str(e).upper():
            error_message = "AI service configuration error. Please contact support."
        elif "QUOTA" in str(e).upper() or "LIMIT" in str(e).upper():
            error_message = "AI service is temporarily at capacity. Please try again in a few minutes."
        elif "NETWORK" in str(e).upper() or "CONNECTION" in str(e).upper():
            error_message = "Network connectivity issue. Please check your connection and try again."
        
        # Return error response that frontend can handle
        return {
            "content": error_message,
            "finish_reason": "error",
            "error": str(e)
        }

@app.post("/api/chat/explain")
async def explain_issue(request: ExplainRequest):
    """
    Generate an explanation and fix for an accessibility issue
    """
    # Check if Gemini is properly configured
    if not GEMINI_CONFIGURED:
        return generate_fallback_explanation(request.issue)
    
    try:
        # Format the issue data
        issue_id = request.issue.get("id", "unknown")
        issue_title = request.issue.get("help", request.issue.get("title", "Accessibility Issue"))
        issue_description = request.issue.get("description", "No description provided")
        issue_html = "No code example available"
        
        if request.issue.get("nodes") and len(request.issue["nodes"]) > 0:
            issue_html = request.issue["nodes"][0].get("html", issue_html)
        
        # Create a prompt for the AI
        system_prompt = """You are an accessibility expert. Provide a concise code-focused fix for the accessibility issue.

Format your response EXACTLY like this with proper syntax highlighting:

**Before (Current Code):**
```html
[current problematic HTML code with proper indentation]
```

**After (Fixed Code):**
```html
[corrected HTML code with accessibility improvements and proper indentation]
```

**Key Changes:**
- Brief bullet point of main change
- Another key improvement if applicable

Keep it concise and focus only on the code changes. Do NOT use asterisks or markdown symbols outside of the code blocks."""
        
        user_prompt = f"""
Issue: {issue_title}
Description: {issue_description}
Element: {issue_html if issue_html else 'Not provided'}

Provide the before/after code fix for this accessibility issue.
        """
        
        # Call the Gemini API
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            f"{system_prompt}\n\n{user_prompt}",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000
            )
        )
        
        return {
            "explanation": response.text
        }
    except Exception as e:
        # Log the error
        print(f"Gemini API error in explain_issue: {str(e)}")
        
        # Generate a fallback explanation based on the issue type
        fallback_explanation = generate_fallback_explanation(request.issue)
        
        return {
            "explanation": fallback_explanation,
            "error": str(e)
        }

@app.post("/api/chat/summary")
async def generate_summary(request: SummaryRequest):
    """
    Generate a summary report of accessibility issues
    """
    # Check if Gemini is properly configured
    if not GEMINI_CONFIGURED:
        return generate_fallback_summary(request.results)
    
    try:
        # Extract relevant data from results
        violations = request.results.get("violations", [])
        passes = request.results.get("passes", [])
        incomplete = request.results.get("incomplete", [])
        inapplicable = request.results.get("inapplicable", [])
        
        # Count issues by severity
        severity_counts = {
            "critical": 0,
            "serious": 0,
            "moderate": 0,
            "minor": 0
        }
        
        for violation in violations:
            severity = (violation.get("impact") or violation.get("severity") or "minor").lower()
            if "critical" in severity:
                severity_counts["critical"] += 1
            elif "serious" in severity:
                severity_counts["serious"] += 1
            elif "moderate" in severity:
                severity_counts["moderate"] += 1
            else:
                severity_counts["minor"] += 1
        
        # Create a prompt for the AI
        system_prompt = "You are an accessibility expert. Be CONCISE and avoid using asterisks or markdown formatting. Keep summaries under 300 words with clear sections."
        user_prompt = f"""
Create a BRIEF accessibility report summary:

Results: {len(violations)} violations, {len(passes)} passed, {len(incomplete)} need review

Severity: Critical: {severity_counts["critical"]}, Serious: {severity_counts["serious"]}, Moderate: {severity_counts["moderate"]}, Minor: {severity_counts["minor"]}

Top Issues: {', '.join([v.get("help", v.get("title", "Unknown issue")) for v in violations[:3]])}

Provide a SHORT summary with:
Overview:
(2-3 sentences about overall accessibility status)

Priority Actions:
- (action 1)
- (action 2)
- (action 3)

Impact:
(1-2 sentences about user benefits)

Do NOT use asterisks or markdown symbols. Use plain text with line breaks.
        """
        
        # Call the Gemini API
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(
            f"{system_prompt}\n\n{user_prompt}",
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=1000
            )
        )
        
        return {
            "summary": response.text
        }
    except Exception as e:
        # Log the error
        print(f"Gemini API error in generate_summary: {str(e)}")
        
        # Generate a fallback summary
        fallback_summary = generate_fallback_summary(request.results)
        
        return {
            "summary": fallback_summary,
            "error": str(e)
        }

def generate_fallback_explanation(issue):
    """
    Generate a fallback explanation when the OpenAI API is unavailable
    """
    issue_id = issue.get("id", "")
    issue_title = issue.get("help", issue.get("title", "Accessibility Issue"))
    issue_description = issue.get("description", "No description provided")
    
    # Common accessibility issues
    if "color-contrast" in issue_id or "contrast" in issue_title.lower():
        return """
## Color Contrast Issue

This element doesn't have enough contrast between text and background colors. WCAG requires a contrast ratio of at least:
- 4.5:1 for normal text (Level AA)
- 3:1 for large text (Level AA)
- 7:1 for normal text (Level AAA)

### How to Fix:
1. Increase the contrast by using darker text on light backgrounds or lighter text on dark backgrounds
2. Use a color contrast checker tool to verify your colors meet WCAG requirements
3. Consider using bold text which can help with readability

### Example Fix:
```css
/* Before */
.low-contrast {
  color: #999;
  background-color: #777;
}

/* After */
.fixed-contrast {
  color: #fff;
  background-color: #555;
}
```
        """
    
    if "alt" in issue_id or "image" in issue_id or "alt" in issue_title.lower():
        return """
## Missing Alt Text

Images must have alt text to be accessible to screen reader users. Alt text provides a textual alternative to non-text content.

### How to Fix:
1. Add an alt attribute to your img tag
2. Make the alt text descriptive of the image content
3. If the image is decorative, use alt="" (empty string)

### Example Fix:
```html
<!-- Before -->
<img src="logo.png">

<!-- After -->
<img src="logo.png" alt="Company Logo - A blue shield with a white star">
```

### Tips for Good Alt Text:
- Be concise but descriptive
- Convey the purpose of the image
- Don't start with "image of" or "picture of"
- Include text that appears in the image
        """
    
    # Generic explanation
    return f"""
## {issue_title}

{issue_description}

### How to Fix:
1. Review the WCAG guidelines related to this issue
2. Implement the necessary changes to make your content accessible
3. Test with assistive technologies to ensure the fix works

### Note:
This is a generic explanation due to temporary AI service limitations. For more specific guidance, please try again later or consult the WCAG documentation.
    """

def generate_fallback_summary(results):
    """
    Generate a fallback summary when the OpenAI API is unavailable
    """
    violations = results.get("violations", [])
    passes = results.get("passes", [])
    incomplete = results.get("incomplete", [])
    inapplicable = results.get("inapplicable", [])
    
    # Count issues by severity
    severity_counts = {"critical": 0, "serious": 0, "moderate": 0, "minor": 0}
    
    for violation in violations:
        severity = (violation.get("impact") or violation.get("severity") or "minor").lower()
        if "critical" in severity:
            severity_counts["critical"] += 1
        elif "serious" in severity:
            severity_counts["serious"] += 1
        elif "moderate" in severity:
            severity_counts["moderate"] += 1
        else:
            severity_counts["minor"] += 1
    
    return f"""
# Accessibility Analysis Summary

## Overview
This page has **{len(violations)} accessibility issues** that need to be addressed, with **{len(passes)} passing checks** and **{len(incomplete)} items that need manual review**.

## Severity Breakdown
- **{severity_counts["critical"]} Critical Issues**: These severely impact users with disabilities and should be fixed immediately.
- **{severity_counts["serious"]} Serious Issues**: These significantly impact accessibility and should be prioritized.
- **{severity_counts["moderate"]} Moderate Issues**: These somewhat impact accessibility and should be addressed.
- **{severity_counts["minor"]} Minor Issues**: These have minimal impact but should still be fixed for optimal accessibility.

## Key Issues
{', '.join([v.get("help", v.get("title", "Unknown issue")) for v in violations[:3]])}

## Recommendations
1. **Fix Critical Issues First**: Focus on color contrast, missing alt text, and keyboard accessibility issues.
2. **Test with Real Users**: Consider testing with users who rely on assistive technologies.
3. **Implement Regular Scans**: Make accessibility testing part of your development workflow.

## Note
This is a generated summary due to temporary AI service limitations. For more detailed analysis, please try again later.
    """

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
