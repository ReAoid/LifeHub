"""In-memory event bus for inter-module communication (no Redis needed)."""

import asyncio
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("lifehub.event_bus")


class EventBus:
    """Lightweight in-memory publish-subscribe event bus.

    For a personal system this is sufficient. Can be swapped for Redis
    later if/when multi-process or multi-device sync is needed.
    """

    def __init__(self) -> None:
        self._handlers: dict[str, list[Callable]] = {} # 事件处理器字典，键为事件名，值为处理器列表
        self._queue: asyncio.Queue = asyncio.Queue() # 消息排队篮子
        self._listener_task: asyncio.Task | None = None # 后台监听任务
        self._running = False # 事件总线运行状态

    async def connect(self) -> None:
        """Initialize (no-op for in-memory)."""
        logger.info("EventBus: using in-memory mode")
        self._running = True

    async def disconnect(self) -> None:
        """Shutdown the listener."""
        self._running = False
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
            self._listener_task = None
        logger.info("EventBus: disconnected")

    async def publish(self, event_name: str, payload: dict | None = None) -> None:
        """Publish an event to all registered handlers."""
        if not self._running:
            logger.warning("EventBus not running, cannot publish")
            return
        await self._queue.put((event_name, payload or {}))
        logger.debug("Published event: %s", event_name)

    def subscribe(self, event_name: str, handler: Callable) -> None:
        """Register a handler for an event."""
        if event_name not in self._handlers:
            self._handlers[event_name] = []
        self._handlers[event_name].append(handler)
        logger.debug("Subscribed to event: %s", event_name)

    async def _dispatch(self, event_name: str, payload: dict) -> None:
        """Dispatch an event to matching handlers."""
        handlers = self._handlers.get(event_name, [])
        if not handlers:
            logger.debug("No handlers for event: %s", event_name)
            return
        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(event_name, payload)
                else:
                    handler(event_name, payload)
            except Exception:
                logger.exception("Handler error for event %s", event_name)

    async def _listen(self) -> None:
        """Background task that consumes events from the queue."""
        logger.info("EventBus listener started")
        try:
            while self._running:
                try:
                    event_name, payload = await asyncio.wait_for(
                        self._queue.get(), timeout=1.0
                    )
                    await self._dispatch(event_name, payload)
                    self._queue.task_done()
                except asyncio.TimeoutError:
                    continue
        except asyncio.CancelledError:
            logger.info("EventBus listener cancelled")
        except Exception:
            logger.exception("EventBus listener error")

    async def start_listener(self) -> None:
        """Start the background listener task."""
        if self._listener_task is None or self._listener_task.done():
            self._listener_task = asyncio.create_task(self._listen())


# Singleton instance
event_bus = EventBus()
