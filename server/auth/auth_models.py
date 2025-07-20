"""Authentication models and schemas."""

from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional

class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Token data model."""
    email: str

class User(BaseModel):
    """User model."""
    email: EmailStr
    full_name: str
    disabled: Optional[bool] = None

class UserInDB(User):
    """User in database model."""
    hashed_password: str

class UserCreate(BaseModel):
    """User creation model."""
    email: EmailStr
    full_name: str
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class PasswordResetRequest(BaseModel):
    """Password reset request model."""
    email: EmailStr

class PasswordReset(BaseModel):
    """Password reset model."""
    token: str
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
