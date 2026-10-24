"""Read-only/no-model-charge smoke for ALREADY deployed Galaxy HTTP routes.

Cannot authorize a paid model call: sends no bearer token and only invalid or
OPTIONS requests. Uses exact known Azure host, no redirects, no private headers.
Invoke manually with --confirm READONLY; not part of PR/push CI.
"""
from __future__ import annotations
import argparse
import json
import sys
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError

HOST = "https://gengalaxy-p3-1429841605.azurewebsites.net"
ORIGIN = "https://gengalaxy1429841605.z29.web.core.windows.net"
ROUTES = ("practice/evaluate", "practice/tutor")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request_once(url: str, method: str, origin: str | None) -> tuple[int, dict[str,str]]:
    """Perform exactly one bounded, token-free request to a pinned host."""
    allowed = tuple(HOST + "/api/" + suffix for suffix in ROUTES)
    if url not in allowed or method not in ("OPTIONS", "POST"):
        raise ValueError("Only the two known Galaxy routes are allowed")
    headers = {"Accept": "application/json"}
    if origin is not None:
        headers["Origin"] = origin
    body = None
    if method == "POST":
        # No JWT is sent. Server must reject this BEFORE reaching paid model/quota.
        headers["Content-Type"] = "application/json"
        body = b'{"topic_key":"NO_ACCESS","question":"not authorized","response":"no session"}'
    req = Request(url, data=body, headers=headers, method=method)
    opener = build_opener(NoRedirect())
    try:
        with opener.open(req, timeout=40) as response:
            response.read(2049)  # Never echo response, which may be untrusted.
            return response.status, dict(response.headers.items())
    except HTTPError as ex:
        ex.read(2049)
        return ex.code, dict(ex.headers.items())


def evaluate_probe(probe=request_once) -> list[str]:
    """Return actionable failures; never silently accept a 200 on unauth POST."""
    failures: list[str] = []
    for route in ROUTES:
        url = HOST + "/api/" + route
        cases = (
            ("OPTIONS", ORIGIN, 200),
            ("OPTIONS", "https://untrusted.example.org", 403),
            ("POST", ORIGIN, 401),
        )
        for method, origin, expected in cases:
            try:
                status, headers = probe(url, method, origin)
            except (OSError, URLError, ValueError) as ex:
                failures.append(route + " " + method + ": unavailable (" + type(ex).__name__ + ")")
                continue
            if status != expected:
                failures.append(route + " " + method + ": expected " +
                                str(expected) + ", got " + str(status))
            allowed = {k.lower(): v for k, v in headers.items()}.get("access-control-allow-origin")
            if origin == ORIGIN and allowed != ORIGIN:
                failures.append(route + " " + method + ": expected exact CORS origin")
            if origin != ORIGIN and allowed is not None:
                failures.append(route + " " + method + ": untrusted origin received CORS header")
    return failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm", choices=["READONLY"], required=True,
                        help="Ack that no authenticated or paid model call is performed")
    args = parser.parse_args()
    if args.confirm != "READONLY":
        return 2
    failures = evaluate_probe()
    if failures:
        for failure in failures:
            print("FAIL: " + failure)
        return 1
    print("PASS: two deployed Galaxy routes reject unauthenticated requests, "
          "enforce exact CORS; no JWT, quota reservation or model call was made.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
