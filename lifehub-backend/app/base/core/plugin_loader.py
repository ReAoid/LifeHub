"""Plugin loader: scan, register routes, and wire up modules."""

import importlib
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from fastapi import APIRouter, FastAPI

from app.base.core.config import settings

logger = logging.getLogger("lifehub.plugin_loader")


@dataclass
class Plugin:
    """Descriptor for a single plugin module."""

    name: str # 插件名，比如 daily / finance
    version: str = "0.1.0" # 版本号
    router_prefix: str = "" # 接口统一前缀，比如 /finance
    router_module: str = "" # 路由模块路径，比如 app.modules.finance.router
    models: list[str] = field(default_factory=list) # 模型模块路径列表，比如 ["app.modules.finance.models"]
    events_subscribe: list[str] = field(default_factory=list) # 事件订阅列表，比如 ["user_registered", "daily_completed"]
    enabled: bool = True # 是否启用


class PluginLoader:
    """Scans app/modules/ for plugins and registers them with the FastAPI app."""

    def __init__(self, app: FastAPI) -> None:
        self.app = app
        self.plugins: dict[str, Plugin] = {}
        self._router_map: dict[str, APIRouter] = {}

    def discover(self) -> None:
        """Scan all modules in app/modules/ and load enabled plugins."""
        import os

        modules_dir = os.path.join(os.path.dirname(__file__), "..", "..", "modules")
        if not os.path.isdir(modules_dir):
            logger.warning("Modules directory not found: %s", modules_dir)
            return

        for entry in sorted(os.listdir(modules_dir)):
            entry_path = os.path.join(modules_dir, entry)
            if not os.path.isdir(entry_path):
                continue
            init_file = os.path.join(entry_path, "__init__.py")
            if not os.path.isfile(init_file):
                continue

            # Determine the Python module name
            module_name = f"app.modules.{entry}"

            # Check plugin enable/disable from env
            env_key = f"PLUGIN_{entry.upper().replace('MODULE_', '')}_ENABLE"
            enabled = getattr(settings, env_key, False)
            if not enabled:
                logger.info("Plugin %s is disabled (env %s=false)", entry, env_key)
                continue

            try:
                mod = importlib.import_module(module_name)
                if not hasattr(mod, "plugin"):
                    logger.warning("Module %s has no 'plugin' attribute, skipping", module_name)
                    continue
                plugin: Plugin = mod.plugin
                plugin.enabled = True
                self.plugins[plugin.name] = plugin
                logger.info(
                    "Discovered plugin: %s v%s (prefix=%s)",
                    plugin.name,
                    plugin.version,
                    plugin.router_prefix,
                )
            except Exception:
                logger.exception("Failed to load plugin %s", module_name)

    def register_routes(self) -> None:
        """Import each plugin's router module and mount its routes."""
        for name, plugin in self.plugins.items():
            if not plugin.enabled or not plugin.router_module:
                continue
            try:
                router_mod = importlib.import_module(plugin.router_module)
                if not hasattr(router_mod, "router"):
                    logger.warning("Plugin %s router module has no 'router'", name)
                    continue
                router: APIRouter = router_mod.router
                self.app.include_router(router, prefix=plugin.router_prefix)
                self._router_map[name] = router
                logger.info(
                    "Registered routes for %s at %s",
                    name,
                    plugin.router_prefix,
                )
            except Exception:
                logger.exception("Failed to register routes for plugin %s", name)

    def register_models(self) -> None:
        """Import each plugin's model modules to ensure SQLAlchemy registers them."""
        for name, plugin in self.plugins.items():
            if not plugin.enabled:
                continue
            for model_path in plugin.models:
                try:
                    importlib.import_module(model_path)
                    logger.debug("Loaded models for %s from %s", name, model_path)
                except Exception:
                    logger.exception("Failed to load models for %s from %s", name, model_path)

    def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions for each plugin."""
        for name, plugin in self.plugins.items():
            if not plugin.enabled:
                continue
            # Try to import the plugin's events module
            try:
                events_module = importlib.import_module(f"app.modules.{plugin.name}.events")
                if hasattr(events_module, "register_events"):
                    events_module.register_events(event_bus)
                    logger.info("Registered events for plugin %s", name)
            except ModuleNotFoundError:
                logger.debug("No events module for plugin %s", name)
            except Exception:
                logger.exception("Failed to register events for plugin %s", name)

    def load_all(self, event_bus: Any | None = None) -> None:
        """Run the full plugin loading pipeline."""
        self.discover()
        self.register_models()
        self.register_routes()
        if event_bus:
            self.subscribe_events(event_bus)
        logger.info("Plugin loading complete. Enabled: %s", list(self.plugins.keys()))
