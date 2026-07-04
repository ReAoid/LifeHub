"""module_finance business logic services: Account, Bill, Budget, Asset, InvestPlan."""

import datetime
import logging
import uuid
from decimal import Decimal
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.core.event_bus import event_bus
from app.modules.module_finance.calculator import (
    calculate_asset_profit,
    calculate_budget_spending,
)
from app.modules.module_finance.models import Account, Asset, Bill, Budget, InvestPlan
from app.modules.module_finance.schemas import (
    AccountCreate,
    AccountUpdate,
    AssetCreate,
    AssetUpdate,
    BillCreate,
    BillUpdate,
    BudgetCreate,
    BudgetUpdate,
    InvestPlanCreate,
    InvestPlanUpdate,
)

logger = logging.getLogger("lifehub.module_finance.services")


# ==================== Account Service ====================

class AccountService:
    """Account CRUD and balance management."""

    async def list_accounts(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        is_active: bool | None = None,
    ) -> list[Account]:
        """List accounts with optional active filter."""
        stmt = select(Account).where(Account.user_id == user_id)
        if is_active is not None:
            stmt = stmt.where(Account.is_active == is_active)
        stmt = stmt.order_by(Account.created_at.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_account(
        self, db: AsyncSession, user_id: uuid.UUID, account_id: uuid.UUID
    ) -> Account:
        """Get a single account by ID."""
        stmt = select(Account).where(
            Account.id == account_id, Account.user_id == user_id
        )
        result = await db.execute(stmt)
        account = result.scalar_one_or_none()
        if not account:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Account not found"
            )
        return account

    async def create_account(
        self, db: AsyncSession, user_id: uuid.UUID, data: AccountCreate
    ) -> Account:
        """Create a new account."""
        account = Account(
            user_id=user_id,
            name=data.name,
            account_type=data.account_type,
            currency=data.currency,
            balance=data.balance,
            icon=data.icon,
            color=data.color,
            is_active=data.is_active,
        )
        db.add(account)
        await db.flush()
        await db.refresh(account)
        logger.info("Account created: %s (%s)", account.name, account.id)
        return account

    async def update_account(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        data: AccountUpdate,
    ) -> Account:
        """Update an existing account."""
        account = await self.get_account(db, user_id, account_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return account

        for key, value in update_dict.items():
            setattr(account, key, value)

        await db.flush()
        await db.refresh(account)
        logger.info("Account updated: %s (%s)", account.name, account.id)
        return account

    async def delete_account(
        self, db: AsyncSession, user_id: uuid.UUID, account_id: uuid.UUID
    ) -> None:
        """Delete an account."""
        account = await self.get_account(db, user_id, account_id)
        await db.delete(account)
        await db.flush()
        logger.info("Account deleted: %s (%s)", account.name, account_id)

    async def adjust_balance(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID,
        amount: Decimal,
    ) -> Account:
        """Adjust account balance by a delta amount (positive or negative)."""
        account = await self.get_account(db, user_id, account_id)
        account.balance += amount
        await db.flush()
        await db.refresh(account)
        return account


# ==================== Bill Service ====================

class BillService:
    """Bill CRUD, categorization, and transaction history."""

    async def list_bills(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID | None = None,
        bill_type: str | None = None,
        category: str | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[Bill]:
        """List bills with optional filters, ordered by date descending."""
        stmt = select(Bill).where(Bill.user_id == user_id)

        if account_id:
            stmt = stmt.where(Bill.account_id == account_id)
        if bill_type:
            stmt = stmt.where(Bill.bill_type == bill_type)
        if category:
            stmt = stmt.where(Bill.category == category)
        if date_from:
            stmt = stmt.where(Bill.bill_date >= date_from)
        if date_to:
            stmt = stmt.where(Bill.bill_date <= date_to)

        stmt = stmt.order_by(Bill.bill_date.desc(), Bill.created_at.desc())
        stmt = stmt.limit(limit).offset(offset)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def count_bills(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        account_id: uuid.UUID | None = None,
        bill_type: str | None = None,
        category: str | None = None,
        date_from: datetime.date | None = None,
        date_to: datetime.date | None = None,
    ) -> int:
        """Count bills matching filters."""
        stmt = select(func.count(Bill.id)).where(Bill.user_id == user_id)

        if account_id:
            stmt = stmt.where(Bill.account_id == account_id)
        if bill_type:
            stmt = stmt.where(Bill.bill_type == bill_type)
        if category:
            stmt = stmt.where(Bill.category == category)
        if date_from:
            stmt = stmt.where(Bill.bill_date >= date_from)
        if date_to:
            stmt = stmt.where(Bill.bill_date <= date_to)

        result = await db.execute(stmt)
        return result.scalar() or 0

    async def get_bill(
        self, db: AsyncSession, user_id: uuid.UUID, bill_id: uuid.UUID
    ) -> Bill:
        """Get a single bill by ID."""
        stmt = select(Bill).where(Bill.id == bill_id, Bill.user_id == user_id)
        result = await db.execute(stmt)
        bill = result.scalar_one_or_none()
        if not bill:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found"
            )
        return bill

    async def create_bill(
        self, db: AsyncSession, user_id: uuid.UUID, data: BillCreate
    ) -> Bill:
        """Create a new bill and update account balance accordingly."""
        # Verify account exists and belongs to user
        account = await account_service.get_account(db, user_id, data.account_id)

        bill = Bill(
            user_id=user_id,
            account_id=data.account_id,
            bill_type=data.bill_type,
            amount=data.amount,
            category=data.category,
            description=data.description,
            bill_date=data.bill_date or datetime.date.today(),
            to_account_id=data.to_account_id,
        )
        db.add(bill)

        # Update account balance
        if data.bill_type == "income":
            account.balance += data.amount
        elif data.bill_type == "expense":
            account.balance -= data.amount
        elif data.bill_type == "transfer":
            account.balance -= data.amount
            # Update target account balance
            if data.to_account_id:
                target_account = await account_service.get_account(
                    db, user_id, data.to_account_id
                )
                target_account.balance += data.amount

        await db.flush()
        await db.refresh(bill)
        logger.info(
            "Bill created: %s ¥%s (%s)", bill.bill_type, bill.amount, bill.category
        )
        return bill

    async def update_bill(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        bill_id: uuid.UUID,
        data: BillUpdate,
    ) -> Bill:
        """Update an existing bill and adjust balances accordingly."""
        bill = await self.get_bill(db, user_id, bill_id)
        old_amount = bill.amount
        old_type = bill.bill_type

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return bill

        # Reverse old balance effect
        account = await account_service.get_account(db, user_id, bill.account_id)
        if old_type == "income":
            account.balance -= old_amount
        elif old_type == "expense":
            account.balance += old_amount
        elif old_type == "transfer":
            account.balance += old_amount
            if bill.to_account_id:
                target_account = await account_service.get_account(
                    db, user_id, bill.to_account_id
                )
                target_account.balance -= old_amount

        # Apply new values
        for key, value in update_dict.items():
            setattr(bill, key, value)

        # Apply new balance effect
        new_account = await account_service.get_account(db, user_id, bill.account_id)
        if bill.bill_type == "income":
            new_account.balance += bill.amount
        elif bill.bill_type == "expense":
            new_account.balance -= bill.amount
        elif bill.bill_type == "transfer":
            new_account.balance -= bill.amount
            if bill.to_account_id:
                target_account = await account_service.get_account(
                    db, user_id, bill.to_account_id
                )
                target_account.balance += bill.amount

        await db.flush()
        await db.refresh(bill)
        logger.info("Bill updated: %s (%s)", bill.id, bill.category)
        return bill

    async def delete_bill(
        self, db: AsyncSession, user_id: uuid.UUID, bill_id: uuid.UUID
    ) -> None:
        """Delete a bill and reverse its balance effect."""
        bill = await self.get_bill(db, user_id, bill_id)

        # Reverse balance effect
        account = await account_service.get_account(db, user_id, bill.account_id)
        if bill.bill_type == "income":
            account.balance -= bill.amount
        elif bill.bill_type == "expense":
            account.balance += bill.amount
        elif bill.bill_type == "transfer":
            account.balance += bill.amount
            if bill.to_account_id:
                target_account = await account_service.get_account(
                    db, user_id, bill.to_account_id
                )
                target_account.balance -= bill.amount

        await db.delete(bill)
        await db.flush()
        logger.info("Bill deleted: %s", bill_id)

    async def get_categories(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> list[str]:
        """Get distinct bill categories for the user."""
        stmt = (
            select(Bill.category)
            .where(Bill.user_id == user_id)
            .distinct()
            .order_by(Bill.category)
        )
        result = await db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_summary(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        date_from: datetime.date,
        date_to: datetime.date,
    ) -> dict[str, Any]:
        """Get income/expense summary for a date range."""
        stmt = select(
            Bill.bill_type,
            func.coalesce(func.sum(Bill.amount), 0),
        ).where(
            Bill.user_id == user_id,
            Bill.bill_date >= date_from,
            Bill.bill_date <= date_to,
            Bill.bill_type.in_(["income", "expense"]),
        ).group_by(Bill.bill_type)

        result = await db.execute(stmt)
        rows = dict(result.all())

        income = float(rows.get("income", 0))
        expense = float(rows.get("expense", 0))

        # Category breakdown for expenses
        cat_stmt = select(
            Bill.category,
            func.coalesce(func.sum(Bill.amount), 0),
        ).where(
            Bill.user_id == user_id,
            Bill.bill_date >= date_from,
            Bill.bill_date <= date_to,
            Bill.bill_type == "expense",
        ).group_by(Bill.category).order_by(func.sum(Bill.amount).desc())

        cat_result = await db.execute(cat_stmt)
        categories = [
            {"category": row[0], "amount": float(row[1])}
            for row in cat_result.all()
        ]

        return {
            "income": income,
            "expense": expense,
            "net": income - expense,
            "categories": categories,
        }


# ==================== Budget Service ====================

class BudgetService:
    """Budget management with overspend alerts."""

    async def list_budgets(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        period: str | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> list[Budget]:
        """List budgets with optional filters."""
        stmt = select(Budget).where(Budget.user_id == user_id)
        if period:
            stmt = stmt.where(Budget.period == period)
        if year:
            stmt = stmt.where(Budget.year == year)
        if month is not None:
            stmt = stmt.where(Budget.month == month)
        stmt = stmt.order_by(Budget.category)
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_budget(
        self, db: AsyncSession, user_id: uuid.UUID, budget_id: uuid.UUID
    ) -> Budget:
        """Get a single budget by ID."""
        stmt = select(Budget).where(
            Budget.id == budget_id, Budget.user_id == user_id
        )
        result = await db.execute(stmt)
        budget = result.scalar_one_or_none()
        if not budget:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found"
            )
        return budget

    async def create_budget(
        self, db: AsyncSession, user_id: uuid.UUID, data: BudgetCreate
    ) -> Budget:
        """Create a new budget."""
        # Check for duplicate budget (same category, period, year, month)
        stmt = select(Budget).where(
            Budget.user_id == user_id,
            Budget.category == data.category,
            Budget.period == data.period,
            Budget.year == data.year,
        )
        if data.period == "monthly" and data.month is not None:
            stmt = stmt.where(Budget.month == data.month)

        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Budget for '{data.category}' in {data.year}/{data.month} already exists",
            )

        budget = Budget(
            user_id=user_id,
            category=data.category,
            amount=data.amount,
            period=data.period,
            year=data.year,
            month=data.month,
        )
        db.add(budget)
        await db.flush()
        await db.refresh(budget)
        logger.info("Budget created: %s ¥%s (%s)", budget.category, budget.amount, budget.period)
        return budget

    async def update_budget(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
        data: BudgetUpdate,
    ) -> Budget:
        """Update an existing budget."""
        budget = await self.get_budget(db, user_id, budget_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return budget

        for key, value in update_dict.items():
            setattr(budget, key, value)

        await db.flush()
        await db.refresh(budget)
        logger.info("Budget updated: %s (%s)", budget.category, budget.id)
        return budget

    async def delete_budget(
        self, db: AsyncSession, user_id: uuid.UUID, budget_id: uuid.UUID
    ) -> None:
        """Delete a budget."""
        budget = await self.get_budget(db, user_id, budget_id)
        await db.delete(budget)
        await db.flush()
        logger.info("Budget deleted: %s (%s)", budget.category, budget_id)

    async def get_budget_with_spending(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        budget_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Get a budget with actual spending and overspend check."""
        budget = await self.get_budget(db, user_id, budget_id)

        # Calculate actual spending for this budget's category and period
        if budget.period == "monthly" and budget.month:
            date_from = datetime.date(budget.year, budget.month, 1)
            if budget.month == 12:
                date_to = datetime.date(budget.year + 1, 1, 1) - datetime.timedelta(days=1)
            else:
                date_to = datetime.date(budget.year, budget.month + 1, 1) - datetime.timedelta(days=1)
        else:
            # Yearly
            date_from = datetime.date(budget.year, 1, 1)
            date_to = datetime.date(budget.year, 12, 31)

        stmt = select(
            func.coalesce(func.sum(Bill.amount), 0)
        ).where(
            Bill.user_id == user_id,
            Bill.bill_type == "expense",
            Bill.category == budget.category,
            Bill.bill_date >= date_from,
            Bill.bill_date <= date_to,
        )
        result = await db.execute(stmt)
        actual_spending = Decimal(str(result.scalar() or 0))

        analytics = calculate_budget_spending(budget.amount, actual_spending)

        return {
            "id": str(budget.id),
            "user_id": str(budget.user_id),
            "category": budget.category,
            "amount": float(budget.amount),
            "period": budget.period,
            "year": budget.year,
            "month": budget.month,
            "spent": analytics["spent"],
            "remaining": analytics["remaining"],
            "percentage": analytics["percentage"],
            "is_over_budget": analytics["is_over_budget"],
            "created_at": budget.created_at.isoformat(),
            "updated_at": budget.updated_at.isoformat(),
        }

    async def list_budgets_with_spending(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        period: str | None = None,
        year: int | None = None,
        month: int | None = None,
    ) -> list[dict[str, Any]]:
        """List all budgets with spending analytics."""
        budgets = await self.list_budgets(db, user_id, period, year, month)
        results = []
        for budget in budgets:
            result = await self.get_budget_with_spending(db, user_id, budget.id)
            results.append(result)
        return results

    async def get_monthly_overview(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        year: int,
        month: int,
    ) -> dict[str, Any]:
        """Get complete monthly budget overview with spending breakdown.

        Includes both monthly budgets (for the given month) and yearly budgets.
        Yearly budgets show the full annual amount and year-to-date cumulative
        spending, with a per-month breakdown for a 12-segment progress bar.
        """
        # 1. Monthly budgets for this specific month
        monthly_budgets = await self.list_budgets_with_spending(
            db, user_id, period="monthly", year=year, month=month
        )

        # 2. Yearly budgets for this year — show full amount + per-month breakdown
        yearly_stmt = select(Budget).where(
            Budget.user_id == user_id,
            Budget.period == "yearly",
            Budget.year == year,
        )
        yearly_result = await db.execute(yearly_stmt)
        yearly_budgets = list(yearly_result.scalars().all())

        yearly_monthly_entries: list[dict[str, Any]] = []
        for budget in yearly_budgets:
            total_amount = float(budget.amount)
            monthly_share = total_amount / 12

            # Calculate per-month spending for the full year
            monthly_spending: list[dict[str, Any]] = []
            cumulative_spent = 0.0
            for m in range(1, 13):
                m_date_from = datetime.date(year, m, 1)
                if m == 12:
                    m_date_to = datetime.date(year + 1, 1, 1) - datetime.timedelta(days=1)
                else:
                    m_date_to = datetime.date(year, m + 1, 1) - datetime.timedelta(days=1)

                stmt = select(
                    func.coalesce(func.sum(Bill.amount), 0)
                ).where(
                    Bill.user_id == user_id,
                    Bill.bill_type == "expense",
                    Bill.category == budget.category,
                    Bill.bill_date >= m_date_from,
                    Bill.bill_date <= m_date_to,
                )
                result = await db.execute(stmt)
                m_spent = float(result.scalar() or 0)
                cumulative_spent += m_spent

                monthly_spending.append({
                    "month": m,
                    "spent": m_spent,
                    "budget_share": round(monthly_share, 2),
                })

            remaining = total_amount - cumulative_spent
            pct = (cumulative_spent / total_amount * 100) if total_amount > 0 else 0

            yearly_monthly_entries.append({
                "id": str(budget.id),
                "user_id": str(budget.user_id),
                "category": budget.category,
                "amount": total_amount,
                "period": "yearly",
                "year": budget.year,
                "month": None,
                "spent": round(cumulative_spent, 2),
                "remaining": round(max(0, remaining), 2),
                "percentage": round(min(pct, 100), 2),
                "is_over_budget": remaining < 0,
                "monthly_spending": monthly_spending,
                "created_at": budget.created_at.isoformat(),
                "updated_at": budget.updated_at.isoformat(),
            })

        # 3. Combine monthly + yearly budgets
        all_budgets = monthly_budgets + yearly_monthly_entries

        total_budget = sum(b["amount"] for b in all_budgets)
        total_spent = sum(b["spent"] for b in all_budgets)

        # 4. Uncategorized spending = expenses whose category doesn't match ANY budget
        categorized_categories = list(set(b["category"] for b in all_budgets))
        if categorized_categories:
            stmt = select(
                func.coalesce(func.sum(Bill.amount), 0)
            ).where(
                Bill.user_id == user_id,
                Bill.bill_type == "expense",
                Bill.category.notin_(categorized_categories),
                func.extract("year", Bill.bill_date) == year,
                func.extract("month", Bill.bill_date) == month,
            )
        else:
            stmt = select(
                func.coalesce(func.sum(Bill.amount), 0)
            ).where(
                Bill.user_id == user_id,
                Bill.bill_type == "expense",
                func.extract("year", Bill.bill_date) == year,
                func.extract("month", Bill.bill_date) == month,
            )

        result = await db.execute(stmt)
        uncategorized_spent = float(result.scalar() or 0)

        return {
            "year": year,
            "month": month,
            "total_budget": total_budget,
            "total_spent": total_spent,
            "uncategorized_spent": uncategorized_spent,
            "budgets": all_budgets,
        }


# ==================== Asset Service ====================

class AssetService:
    """Asset CRUD with profit/loss calculation."""

    async def list_assets(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        asset_type: str | None = None,
    ) -> list[Asset]:
        """List assets with optional type filter."""
        stmt = select(Asset).where(Asset.user_id == user_id)
        if asset_type:
            stmt = stmt.where(Asset.asset_type == asset_type)
        stmt = stmt.order_by(Asset.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_asset(
        self, db: AsyncSession, user_id: uuid.UUID, asset_id: uuid.UUID
    ) -> Asset:
        """Get a single asset by ID."""
        stmt = select(Asset).where(
            Asset.id == asset_id, Asset.user_id == user_id
        )
        result = await db.execute(stmt)
        asset = result.scalar_one_or_none()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found"
            )
        return asset

    async def create_asset(
        self, db: AsyncSession, user_id: uuid.UUID, data: AssetCreate
    ) -> Asset:
        """Create a new asset position."""
        asset = Asset(
            user_id=user_id,
            name=data.name,
            asset_type=data.asset_type,
            code=data.code,
            hold_amount=data.hold_amount,
            cost_price=data.cost_price,
            current_price=data.current_price,
            currency=data.currency,
            purchase_date=data.purchase_date,
        )
        db.add(asset)
        await db.flush()
        await db.refresh(asset)
        logger.info("Asset created: %s (%s)", asset.name, asset.id)
        return asset

    async def update_asset(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        asset_id: uuid.UUID,
        data: AssetUpdate,
    ) -> Asset:
        """Update an existing asset."""
        asset = await self.get_asset(db, user_id, asset_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return asset

        for key, value in update_dict.items():
            setattr(asset, key, value)

        await db.flush()
        await db.refresh(asset)
        logger.info("Asset updated: %s (%s)", asset.name, asset.id)
        return asset

    async def delete_asset(
        self, db: AsyncSession, user_id: uuid.UUID, asset_id: uuid.UUID
    ) -> None:
        """Delete an asset."""
        asset = await self.get_asset(db, user_id, asset_id)
        await db.delete(asset)
        await db.flush()
        logger.info("Asset deleted: %s (%s)", asset.name, asset_id)

    async def update_price(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        asset_id: uuid.UUID,
        current_price: Decimal,
    ) -> Asset:
        """Update current price for an asset."""
        asset = await self.get_asset(db, user_id, asset_id)
        asset.current_price = current_price
        await db.flush()
        await db.refresh(asset)
        return asset

    async def get_asset_with_profit(
        self, db: AsyncSession, user_id: uuid.UUID, asset_id: uuid.UUID
    ) -> dict[str, Any]:
        """Get asset with profit/loss calculation."""
        asset = await self.get_asset(db, user_id, asset_id)
        profit_data = calculate_asset_profit(
            hold_amount=asset.hold_amount,
            cost_price=asset.cost_price,
            current_price=asset.current_price,
        )
        return {
            "id": str(asset.id),
            "user_id": str(asset.user_id),
            "name": asset.name,
            "asset_type": asset.asset_type,
            "code": asset.code,
            "hold_amount": float(asset.hold_amount),
            "cost_price": float(asset.cost_price),
            "current_price": float(asset.current_price),
            "currency": asset.currency,
            "cost_value": float(profit_data["cost_value"]),
            "current_value": float(profit_data["current_value"]),
            "profit": float(profit_data["profit"]),
            "profit_percentage": profit_data["profit_percentage"],
            "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
            "created_at": asset.created_at.isoformat(),
            "updated_at": asset.updated_at.isoformat(),
        }

    async def list_assets_with_profit(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        asset_type: str | None = None,
    ) -> list[dict[str, Any]]:
        """List all assets with profit/loss calculation."""
        assets = await self.list_assets(db, user_id, asset_type)
        results = []
        for asset in assets:
            result = await self.get_asset_with_profit(db, user_id, asset.id)
            results.append(result)
        return results

    async def get_portfolio_summary(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> dict[str, Any]:
        """Get portfolio summary with allocation and total profit."""
        assets = await self.list_assets_with_profit(db, user_id)

        total_cost = sum(a["cost_value"] for a in assets)
        total_value = sum(a["current_value"] for a in assets)
        total_profit = sum(a["profit"] for a in assets)

        # Calculate allocation percentages
        for asset in assets:
            if total_value > 0:
                asset["allocation_percentage"] = round(
                    asset["current_value"] / total_value * 100, 2
                )
            else:
                asset["allocation_percentage"] = 0.0

        # Group by asset type
        type_summary = {}
        for asset in assets:
            at = asset["asset_type"]
            if at not in type_summary:
                type_summary[at] = {
                    "asset_type": at,
                    "total_value": 0.0,
                    "total_cost": 0.0,
                    "profit": 0.0,
                }
            type_summary[at]["total_value"] += asset["current_value"]
            type_summary[at]["total_cost"] += asset["cost_value"]
            type_summary[at]["profit"] += asset["profit"]

        return {
            "total_cost": round(total_cost, 2),
            "total_value": round(total_value, 2),
            "total_profit": round(total_profit, 2),
            "total_profit_percentage": round(
                (total_profit / total_cost * 100) if total_cost > 0 else 0, 2
            ),
            "assets": assets,
            "type_summary": list(type_summary.values()),
        }


# ==================== InvestPlan Service ====================

class InvestPlanService:
    """InvestPlan CRUD with due event publishing."""

    async def list_plans(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        is_active: bool | None = None,
    ) -> list[InvestPlan]:
        """List invest plans with optional active filter."""
        stmt = select(InvestPlan).where(InvestPlan.user_id == user_id)
        if is_active is not None:
            stmt = stmt.where(InvestPlan.is_active == is_active)
        stmt = stmt.order_by(InvestPlan.next_date.asc())
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def get_plan(
        self, db: AsyncSession, user_id: uuid.UUID, plan_id: uuid.UUID
    ) -> InvestPlan:
        """Get a single invest plan by ID."""
        stmt = select(InvestPlan).where(
            InvestPlan.id == plan_id, InvestPlan.user_id == user_id
        )
        result = await db.execute(stmt)
        plan = result.scalar_one_or_none()
        if not plan:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Invest plan not found"
            )
        return plan

    async def create_plan(
        self, db: AsyncSession, user_id: uuid.UUID, data: InvestPlanCreate
    ) -> InvestPlan:
        """Create a new invest plan."""
        # Verify asset exists
        await asset_service.get_asset(db, user_id, data.asset_id)

        plan = InvestPlan(
            user_id=user_id,
            name=data.name,
            asset_id=data.asset_id,
            amount=data.amount,
            frequency=data.frequency,
            next_date=data.next_date or datetime.date.today(),
            is_active=data.is_active,
        )
        db.add(plan)
        await db.flush()
        await db.refresh(plan)
        logger.info("InvestPlan created: %s (%s)", plan.name, plan.id)
        return plan

    async def update_plan(
        self,
        db: AsyncSession,
        user_id: uuid.UUID,
        plan_id: uuid.UUID,
        data: InvestPlanUpdate,
    ) -> InvestPlan:
        """Update an existing invest plan."""
        plan = await self.get_plan(db, user_id, plan_id)

        if data.asset_id is not None:
            await asset_service.get_asset(db, user_id, data.asset_id)

        update_dict = data.model_dump(exclude_unset=True)
        if not update_dict:
            return plan

        for key, value in update_dict.items():
            setattr(plan, key, value)

        await db.flush()
        await db.refresh(plan)
        logger.info("InvestPlan updated: %s (%s)", plan.name, plan.id)
        return plan

    async def delete_plan(
        self, db: AsyncSession, user_id: uuid.UUID, plan_id: uuid.UUID
    ) -> None:
        """Delete an invest plan."""
        plan = await self.get_plan(db, user_id, plan_id)
        await db.delete(plan)
        await db.flush()
        logger.info("InvestPlan deleted: %s (%s)", plan.name, plan_id)

    async def check_due_plans(
        self, db: AsyncSession, user_id: uuid.UUID
    ) -> list[dict[str, Any]]:
        """Check for due invest plans and publish events for them."""
        today = datetime.date.today()
        stmt = select(InvestPlan).where(
            InvestPlan.user_id == user_id,
            InvestPlan.is_active == True,
            InvestPlan.next_date <= today,
        )
        result = await db.execute(stmt)
        due_plans = list(result.scalars().all())

        triggered = []
        for plan in due_plans:
            # Publish event
            await event_bus.publish(
                "InvestPlanDueEvent",
                {
                    "user_id": str(user_id),
                    "plan_id": str(plan.id),
                    "plan_name": plan.name,
                    "amount": float(plan.amount),
                    "next_date": plan.next_date.isoformat(),
                },
            )

            # Calculate next date based on frequency
            if plan.frequency == "weekly":
                next_date = plan.next_date + datetime.timedelta(days=7)
            elif plan.frequency == "biweekly":
                next_date = plan.next_date + datetime.timedelta(days=14)
            else:  # monthly
                month = plan.next_date.month + 1
                year = plan.next_date.year
                if month > 12:
                    month = 1
                    year += 1
                day = min(plan.next_date.day, 28)  # Safe day
                next_date = datetime.date(year, month, day)

            plan.next_date = next_date
            triggered.append({
                "plan_id": str(plan.id),
                "plan_name": plan.name,
                "amount": float(plan.amount),
                "next_date": plan.next_date.isoformat(),
            })

        if triggered:
            await db.flush()
            logger.info(
                "Triggered %d due invest plans and published events", len(triggered)
            )

        return triggered


# ==================== Singleton Instances ====================

account_service = AccountService()
bill_service = BillService()
budget_service = BudgetService()
asset_service = AssetService()
invest_plan_service = InvestPlanService()
