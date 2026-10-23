"""GitHub Actions-only: temporarily create two Galaxy Auth users for real RLS tests.

Uses an admin key ONLY for Supabase Auth create/delete. Actual data isolation
checks continue to use independently signed-in user JWTs and a publishable key.
No login credentials, tokens or elevated keys are written to files or logs.
"""
import base64
import json
import os
import secrets
import signal
import sys
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from live_rls_check import CheckFailed, URL, run as run_rls, validate_publishable_key, sign_in, request, json_body

ADMIN_ENDPOINT = URL + "/auth/v1/admin/users"
TIMEOUT = 20


def validate_admin_key(value):
    if not isinstance(value, str) or not value or len(value) > 4096:
        raise CheckFailed("Missing GALAXY_SUPABASE_ADMIN_KEY GitHub dev secret")
    if value.startswith("sb_secret_"):
        return value
    if value.startswith(("sb_publishable_", "eyJ")) and value.count(".") != 2:
        raise CheckFailed("Admin key must not be a publishable key")
    if value.count(".") == 2:
        try:
            middle = value.split(".")[1]
            claims = json.loads(base64.urlsafe_b64decode(middle + "=" * (-len(middle) % 4)))
        except (ValueError, TypeError, UnicodeError) as exc:
            raise CheckFailed("Admin key is not a valid service_role JWT") from exc
        if claims.get("role") == "service_role" and claims.get("ref") == "vfoghlhtnifpnbevgufa":
            return value
    raise CheckFailed("Admin key must be a project-specific Supabase secret or service_role key")


def admin_request(method, path, secret, body=None):
    # Never use arbitrary host, project, table, or user-provided path.
    if path != "" and (not path.startswith("/") or path.count("/") != 1):
        raise CheckFailed("Invalid Auth admin path")
    if path and path[1:] != str(uuid.UUID(path[1:])):
        raise CheckFailed("Invalid Auth user UUID")
    headers = {"apikey": secret, "Content-Type": "application/json",
               "User-Agent": "GenAI-Galaxy-GitHub-Actions-test-runner"}
    if secret.count(".") == 2:
        headers["Authorization"] = "Bearer " + secret
    payload = None if body is None else json.dumps(body).encode("utf-8")
    req = Request(ADMIN_ENDPOINT + path, method=method, headers=headers, data=payload)
    try:
        with urlopen(req, timeout=TIMEOUT) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else {}
    except HTTPError as exc:
        # Do not print response or headers; Auth responses can contain personal data.
        raise CheckFailed("Supabase Auth admin " + method + " failed: HTTP " + str(exc.code)) from None
    except URLError:
        raise CheckFailed("Supabase Auth admin network connection failed") from None


def create_test_user(secret, address, password):
    code, record = admin_request("POST", "", secret, {
        "email": address, "password": password, "email_confirm": True,
        "app_metadata": {"galaxy_ephemeral_rls_test": True}
    })
    if code not in (200, 201) or not isinstance(record, dict):
        raise CheckFailed("Supabase Auth did not create the isolated test user")
    record = record.get("user", record)
    if not isinstance(record, dict) or record.get("email", "").lower() != address.lower():
        raise CheckFailed("Unexpected Auth admin createUser response")
    try:
        user_id = str(uuid.UUID(record["id"]))
    except (KeyError, ValueError, TypeError) as exc:
        raise CheckFailed("New Auth user ID is invalid") from exc
    return user_id


def check_galaxy_subscriptions(key, a_email, a_pw, b_email, b_pw):
    # Each real user signs in normally. No admin/service key touches these checks.
    a_id, a_token = sign_in(a_email, a_pw, key)
    b_id, b_token = sign_in(b_email, b_pw, key)
    if a_id == b_id:
        raise CheckFailed("Subscription test accounts must be distinct")
    for token in (a_token, b_token):
        status, raw = request("POST", "/rest/v1/rpc/genai_study_my_subscription",
                              key, token=token, body={})
        state = json_body(raw)
        if status != 200 or not isinstance(state, dict) or state.get("plan_code") != "FREE" or state.get("allowed") is not True or state.get("daily_eval_limit") != 5:
            raise CheckFailed("Galaxy default FREE subscription or authenticated RPC failed")
    status, raw = request("GET", "/rest/v1/genai_study_user_subscriptions?select=user_id&user_id=eq." + b_id, key, token=a_token)
    if status != 200 or json_body(raw) != []:
        raise CheckFailed("User A can access User B subscription")
    status, _ = request("POST", "/rest/v1/genai_study_user_subscriptions",
                        key, token=a_token, body={"user_id":a_id,"plan_code":"PRO","status":"ACTIVE"})
    if status in (200, 201, 204):
        raise CheckFailed("CRITICAL: user can self-upgrade to paid subscription plan")
    print("Galaxy subscription verified: authenticated FREE defaults, cross-user isolation, and no self-upgrade.")


