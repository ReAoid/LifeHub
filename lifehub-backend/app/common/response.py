"""Unified API response format."""

from typing import Any

from fastapi.responses import JSONResponse


def success_response(data: Any = None, message: str = "success") -> JSONResponse:
    """Return a successful API response with standard format.

    Automatically converts Pydantic models and lists of models to dicts.
    """
    return JSONResponse(
        content={
            "code": 0,
            "message": message,
            "data": _serialize(data),
        }
    )


def error_response(code: int, message: str, data: Any = None, status_code: int = 400) -> JSONResponse:
    """Return an error API response with standard format."""
    return JSONResponse(
        status_code=status_code,
        content={
            "code": code,
            "message": message,
            "data": _serialize(data),
        },
    )


def _serialize(obj: Any) -> Any:
    """Recursively convert Pydantic models to dicts for JSON serialization."""
    if obj is None:
        return None
    if hasattr(obj, "model_dump"):
        return obj.model_dump(mode="json")
    if isinstance(obj, (list, tuple)):
        return [_serialize(item) for item in obj]
    if isinstance(obj, dict):
        return {k: _serialize(v) for k, v in obj.items()}
    return obj
