"""module_finance calculator: profit/loss, allocation ratios, budget analytics."""

from decimal import Decimal
from typing import Any


def calculate_asset_profit(
    hold_amount: Decimal,
    cost_price: Decimal,
    current_price: Decimal,
) -> dict[str, Any]:
    """Calculate profit/loss for a single asset position.

    Returns:
        cost_value: Total cost (hold_amount * cost_price)
        current_value: Current total value (hold_amount * current_price)
        profit: Absolute profit (current_value - cost_value)
        profit_percentage: Percentage return relative to cost
    """
    cost_value = hold_amount * cost_price
    current_value = hold_amount * current_price
    profit = current_value - cost_value

    if cost_price > 0:
        profit_percentage = float(
            ((current_price - cost_price) / cost_price * 100).quantize(Decimal("0.01"))
        )
    else:
        profit_percentage = 0.0

    return {
        "cost_value": cost_value.quantize(Decimal("0.01")),
        "current_value": current_value.quantize(Decimal("0.01")),
        "profit": profit.quantize(Decimal("0.01")),
        "profit_percentage": profit_percentage,
    }


def calculate_allocation(assets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Calculate asset allocation ratios based on current market value.

    Each dict in `assets` must have keys: id, name, asset_type, hold_amount, current_price.
    Returns the same list with an added `current_value` and `allocation_percentage`.
    """
    total_value = Decimal("0")
    enriched = []

    for asset in assets:
        hold_amount = Decimal(str(asset.get("hold_amount", 0)))
        current_price = Decimal(str(asset.get("current_price", 0)))
        current_value = hold_amount * current_price
        enriched.append({
            **asset,
            "current_value": current_value.quantize(Decimal("0.01")),
        })
        total_value += current_value

    if total_value > 0:
        for item in enriched:
            item["allocation_percentage"] = float(
                (item["current_value"] / total_value * 100).quantize(Decimal("0.01"))
            )
    else:
        for item in enriched:
            item["allocation_percentage"] = 0.0

    return enriched


def calculate_budget_spending(
    budget_amount: Decimal,
    actual_spending: Decimal,
) -> dict[str, Any]:
    """Calculate budget spending analytics.

    Returns:
        spent: Actual spending amount
        remaining: Remaining budget (budget - spent, or 0 if over)
        percentage: Percentage of budget used
        is_over_budget: Whether spending exceeds budget
    """
    if budget_amount <= 0:
        return {
            "spent": float(actual_spending),
            "remaining": 0.0,
            "percentage": 100.0 if actual_spending > 0 else 0.0,
            "is_over_budget": actual_spending > 0,
        }

    percentage = float((actual_spending / budget_amount * 100).quantize(Decimal("0.1")))
    remaining = max(budget_amount - actual_spending, Decimal("0")).quantize(Decimal("0.01"))

    return {
        "spent": float(actual_spending.quantize(Decimal("0.01"))),
        "remaining": float(remaining),
        "percentage": min(percentage, 100.0),
        "is_over_budget": actual_spending > budget_amount,
    }


def calculate_net_worth(accounts: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate total net worth from all accounts.

    Each dict must have keys: account_type, balance.
    Returns total, assets (positive balance accounts), liabilities (credit).
    """
    total = Decimal("0")
    assets = Decimal("0")
    liabilities = Decimal("0")

    for account in accounts:
        balance = Decimal(str(account.get("balance", 0)))
        total += balance
        if account.get("account_type") == "credit":
            liabilities += abs(balance)
        else:
            assets += balance

    return {
        "total": float(total.quantize(Decimal("0.01"))),
        "assets": float(assets.quantize(Decimal("0.01"))),
        "liabilities": float(liabilities.quantize(Decimal("0.01"))),
    }


def calculate_monthly_summary(bills: list[dict[str, Any]]) -> dict[str, Any]:
    """Calculate monthly income/expense summary from a list of bills.

    Each dict must have keys: bill_type, amount.
    """
    income = Decimal("0")
    expense = Decimal("0")

    for bill in bills:
        amount = Decimal(str(bill.get("amount", 0)))
        bill_type = bill.get("bill_type", "")
        if bill_type == "income":
            income += amount
        elif bill_type == "expense":
            expense += amount

    return {
        "income": float(income.quantize(Decimal("0.01"))),
        "expense": float(expense.quantize(Decimal("0.01"))),
        "net": float((income - expense).quantize(Decimal("0.01"))),
    }
