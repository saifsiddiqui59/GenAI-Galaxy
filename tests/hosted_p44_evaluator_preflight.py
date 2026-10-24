"""Live public evaluator preflight diagnostic. NO JWT, no POST model call and no paid tokens."""
import re
import urllib.request
import urllib.error
from urllib.parse import urlparse

SITE="https://gengalaxy1429841605.z29.web.core.windows.net"
ORIGIN=SITE

def fetch(request):
 try:
  with urllib.request.urlopen(request,timeout=20) as r:
   return r.status, dict(r.headers),r.read(20000).decode('utf-8','replace')
 except urllib.error.HTTPError as e:
  return e.code,dict(e.headers),e.read(20000).decode('utf-8','replace')

def main():
 status,headers,text=fetch(urllib.request.Request(SITE+"/runtime-config.js"))
 assert status==200, f"Hosted config unavailable HTTP {status}"
 match=re.search(r"window\\.GALAXY_EVALUATOR_URL\\s*=\\s*['\\\"]([^'\\\"]*)['\\\"]",text)
 assert match,"Hosted evaluator configuration missing"
 endpoint=match.group(1).strip()
 if not endpoint:
  print("FAIL HOSTED CONFIG: evaluator endpoint is blank; AI review cannot run")
  raise SystemExit(2)
 parsed=urlparse(endpoint)
 assert parsed.scheme=="https" and parsed.username is None and parsed.password is None, "Unsafe endpoint"
 assert parsed.hostname and parsed.hostname.endswith(".azurewebsites.net"), "Unexpected evaluator hostname"
 assert parsed.path.endswith("/api/practice/evaluate"), "Incorrect evaluator route"
 print("Hosted configured evaluator hostname:", parsed.hostname, "path:",parsed.path)
 req=urllib.request.Request(endpoint,method="OPTIONS",headers={
   "Origin":ORIGIN,
   "Access-Control-Request-Method":"POST",
   "Access-Control-Request-Headers":"authorization,content-type"
 })
 try: code,hdr,body=fetch(req)
 except Exception as e:
  print("FAIL NETWORK: browser cannot reach evaluator host",type(e).__name__)
  raise
 print("Evaluator CORS preflight HTTP:",code)
 print("Allow-Origin:",hdr.get("Access-Control-Allow-Origin","(missing)"))
 print("Allow-Headers:",hdr.get("Access-Control-Allow-Headers","(missing)"))
 assert code in (200,204), "Preflight did not return success"
 assert hdr.get("Access-Control-Allow-Origin")==ORIGIN,"Site origin missing from CORS response"
 allowed=hdr.get("Access-Control-Allow-Headers","").lower()
 assert "authorization" in allowed and "content-type" in allowed,"Auth/content headers not allowed"
 print("PASS: hosted public evaluator route and browser CORS preflight; no paid LLM call.")

if __name__=="__main__": main()
