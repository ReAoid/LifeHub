"""Auth-related Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """User registration request body."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)


class LoginRequest(BaseModel):
    """User login request body."""

    username: str
    password: str


class TokenResponse(BaseModel):
    """Token response body."""

    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    """Token refresh request body."""

    refresh_token: str


class TokenPayload(BaseModel):
    """Decoded JWT token payload."""

    sub: str
    exp: int
    type: str = "access"
