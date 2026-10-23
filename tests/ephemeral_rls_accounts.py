"""GitHub Actions-only: temporarily create two Galaxy Auth users for real RLS tests.

Uses an admin key ONLY for Supabase Auth create/delete. Actual data isolation
checks continue to use independently signed-in user JWTs and a publishable key.
No login credentials, tokens or elevated keys are written to files or logs.
"""
import base64
import json
import os
import secrets
import sys
import uuid
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from live_rls_check import CheckFailed, URL, run as run_rls, validate_publishable_key

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
        if created:
            print("Temporary Galaxy Auth users deleted via Admin API.")


if __name__ == "__main__":
    try:
        run()
    except CheckFailed as exc:
        print("FAIL: " + str(exc), file=sys.stderr)
        sys.exit(1)
