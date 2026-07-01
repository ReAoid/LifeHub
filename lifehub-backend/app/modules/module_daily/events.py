"""module_daily event handlers."""

import logging

logger = logging.getLogger("lifehub.module_daily.events")


async def handle_invest_plan_due(event_name: str, data: dict) -> None:
    """Handle InvestPlanDueEvent: create a task reminder."""
    logger.info("Received InvestPlanDueEvent: %s", data)
    # TODO: Create a task for the user when an invest plan is due


def register_events(event_bus) -> None:
    """Register event subscriptions."""
    event_bus.subscribe("InvestPlanDueEvent", handle_invest_plan_due)
