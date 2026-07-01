"""module_daily plugin registration entry point."""

from app.base.core.plugin_loader import Plugin

plugin = Plugin(
    name="module_daily",
    version="0.1.0",
    router_prefix="/api/daily",
    router_module="app.modules.module_daily.api",
    models=["app.modules.module_daily.models"],
    events_subscribe=["InvestPlanDueEvent"],
)
