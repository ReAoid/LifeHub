"""User-related Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel


import uuid


class UserResponse(BaseModel):
    """Public user info response."""

    id: uuid.UUID
    username: str
    email: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """User profile update request."""

    email: str | None = None
