"""Galaxy V4 authenticated Azure Functions API (not deployed).

Required: Azure Function deployment with managed HTTPS, allowed-origin and
rate limiting configured at an API gateway. Do not put model keys in Blob site.
"""
import json
import os
from pathlib import Path
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen, build_opener, HTTPRedirectHandler
from urllib.error import HTTPError, URLError
import uuid
import re
import time
import azure.functions as func
from core import InputError, bearer_token, document_id, topic_key, extract_text, validate_review, verify_gateway, owner_document_filters, owned_storage_path, validate_interview_history, MAX_BYTES
from consumption_security import backend_profile, enforce_eval_quota, QuotaExceeded, QuotaUnavailable, DIRECT, GATEWAY
from eval_observability import new_trace_id, record_evaluation, usage_counters
from interview_grading import grading_system_prompt, validate_structured_review, GradingContractError

app=func.FunctionApp(http_auth_level=func.AuthLevel.ANONYMOUS)
RUBRICS=json.loads((Path(__file__).parent/'rubrics.json').read_text())

class UpstreamError(RuntimeError):
    pass


class _NoRedirect(HTTPRedirectHandler):
    """Reject upstream redirects before forwarding a bearer token or API key."""
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def _no_redirect_open(request, timeout):
    # Per-call opener only; never modify process-global redirect handlers.
    return build_opener(_NoRedirect()).open(request, timeout=timeout)


def request_json(url, method='GET', payload=None, token=None, extra_headers=None, limit=2_000_000, timeout=15):
    headers={'Accept':'application/json'}
    if token:
        headers['Authorization']='Bearer '+token
    if payload is not None:
        headers['Content-Type']='application/json'
    headers.update(extra_headers or {})
    body=json.dumps(payload).encode('utf-8') if payload is not None else None
    try:
        with _no_redirect_open(Request(url,data=body,method=method,headers=headers),timeout=timeout) as r:
            data=r.read(limit+1)
            if len(data)>limit:
                raise UpstreamError('Upstream result was too large')
            return json.loads(data) if data else None
    except (HTTPError,URLError,ValueError,TimeoutError) as ex:
        raise UpstreamError('Upstream service did not complete request') from ex


def site_origin():
    origin=os.environ.get('GALAXY_ALLOWED_ORIGIN','').rstrip('/')
    if origin and (not origin.startswith('https://') or '/' in origin[8:]):
        raise RuntimeError('Invalid configured site origin')
    return origin


def make_response(req, data, status=200, trace_id=None):
    headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
    if trace_id:
        headers['X-Galaxy-Trace-Id']=trace_id
        headers['Access-Control-Expose-Headers']='X-Galaxy-Trace-Id'
    origin=req.headers.get('Origin','')
    if origin and origin==site_origin():
        headers.update({'Access-Control-Allow-Origin':origin,'Vary':'Origin',
                        'Access-Control-Allow-Headers':'authorization, content-type',
                        'Access-Control-Allow-Methods':'POST, OPTIONS'})
    return func.HttpResponse(json.dumps(data),status_code=status,mimetype='application/json',headers=headers)


def preflight(req):
    if req.method=='OPTIONS':
        allowed=bool(req.headers.get('Origin') and req.headers.get('Origin')==site_origin())
        return make_response(req,{'ok':allowed},200 if allowed else 403)
    return None


def env_config():
    url=os.environ.get('SUPABASE_URL','').rstrip('/')
    key=os.environ.get('SUPABASE_PUBLISHABLE_KEY','')
    if url != 'https://vfoghlhtnifpnbevgufa.supabase.co' or not key:
        raise RuntimeError('Supabase backend configuration incomplete')
    return url,key


def authenticate(req):
    # APIM must strip any client-provided internal header, inject its own shared
    # secret, enforce JWT-scoped quotas, and restrict direct Function ingress.
    profile=backend_profile()
    if profile==GATEWAY:
        verify_gateway(req.headers.get('X-Galaxy-Internal-Token'), os.environ.get('GALAXY_GATEWAY_SHARED_SECRET'))
    # DIRECT is safe only for the evaluation endpoint, which reserves an atomic
    # per-user AND global daily quota before reaching Azure OpenAI.
    token=bearer_token(req.headers.get('Authorization'))
    base,public_key=env_config()
    try:
        u=request_json(base+'/auth/v1/user',token=token,extra_headers={'apikey':public_key},limit=150_000)
    except UpstreamError:
        raise InputError('Invalid user session') from None
    if not isinstance(u,dict) or not u.get('id'):
        raise InputError('Invalid user session')
    try:
        user_id=str(uuid.UUID(u['id']))
    except (TypeError,ValueError):
        raise InputError('Invalid user session') from None
    return token,user_id,base,public_key


