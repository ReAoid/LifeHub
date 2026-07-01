"""module_finance API routes: accounts, bills, assets, budgets, invest plans."""

from fastapi import APIRouter

from app.common.response import success_response

router = APIRouter(tags=["Finance"])


@router.get("/accounts")
async def list_accounts():
    """List all accounts (placeholder)."""
    return success_response(data=[])


@router.get("/bills")
async def list_bills():
    """List all bills (placeholder)."""
    return success_response(data=[])


@router.get("/assets")
async def list_assets():
    """List all assets (placeholder)."""
    return success_response(data=[])


@router.get("/budgets")
async def list_budgets():
    """List all budgets (placeholder)."""
    return success_response(data=[])


@router.get("/invest-plans")
async def list_invest_plans():
    """List all invest plans (placeholder)."""
    return success_response(data=[])
