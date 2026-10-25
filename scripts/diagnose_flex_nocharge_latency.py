"""P63: token-free, cold-start-tolerant diagnosis for existing Galaxy Flex routes.

No new instance, Always Ready, model call, bearer token, account write or
personal answer is used. Only synthetically anonymous OPTIONS/POST probes.
"""
import argparse
import time
from urllib.request import Request, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError

HOST = "https://gengalaxy-p3-1429841605.azurewebsites.net"
ORIGIN = "https://gengalaxy1429841605.z29.web.core.windows.net"
PATHS = ("/api/practice/evaluate","/api/practice/tutor")

class RejectRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def probe(path, method, timeout):
    if path not in PATHS or method not in ("OPTIONS","POST") or not 1 <= timeout <= 120:
        raise ValueError("Only approved anonymous Galaxy paths and timeouts are supported")
    headers = {"Origin":ORIGIN, "Accept":"application/json"}
    data = None
    if method=="POST":
        headers["Content-Type"]="application/json"
        data=b'{"topic_key":"NO_AUTH","response":"synthetic anonymous test"}'
    request=Request(HOST+path,method=method,headers=headers,data=data)
    start=time.monotonic()
    try:
        with build_opener(RejectRedirect()).open(request,timeout=timeout) as response:
            return response.status,dict(response.headers.items()),time.monotonic()-start
    except HTTPError as error:
        return error.code,dict(error.headers.items()),time.monotonic()-start

def run_once(probe_fn=probe):
    # First request is allowed to be slow because owner explicitly accepts
    # zero-Always-Ready cold starts; warm checks must separately pass.
    cases = [
        (PATHS[0],"OPTIONS",120,200),
        (PATHS[0],"POST",40,401),
        (PATHS[1],"OPTIONS",40,200),
        (PATHS[1],"POST",40,401),
        (PATHS[0],"OPTIONS",40,200),
        (PATHS[1],"OPTIONS",40,200),
    ]
    failures=[]
    for path,method,timeout,expected in cases:
        try:
            status,headers,duration=probe_fn(path,method,timeout)
        except (OSError,URLError,TimeoutError) as err:
            print("Probe",path,method,"timeout/unavailable",type(err).__name__,
                  "bounded_seconds",timeout)
            failures.append(path+" "+method+": unavailable")
            continue
        origin={k.lower():v for k,v in headers.items()}.get("access-control-allow-origin")
        print("Probe",path,method,"HTTP",status,"seconds",round(duration,2),
              "first_coldstart_allowance" if timeout==120 else "warm_check")
        if status!=expected:
            failures.append(path+" "+method+": expected "+str(expected)+", got "+str(status))
        if origin!=ORIGIN:
            failures.append(path+" "+method+": incorrect exact CORS origin")
    if failures:
        print("FAIL: cold-start tolerant anonymous route acceptance incomplete; no paid AI used.")
    else:
        print("PASS: cold-start tolerant anonymous routes return expected 200/401/CORS without paid AI.")
    return failures

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--confirm",choices=["READONLY"],required=True)
    args=parser.parse_args()
    return 1 if run_once() else 0

if __name__=="__main__":
    raise SystemExit(main())