def model_review(rubric, question, response, history=None):
    # Gateway applies per-user quota before this expensive operation.
    endpoint=os.environ.get('AZURE_OPENAI_ENDPOINT','').rstrip('/')
    deployment=os.environ.get('AZURE_OPENAI_DEPLOYMENT','')
    key=os.environ.get('AZURE_OPENAI_API_KEY','')
    parsed=urlparse(endpoint)
    if (not key or parsed.scheme!='https' or parsed.username or parsed.password
        or not parsed.hostname or not (parsed.hostname.endswith('.openai.azure.com')
         or parsed.hostname.endswith('.services.ai.azure.com'))
        or parsed.path not in ('','/') or parsed.port not in (None,443)
        or not re.fullmatch(r'[A-Za-z0-9_.-]{1,64}',deployment)):
        raise RuntimeError('Model evaluation not provisioned')
    url=endpoint+'/openai/deployments/'+quote(deployment)+'/chat/completions?api-version=2024-10-21'
    prompt=grading_system_prompt()
    user_input=json.dumps({'topic':rubric['topic'],'question':question,'reference_answer':rubric['reference_answer'],
                           'technical_context':rubric['technical_context'],'common_mistakes':rubric['common_mistakes'],
                           'expected_concepts':rubric['expected_concepts'],'project_context':rubric['project_context'],
                           'candidate_answer':response,'prior_interview_exchanges':history or []},ensure_ascii=False)
    out=request_json(url,method='POST',payload={
       'messages':[{'role':'system','content':prompt},{'role':'user','content':user_input}],
       'temperature':0,'max_tokens':1200,'response_format':{'type':'json_object'}},
       extra_headers={'api-key':key},limit=50_000,timeout=28)
    try:
        result=json.loads(out['choices'][0]['message']['content'])
    except (KeyError,ValueError,TypeError,IndexError):
        raise UpstreamError('Model review output did not match schema') from None
    try:
        reviewed=validate_structured_review(result,response)
    except GradingContractError:
        raise UpstreamError('Model review failed evidence contract') from None
    return reviewed, usage_counters(out)


@app.route(route='practice/evaluate',methods=['POST','OPTIONS'])
def evaluate(req:func.HttpRequest)->func.HttpResponse:
    pending=preflight(req)
    if pending:return pending
    # Generated server-side. Never accept caller-supplied correlation IDs as trusted.
    trace_id=new_trace_id()
    started_at=time.monotonic()
    stage='auth'
    status=503
    quota='none'
    usage={}
    accuracy=None
    clarity=None

    def result(payload, code):
        nonlocal status
        status=code
        return make_response(req,payload,code,trace_id=trace_id)

    try:
        token,user_id,base,public_key=authenticate(req)
        stage='validation'
        body=req.get_json()
        if not isinstance(body,dict):raise InputError('Invalid request JSON')
        k=topic_key(body.get('topic_key'),set(RUBRICS))
        response=body.get('response','')
        question=body.get('question','')
        if not isinstance(response,str) or not 15<=len(response)<=2000:
            raise InputError('Answer must be between 15 and 2000 characters')
        if not isinstance(question,str) or not 1<=len(question)<=500:
            raise InputError('Question is too long or missing')
        history=validate_interview_history(body.get('history'))
        # No billed LLM call before valid JWT, valid inputs, AND quota reservation.
        stage='quota'
        if backend_profile()==DIRECT:
            enforce_eval_quota(token=token,base=base,public_key=public_key,request_json=request_json)
            quota='reserved'
        elif os.environ.get('GALAXY_EVAL_GATEWAY_RATE_LIMIT')!='active':
            return result({'error':'Evaluation quota gateway is not configured'},503)
        stage='model'
        review,usage=model_review(RUBRICS[k],question,response,history=history)
        accuracy=review.get('accuracy')
        clarity=review.get('clarity')
        stage='completed'
        return result(review,200)
    except QuotaExceeded:
        quota='denied'
        return result({'error':'Daily evaluation limit reached'},429)
    except InputError as ex:
        code=403 if str(ex)=='Trusted gateway required' else (401 if str(ex)=='Bearer authentication required' else 400)
        return result({'error':str(ex)},code)
    except (RuntimeError,UpstreamError):
        if stage=='quota':
            quota='unavailable'
        return result({'error':'Evaluator service is unavailable'},503)
    finally:
        # Small, allowlisted, non-PII record: one trace per request.
        record_evaluation(trace_id=trace_id,status=status,stage=stage,
                          started_at=started_at,quota_result=quota,
                          usage=usage,accuracy=accuracy,clarity=clarity)


