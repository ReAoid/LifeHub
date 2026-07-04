"""Dashboard API route — aggregates overview data from all modules."""

import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.base.db.session import get_db
from app.base.models.user import User
from app.common.deps import get_current_user
from app.common.response import success_response

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Aggregate dashboard overview:
      - today_tasks    (from module_daily)
      - active_habits  (from module_daily)
      - monthly_expenses (from module_finance)
      - total_assets   (from module_finance)
    """
    today_tasks = 0
    active_habits = 0
    monthly_expenses = 0.0
    total_assets = 0.0

    # --- Try to load finance data ---
    try:
        from app.modules.module_finance.services import account_service, bill_service

        # Total assets = sum of all account balances
        accounts = await account_service.list_accounts(db, current_user.id)
        for acct in accounts:
            total_assets += float(acct.balance)

        # Monthly expenses = sum of expense bills this month
        today = datetime.date.today()
        month_start = today.replace(day=1)
        if today.month == 12:
            month_end = today.replace(year=today.year + 1, month=1, day=1) - datetime.timedelta(days=1)
        else:
            month_end = today.replace(month=today.month + 1, day=1) - datetime.timedelta(days=1)

        bills = await bill_service.list_bills(
            db=db,
            user_id=current_user.id,
            bill_type="expense",
            date_from=month_start,
            date_to=month_end,
            limit=500,
        )
        monthly_expenses = sum(float(b.amount) for b in bills)
    except Exception:
        # Module not loaded or tables missing – use defaults
        pass

    # --- Try to load daily module data ---
    try:
        from app.modules.module_daily.services import task_service, habit_service

        today = datetime.date.today()
        tasks = await task_service.list_tasks(
            db=db,
            user_id=current_user.id,
            due_date=today,
        )
        today_tasks = len(tasks)

        habits = await habit_service.list_habits(db=db, user_id=current_user.id, is_active=True)
        active_habits = len(habits)
    except Exception:
        pass

    return success_response(
        data={
            "today_tasks": today_tasks,
            "active_habits": active_habits,
            "monthly_expenses": monthly_expenses,
            "total_assets": total_assets,
        }
    )
