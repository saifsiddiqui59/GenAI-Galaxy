"""Manual-only, fail-closed Galaxy Supabase cross-account isolation smoke.

Writes tiny, random, cleanable fixtures ONLY to genai_study_* tables and
genai-study-docs, using two existing consenting test accounts. Never uses
service-role keys or alters other projects/tables. Not part of PR/push CI.
"""
import json
import os
import sys
import uuid
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

URL = "https://vfoghlhtnifpnbevgufa.supabase.co"
BUCKET = "genai-study-docs"
TIMEOUT = 20


class CheckFailed(RuntimeError):
    pass



def validate_publishable_key(key):
    """Reject accidentally supplying an elevated Supabase key to the live probe.

    Old Supabase anon JWT keys are accepted only when their role claim is anon.
    New opaque publishable keys start sb_publishable_; never use sb_secret_.
    """
    import base64
    if not isinstance(key, str) or not key.strip() or len(key) > 4096:
        raise CheckFailed("Invalid Supabase publishable key")
    if key.startswith("sb_secret_"):
        raise CheckFailed("Refusing privileged Supabase key")
    if key.startswith("sb_publishable_"):
        return key
    if key.count(".") != 2:
        raise CheckFailed("Expected an anon or publishable Supabase key")
    try:
        claims = key.split(".")[1]
        raw = base64.urlsafe_b64decode(claims + "=" * (-len(claims) % 4))
        role = json.loads(raw).get("role")
    except (ValueError, UnicodeError, TypeError):
        raise CheckFailed("Unrecognized Supabase JWT key") from None
    if role != "anon":
        raise CheckFailed("Refusing privileged Supabase key")
    return key

def request(method, path, key, token=None, body=None, content_type=None, prefer=None):
    headers = {"apikey": key}
    if token:
        headers["Authorization"] = "Bearer " + token
    if content_type:
        headers["Content-Type"] = content_type
    if prefer:
        headers["Prefer"] = prefer
    data = None if body is None else (json.dumps(body).encode() if isinstance(body, (dict, list)) else body)
    if body is not None and not content_type:
        headers["Content-Type"] = "application/json"
    req = Request(URL + path, data=data, headers=headers, method=method)
    try:
        with urlopen(req, timeout=TIMEOUT) as response:
            return response.status, response.read()
    except HTTPError as exc:
        return exc.code, exc.read()
    except URLError as exc:
        raise CheckFailed("Supabase network connection failed") from exc


def json_body(data):
    try:
        return json.loads(data or b"null")
    except (ValueError, UnicodeError):
        raise CheckFailed("Supabase returned non-JSON data") from None


def require(condition, message):
    if not condition:
        raise CheckFailed(message)


def sign_in(email, password, key):
    status, raw = request("POST", "/auth/v1/token?grant_type=password", key,
                          body={"email": email, "password": password})
    payload = json_body(raw)
    require(status == 200 and isinstance(payload, dict) and payload.get("access_token")
            and isinstance(payload.get("user"), dict) and payload["user"].get("id"),
            "Test account sign-in failed (verify password and confirmed email)")
    return payload["user"]["id"], payload["access_token"]


def rest(method, table, key, token, *, query="", body=None):
    require(table in {"genai_study_progress", "genai_study_attempts", "genai_study_documents"},
            "Not a Galaxy allowlisted table")
    path = "/rest/v1/" + table + ("?" + query if query else "")
    status, raw = request(method, path, key, token, body, prefer="return=representation")
    return status, json_body(raw)


def rows_for(table, field, value, key, token):
    q = quote(str(value), safe="")
    code, rows = rest("GET", table, key, token, query=field + "=eq." + q + "&select=*")
    require(code == 200 and isinstance(rows, list), "Unable to query Galaxy table " + table)
    return rows


def cleanup(key, a, b, topic, doc_ids, paths):
    # Best effort, only random names created by this invocation, never user content.
    for user_id, token in (a, b):
        for table in ("genai_study_progress", "genai_study_attempts"):
            for suffix in ("", "-forged"):
                rest("DELETE", table, key, token,
                     query="topic_key=eq." + quote(topic + suffix, safe="") + "&user_id=eq." + user_id)
    for doc_id in doc_ids:
        for user_id, token in (a, b):
            rest("DELETE", "genai_study_documents", key, token,
                 query="id=eq." + doc_id + "&user_id=eq." + user_id)
    for user_id, token in (a, b):
        request("DELETE", "/storage/v1/object/" + BUCKET, key, token,
                body={"prefixes": paths})


