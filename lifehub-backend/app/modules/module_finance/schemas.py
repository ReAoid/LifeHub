"""module_finance Pydantic schemas for request/response validation."""

import datetime
import uuid
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator


# ==================== Account ====================

class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: str = "cash"
    currency: str = "CNY"
    balance: Decimal = Field(default=Decimal("0.00"), max_digits=15, decimal_places=2)
    icon: str | None = None
    color: str | None = None
    is_active: bool = True

    @field_validator("account_type")
    @classmethod
    def validate_account_type(cls, v: str) -> str:
        if v not in ("cash", "bank", "credit", "investment", "ewallet"):
            raise ValueError("account_type must be: cash, bank, credit, investment, ewallet")
        return v


class AccountUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    account_type: str | None = None
    currency: str | None = None
    balance: Decimal | None = Field(default=None, max_digits=15, decimal_places=2)
    icon: str | None = None
    color: str | None = None
    is_active: bool | None = None


class AccountResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    account_type: str
    currency: str
    balance: Decimal
    icon: str | None = None
    color: str | None = None
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== Bill ====================

class BillCreate(BaseModel):
    account_id: uuid.UUID
    bill_type: str
    amount: Decimal = Field(..., max_digits=12, decimal_places=2, gt=0)
    category: str = "其他"
    description: str | None = None
    bill_date: datetime.date | None = None
    to_account_id: uuid.UUID | None = None

    @field_validator("bill_type")
    @classmethod
    def validate_bill_type(cls, v: str) -> str:
        if v not in ("income", "expense", "transfer"):
            raise ValueError("bill_type must be: income, expense, transfer")
        return v

    @field_validator("to_account_id")
    @classmethod
    def validate_transfer(cls, v: uuid.UUID | None, info) -> uuid.UUID | None:
        values = info.data
        if values.get("bill_type") == "transfer" and v is None:
            raise ValueError("to_account_id is required for transfer")
        if v is not None and values.get("bill_type") != "transfer":
            raise ValueError("to_account_id is only allowed for transfer")
        return v


class BillUpdate(BaseModel):
    account_id: uuid.UUID | None = None
    bill_type: str | None = None
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, gt=0)
    category: str | None = None
    description: str | None = None
    bill_date: datetime.date | None = None
    to_account_id: uuid.UUID | None = None


class BillResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    account_id: uuid.UUID
    bill_type: str
    amount: Decimal
    category: str
    description: str | None = None
    bill_date: datetime.date
    to_account_id: uuid.UUID | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== Budget ====================

class BudgetCreate(BaseModel):
    category: str = Field(..., min_length=1, max_length=50)
    amount: Decimal = Field(..., max_digits=12, decimal_places=2, gt=0)
    period: str = "monthly"
    year: int
    month: int | None = None

    @field_validator("period")
    @classmethod
    def validate_period(cls, v: str) -> str:
        if v not in ("monthly", "yearly"):
            raise ValueError("period must be: monthly, yearly")
        return v

    @field_validator("month")
    @classmethod
    def validate_month(cls, v: int | None, info) -> int | None:
        values = info.data
        if values.get("period") == "monthly" and v is None:
            raise ValueError("month is required for monthly budget")
        if v is not None and not 1 <= v <= 12:
            raise ValueError("month must be between 1 and 12")
        return v


class BudgetUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=50)
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, gt=0)
    period: str | None = None
    year: int | None = None
    month: int | None = None


class BudgetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: str
    amount: Decimal
    period: str
    year: int
    month: int | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class BudgetWithSpendingResponse(BaseModel):
    """Budget response with actual spending and remaining amount."""
    id: uuid.UUID
    user_id: uuid.UUID
    category: str
    amount: Decimal
    period: str
    year: int
    month: int | None = None
    spent: Decimal = Decimal("0.00")
    remaining: Decimal = Decimal("0.00")
    percentage: float = 0.0
    is_over_budget: bool = False
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== Asset ====================

class AssetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    asset_type: str
    code: str | None = None
    hold_amount: Decimal = Field(default=Decimal("0"), max_digits=18, decimal_places=4)
    cost_price: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=4)
    current_price: Decimal = Field(default=Decimal("0"), max_digits=12, decimal_places=4)
    currency: str = "CNY"
    purchase_date: datetime.date | None = None

    @field_validator("asset_type")
    @classmethod
    def validate_asset_type(cls, v: str) -> str:
        allowed = ("stock", "fund", "bond", "crypto", "real_estate")
        if v not in allowed:
            raise ValueError(f"asset_type must be one of: {', '.join(allowed)}")
        return v


class AssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    asset_type: str | None = None
    code: str | None = None
    hold_amount: Decimal | None = Field(default=None, max_digits=18, decimal_places=4)
    cost_price: Decimal | None = Field(default=None, max_digits=12, decimal_places=4)
    current_price: Decimal | None = Field(default=None, max_digits=12, decimal_places=4)
    currency: str | None = None
    purchase_date: datetime.date | None = None


class AssetResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    asset_type: str
    code: str | None = None
    hold_amount: Decimal
    cost_price: Decimal
    current_price: Decimal
    currency: str
    purchase_date: datetime.date | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


class AssetProfitResponse(BaseModel):
    """Asset response with profit/loss calculation."""
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    asset_type: str
    code: str | None = None
    hold_amount: Decimal
    cost_price: Decimal
    current_price: Decimal
    currency: str
    cost_value: Decimal  # hold_amount * cost_price
    current_value: Decimal  # hold_amount * current_price
    profit: Decimal  # current_value - cost_value
    profit_percentage: float  # (current_price - cost_price) / cost_price * 100
    purchase_date: datetime.date | None = None
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}


# ==================== InvestPlan ====================

class InvestPlanCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    asset_id: uuid.UUID
    amount: Decimal = Field(..., max_digits=12, decimal_places=2, gt=0)
    frequency: str = "monthly"
    next_date: datetime.date | None = None
    is_active: bool = True

    @field_validator("frequency")
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        if v not in ("weekly", "biweekly", "monthly"):
            raise ValueError("frequency must be: weekly, biweekly, monthly")
        return v


class InvestPlanUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    asset_id: uuid.UUID | None = None
    amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, gt=0)
    frequency: str | None = None
    next_date: datetime.date | None = None
    is_active: bool | None = None


class InvestPlanResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    asset_id: uuid.UUID
    amount: Decimal
    frequency: str
    next_date: datetime.date
    is_active: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    model_config = {"from_attributes": True}
