"""User settings API routes."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.schemas.user import UserResponse, UserUpdateRequest
from app.common.deps import get_current_user
from app.common.response import success_response

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile")
async def get_profile(current_user=Depends(get_current_user)):
    """Get current user profile."""
    return success_response(data=UserResponse.model_validate(current_user))


@router.put("/profile")
async def update_profile(
    body: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update user profile."""
    if body.email is not None:
        current_user.email = body.email
        await db.flush()
        await db.refresh(current_user)
    return success_response(data=UserResponse.model_validate(current_user))