def run():
    required = (
        "GALAXY_SUPABASE_PUBLISHABLE_KEY", "GALAXY_TEST_A_EMAIL", "GALAXY_TEST_A_PASSWORD",
        "GALAXY_TEST_B_EMAIL", "GALAXY_TEST_B_PASSWORD"
    )
    missing = [name for name in required if not os.environ.get(name)]
    require(not missing, "Missing required dedicated test-account environment variables: " + ", ".join(missing))
    require(os.getenv("GALAXY_SUPABASE_URL", URL) == URL,
            "Refusing a different Supabase project URL")
    key = validate_publishable_key(os.environ["GALAXY_SUPABASE_PUBLISHABLE_KEY"])
    a = sign_in(os.environ["GALAXY_TEST_A_EMAIL"], os.environ["GALAXY_TEST_A_PASSWORD"], key)
    b = sign_in(os.environ["GALAXY_TEST_B_EMAIL"], os.environ["GALAXY_TEST_B_PASSWORD"], key)
    require(a[0] != b[0], "Both credentials resolve to the same account")

    probe = uuid.uuid4().hex
    topic = "__galaxy_rls_test__/" + probe
    doc_id = str(uuid.uuid4())
    forged_id = str(uuid.uuid4())
    own_path = a[0] + "/" + probe + "-rls.txt"
    forged_path = a[0] + "/" + probe + "-forged.txt"
    try:
        record = {"user_id": a[0], "topic_key": topic, "status": 1, "confidence": 1,
                  "note": "Galaxy temporary isolation probe"}
        code, _ = rest("POST", "genai_study_progress", key, a[1], body=record)
        require(code in (200, 201), "Account A cannot write owned progress")
        require(len(rows_for("genai_study_progress", "topic_key", topic, key, a[1])) == 1,
                "Account A cannot read back owned progress")
        require(rows_for("genai_study_progress", "topic_key", topic, key, b[1]) == [],
                "Account B can read Account A progress")

        # Unauthorized update/delete must modify zero foreign rows.
        path_filter = "topic_key=eq." + quote(topic, safe="") + "&user_id=eq." + a[0]
        code, data = rest("PATCH", "genai_study_progress", key, b[1],
                          query=path_filter, body={"status": 2})
        require((code in (200, 204) and data in ([], None)) or code in (401, 403),
                "Account B could update Account A progress")
        code, data = rest("DELETE", "genai_study_progress", key, b[1], query=path_filter)
        require((code in (200, 204) and data in ([], None)) or code in (401, 403),
                "Account B could delete Account A progress")
        require(len(rows_for("genai_study_progress", "topic_key", topic, key, a[1])) == 1,
                "Owner progress disappeared after foreign write")

        spoof = {**record, "topic_key": topic + "-forged"}
        code, _ = rest("POST", "genai_study_progress", key, b[1], body=spoof)
        require(code in (401, 403), "Account B can insert records under A's user_id")
        code, _ = rest("POST", "genai_study_progress", key, b[1],
                       body={**record, "user_id": b[0]})
        require(code in (200, 201), "Account B cannot write owned progress")
        require(len(rows_for("genai_study_progress", "topic_key", topic, key, a[1])) == 1,
                "Account A sees Account B progress")

        attempt = {"user_id": a[0], "topic_key": topic, "question_key": "galaxy-rls-test",
                   "level": 1, "correct": False, "response": "temporary", "feedback": "temporary"}
        code, _ = rest("POST", "genai_study_attempts", key, a[1], body=attempt)
        require(code in (200, 201), "A cannot insert owned attempt")
        require(rows_for("genai_study_attempts", "topic_key", topic, key, b[1]) == [],
                "B can see A's private attempt")

        doc = {"id": doc_id, "user_id": a[0], "title": "Temporary Galaxy isolation probe",
               "category": "topic", "body": "temporary test content", "filename": "rls.txt",
               "file_path": own_path, "mime": "text/plain"}
        code, _ = rest("POST", "genai_study_documents", key, a[1], body=doc)
        require(code in (200, 201), "A cannot insert owned document metadata")
        require(rows_for("genai_study_documents", "id", doc_id, key, b[1]) == [],
                "B can read A's document metadata")
        code, _ = rest("POST", "genai_study_documents", key, b[1],
                       body={**doc, "id": forged_id})
        require(code in (401, 403), "B can forge A's private document metadata")

        blob = b"Galaxy private test only"
        storage = "/storage/v1/object/" + BUCKET + "/" + own_path
        code, _ = request("POST", storage, key, a[1], blob, "text/plain")
        require(code in (200, 201), "A cannot upload to its own private bucket prefix")
        guarded = "/storage/v1/object/authenticated/" + BUCKET + "/" + own_path
        code, content = request("GET", guarded, key, a[1])
        require(code == 200 and content == blob, "A cannot read own private storage")
        code, _ = request("GET", guarded, key, b[1])
        require(code in (400, 401, 403, 404), "B can read A's private storage")
        code, _ = request("POST", "/storage/v1/object/" + BUCKET + "/" + forged_path,
                          key, b[1], b"forbidden", "text/plain")
        require(code in (400, 401, 403, 404), "B can write inside A's storage prefix")
    finally:
        cleanup(key, a, b, topic, (doc_id, forged_id), (own_path, forged_path))
    print("PASS: two real Supabase accounts, progress/attempt/document RLS and private storage isolation")


if __name__ == "__main__":
    try:
        run()
    except CheckFailed as exc:
        print("FAIL: " + str(exc), file=sys.stderr)
        sys.exit(1)
