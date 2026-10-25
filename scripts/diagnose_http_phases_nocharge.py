"""P65: safe live Azure HTTP phase probes, only existing Galaxy Function routes.

Never sends bearer credentials, model prompts or paid calls. Captures curl's
DNS/connect/TLS/time-to-first-byte durations so a 40-second response stall
can be distinguished from transport failure. No polling/scheduled keepalive.
"""
from __future__ import annotations
import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

HOST = "https://gengalaxy-p3-1429841605.azurewebsites.net"
ORIGIN = "https://gengalaxy1429841605.z29.web.core.windows.net"
PATHS = (
    "/api/practice/evaluate",
    "/api/practice/tutor",
    "/api/vault/extract",
    "/api/speech/token",
)
PHASE_TEMPLATE = (
    '{"code":"%{http_code}","dns":"%{time_namelookup}",'
    '"tcp":"%{time_connect}","tls":"%{time_appconnect}",'
    '"ttfb":"%{time_starttransfer}","total":"%{time_total}",'
    '"ip":"%{remote_ip}","http_ver":"%{http_version}"}'
)

def build_command(path: str, method: str, seconds: int) -> list[str]:
    if path not in PATHS or method not in ("OPTIONS", "POST") or not 5 <= seconds <= 120:
        raise ValueError("Only bounded anonymous requests to approved Galaxy routes allowed")
    cmd = [
        "curl", "--http1.1", "--silent", "--show-error", "--max-time", str(seconds),
        "--connect-timeout", "8", "--globoff",
        "--output", "/dev/null", "--write-out", PHASE_TEMPLATE,
        "--request", method, HOST + path,
        "--header", "Origin: " + ORIGIN,
        "--header", "Accept: application/json",
    ]
    if method == "OPTIONS":
        cmd += ["--header", "Access-Control-Request-Method: POST",
                "--header", "Access-Control-Request-Headers: authorization, content-type"]
    else:
        cmd += ["--header", "Content-Type: application/json", "--data-binary",
                '{"topic_key":"NO_AUTH","response":"synthetic denied"}']
    return cmd

def _safe_ip(value: object) -> str:
    # The IP is a public Azure routing peer, never a caller/user address.
    if not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F:.]{2,48}", value):
        return "unknown"
    return value

def sample(path: str, method: str, seconds: int = 20, *, runner=subprocess.run) -> dict:
    cmd = build_command(path, method, seconds)
    # Never publish raw response headers: they may contain routing cookies,
    # trace identifiers or infrastructure details. Record one boolean only.
    with tempfile.TemporaryDirectory(prefix="galaxy-http-") as scratch:
        header_file = Path(scratch) / "headers"
        result = runner(cmd + ["--dump-header", str(header_file)],
                        capture_output=True, text=True, timeout=seconds+8)
        try:
            headers_text = header_file.read_text(encoding="utf-8", errors="replace")
        except OSError:
            headers_text = ""
    app_trace_present = bool(re.search(r"(?im)^x-galaxy-trace-id:\s*[0-9a-f-]{36}\s*$", headers_text))
    # Curl stderr can contain infrastructure details: do NOT log or return it.
    try:
        detail = json.loads(result.stdout)
    except (ValueError, TypeError):
        detail = {}
    def duration(name):
        try:
            x=float(detail.get(name,0))
            return round(x, 3) if 0 <= x <= seconds+2 else 0
        except (ValueError, TypeError):
            return 0
    code = str(detail.get("code","000"))
    if not re.fullmatch(r"[0-9]{3}", code):
        code = "000"
    expected = "200/204" if method == "OPTIONS" else "401"
    return {
        "route": path, "method": method, "expected": expected,
        "http_code": code, "curl_exit": int(result.returncode),
        "dns_s": duration("dns"), "tcp_s": duration("tcp"),
        "tls_s": duration("tls"), "ttfb_s": duration("ttfb"),
        "total_s": duration("total"), "azure_peer": _safe_ip(detail.get("ip")),
        "http_version": str(detail.get("http_ver", ""))[:8],
        "app_trace_present": app_trace_present,
        # Actual browser CORS preflight can be answered with 204 by Azure's
        # platform CORS module before the Python route executes (200).
        "passed": result.returncode == 0 and (code in ("200", "204") if method == "OPTIONS" else code == "401"),
    }

def cases():
    # The first cold start is measured generously; subsequent independent
    # calls must respond. Alternating the two primary routes reveals whether
    # failures affect one route, one HTTP worker or every route.
    yield PATHS[0], "OPTIONS", 90
    for _ in range(2):
        for p in PATHS[:2]:
            yield p, "OPTIONS", 20
            yield p, "POST", 20
    for p in PATHS[2:]:
        yield p, "OPTIONS", 20

def main() -> int:
    arg=argparse.ArgumentParser()
    arg.add_argument("--confirm",choices=["READONLY"],required=True)
    arg.parse_args()
    results = []
    for p, method, timeout in cases():
        try:
            value = sample(p, method, timeout)
        except (OSError, subprocess.TimeoutExpired, subprocess.SubprocessError):
            value = {"route":p,"method":method,"expected":"200/204" if method=="OPTIONS" else "401",
                     "http_code":"000","curl_exit":124,"dns_s":0,"tcp_s":0,"tls_s":0,
                     "ttfb_s":0,"total_s":float(timeout),"azure_peer":"unknown",
                     "http_version":"","passed":False}
        print(json.dumps(value,sort_keys=True),flush=True)
        results.append(value)
    failures=sum(not x["passed"] for x in results)
    print("P65",len(results),"anonymous samples;",failures,
          "failed; no JWT, quota reservation or AI model call.")
    return 0 if failures == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
