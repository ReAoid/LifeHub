"""module_daily business logic services."""

import datetime
import logging
import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.module_daily.models import Goal, Habit, HabitLog, Task
from app.modules.module_daily.schemas import (
    GoalCreate,
    GoalUpdate,
    HabitCreate,
    HabitLogCreate,
    HabitLogUpdate,
    HabitUpdate,
    TaskCreate,
    TaskUpdate,
)

logger = logging.getLogger("lifehub.module_daily.services")


# ==================== Task Service ====================

class TaskService:
    """Task CRUD and business logic."""

    async def list_tasks(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        status: str | None = None,
        priority: int | None = None,
        due_date_from: datetime.date | None = None,
        due_date_to: datetime.date | None = None,
        parent_id: uuid.UUID | None = None,
        include_done: bool = False,
    ) -> list[Task]:
        """List tasks with optional filters."""
        stmt = select(Task).where(Task.user_id == user_id)

        if status:
            stmt = stmt.where(Task.status == status)
        elif not include_done:
            stmt = stmt.where(Task.status.in_(["todo", "in_progress"]))

        if priority:
            stmt = stmt.where(Task.priority == priority)

        if due_date_from:
            stmt = stmt.where(
                or_(Task.due_date >= due_date_from, Task.due_date.is_(None))
            )
        if due_date_to:
            stmt = stmt.where(
                or_(Task.due_date <= due_date_to, Task.due_date.is_(None))
            )

        # parent_id=None means top-level tasks
        if parent_id is not None:
            stmt = stmt.where(Task.parent_id == parent_id)
        else:
            stmt = stmt.where(Task.parent_id.is_(None))

        stmt = stmt.order_by(Task.sort_order, Task.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_task(self, db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID) -> Task:
        """Get a single task by ID."""
        stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        result = await db.execute(stmt)
        task = result.scalar_one_or_none()
        if not task:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return task

    async def create_task(self, db: AsyncSession, user_id: uuid.UUID, data: TaskCreate) -> Task:
        """Create a new task."""
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            status=data.status,
            due_date=data.due_date,
            due_time=data.due_time,
            parent_id=data.parent_id,
            sort_order=data.sort_order,
            is_recurring=data.is_recurring,
            recur_rule=data.recur_rule,
        )
        db.add(task)
        await db.flush()
        await db.refresh(task)
        logger.info("Task created: %s (%s)", task.title, task.id)
        return task

    async def update_task(
        self, db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID, data: TaskUpdate
    ) -> Task:
        """Update an existing task."""
        task = await self.get_task(db, user_id, task_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return task

        # If marking as done, set completed_at
        if "status" in update_dict and update_dict["status"] == "done":
            update_dict["completed_at"] = datetime.datetime.now(datetime.timezone.utc)
        elif "status" in update_dict and update_dict["status"] != "done":
            update_dict["completed_at"] = None

        for key, value in update_dict.items():
            setattr(task, key, value)

        await db.flush()
        await db.refresh(task)
        logger.info("Task updated: %s (%s)", task.title, task.id)
        return task

    async def delete_task(self, db: AsyncSession, user_id: uuid.UUID, task_id: uuid.UUID) -> None:
        """Delete a task and its subtasks."""
        task = await self.get_task(db, user_id, task_id)

        # Delete subtasks first
        await db.execute(
            delete(Task).where(Task.parent_id == task_id, Task.user_id == user_id)
        )
        await db.delete(task)
        await db.flush()
        logger.info("Task deleted: %s (%s)", task.title, task_id)

    async def reorder_tasks(
        self, db: AsyncSession, user_id: uuid.UUID, task_ids: list[uuid.UUID]
    ) -> list[Task]:
        """Bulk reorder tasks by setting sort_order based on list position."""
        tasks = []
        for idx, task_id in enumerate(task_ids):
            stmt = (
                update(Task)
                .where(Task.id == task_id, Task.user_id == user_id)
                .values(sort_order=idx)
            )
            await db.execute(stmt)

            task = await self.get_task(db, user_id, task_id)
            tasks.append(task)

        return tasks


# ==================== Habit Service ====================

class HabitService:
    """Habit CRUD and business logic."""

    async def list_habits(
        self, db: AsyncSession, user_id: uuid.UUID, is_active: bool | None = None
    ) -> list[Habit]:
        """List habits with optional active filter."""
        stmt = select(Habit).where(Habit.user_id == user_id)
        if is_active is not None:
            stmt = stmt.where(Habit.is_active == is_active)
        stmt = stmt.order_by(Habit.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_habit(self, db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID) -> Habit:
        """Get a single habit by ID."""
        stmt = select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id)
        result = await db.execute(stmt)
        habit = result.scalar_one_or_none()
        if not habit:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found")
        return habit

    async def create_habit(self, db: AsyncSession, user_id: uuid.UUID, data: HabitCreate) -> Habit:
        """Create a new habit."""
        habit = Habit(
            user_id=user_id,
            name=data.name,
            description=data.description,
            frequency=data.frequency,
            target_count=data.target_count,
            icon=data.icon,
            color=data.color,
            start_date=data.start_date or datetime.date.today(),
            is_active=data.is_active,
        )
        db.add(habit)
        await db.flush()
        await db.refresh(habit)
        logger.info("Habit created: %s (%s)", habit.name, habit.id)
        return habit

    async def update_habit(
        self, db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID, data: HabitUpdate
    ) -> Habit:
        """Update an existing habit."""
        habit = await self.get_habit(db, user_id, habit_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return habit

        for key, value in update_dict.items():
            setattr(habit, key, value)

        await db.flush()
        await db.refresh(habit)
        logger.info("Habit updated: %s (%s)", habit.name, habit.id)
        return habit

    async def delete_habit(self, db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID) -> None:
        """Delete a habit and its logs."""
        habit = await self.get_habit(db, user_id, habit_id)
        await db.delete(habit)
        await db.flush()
        logger.info("Habit deleted: %s (%s)", habit.name, habit_id)

    async def get_streak(self, db: AsyncSession, user_id: uuid.UUID, habit_id: uuid.UUID) -> dict:
        """Calculate current streak and longest streak for a habit."""
        habit = await self.get_habit(db, user_id, habit_id)

        stmt = (
            select(HabitLog)
            .where(HabitLog.habit_id == habit_id)
            .order_by(HabitLog.log_date.desc())
        )
        result = await db.execute(stmt)
        logs = list(result.scalars().all())

        if not logs:
            return {"current_streak": 0, "longest_streak": 0, "total_logs": 0}

        # Group by date (deduplicate)
        log_dates = sorted(set(log.log_date for log in logs), reverse=True)

        # Calculate current streak
        today = datetime.date.today()
        current_streak = 0
        check_date = today

        # Check if today is logged or yesterday (allow same-day grace)
        if log_dates and log_dates[0] == today:
            current_streak = 1
            check_date = today - datetime.timedelta(days=1)
        elif log_dates and log_dates[0] == today - datetime.timedelta(days=1):
            current_streak = 1
            check_date = today - datetime.timedelta(days=2)
        else:
            current_streak = 0

        for d in log_dates:
            if d == check_date:
                current_streak += 1
                check_date -= datetime.timedelta(days=1)
            elif d < check_date:
                break

        # Calculate longest streak
        sorted_dates = sorted(set(log.log_date for log in logs))
        longest_streak = 1
        temp_streak = 1
        for i in range(1, len(sorted_dates)):
            if (sorted_dates[i] - sorted_dates[i - 1]).days == 1:
                temp_streak += 1
                longest_streak = max(longest_streak, temp_streak)
            else:
                temp_streak = 1

        return {
            "current_streak": current_streak,
            "longest_streak": longest_streak,
            "total_logs": len(logs),
        }


# ==================== HabitLog Service ====================

class HabitLogService:
    """HabitLog (check-in) CRUD."""

    async def log_habit(
        self, db: AsyncSession, user_id: uuid.UUID, data: HabitLogCreate
    ) -> HabitLog:
        """Create a habit log entry (check-in)."""
        # Verify habit exists and belongs to user
        from app.modules.module_daily.services import habit_service
        await habit_service.get_habit(db, user_id, data.habit_id)

        log_date = data.log_date or datetime.date.today()

        # Check if already logged for this date — if so, update count
        stmt = select(HabitLog).where(
            HabitLog.habit_id == data.habit_id,
            HabitLog.log_date == log_date,
        )
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if existing:
            existing.count += data.count
            if data.note:
                existing.note = data.note
            await db.flush()
            await db.refresh(existing)
            return existing

        log = HabitLog(
            habit_id=data.habit_id,
            log_date=log_date,
            count=data.count,
            note=data.note,
        )
        db.add(log)
        await db.flush()
        await db.refresh(log)
        logger.info("Habit logged: %s on %s x%d", data.habit_id, log_date, data.count)
        return log

    async def update_log(
        self, db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID, data: HabitLogUpdate
    ) -> HabitLog:
        """Update a habit log entry."""
        stmt = select(HabitLog).where(HabitLog.id == log_id)
        result = await db.execute(stmt)
        log = result.scalar_one_or_none()
        if not log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit log not found")

        # Verify habit belongs to user
        from app.modules.module_daily.services import habit_service
        await habit_service.get_habit(db, user_id, log.habit_id)

        update_dict = data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(log, key, value)

        await db.flush()
        await db.refresh(log)
        return log

    async def delete_log(self, db: AsyncSession, user_id: uuid.UUID, log_id: uuid.UUID) -> None:
        """Delete a habit log entry."""
        stmt = select(HabitLog).where(HabitLog.id == log_id)
        result = await db.execute(stmt)
        log = result.scalar_one_or_none()
        if not log:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit log not found")

        # Verify habit belongs to user
        from app.modules.module_daily.services import habit_service
        await habit_service.get_habit(db, user_id, log.habit_id)

        await db.delete(log)
        await db.flush()

    async def list_logs(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        habit_id: uuid.UUID | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> list[HabitLog]:
        """List habit logs with optional filters."""
        stmt = select(HabitLog)

        if habit_id:
            stmt = stmt.where(HabitLog.habit_id == habit_id)
            # Verify habit belongs to user
            from app.modules.module_daily.services import habit_service
            await habit_service.get_habit(db, user_id, habit_id)

        if date_from:
            stmt = stmt.where(HabitLog.log_date >= date_from)
        if date_to:
            stmt = stmt.where(HabitLog.log_date <= date_to)

        stmt = stmt.order_by(HabitLog.log_date.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())


# ==================== Goal Service ====================

class GoalService:
    """Goal CRUD and progress calculation."""

    async def list_goals(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        status: str | None = None,
        goal_type: str | None = None,
    ) -> list[Goal]:
        """List goals with optional filters."""
        stmt = select(Goal).where(Goal.user_id == user_id)
        if status:
            stmt = stmt.where(Goal.status == status)
        if goal_type:
            stmt = stmt.where(Goal.goal_type == goal_type)
        stmt = stmt.order_by(Goal.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_goal(self, db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID) -> Goal:
        """Get a single goal by ID."""
        stmt = select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id)
        result = await db.execute(stmt)
        goal = result.scalar_one_or_none()
        if not goal:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
        return goal

    async def create_goal(self, db: AsyncSession, user_id: uuid.UUID, data: GoalCreate) -> Goal:
        """Create a new goal with initial progress calculation."""
        progress = self._calculate_progress(
            current_value=data.current_value,
            target_value=data.target_value,
        )
        goal = Goal(
            user_id=user_id,
            title=data.title,
            description=data.description,
            goal_type=data.goal_type,
            target_value=data.target_value,
            current_value=data.current_value,
            unit=data.unit,
            start_date=data.start_date or datetime.date.today(),
            end_date=data.end_date,
            status=data.status,
            progress=progress,
        )
        db.add(goal)
        await db.flush()
        await db.refresh(goal)
        logger.info("Goal created: %s (%s)", goal.title, goal.id)
        return goal

    async def update_goal(
        self, db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID, data: GoalUpdate
    ) -> Goal:
        """Update a goal and recompute progress."""
        goal = await self.get_goal(db, user_id, goal_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return goal

        # If marking as completed, set progress to 100%
        if "status" in update_dict and update_dict["status"] == "completed":
            update_dict["progress"] = Decimal("100.00")
            update_dict["current_value"] = float(goal.target_value)

        for key, value in update_dict.items():
            setattr(goal, key, value)

        # Recalculate progress if target or current changed
        if "target_value" in update_dict or "current_value" in update_dict:
            goal.progress = self._calculate_progress(
                current_value=float(goal.current_value),
                target_value=float(goal.target_value),
            )

        await db.flush()
        await db.refresh(goal)
        logger.info("Goal updated: %s (%s) progress=%s%%", goal.title, goal.id, goal.progress)
        return goal

    async def delete_goal(self, db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID) -> None:
        """Delete a goal."""
        goal = await self.get_goal(db, user_id, goal_id)
        await db.delete(goal)
        await db.flush()
        logger.info("Goal deleted: %s (%s)", goal.title, goal_id)

    async def update_progress(
        self, db: AsyncSession, user_id: uuid.UUID, goal_id: uuid.UUID, current_value: float
    ) -> Goal:
        """Manually update goal progress value."""
        goal = await self.get_goal(db, user_id, goal_id)
        goal.current_value = current_value
        goal.progress = self._calculate_progress(
            current_value=float(goal.current_value),
            target_value=float(goal.target_value),
        )

        # Auto-complete if progress >= 100%
        if goal.progress is not None and goal.progress >= Decimal("100.00"):
            goal.status = "completed"

        await db.flush()
        await db.refresh(goal)
        return goal

    def _calculate_progress(self, current_value: float, target_value: float) -> Decimal:
        """Calculate progress percentage."""
        if target_value == 0:
            return Decimal("0.00")
        progress = (current_value / target_value) * 100
        return Decimal(str(round(min(progress, 100), 2)))


# ==================== Singleton Instances ====================

task_service = TaskService()
habit_service = HabitService()
habit_log_service = HabitLogService()
goal_service = GoalService()
