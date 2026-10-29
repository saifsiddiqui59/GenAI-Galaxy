"""Mandatory, database-atomic pay-per-use budget for direct Function evaluation.

This protects Azure OpenAI spend without a continuously running APIM instance.
The Supabase RPC is owned by Galaxy, verifies auth.uid() and enforces both
per-user and global UTC-day caps in one database transaction.
"""
import os

GALAXY_SUPABASE_URL = "https://vfoghlhtnifpnbevgufa.supabase.co"
DIRECT = "direct-consumption"
GATEWAY = "managed-gateway"


class QuotaExceeded(RuntimeError):
    """A genuine authenticated user has exhausted the bounded daily quota."""


class QuotaUnavailable(RuntimeError):
    """Cannot prove the quota was reserved, so no paid model call is permitted."""

class ProRequired(RuntimeError):
    """The verified Galaxy subscriber does not hold an active PRO plan."""


def enforce_pro_access(*, token, base, public_key, request_json):
    """Fail closed before billable requests; never trust user-supplied plan fields.

    Launch gate must be explicitly activated on backend AND in the Galaxy-owned
    quota RPC. A browser badge alone never permits metered consumption.
    """
    if os.environ.get("GALAXY_PAID_FEATURES_ENABLED") != "active":
        raise QuotaUnavailable("PRO metered features are currently disabled")
    if base != GALAXY_SUPABASE_URL or not token or not public_key:
        raise QuotaUnavailable("Galaxy plan cannot be verified")
    try:
        plan = request_json(
            base + "/rest/v1/rpc/genai_study_my_subscription",
            method="POST", payload={}, token=token,
            extra_headers={"apikey": public_key},
            limit=300, timeout=12)
    except Exception as exc:
        raise QuotaUnavailable("Galaxy plan service unavailable") from exc
    if not isinstance(plan, dict):
        raise QuotaUnavailable("Galaxy plan response is unverified")
    if (plan.get("plan_code") != "PRO"
        or plan.get("status") not in ("ACTIVE", "TRIALING")
        or plan.get("allowed") is not True
        or type(plan.get("daily_eval_limit")) is not int
        or not 1 <= plan["daily_eval_limit"] <= 20):
        raise ProRequired("Active PRO subscription required")


def backend_profile():
    value = os.environ.get("GALAXY_BACKEND_PROFILE", "")
    if value not in (DIRECT, GATEWAY):
        raise QuotaUnavailable("A secure backend profile is required")
    return value


def enforce_eval_quota(*, token, base, public_key, request_json):
    if base != GALAXY_SUPABASE_URL:
        raise QuotaUnavailable("Quota backend cannot use another Supabase project")
    if not isinstance(token, str) or not token or not isinstance(public_key, str) or not public_key:
        raise QuotaUnavailable("Cannot reserve quota without authenticated credentials")
    # A user JWT is required: never replace it with service_role for a quota call.
    # The SQL function validates auth.uid() and contains no caller-supplied limit.
    try:
        result = request_json(
            base + "/rest/v1/rpc/genai_study_reserve_evaluation",
            method="POST", payload={}, token=token,
            extra_headers={"apikey": public_key},
            limit=80, timeout=12)
    except Exception as exc:
        raise QuotaUnavailable("Database quota check unavailable") from exc
    if result is True:
        return
    if result is False:
        raise QuotaExceeded("Daily evaluation request limit reached")
    raise QuotaUnavailable("Unexpected database quota response")
