"""module_finance plugin registration entry point."""

from app.base.core.plugin_loader import Plugin

plugin = Plugin(
    name="module_finance",
    version="0.1.0",
    router_prefix="/api/finance",
    router_module="app.modules.module_finance.api",
    models=["app.modules.module_finance.models"],
    events_subscribe=[],
)
