"""module_daily event handlers for cross-module communication."""

import logging
from datetime import date

from app.base.db.session import async_session_factory
from app.modules.module_daily.models import Task
from app.modules.module_daily.schemas import TaskCreate

logger = logging.getLogger("lifehub.module_daily.events")


async def handle_invest_plan_due(event_name: str, data: dict) -> None:
    """Handle InvestPlanDueEvent: create a task reminder when an invest plan is due.

    Expected data format:
    {
        "user_id": "uuid-string",
        "plan_id": "uuid-string",
        "plan_name": "My Investment Plan",
        "amount": 1000.00,
        "next_date": "2026-07-04"
    }
    """
    logger.info("Received InvestPlanDueEvent: %s", data)

    user_id = data.get("user_id")
    plan_name = data.get("plan_name", "Investment Plan")
    amount = data.get("amount", 0)
    next_date_str = data.get("next_date")

    if not user_id:
        logger.warning("InvestPlanDueEvent missing user_id, skipping")
        return

    import uuid

    try:
        due_date = date.fromisoformat(next_date_str) if next_date_str else date.today()
    except (ValueError, TypeError):
        due_date = date.today()

    # Create a task reminder in the database
    task_data = TaskCreate(
        title=f"[定投提醒] {plan_name} - ¥{amount}",
        description=f"您的定投计划 {plan_name} 本期金额 ¥{amount} 已到期，请确保账户余额充足。",
        priority=2,  # P1 - important
        status="todo",
        due_date=due_date,
    )

    async with async_session_factory() as db:
        try:
            task = Task(
                user_id=uuid.UUID(user_id),
                title=task_data.title,
                description=task_data.description,
                priority=task_data.priority,
                status=task_data.status,
                due_date=task_data.due_date,
            )
            db.add(task)
            await db.commit()
            logger.info("Created task from InvestPlanDueEvent: %s", task.title)
        except Exception:
            logger.exception("Failed to create task from InvestPlanDueEvent")


def register_events(event_bus) -> None:
    """Register event subscriptions."""
    event_bus.subscribe("InvestPlanDueEvent", handle_invest_plan_due)
    logger.info("Registered event subscriptions for module_daily")
