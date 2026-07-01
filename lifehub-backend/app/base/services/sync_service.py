"""Sync service for tracking data changes."""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.models.sync import SyncLog


class SyncService:
    """Record and query synchronization events."""

    async def record_change(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        device_id: str,
        entity_type: str,
        entity_id: uuid.UUID,
        action: str,
        version: int = 1,
    ) -> SyncLog:
        """Record a data change event."""
        log = SyncLog(
            user_id=user_id,
            device_id=device_id,
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            version=version,
        )
        db.add(log)
        await db.flush()
        await db.refresh(log)
        return log

    async def get_changes_since(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        since: str,
        limit: int = 100,
    ) -> list[SyncLog]:
        """Get all changes since a given timestamp."""
        result = await db.execute(
            select(SyncLog)
            .where(SyncLog.user_id == user_id, SyncLog.created_at > since)
            .order_by(SyncLog.created_at.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_latest_version(
        self, db: AsyncSession, user_id: uuid.UUID, entity_type: str, entity_id: uuid.UUID
    ) -> int:
        """Get the latest version number for an entity."""
        result = await db.execute(
            select(SyncLog.version)
            .where(
                SyncLog.user_id == user_id,
                SyncLog.entity_type == entity_type,
                SyncLog.entity_id == entity_id,
            )
            .order_by(SyncLog.version.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        return row or 0


sync_service = SyncService()
