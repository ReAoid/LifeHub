"""Common dependency injection utilities."""

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.models.user import User
from app.base.services.auth_service import auth_service


async def get_current_user(
    authorization: str = Header(..., description="Bearer <token>"),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: extract and validate JWT, return current user."""
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization header")
    return await auth_service.get_current_user(db, token)
