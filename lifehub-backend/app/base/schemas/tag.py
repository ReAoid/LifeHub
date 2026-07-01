"""Tag-related Pydantic schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class TagCreate(BaseModel):
    """Tag creation request."""

    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class TagUpdate(BaseModel):
    """Tag update request."""

    name: str | None = Field(None, min_length=1, max_length=50)
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


import uuid


class TagResponse(BaseModel):
    """Tag response."""

    id: uuid.UUID
    name: str
    color: str
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TagLinkRequest(BaseModel):
    """Create a tag link."""

    tag_id: uuid.UUID
    target_type: str
    target_id: uuid.UUID


class TagLinkResponse(BaseModel):
    """Tag link response."""

    id: uuid.UUID
    tag_id: uuid.UUID
    target_type: str
    target_id: uuid.UUID
    user_id: uuid.UUID

    model_config = {"from_attributes": True}
