"""module_daily Pydantic schemas for request/response validation."""

import datetime
import uuid
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ==================== Task ====================

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    priority: int = Field(default=4, ge=1, le=4)
    status: str = "todo"
    due_date: datetime.date | None = None
    due_time: datetime.time | None = None
    parent_id: uuid.UUID | None = None
    sort_order: int = 0
    is_recurring: bool = False
    recur_rule: dict | None = None


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    priority: int | None = Field(default=None, ge=1, le=4)
    status: str | None = None
    due_date: datetime.date | None = None
    due_time: datetime.time | None = None
    parent_id: uuid.UUID | None = None
    sort_order: int | None = None
    is_recurring: bool | None = None
    recur_rule: dict | None = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str | None) -> str | None:
        if v is not None and v not in ("todo", "in_progress", "done", "cancelled"):
            raise ValueError("status must be one of: todo, in_progress, done, cancelled")
        return v


class TaskResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None = None
    priority: int
    status: str
    due_date: datetime.date | None = None
    due_time: datetime.time | None = None
    parent_id: uuid.UUID | None = None
    sort_order: int
    is_recurring: bool
    recur_rule: dict | None = None
    completed_at: datetime.datetime | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== Habit ====================

class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    frequency: str = "daily"
    target_count: int = 1
    icon: str | None = None
    color: str | None = None
    start_date: datetime.date | None = None
    is_active: bool = True

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        if v not in ("daily", "weekly", "monthly", "custom"):
            raise ValueError("frequency must be: daily, weekly, monthly, custom")
        return v


class HabitUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None
    frequency: str | None = None
    target_count: int | None = None
    icon: str | None = None
    color: str | None = None
    start_date: datetime.date | None = None
    is_active: bool | None = None


class HabitResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    description: str | None = None
    frequency: str
    target_count: int
    icon: str | None = None
    color: str | None = None
    start_date: datetime.date
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== HabitLog ====================

class HabitLogCreate(BaseModel):
    habit_id: uuid.UUID
    log_date: datetime.date | None = None
    count: int = 1
    note: str | None = None


class HabitLogUpdate(BaseModel):
    count: int | None = None
    note: str | None = None


class HabitLogResponse(BaseModel):
    id: uuid.UUID
    habit_id: uuid.UUID
    log_date: datetime.date
    count: int
    note: str | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== Goal ====================

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    goal_type: str = "monthly"
    target_value: float = 0
    current_value: float = 0
    unit: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    status: str = "active"

    @field_validator("goal_type")
    @classmethod
    def validate_goal_type(cls, v: str) -> str:
        if v not in ("annual", "quarterly", "monthly", "weekly"):
            raise ValueError("goal_type must be: annual, quarterly, monthly, weekly")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in ("active", "completed", "abandoned"):
            raise ValueError("status must be: active, completed, abandoned")
        return v


class GoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    goal_type: str | None = None
    target_value: float | None = None
    current_value: float | None = None
    unit: str | None = None
    start_date: datetime.date | None = None
    end_date: datetime.date | None = None
    status: str | None = None


class GoalResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: str | None = None
    goal_type: str
    target_value: float
    current_value: float
    unit: str | None = None
    start_date: datetime.date
    end_date: datetime.date | None = None
    status: str
    progress: Decimal | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
