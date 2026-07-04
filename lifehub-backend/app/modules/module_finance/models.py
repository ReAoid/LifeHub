"""module_finance ORM models: Account, Bill, Budget, Asset, InvestPlan."""

import datetime
import uuid
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Time,
    Uuid,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.base.db.base_model import Base, TimestampMixin, UUIDMixin


class Account(UUIDMixin, TimestampMixin, Base):
    """账户"""

    __tablename__ = "finance_accounts"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    account_type: Mapped[str] = mapped_column(
        String(30), nullable=False, default="cash"
    )  # cash / bank / credit / investment / ewallet
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="CNY")
    balance: Mapped[Decimal] = mapped_column(
        Numeric(15, 2), nullable=False, default=Decimal("0.00")
    )
    icon: Mapped[str | None] = mapped_column(String(50), default=None)
    color: Mapped[str | None] = mapped_column(String(7), default=None)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    bills: Mapped[list["Bill"]] = relationship(
        "Bill", back_populates="account", lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Account {self.name}>"


class Bill(UUIDMixin, TimestampMixin, Base):
    """账单"""

    __tablename__ = "finance_bills"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    account_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("finance_accounts.id"), nullable=False, index=True
    )
    bill_type: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # income / expense / transfer
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, default="其他"
    )
    description: Mapped[str | None] = mapped_column(Text, default=None)
    bill_date: Mapped[datetime.date] = mapped_column(
        Date, nullable=False, default=datetime.date.today, index=True
    )

    # For transfer: target account
    to_account_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, default=None
    )

    # Relationship
    account: Mapped["Account"] = relationship(
        "Account", back_populates="bills", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<Bill {self.bill_type} ¥{self.amount}>"


class Budget(UUIDMixin, TimestampMixin, Base):
    """预算"""

    __tablename__ = "finance_budgets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    period: Mapped[str] = mapped_column(
        String(10), nullable=False, default="monthly"
    )  # monthly / yearly
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    month: Mapped[int | None] = mapped_column(
        Integer, default=None
    )  # 1-12, only when period=monthly

    def __repr__(self) -> str:
        return f"<Budget {self.category} ¥{self.amount}>"


class Asset(UUIDMixin, TimestampMixin, Base):
    """持仓资产"""

    __tablename__ = "finance_assets"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_type: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # stock / fund / bond / crypto / real_estate
    code: Mapped[str | None] = mapped_column(String(20), default=None)
    hold_amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 4), nullable=False, default=Decimal("0")
    )
    cost_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("0")
    )
    current_price: Mapped[Decimal] = mapped_column(
        Numeric(12, 4), nullable=False, default=Decimal("0")
    )
    currency: Mapped[str] = mapped_column(String(10), nullable=False, default="CNY")
    purchase_date: Mapped[datetime.date | None] = mapped_column(Date, default=None)

    # Relationships
    invest_plans: Mapped[list["InvestPlan"]] = relationship(
        "InvestPlan", back_populates="asset", lazy="selectin",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Asset {self.name} ({self.code})>"


class InvestPlan(UUIDMixin, TimestampMixin, Base):
    """定投计划"""

    __tablename__ = "finance_invest_plans"

    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("finance_assets.id"), nullable=False, index=True
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2), nullable=False
    )
    frequency: Mapped[str] = mapped_column(
        String(10), nullable=False, default="monthly"
    )  # weekly / biweekly / monthly
    next_date: Mapped[datetime.date] = mapped_column(
        Date, nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationship
    asset: Mapped["Asset"] = relationship(
        "Asset", back_populates="invest_plans", lazy="selectin"
    )

    def __repr__(self) -> str:
        return f"<InvestPlan {self.name} ¥{self.amount}>"
