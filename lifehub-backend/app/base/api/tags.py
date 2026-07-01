"""Tag CRUD API routes."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.schemas.tag import (
    TagCreate,
    TagLinkRequest,
    TagLinkResponse,
    TagResponse,
    TagUpdate,
)
from app.base.services.tag_service import tag_service
from app.common.deps import get_current_user
from app.common.response import success_response

router = APIRouter(prefix="/api/tags", tags=["Tags"])


@router.post("")
async def create_tag(
    body: TagCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Create a new tag."""
    tag = await tag_service.create_tag(db, current_user.id, body.name, body.color)
    return success_response(data=TagResponse.model_validate(tag))


@router.get("")
async def list_tags(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """List all tags for the current user."""
    tags = await tag_service.get_tags(db, current_user.id)
    return success_response(data=[TagResponse.model_validate(t) for t in tags])


@router.get("/{tag_id}")
async def get_tag(
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get a single tag."""
    tag = await tag_service.get_tag(db, current_user.id, tag_id)
    return success_response(data=TagResponse.model_validate(tag))


@router.put("/{tag_id}")
async def update_tag(
    tag_id: uuid.UUID,
    body: TagUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Update a tag."""
    tag = await tag_service.update_tag(db, current_user.id, tag_id, body.name, body.color)
    return success_response(data=TagResponse.model_validate(tag))


@router.delete("/{tag_id}")
async def delete_tag(
    tag_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Delete a tag."""
    await tag_service.delete_tag(db, current_user.id, tag_id)
    return success_response(data=None)


@router.post("/links")
async def create_tag_link(
    body: TagLinkRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Associate a tag with an entity."""
    link = await tag_service.create_tag_link(
        db,
        current_user.id,
        uuid.UUID(body.tag_id),
        body.target_type,
        uuid.UUID(body.target_id),
    )
    return success_response(data=TagLinkResponse.model_validate(link))


@router.get("/links/{target_type}/{target_id}")
async def get_tag_links(
    target_type: str,
    target_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all tags for a specific entity."""
    links = await tag_service.get_links_for_target(db, current_user.id, target_type, target_id)
    return success_response(data=[TagLinkResponse.model_validate(l) for l in links])


@router.delete("/links/{link_id}")
async def delete_tag_link(
    link_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Remove a tag from an entity."""
    await tag_service.delete_tag_link(db, current_user.id, link_id)
    return success_response(data=None)
