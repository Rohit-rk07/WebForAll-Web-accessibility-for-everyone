"""Authentication utilities and functions (MongoDB + Motor)."""

import os
import secrets
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
from fastapi import HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer
from .auth_models import User, UserInDB
from services.db import users as users_col, password_reset_tokens as prt_col, init_indexes, seed_default_users
from typing import Optional, Union

# Authentication settings
SECRET_KEY = os.environ.get("SECRET_KEY", secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password."""
    return pwd_context.hash(password)

async def get_user(_unused_db: dict, email: str) -> Optional[UserInDB]:
    """Get user by email from MongoDB. Signature keeps unused first param for backward compatibility."""
    doc = await users_col.find_one({"email": email})
    if not doc:
        return None
    return UserInDB(**{
        "email": doc.get("email"),
        "full_name": doc.get("full_name"),
        "hashed_password": doc.get("hashed_password"),
        "disabled": doc.get("disabled", False),
    })

async def authenticate_user(_unused_db: dict, email: str, password: str) -> Union[UserInDB, bool]:
    """Authenticate user by email and password using MongoDB."""
    user = await get_user(None, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    """Get current user from JWT token (validates against MongoDB)."""
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
    except jwt.PyJWTError:
        raise credentials_exception
    user = await get_user(None, email=email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user."""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def initialize_default_users():
    """Create indexes and seed default users in MongoDB (idempotent)."""
    await init_indexes()
    await seed_default_users(get_password_hash)
