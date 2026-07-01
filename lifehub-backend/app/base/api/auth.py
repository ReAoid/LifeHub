"""Authentication API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.base.schemas.user import UserResponse
from app.base.services.auth_service import auth_service
from app.common.deps import get_current_user
from app.common.response import success_response

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register")
async def register(body: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    user = await auth_service.register(db, body.username, body.email, body.password)
    return success_response(data=UserResponse.model_validate(user))


@router.post("/login")
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login and receive access + refresh tokens."""
    access_token, refresh_token = await auth_service.login(db, body.username, body.password)
    return success_response(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token)
    )


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    """Refresh an expired access token using a refresh token."""
    access_token, refresh_token = await auth_service.refresh_token(body.refresh_token)
    return success_response(
        data=TokenResponse(access_token=access_token, refresh_token=refresh_token)
    )


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Get the currently authenticated user's info."""
    return success_response(data=UserResponse.model_validate(current_user))
