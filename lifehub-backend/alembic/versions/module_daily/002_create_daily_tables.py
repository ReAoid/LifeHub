"""Create module_daily tables: tasks, habits, habit_logs, goals

Revision ID: 002_create_daily_tables
Revises: 001_create_base_tables
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_create_daily_tables"
down_revision: str = "001_create_base_tables"
branch_labels: Union[str, Sequence[str], None] = ("module_daily",)
depends_on: Union[str, Sequence[str], None] = ("base",)


def upgrade() -> None:
    # ---- daily_tasks ----
    op.create_table(
        "daily_tasks",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("priority", sa.SmallInteger(), nullable=False, server_default=sa.text("4")),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'todo'"), index=True),
        sa.Column("due_date", sa.Date(), nullable=True),
        sa.Column("due_time", sa.Time(), nullable=True),
        sa.Column("parent_id", sa.Uuid(), nullable=True, index=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_recurring", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("recur_rule", sa.JSON(), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- daily_habits ----
    op.create_table(
        "daily_habits",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("frequency", sa.String(20), nullable=False, server_default=sa.text("'daily'")),
        sa.Column("target_count", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("color", sa.String(7), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- daily_habit_logs ----
    op.create_table(
        "daily_habit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("habit_id", sa.Uuid(), sa.ForeignKey("daily_habits.id"), nullable=False, index=True),
        sa.Column("log_date", sa.Date(), nullable=False, index=True),
        sa.Column("count", sa.Integer(), nullable=False, server_default=sa.text("1")),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- daily_goals ----
    op.create_table(
        "daily_goals",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("goal_type", sa.String(20), nullable=False, server_default=sa.text("'monthly'")),
        sa.Column("target_value", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("current_value", sa.Numeric(12, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("unit", sa.String(20), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default=sa.text("'active'")),
        sa.Column("progress", sa.Numeric(5, 2), nullable=True, server_default=sa.text("0.00")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("daily_goals")
    op.drop_table("daily_habit_logs")
    op.drop_table("daily_habits")
    op.drop_table("daily_tasks")
