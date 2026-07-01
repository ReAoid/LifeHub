"""Global exception handlers."""

import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse

from app.common.response import error_response

logger = logging.getLogger("lifehub.exceptions")


def register_exception_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        logger.warning("HTTP %d: %s", exc.status_code, exc.detail)
        return error_response(
            code=exc.status_code * 100,
            message=exc.detail,
            status_code=exc.status_code,
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception: %s", exc)
        return error_response(
            code=50000,
            message="Internal server error",
            status_code=500,
        )
