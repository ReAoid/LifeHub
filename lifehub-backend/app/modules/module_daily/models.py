"""module_daily ORM models: Task, Habit, HabitLog, Goal."""

import datetime
import uuid

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    SmallInteger,
    String,
    Text,
    Time,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base.db.base_model import Base, TimestampMixin, UUIDMixin


class Task(UUIDMixin, TimestampMixin, Base):
    """待办任务"""

    __tablename__ = "daily_tasks"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)

    # Priority: 1=P0(紧急重要), 2=P1(重要不紧急), 3=P2(紧急不重要), 4=P3(普通)
    priority: Mapped[int] = mapped_column(SmallInteger, default=4, nullable=False)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="todo", nullable=False, index=True
    )  # todo / in_progress / done / cancelled

    # Due date/time
    due_date: Mapped[datetime.date | None] = mapped_column(Date, default=None)
    due_time: Mapped[datetime.time | None] = mapped_column(Time, default=None)

    # Parent task (subtask nesting)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, default=None, index=True
    )

    # Sort order
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Recurrence
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    recur_rule: Mapped[dict | None] = mapped_column(JSON, default=None)

    # Completion
    completed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )

    def __repr__(self) -> str:
        return f"<Task {self.title}>"


class Habit(UUIDMixin, TimestampMixin, Base):
    """习惯"""

    __tablename__ = "daily_habits"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)

    # Frequency: daily / weekly / monthly / custom
    frequency: Mapped[str] = mapped_column(
        String(20), default="daily", nullable=False
    )
    target_count: Mapped[int] = mapped_column(
        Integer, default=1, nullable=False
    )

    icon: Mapped[str | None] = mapped_column(String(50), default=None)
    color: Mapped[str | None] = mapped_column(String(7), default=None)

    start_date: Mapped[datetime.date] = mapped_column(
        Date, nullable=False, default=datetime.date.today
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    logs: Mapped[list["HabitLog"]] = relationship(
        "HabitLog", back_populates="habit", lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Habit {self.name}>"


class HabitLog(UUIDMixin, TimestampMixin, Base):
    """习惯打卡记录"""

    __tablename__ = "daily_habit_logs"

    habit_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("daily_habits.id"), nullable=False, index=True
    )
    log_date: Mapped[datetime.date] = mapped_column(
        Date, nullable=False, index=True
    )
    count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, default=None)

    # Relationship
    habit: Mapped["Habit"] = relationship(
        "Habit", back_populates="logs", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<HabitLog {self.log_date} x{self.count}>"


class Goal(UUIDMixin, TimestampMixin, Base):
    """目标"""

    __tablename__ = "daily_goals"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, default=None)

    # Goal type: annual / quarterly / monthly / weekly
    goal_type: Mapped[str] = mapped_column(
        String(20), default="monthly", nullable=False
    )

    # Progress tracking
    target_value: Mapped[float] = mapped_column(
        Numeric(12, 2), default=0, nullable=False
    )
    current_value: Mapped[float] = mapped_column(
        Numeric(12, 2), default=0, nullable=False
    )
    unit: Mapped[str | None] = mapped_column(String(20), default=None)

    # Date range
    start_date: Mapped[datetime.date] = mapped_column(
        Date, nullable=False, default=datetime.date.today
    )
    end_date: Mapped[datetime.date | None] = mapped_column(Date, default=None)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), default="active", nullable=False
    )  # active / completed / abandoned

    # Computed progress (0.00 ~ 100.00)
    progress: Mapped[float | None] = mapped_column(
        Numeric(5, 2), default=0.00
    )

    def __repr__(self) -> str:
        return f"<Goal {self.title}>"
