"""module_finance API routes: accounts, bills, assets, budgets, invest plans."""

import datetime
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.deps import get_current_user
from app.common.response import success_response
from app.base.db.session import get_db
from app.base.models.user import User
from app.modules.module_finance.calculator import (
    calculate_monthly_summary,
    calculate_net_worth,
)
from app.modules.module_finance.schemas import (
    AccountCreate,
    AccountResponse,
    AccountUpdate,
    AssetCreate,
    AssetResponse,
    AssetUpdate,
    BillCreate,
    BillResponse,
    BillUpdate,
    BudgetCreate,
    BudgetResponse,
    BudgetUpdate,
    InvestPlanCreate,
    InvestPlanResponse,
    InvestPlanUpdate,
)
from app.modules.module_finance.services import (
    account_service,
    asset_service,
    bill_service,
    budget_service,
    invest_plan_service,
)

router = APIRouter(tags=["Finance"])


# ==================== Accounts ====================

@router.get("/accounts", response_model=dict)
async def list_accounts(
    is_active: bool | None = Query(None, alias="isActive"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all accounts."""
    accounts = await account_service.list_accounts(db, current_user.id, is_active)
    return success_response(
        data=[AccountResponse.model_validate(a).model_dump(mode="json") for a in accounts]
    )


@router.get("/accounts/{account_id}", response_model=dict)
async def get_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single account by ID."""
    account = await account_service.get_account(db, current_user.id, account_id)
    return success_response(
        data=AccountResponse.model_validate(account).model_dump(mode="json")
    )


@router.post("/accounts", response_model=dict, status_code=201)
async def create_account(
    data: AccountCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new account."""
    account = await account_service.create_account(db, current_user.id, data)
    return success_response(
        data=AccountResponse.model_validate(account).model_dump(mode="json"),
        message="Account created",
    )


@router.put("/accounts/{account_id}", response_model=dict)
async def update_account(
    account_id: uuid.UUID,
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing account."""
    account = await account_service.update_account(db, current_user.id, account_id, data)
    return success_response(
        data=AccountResponse.model_validate(account).model_dump(mode="json"),
        message="Account updated",
    )


@router.delete("/accounts/{account_id}", response_model=dict)
async def delete_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an account (and its bills)."""
    await account_service.delete_account(db, current_user.id, account_id)
    return success_response(message="Account deleted")


@router.put("/accounts/{account_id}/balance", response_model=dict)
async def adjust_balance(
    account_id: uuid.UUID,
    amount: float = Query(..., description="Delta amount (positive or negative)"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Manually adjust account balance by a delta amount."""
    from decimal import Decimal
    account = await account_service.adjust_balance(
        db, current_user.id, account_id, Decimal(str(amount))
    )
    return success_response(
        data=AccountResponse.model_validate(account).model_dump(mode="json"),
        message="Balance adjusted",
    )


# ==================== Bills ====================
# NOTE: Static routes must be defined BEFORE parameterized routes (e.g., /bills/categories before /bills/{bill_id})
# to prevent FastAPI from trying to parse "categories" as a UUID and returning 422.

@router.get("/bills", response_model=dict)
async def list_bills(
    account_id: uuid.UUID | None = Query(None, alias="accountId"),
    bill_type: str | None = Query(None, alias="billType"),
    category: str | None = None,
    date_from: datetime.date | None = Query(None, alias="dateFrom"),
    date_to: datetime.date | None = Query(None, alias="dateTo"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List bills with optional filters."""
    bills = await bill_service.list_bills(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
        bill_type=bill_type,
        category=category,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    total = await bill_service.count_bills(
        db=db,
        user_id=current_user.id,
        account_id=account_id,
        bill_type=bill_type,
        category=category,
        date_from=date_from,
        date_to=date_to,
    )
    return success_response(
        data={
            "items": [BillResponse.model_validate(b).model_dump(mode="json") for b in bills],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    )


@router.get("/bills/categories", response_model=dict)
async def get_bill_categories(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all distinct bill categories for the current user."""
    categories = await bill_service.get_categories(db, current_user.id)
    return success_response(data=categories)


@router.get("/bills/summary", response_model=dict)
async def get_bill_summary(
    date_from: datetime.date = Query(..., alias="dateFrom"),
    date_to: datetime.date = Query(..., alias="dateTo"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get income/expense summary for a date range."""
    summary = await bill_service.get_summary(db, current_user.id, date_from, date_to)
    return success_response(data=summary)


@router.get("/bills/{bill_id}", response_model=dict)
async def get_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single bill by ID."""
    bill = await bill_service.get_bill(db, current_user.id, bill_id)
    return success_response(
        data=BillResponse.model_validate(bill).model_dump(mode="json")
    )


@router.post("/bills", response_model=dict, status_code=201)
async def create_bill(
    data: BillCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new bill (updates account balance automatically)."""
    bill = await bill_service.create_bill(db, current_user.id, data)
    return success_response(
        data=BillResponse.model_validate(bill).model_dump(mode="json"),
        message="Bill created",
    )


@router.put("/bills/{bill_id}", response_model=dict)
async def update_bill(
    bill_id: uuid.UUID,
    data: BillUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing bill (adjusts balances accordingly)."""
    bill = await bill_service.update_bill(db, current_user.id, bill_id, data)
    return success_response(
        data=BillResponse.model_validate(bill).model_dump(mode="json"),
        message="Bill updated",
    )


@router.delete("/bills/{bill_id}", response_model=dict)
async def delete_bill(
    bill_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a bill (reverses its balance effect)."""
    await bill_service.delete_bill(db, current_user.id, bill_id)
    return success_response(message="Bill deleted")


# ==================== Budgets ====================
# NOTE: Static routes (/budgets/monthly-overview) must be BEFORE /budgets/{budget_id}

@router.get("/budgets", response_model=dict)
async def list_budgets(
    period: str | None = None,
    year: int | None = None,
    month: int | None = None,
    with_spending: bool = Query(False, alias="withSpending"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List budgets with optional spending analytics."""
    if with_spending:
        budgets = await budget_service.list_budgets_with_spending(
            db, current_user.id, period, year, month
        )
    else:
        budgets = await budget_service.list_budgets(db, current_user.id, period, year, month)
        budgets = [BudgetResponse.model_validate(b).model_dump(mode="json") for b in budgets]
    return success_response(data=budgets)


@router.get("/budgets/monthly-overview", response_model=dict)
async def get_monthly_overview(
    year: int = Query(..., ge=2020, le=2100),
    month: int = Query(..., ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete monthly budget overview with spending breakdown."""
    overview = await budget_service.get_monthly_overview(
        db, current_user.id, year, month
    )
    return success_response(data=overview)


@router.get("/budgets/{budget_id}", response_model=dict)
async def get_budget(
    budget_id: uuid.UUID,
    with_spending: bool = Query(False, alias="withSpending"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single budget by ID."""
    if with_spending:
        budget = await budget_service.get_budget_with_spending(
            db, current_user.id, budget_id
        )
    else:
        b = await budget_service.get_budget(db, current_user.id, budget_id)
        budget = BudgetResponse.model_validate(b).model_dump(mode="json")
    return success_response(data=budget)


@router.post("/budgets", response_model=dict, status_code=201)
async def create_budget(
    data: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new budget."""
    budget = await budget_service.create_budget(db, current_user.id, data)
    return success_response(
        data=BudgetResponse.model_validate(budget).model_dump(mode="json"),
        message="Budget created",
    )


@router.put("/budgets/{budget_id}", response_model=dict)
async def update_budget(
    budget_id: uuid.UUID,
    data: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing budget."""
    budget = await budget_service.update_budget(db, current_user.id, budget_id, data)
    return success_response(
        data=BudgetResponse.model_validate(budget).model_dump(mode="json"),
        message="Budget updated",
    )


@router.delete("/budgets/{budget_id}", response_model=dict)
async def delete_budget(
    budget_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a budget."""
    await budget_service.delete_budget(db, current_user.id, budget_id)
    return success_response(message="Budget deleted")


# ==================== Assets ====================
# NOTE: Static routes (/assets/portfolio/summary) must be BEFORE /assets/{asset_id}

@router.get("/assets", response_model=dict)
async def list_assets(
    asset_type: str | None = Query(None, alias="assetType"),
    with_profit: bool = Query(False, alias="withProfit"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List assets with optional profit/loss info."""
    if with_profit:
        assets = await asset_service.list_assets_with_profit(
            db, current_user.id, asset_type
        )
    else:
        assets = await asset_service.list_assets(db, current_user.id, asset_type)
        assets = [AssetResponse.model_validate(a).model_dump(mode="json") for a in assets]
    return success_response(data=assets)


@router.get("/assets/portfolio/summary", response_model=dict)
async def get_portfolio_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get complete portfolio summary with allocation and profit/loss."""
    summary = await asset_service.get_portfolio_summary(db, current_user.id)
    return success_response(data=summary)


@router.get("/assets/{asset_id}", response_model=dict)
async def get_asset(
    asset_id: uuid.UUID,
    with_profit: bool = Query(False, alias="withProfit"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single asset by ID."""
    if with_profit:
        asset = await asset_service.get_asset_with_profit(db, current_user.id, asset_id)
    else:
        a = await asset_service.get_asset(db, current_user.id, asset_id)
        asset = AssetResponse.model_validate(a).model_dump(mode="json")
    return success_response(data=asset)


@router.post("/assets", response_model=dict, status_code=201)
async def create_asset(
    data: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new asset position."""
    asset = await asset_service.create_asset(db, current_user.id, data)
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(mode="json"),
        message="Asset created",
    )


@router.put("/assets/{asset_id}", response_model=dict)
async def update_asset(
    asset_id: uuid.UUID,
    data: AssetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing asset."""
    asset = await asset_service.update_asset(db, current_user.id, asset_id, data)
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(mode="json"),
        message="Asset updated",
    )


@router.delete("/assets/{asset_id}", response_model=dict)
async def delete_asset(
    asset_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an asset (and its invest plans)."""
    await asset_service.delete_asset(db, current_user.id, asset_id)
    return success_response(message="Asset deleted")


@router.put("/assets/{asset_id}/price", response_model=dict)
async def update_asset_price(
    asset_id: uuid.UUID,
    current_price: float = Query(..., alias="currentPrice"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current price for an asset."""
    from decimal import Decimal
    asset = await asset_service.update_price(
        db, current_user.id, asset_id, Decimal(str(current_price))
    )
    return success_response(
        data=AssetResponse.model_validate(asset).model_dump(mode="json"),
        message="Price updated",
    )


# ==================== Invest Plans ====================
# NOTE: Static routes (/invest-plans/check-due) must be BEFORE /invest-plans/{plan_id}

@router.get("/invest-plans", response_model=dict)
async def list_invest_plans(
    is_active: bool | None = Query(None, alias="isActive"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List invest plans."""
    plans = await invest_plan_service.list_plans(db, current_user.id, is_active)
    return success_response(
        data=[InvestPlanResponse.model_validate(p).model_dump(mode="json") for p in plans]
    )


@router.post("/invest-plans/check-due", response_model=dict)
async def check_due_plans(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check for due invest plans and publish events for them."""
    triggered = await invest_plan_service.check_due_plans(db, current_user.id)
    return success_response(
        data=triggered,
        message=f"Checked due plans: {len(triggered)} triggered",
    )


@router.get("/invest-plans/{plan_id}", response_model=dict)
async def get_invest_plan(
    plan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a single invest plan by ID."""
    plan = await invest_plan_service.get_plan(db, current_user.id, plan_id)
    return success_response(
        data=InvestPlanResponse.model_validate(plan).model_dump(mode="json")
    )


@router.post("/invest-plans", response_model=dict, status_code=201)
async def create_invest_plan(
    data: InvestPlanCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new invest plan."""
    plan = await invest_plan_service.create_plan(db, current_user.id, data)
    return success_response(
        data=InvestPlanResponse.model_validate(plan).model_dump(mode="json"),
        message="Invest plan created",
    )


@router.put("/invest-plans/{plan_id}", response_model=dict)
async def update_invest_plan(
    plan_id: uuid.UUID,
    data: InvestPlanUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update an existing invest plan."""
    plan = await invest_plan_service.update_plan(db, current_user.id, plan_id, data)
    return success_response(
        data=InvestPlanResponse.model_validate(plan).model_dump(mode="json"),
        message="Invest plan updated",
    )


@router.delete("/invest-plans/{plan_id}", response_model=dict)
async def delete_invest_plan(
    plan_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete an invest plan."""
    await invest_plan_service.delete_plan(db, current_user.id, plan_id)
    return success_response(message="Invest plan deleted")


# ==================== Dashboard / Overview ====================

@router.get("/overview", response_model=dict)
async def get_finance_overview(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get finance overview: net worth, month summary, portfolio summary."""
    # Accounts
    accounts = await account_service.list_accounts(db, current_user.id)
    account_dicts = [
        {
            "account_type": a.account_type,
            "balance": float(a.balance),
            "name": a.name,
        }
        for a in accounts
    ]
    net_worth = calculate_net_worth(account_dicts)

    # Current month bills summary
    today = datetime.date.today()
    month_start = today.replace(day=1)
    if today.month == 12:
        month_end = today.replace(year=today.year + 1, month=1, day=1) - datetime.timedelta(days=1)
    else:
        month_end = today.replace(month=today.month + 1, day=1) - datetime.timedelta(days=1)

    bills = await bill_service.list_bills(
        db=db,
        user_id=current_user.id,
        date_from=month_start,
        date_to=month_end,
        limit=500,
    )
    bill_dicts = [
        {"bill_type": b.bill_type, "amount": float(b.amount)}
        for b in bills
    ]
    monthly_summary = calculate_monthly_summary(bill_dicts)

    # Portfolio summary
    portfolio = await asset_service.get_portfolio_summary(db, current_user.id)

    return success_response(
        data={
            "net_worth": net_worth,
            "monthly_summary": monthly_summary,
            "portfolio_summary": {
                "total_value": portfolio["total_value"],
                "total_profit": portfolio["total_profit"],
                "total_profit_percentage": portfolio["total_profit_percentage"],
            },
            "accounts": [
                {
                    "id": str(a.id),
                    "name": a.name,
                    "account_type": a.account_type,
                    "balance": float(a.balance),
                    "currency": a.currency,
                    "color": a.color,
                    "icon": a.icon,
                }
                for a in accounts
            ],
        }
    )
