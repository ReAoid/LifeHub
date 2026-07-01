"""module_finance event handlers."""

import logging

logger = logging.getLogger("lifehub.module_finance.events")


async def check_invest_plan_due(event_name: str, data: dict) -> None:
    """Placeholder for invest plan due check."""
    logger.debug("Event received: %s with data: %s", event_name, data)


def register_events(event_bus) -> None:
    """Register event subscriptions."""
    # Subscriptions will be added in Phase 3
    pass