@app.route(route='vault/extract',methods=['POST','OPTIONS'])
def vault_extract(req:func.HttpRequest)->func.HttpResponse:
    pending=preflight(req)
    if pending:return pending
    # Minimum-cost profile disables unscanned document extraction entirely.
    # Never grant access to private documents until malware quarantine exists.
    try:
        if backend_profile()==DIRECT:
            return make_response(req,{'error':'Vault extraction is disabled until malware scanning is deployed'},503)
    except QuotaUnavailable:
        return make_response(req,{'error':'Backend profile is not configured'},503)
    try:
        token,user_id,base,public_key=authenticate(req)
        # External gateway must enforce authenticated per-user vault quotas.
        # This marker is a fail-closed setting, not proof of a live quota policy.
        if os.environ.get('GALAXY_VAULT_GATEWAY_RATE_LIMIT')!='active':
            return make_response(req,{'error':'Private document extraction quota gateway is not configured'},503)
        payload=req.get_json()
        if not isinstance(payload,dict):raise InputError('Invalid request JSON')
        doc_id=document_id(payload.get('document_id'))
        filters=owner_document_filters(user_id,doc_id)
        url=base+'/rest/v1/genai_study_documents?'+urlencode({'select':'id,user_id,filename,file_path',**filters})
        rows=request_json(url,token=token,extra_headers={'apikey':public_key},limit=6000)
        if not isinstance(rows,list) or len(rows)!=1 or rows[0].get('user_id')!=user_id:
            return make_response(req,{'error':'Document not found'},404)
        row=rows[0]
        path=owned_storage_path(user_id,row.get('file_path'))
        download=base+'/storage/v1/object/authenticated/genai-study-docs/'+quote(path,safe='/')
        try:
            with _no_redirect_open(Request(download,headers={'Authorization':'Bearer '+token,'apikey':public_key}),timeout=15) as r:
                raw=r.read(MAX_BYTES+1)
        except (HTTPError,URLError,TimeoutError):
            return make_response(req,{'error':'Private file cannot be retrieved'},502)
        content=extract_text(raw,row.get('filename') or '')
        request_json(base+'/rest/v1/genai_study_documents?'+urlencode(filters),method='PATCH',payload={'body':content},
                     token=token,extra_headers={'apikey':public_key,'Prefer':'return=minimal'},limit=1000)
        return make_response(req,{'status':'text_extracted','characters':len(content),'document_id':doc_id})
    except InputError as ex:return make_response(req,{'error':str(ex)},403 if str(ex)=='Trusted gateway required' else (401 if str(ex)=='Bearer authentication required' else 400))
    except (UpstreamError,RuntimeError):return make_response(req,{'error':'Document extraction service unavailable'},503)


@app.route(route='speech/token',methods=['POST','OPTIONS'])
def speech_token(req:func.HttpRequest)->func.HttpResponse:
    """Issue short-lived Speech SDK tokens. Only a verified user can request one."""
    pending=preflight(req)
    if pending:return pending
    # Speech bearer tokens may be reused for many minutes of paid audio:
    # a per-request quota alone is not a credible speech consumption cap.
    try:
        if backend_profile()==DIRECT:
            return make_response(req,{'error':'Azure Speech tokens are disabled in consumption MVP'},503)
    except QuotaUnavailable:
        return make_response(req,{'error':'Backend profile is not configured'},503)
    try:
        _token,_user_id,_base,_public_key=authenticate(req)
        if os.environ.get('GALAXY_SPEECH_GATEWAY_RATE_LIMIT')!='active':
            return make_response(req,{'error':'Speech token quota is not configured'},503)
        body=req.get_json()
        if not isinstance(body,dict) or body.get('purpose')!='galaxy-interview-stt':
            raise InputError('Invalid speech purpose')
        region=os.environ.get('AZURE_SPEECH_REGION','')
        key=os.environ.get('AZURE_SPEECH_KEY','')
        if not re.fullmatch(r'[a-z0-9-]{3,30}',region) or not key:
            return make_response(req,{'error':'Azure Speech broker not configured'},503)
        # Azure Speech STS issues limited-lifetime authorization tokens, not keys.
        url='https://'+region+'.api.cognitive.microsoft.com/sts/v1.0/issueToken'
        try:
            with _no_redirect_open(Request(url,data=b'',method='POST',headers={
                'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/x-www-form-urlencoded'}),timeout=12) as response:
                value=response.read(10_001)
            if len(value)>10_000:raise UpstreamError('Token was too large')
            speech=value.decode('ascii')
            if not 20<=len(speech)<=10_000:raise UpstreamError('Invalid token length')
        except (HTTPError,URLError,UnicodeError,TimeoutError):
            raise UpstreamError('Speech token request failed') from None
        return make_response(req,{'token':speech,'region':region})
    except InputError as ex:
        return make_response(req,{'error':str(ex)},401 if str(ex)=='Bearer authentication required' else 400)
    except (UpstreamError,RuntimeError):
        return make_response(req,{'error':'Speech token service unavailable'},503)
