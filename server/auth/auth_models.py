"""Authentication models and schemas."""

from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional

class Token(BaseModel):
    """Token response model."""
    access_token: str
    token_type: str
    user: Optional["User"] = None

class TokenData(BaseModel):
    """Token data model."""
    email: str

class User(BaseModel):
    """User model."""
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    disabled: Optional[bool] = None

class UserInDB(User):
    """User in database model."""
    hashed_password: str

def _validate_password_strength(v: str) -> str:
    """Enforce a shared minimum password policy.

    Minimum 8 characters with at least one letter and one digit. Kept as a
    per-field validator so registration and password-reset share identical rules.
    """
    if len(v) < 8:
        raise ValueError('Password must be at least 8 characters long')
    if len(v) > 128:
        raise ValueError('Password must be at most 128 characters long')
    if not any(c.isalpha() for c in v):
        raise ValueError('Password must contain at least one letter')
    if not any(c.isdigit() for c in v):
        raise ValueError('Password must contain at least one number')
    return v

class UserCreate(BaseModel):
    """User creation model."""
    email: EmailStr
    full_name: str = Field(min_length=1, max_length=100)
    password: str

    @field_validator('password')
    @classmethod
    def password_min_length(cls, v):
        return _validate_password_strength(v)

class PasswordResetRequest(BaseModel):
    """Password reset request model."""
    email: EmailStr

class PasswordReset(BaseModel):
    """Password reset model."""
    token: str = Field(min_length=1, max_length=512)
    new_password: str

    @field_validator('new_password')
    @classmethod
    def password_min_length(cls, v):
        return _validate_password_strength(v)


Token.model_rebuild()