def _cancellation_requested(signum, frame):
    # GitHub sends SIGTERM before forcibly killing a timed-out/cancelled job.
    # Convert the signal to a normal exception so the existing finally runs.
    raise CheckFailed("GitHub Actions cancellation requested; cleaning up temporary Auth users")


def run():
    if os.getenv("GITHUB_REPOSITORY") != "saifsiddiqui59/GenAI-Galaxy" or os.getenv("GITHUB_REF") != "refs/heads/main":
        raise CheckFailed("Refusing to run outside Galaxy GitHub main")
    if os.getenv("GALAXY_CONFIRM") != "TEST":
        raise CheckFailed("Manual TEST confirmation required")
    if os.getenv("GALAXY_SUPABASE_URL", URL) != URL:
        raise CheckFailed("Unexpected Supabase project")
    key = validate_publishable_key(os.getenv("GALAXY_SUPABASE_PUBLISHABLE_KEY"))
    admin_key = validate_admin_key(os.getenv("GALAXY_SUPABASE_ADMIN_KEY"))
    if key == admin_key:
        raise CheckFailed("Privileged Auth admin and public test key must be different")

    # Signal handler can only help graceful cancellation, not SIGKILL/runner loss.
    prior_termination = signal.getsignal(signal.SIGTERM)
    signal.signal(signal.SIGTERM, _cancellation_requested)
    created = []
    failed_deletions = []
    original = {name: os.environ.get(name) for name in (
        "GALAXY_TEST_A_EMAIL", "GALAXY_TEST_A_PASSWORD",
        "GALAXY_TEST_B_EMAIL", "GALAXY_TEST_B_PASSWORD")}
    try:
        identifier = secrets.token_hex(12)
        for suffix in ("A", "B"):
            address = "galaxy-rls-" + identifier + "-" + suffix.lower() + "@example.com"
            password = secrets.token_urlsafe(32)
            user_id = create_test_user(admin_key, address, password)
            created.append(user_id)
            os.environ["GALAXY_TEST_" + suffix + "_EMAIL"] = address
            os.environ["GALAXY_TEST_" + suffix + "_PASSWORD"] = password
        if len(created) != 2 or created[0] == created[1]:
            raise CheckFailed("Two distinct Auth accounts were not created")
        print("Created two temporary Galaxy-only Auth test accounts (identities masked).")
        run_rls()
        check_galaxy_subscriptions(key,
            os.environ["GALAXY_TEST_A_EMAIL"], os.environ["GALAXY_TEST_A_PASSWORD"],
            os.environ["GALAXY_TEST_B_EMAIL"], os.environ["GALAXY_TEST_B_PASSWORD"])
        if os.environ.get("GALAXY_RUN_AI_SMOKE") == "1":
            from live_ai_smoke import run_ai_smoke
            run_ai_smoke(key, os.environ["GALAXY_TEST_A_EMAIL"],
                         os.environ["GALAXY_TEST_A_PASSWORD"])
    finally:
        for user_id in reversed(created):
            try:
                code, _ = admin_request("DELETE", "/" + user_id, admin_key)
                if code not in (200, 202, 204):
                    failed_deletions.append(user_id)
            except Exception:
                failed_deletions.append(user_id)
        for name, value in original.items():
            if value is None:
                os.environ.pop(name, None)
            else:
                os.environ[name] = value
        if failed_deletions:
            # Print count only; do not emit email addresses, secrets or JWTs.
            raise CheckFailed(str(len(failed_deletions)) +
                              " temporary test account(s) could not be deleted; inspect Supabase Auth users")
        signal.signal(signal.SIGTERM, prior_termination)
        if created:
            print("Temporary Galaxy Auth users deleted via Admin API.")


if __name__ == "__main__":
    try:
        run()
    except CheckFailed as exc:
        print("FAIL: " + str(exc), file=sys.stderr)
        sys.exit(1)
