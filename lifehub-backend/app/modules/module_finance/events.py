"""module_finance event handlers."""

import logging

logger = logging.getLogger("lifehub.module_finance.events")


async def handle_asset_price_update(event_name: str, data: dict) -> None:
    """Handle asset price update events (for future external data source integration).

    Expected data format:
    {
        "asset_id": "uuid-string",
        "current_price": 123.45,
        "source": "manual/api"
    }
    """
    logger.debug("AssetPriceUpdate event received: %s", data)
    # Future: update asset price in database
    # Current implementation: price updates go through the API directly


def register_events(event_bus) -> None:
    """Register event subscriptions."""
    event_bus.subscribe("AssetPriceUpdate", handle_asset_price_update)
    logger.info("Registered event subscriptions for module_finance")
