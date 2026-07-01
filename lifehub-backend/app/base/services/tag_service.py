"""Tag service."""

import uuid

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.models.tag import Tag, TagLink


class TagService:
    """CRUD operations for tags and tag links."""

    async def create_tag(self, db: AsyncSession, user_id: uuid.UUID, name: str, color: str = "#6366f1") -> Tag:
        """Create a new tag."""
        tag = Tag(name=name, color=color, user_id=user_id)
        db.add(tag)
        await db.flush()
        await db.refresh(tag)
        return tag

    async def get_tags(self, db: AsyncSession, user_id: uuid.UUID) -> list[Tag]:
        """Get all tags for a user."""
        result = await db.execute(
            select(Tag).where(Tag.user_id == user_id).order_by(Tag.created_at)
        )
        return list(result.scalars().all())

    async def get_tag(self, db: AsyncSession, user_id: uuid.UUID, tag_id: uuid.UUID) -> Tag:
        """Get a single tag by ID."""
        result = await db.execute(
            select(Tag).where(and_(Tag.id == tag_id, Tag.user_id == user_id))
        )
        tag = result.scalar_one_or_none()
        if not tag:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
        return tag

    async def update_tag(
        self, db: AsyncSession, user_id: uuid.UUID, tag_id: uuid.UUID, name: str | None, color: str | None
    ) -> Tag:
        """Update a tag."""
        tag = await self.get_tag(db, user_id, tag_id)
        if name is not None:
            tag.name = name
        if color is not None:
            tag.color = color
        await db.flush()
        await db.refresh(tag)
        return tag

    async def delete_tag(self, db: AsyncSession, user_id: uuid.UUID, tag_id: uuid.UUID) -> None:
        """Delete a tag and its links."""
        tag = await self.get_tag(db, user_id, tag_id)
        await db.delete(tag)
        await db.flush()

    async def create_tag_link(
        self, db: AsyncSession, user_id: uuid.UUID, tag_id: uuid.UUID, target_type: str, target_id: uuid.UUID
    ) -> TagLink:
        """Associate a tag with an entity."""
        # Verify tag exists
        await self.get_tag(db, user_id, tag_id)

        # Check duplicate
        result = await db.execute(
            select(TagLink).where(
                and_(
                    TagLink.tag_id == tag_id,
                    TagLink.target_type == target_type,
                    TagLink.target_id == target_id,
                    TagLink.user_id == user_id,
                )
            )
        )
        if result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag link already exists")

        link = TagLink(tag_id=tag_id, target_type=target_type, target_id=target_id, user_id=user_id)
        db.add(link)
        await db.flush()
        await db.refresh(link)
        return link

    async def get_links_for_target(self, db: AsyncSession, user_id: uuid.UUID, target_type: str, target_id: uuid.UUID) -> list[TagLink]:
        """Get all tag links for a specific entity."""
        result = await db.execute(
            select(TagLink).where(
                and_(
                    TagLink.target_type == target_type,
                    TagLink.target_id == target_id,
                    TagLink.user_id == user_id,
                )
            )
        )
        return list(result.scalars().all())

    async def delete_tag_link(self, db: AsyncSession, user_id: uuid.UUID, link_id: uuid.UUID) -> None:
        """Remove a tag link."""
        result = await db.execute(
            select(TagLink).where(and_(TagLink.id == link_id, TagLink.user_id == user_id))
        )
        link = result.scalar_one_or_none()
        if not link:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag link not found")
        await db.delete(link)
        await db.flush()


tag_service = TagService()
