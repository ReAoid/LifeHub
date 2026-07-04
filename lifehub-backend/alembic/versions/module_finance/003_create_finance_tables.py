"""Create module_finance tables: accounts, bills, budgets, assets, invest_plans

Revision ID: 003_create_finance_tables
Revises: 002_create_daily_tables
Create Date: 2026-07-04
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "003_create_finance_tables"
down_revision: str = "002_create_daily_tables"
branch_labels: Union[str, Sequence[str], None] = ("module_finance",)
depends_on: Union[str, Sequence[str], None] = ("base",)


def upgrade() -> None:
    # ---- finance_accounts ----
    op.create_table(
        "finance_accounts",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("account_type", sa.String(30), nullable=False, server_default=sa.text("'cash'")),
        sa.Column("currency", sa.String(10), nullable=False, server_default=sa.text("'CNY'")),
        sa.Column("balance", sa.Numeric(15, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("color", sa.String(7), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- finance_bills ----
    op.create_table(
        "finance_bills",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("account_id", sa.Uuid(), sa.ForeignKey("finance_accounts.id"), nullable=False, index=True),
        sa.Column("bill_type", sa.String(10), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("category", sa.String(50), nullable=False, server_default=sa.text("'其他'")),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("bill_date", sa.Date(), nullable=False, index=True),
        sa.Column("to_account_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- finance_budgets ----
    op.create_table(
        "finance_budgets",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("period", sa.String(10), nullable=False, server_default=sa.text("'monthly'")),
        sa.Column("year", sa.Integer(), nullable=False),
        sa.Column("month", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- finance_assets ----
    op.create_table(
        "finance_assets",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("asset_type", sa.String(20), nullable=False),
        sa.Column("code", sa.String(20), nullable=True),
        sa.Column("hold_amount", sa.Numeric(18, 4), nullable=False, server_default=sa.text("0")),
        sa.Column("cost_price", sa.Numeric(12, 4), nullable=False, server_default=sa.text("0")),
        sa.Column("current_price", sa.Numeric(12, 4), nullable=False, server_default=sa.text("0")),
        sa.Column("currency", sa.String(10), nullable=False, server_default=sa.text("'CNY'")),
        sa.Column("purchase_date", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ---- finance_invest_plans ----
    op.create_table(
        "finance_invest_plans",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("user_id", sa.Uuid(), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("asset_id", sa.Uuid(), sa.ForeignKey("finance_assets.id"), nullable=False, index=True),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("frequency", sa.String(10), nullable=False, server_default=sa.text("'monthly'")),
        sa.Column("next_date", sa.Date(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("finance_invest_plans")
    op.drop_table("finance_assets")
    op.drop_table("finance_budgets")
    op.drop_table("finance_bills")
    op.drop_table("finance_accounts")
