"""module_daily API routes: tasks, habits, goals."""

from fastapi import APIRouter

from app.common.response import success_response

router = APIRouter(tags=["Daily"])


@router.get("/tasks")
async def list_tasks():
    """List all tasks (placeholder)."""
    return success_response(data=[])


@router.get("/habits")
async def list_habits():
    """List all habits (placeholder)."""
    return success_response(data=[])


@router.get("/goals")
async def list_goals():
    """List all goals (placeholder)."""
    return success_response(data=[])
