"""Explicit-price, per-request Azure OpenAI cost *estimate*.

Azure Cost Management actual billing is separate, can lag and may include
additional charges. This file never guesses regional prices or exchange rates.
The rates must come from a separately verified pricing contract.
"""
from __future__ import annotations

from datetime import date
from collections.abc import Mapping
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import re

ONE_MILLION = Decimal("1000000")
MAX_PRICE_PER_MILLION_INR = Decimal("1000000")
MAX_AGE_DAYS = 45
MONEY_PRECISION = Decimal("0.00000001")


def _rate(value: object) -> Decimal | None:
    if not isinstance(value, str) or not re.fullmatch(r"(?:0|[1-9]\d{0,6})(?:\.\d{1,8})?", value):
        return None
    try:
        rate = Decimal(value)
    except InvalidOperation:
        return None
    return rate if rate.is_finite() and Decimal("0") <= rate <= MAX_PRICE_PER_MILLION_INR else None


def _bounded_tokens(value: object) -> int | None:
    return value if type(value) is int and 0 <= value <= 10_000_000 else None


def estimate_model_cost(usage: object, settings: object, *, today: date | None = None) -> dict | None:
    """Price using actual reported token counts, but only when rates are pinned.

    A missing or stale rate returns None, NOT zero. Cached input rate is
    required whenever cached input is reported. The result is explicitly an
    estimate for *model tokens*, not full Azure/Foundry invoice spend.
    """
    if not isinstance(usage, dict) or not isinstance(settings, Mapping):
        return None
    input_tokens = _bounded_tokens(usage.get("input_tokens"))
    output_tokens = _bounded_tokens(usage.get("output_tokens"))
    if input_tokens is None or output_tokens is None:
        return None
    total = _bounded_tokens(usage.get("total_tokens"))
    if total is not None and total != input_tokens + output_tokens:
        return None
    cached = _bounded_tokens(usage.get("cached_input_tokens", 0))
    if cached is None or cached > input_tokens:
        return None
    source = settings.get("GALAXY_PRICE_SOURCE", "")
    if source not in ("azure-official-verified", "azure-billing-contract-verified"):
        return None
    as_of = settings.get("GALAXY_PRICE_ASOF", "")
    if not isinstance(as_of, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", as_of):
        return None
    try:
        price_date = date.fromisoformat(as_of)
    except ValueError:
        return None
    age = ((today or date.today()) - price_date).days
    if not 0 <= age <= MAX_AGE_DAYS:
        return None
    incoming = _rate(settings.get("GALAXY_INPUT_INR_PER_1M", ""))
    outgoing = _rate(settings.get("GALAXY_OUTPUT_INR_PER_1M", ""))
    cache_rate = _rate(settings.get("GALAXY_CACHED_INR_PER_1M", "")) if cached else Decimal("0")
    if any(rate is None for rate in (incoming, outgoing, cache_rate)):
        return None
    amount = (
        Decimal(input_tokens - cached) * incoming
        + Decimal(cached) * cache_rate
        + Decimal(output_tokens) * outgoing
    ) / ONE_MILLION
    if not amount.is_finite():
        return None
    return {
        "currency": "INR",
        "model_cost_estimate_inr": format(amount.quantize(MONEY_PRECISION, rounding=ROUND_HALF_UP), "f"),
        "kind": "configured_token_rate_estimate_not_azure_bill",
        "price_asof": as_of,
        "source": source,
    }
