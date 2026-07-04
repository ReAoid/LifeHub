"""module_daily API routes: tasks, habits, goals."""

import datetime
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.deps import get_current_user
from app.common.response import success_response
from app.base.db.session import get_db
from app.base.models.user import User
from app.modules.module_daily.schemas import (
    GoalCreate,
    GoalResponse,
    GoalUpdate,
    HabitCreate,
    HabitLogCreate,
    HabitLogResponse,
    HabitLogUpdate,
    HabitResponse,
    HabitUpdate,
    TaskCreate,
    TaskResponse,
    TaskUpdate,
)
from app.modules.module_daily.services import (
    goal_service,
    habit_log_service,
    habit_service,
    task_service,
)

router = APIRouter(tags=["Daily"])


# ==================== Tasks ====================

@router.get("/tasks", response_model=dict)
async def list_tasks(
    status: str | None = Query(None, description="Filter by status"),
    priority: int | None = Query(None, ge=1, le=4),
    due_date_from: datetime.date | None = Query(None, alias="dueDateFrom"),
    due_date_to: datetime.date | None = Query(None, alias="dueDateTo"),
    include_done: bool = Query(False, alias="includeDone"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List tasks with optional filters."""
    tasks = await task_service.list_tasks(
        db=db,
        user_id=current_user.id,
        status=status,
        priority=priority,
        due_date_from=due_date_from,
        due_date_to=due_date_to,
        include_done=include_done,
    )
    return success_response(data=[TaskResponse.model_validate(t) for t in tasks])


@router.get("/tasks/{task_id}", response_model=dict)
async def get_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single task by ID."""
    task = await task_service.get_task(db, current_user.id, task_id)
    return success_response(data=TaskResponse.model_validate(task).model_dump(mode="json"))


@router.post("/tasks", response_model=dict, status_code=201)
async def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new task."""
    task = await task_service.create_task(db, current_user.id, data)
    return success_response(
        data=TaskResponse.model_validate(task).model_dump(mode="json"),
        message="Task created",
    )


@router.put("/tasks/{task_id}", response_model=dict)
async def update_task(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing task."""
    task = await task_service.update_task(db, current_user.id, task_id, data)
    return success_response(
        data=TaskResponse.model_validate(task).model_dump(mode="json"),
        message="Task updated",
    )


@router.delete("/tasks/{task_id}", response_model=dict)
async def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a task (and its subtasks)."""
    await task_service.delete_task(db, current_user.id, task_id)
    return success_response(message="Task deleted")


@router.put("/tasks/reorder", response_model=dict)
async def reorder_tasks(
    task_ids: list[uuid.UUID],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Bulk reorder tasks."""
    tasks = await task_service.reorder_tasks(db, current_user.id, task_ids)
    return success_response(
        data=[TaskResponse.model_validate(t).model_dump(mode="json") for t in tasks],
        message="Tasks reordered",
    )


@router.get("/tasks/{task_id}/subtasks", response_model=dict)
async def list_subtasks(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List subtasks of a task."""
    # Verify parent task exists
    await task_service.get_task(db, current_user.id, task_id)
    subtasks = await task_service.list_tasks(
        db=db, user_id=current_user.id, parent_id=task_id
    )
    return success_response(data=[TaskResponse.model_validate(t) for t in subtasks])


# ==================== Habits ====================

@router.get("/habits", response_model=dict)
async def list_habits(
    is_active: bool | None = Query(None, alias="isActive"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List habits."""
    habits = await habit_service.list_habits(db, current_user.id, is_active)
    return success_response(data=[HabitResponse.model_validate(h) for h in habits])


@router.get("/habits/{habit_id}", response_model=dict)
async def get_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single habit by ID."""
    habit = await habit_service.get_habit(db, current_user.id, habit_id)
    return success_response(data=HabitResponse.model_validate(habit).model_dump(mode="json"))


@router.post("/habits", response_model=dict, status_code=201)
async def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new habit."""
    habit = await habit_service.create_habit(db, current_user.id, data)
    return success_response(
        data=HabitResponse.model_validate(habit).model_dump(mode="json"),
        message="Habit created",
    )


@router.put("/habits/{habit_id}", response_model=dict)
async def update_habit(
    habit_id: uuid.UUID,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing habit."""
    habit = await habit_service.update_habit(db, current_user.id, habit_id, data)
    return success_response(
        data=HabitResponse.model_validate(habit).model_dump(mode="json"),
        message="Habit updated",
    )


@router.delete("/habits/{habit_id}", response_model=dict)
async def delete_habit(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a habit and its logs."""
    await habit_service.delete_habit(db, current_user.id, habit_id)
    return success_response(message="Habit deleted")


@router.get("/habits/{habit_id}/streak", response_model=dict)
async def get_habit_streak(
    habit_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get habit streak data."""
    streak = await habit_service.get_streak(db, current_user.id, habit_id)
    return success_response(data=streak)


# ==================== Habit Logs ====================

@router.get("/habit-logs", response_model=dict)
async def list_habit_logs(
    habit_id: uuid.UUID | None = Query(None, alias="habitId"),
    date_from: datetime.date | None = Query(None, alias="dateFrom"),
    date_to: datetime.date | None = Query(None, alias="dateTo"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List habit logs."""
    logs = await habit_log_service.list_logs(
        db=db,
        user_id=current_user.id,
        habit_id=habit_id,
        date_from=date_from,
        date_to=date_to,
    )
    return success_response(data=[HabitLogResponse.model_validate(l) for l in logs])


@router.post("/habit-logs", response_model=dict, status_code=201)
async def log_habit(
    data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check in / log a habit."""
    log = await habit_log_service.log_habit(db, current_user.id, data)
    return success_response(
        data=HabitLogResponse.model_validate(log).model_dump(mode="json"),
        message="Habit logged",
    )


@router.put("/habit-logs/{log_id}", response_model=dict)
async def update_habit_log(
    log_id: uuid.UUID,
    data: HabitLogUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a habit log."""
    log = await habit_log_service.update_log(db, current_user.id, log_id, data)
    return success_response(
        data=HabitLogResponse.model_validate(log).model_dump(mode="json"),
        message="Habit log updated",
    )


@router.delete("/habit-logs/{log_id}", response_model=dict)
async def delete_habit_log(
    log_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a habit log."""
    await habit_log_service.delete_log(db, current_user.id, log_id)
    return success_response(message="Habit log deleted")


# ==================== Goals ====================

@router.get("/goals", response_model=dict)
async def list_goals(
    status: str | None = Query(None),
    goal_type: str | None = Query(None, alias="goalType"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List goals."""
    goals = await goal_service.list_goals(db, current_user.id, status, goal_type)
    return success_response(data=[GoalResponse.model_validate(g) for g in goals])


@router.get("/goals/{goal_id}", response_model=dict)
async def get_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single goal by ID."""
    goal = await goal_service.get_goal(db, current_user.id, goal_id)
    return success_response(data=GoalResponse.model_validate(goal).model_dump(mode="json"))


@router.post("/goals", response_model=dict, status_code=201)
async def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new goal."""
    goal = await goal_service.create_goal(db, current_user.id, data)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(mode="json"),
        message="Goal created",
    )


@router.put("/goals/{goal_id}", response_model=dict)
async def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing goal."""
    goal = await goal_service.update_goal(db, current_user.id, goal_id, data)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(mode="json"),
        message="Goal updated",
    )


@router.delete("/goals/{goal_id}", response_model=dict)
async def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a goal."""
    await goal_service.delete_goal(db, current_user.id, goal_id)
    return success_response(message="Goal deleted")


@router.put("/goals/{goal_id}/progress", response_model=dict)
async def update_goal_progress(
    goal_id: uuid.UUID,
    current_value: float = Query(..., alias="currentValue"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update goal progress value."""
    goal = await goal_service.update_progress(db, current_user.id, goal_id, current_value)
    return success_response(
        data=GoalResponse.model_validate(goal).model_dump(mode="json"),
        message="Goal progress updated",
    )
