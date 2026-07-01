"""Authentication service."""

import logging

from fastapi import HTTPException, status
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.base.models.user import User

logger = logging.getLogger("lifehub.auth_service")


class AuthService:
    """Handle user registration, login, and token operations."""

    async def register(self, db: AsyncSession, username: str, email: str, password: str) -> User:
        """Register a new user."""
        # Check existing
        result = await db.execute(select(User).where((User.username == username) | (User.email == email)))
        existing = result.scalar_one_or_none()
        if existing:
            if existing.username == username:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists")
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
        )
        db.add(user)
        await db.flush()
        await db.refresh(user)
        logger.info("User registered: %s", user.username)
        return user

    async def login(self, db: AsyncSession, username: str, password: str) -> tuple[str, str]:
        """Authenticate user and return access + refresh tokens."""
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        access_token = create_access_token(subject=str(user.id))
        refresh_token = create_refresh_token(subject=str(user.id))
        return access_token, refresh_token

    async def refresh_token(self, refresh_token: str) -> tuple[str, str]:
        """Issue a new access token using a valid refresh token."""
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )
            new_access = create_access_token(subject=user_id)
            new_refresh = create_refresh_token(subject=user_id)
            return new_access, new_refresh
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )

    async def get_current_user(self, db: AsyncSession, token: str) -> User:
        """Decode JWT and return the authenticated user."""
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token type",
                )
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token payload",
                )
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token",
            )

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )
        return user


auth_service = AuthService()
