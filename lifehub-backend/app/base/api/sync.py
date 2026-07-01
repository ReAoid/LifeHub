"""Sync API routes."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.services.sync_service import sync_service
from app.common.deps import get_current_user
from app.common.response import success_response

router = APIRouter(prefix="/api/sync", tags=["Sync"])


@router.get("/changes")
async def get_changes(
    since: str = Query(..., description="ISO timestamp to fetch changes since"),
    limit: int = Query(100, ge=1, le=1000),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get all data changes since a given timestamp."""
    logs = await sync_service.get_changes_since(db, current_user.id, since, limit)
    return success_response(
        data=[
            {
                "id": str(log.id),
                "entity_type": log.entity_type,
                "entity_id": str(log.entity_id),
                "action": log.action,
                "version": log.version,
                "synced_at": log.created_at.isoformat(),
            }
            for log in logs
        ]
    )
