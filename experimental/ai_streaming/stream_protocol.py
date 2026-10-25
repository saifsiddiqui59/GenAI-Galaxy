"""P77 experimental Azure OpenAI SSE transport. NOT registered/deployed as an endpoint.

Only attach it to an HTTP-stream-capable Azure Function AFTER auth, tenant validation,
atomic paid-call quota reservation, and full regression verification. This module
does not make network requests, authorize callers, bill tokens or persist content.

The `delta` events are provisional plain-text tutor output, never model-verified
grades or mastery credits; `complete` requires Azure finish_reason='stop' and [DONE].
"""
from __future__ import annotations
import json
from typing import Iterable, Iterator

MAX_LINE_BYTES = 16_384
MAX_STREAM_LINES = 4_000
MAX_REPLY_CHARS = 2_500
ALLOWED_EVENTS = frozenset(("status", "delta", "complete", "error"))

class StreamContractError(ValueError):
    pass

def galaxy_sse(event: str, data: dict) -> bytes:
    """Frame one allowlisted event; json encoding blocks event/newline injection."""
    if event not in ALLOWED_EVENTS or not isinstance(data, dict):
        raise StreamContractError("Unsupported stream event")
    if any(not isinstance(k, str) for k in data):
        raise StreamContractError("Invalid event fields")
    encoded=json.dumps(data,ensure_ascii=False,separators=(",",":"),allow_nan=False)
    if len(encoded)>5_000:
        raise StreamContractError("Stream frame exceeded limit")
    return ("event: "+event+"\ndata: "+encoded+"\n\n").encode("utf-8")

def verified_stream_request(*,messages,max_tokens:int,quota_reserved:bool) -> dict:
    """Build one provider request, *only* after authenticated quota reservation.

    Configured Azure endpoint+key validation remains owned by the existing
    api/model_provider.py; this helper accepts no user-provided model URI/key.
    """
    if quota_reserved is not True:
        raise StreamContractError("Authenticated atomic quota reservation required")
    if (not isinstance(messages,list) or len(messages)!=2
        or [m.get("role") for m in messages if isinstance(m,dict)]!=["system","user"]
        or any(not isinstance(m,dict) or not isinstance(m.get("content"),str)
               or not m["content"] for m in messages)
        or type(max_tokens) is not int or not 50<=max_tokens<=650):
        raise StreamContractError("Invalid approved tutor prompt")
    return {"messages":messages,"temperature":0,"max_tokens":max_tokens,
            "stream":True,"stream_options":{"include_usage":True}}

def _usage(value):
    if not isinstance(value,dict):
        return None
    keys=("prompt_tokens","completion_tokens","total_tokens")
    if any(type(value.get(k)) is not int or not 0<=value[k]<=10_000_000 for k in keys):
        return None
    if value["prompt_tokens"]+value["completion_tokens"]!=value["total_tokens"]:
        return None
    return {"input_tokens":value["prompt_tokens"],"output_tokens":value["completion_tokens"],
            "total_tokens":value["total_tokens"]}

def parse_azure_chat_sse(lines: Iterable[bytes|str]) -> Iterator[tuple[str,dict]]:
    """Parse Azure Chat Completions `data: JSON` SSE lines without hidden retries.

    Emits individual model text deltas immediately; accumulates and validates
    a bounded final result. A missing [DONE], truncated JSON, finish=length,
    tool call, or invalid content MUST NOT produce a `complete` event.
    """
    text_len=0
    finish=None
    token_usage=None
    line_count=0
    done=False
    for raw in lines:
        line_count+=1
        if line_count>MAX_STREAM_LINES:
            raise StreamContractError("Provider stream exceeded line cap")
        if isinstance(raw,bytes):
            if len(raw)>MAX_LINE_BYTES:
                raise StreamContractError("Provider stream line too large")
            try:
                line=raw.decode("utf-8")
            except UnicodeDecodeError:
                raise StreamContractError("Provider emitted invalid UTF-8") from None
        elif isinstance(raw,str):
            if len(raw.encode("utf-8"))>MAX_LINE_BYTES:
                raise StreamContractError("Provider stream line too large")
            line=raw
        else:
            raise StreamContractError("Invalid provider stream line")
        line=line.rstrip("\r\n")
        if not line or line.startswith(":"):
            continue
        if done:
            raise StreamContractError("Unexpected provider data after DONE")
        if not line.startswith("data:"):
            raise StreamContractError("Unexpected upstream stream framing")
        payload=line[5:].strip()
        if payload=="[DONE]":
            if finish!="stop" or not text_len:
                raise StreamContractError("Provider did not finish a valid answer")
            done=True
            continue
        try:
            part=json.loads(payload)
        except (ValueError,TypeError):
            raise StreamContractError("Malformed provider SSE JSON") from None
        if not isinstance(part,dict) or "error" in part:
            raise StreamContractError("Provider stream returned an error")
        choices=part.get("choices")
        if not isinstance(choices,list):
            raise StreamContractError("Provider stream choices invalid")
        if not choices:
            usage=_usage(part.get("usage"))
            if usage is not None:
                token_usage=usage
            continue
        if len(choices)!=1 or not isinstance(choices[0],dict):
            raise StreamContractError("Unexpected provider choices")
        choice=choices[0]
        reason=choice.get("finish_reason")
        if reason is not None:
            if reason!="stop" or finish is not None:
                raise StreamContractError("Provider stream terminated abnormally")
            finish=reason
        delta=choice.get("delta") or {}
        if not isinstance(delta,dict) or "tool_calls" in delta or "function_call" in delta:
            raise StreamContractError("Unsupported provider tool event")
        chunk=delta.get("content")
        if chunk is None:
            continue
        if not isinstance(chunk,str) or "\x00" in chunk:
            raise StreamContractError("Invalid model text delta")
        text_len+=len(chunk)
        if text_len>MAX_REPLY_CHARS:
            raise StreamContractError("Model response exceeded tutor bound")
        if chunk:
            yield "delta",{"text":chunk,"provisional":True}
    if not done:
        raise StreamContractError("Provider stream interrupted before DONE")
    yield "complete",{"completed":True,"usage":token_usage,
                      "verified":False,"kind":"tutor_draft"}

def relay_tutor_sse(lines: Iterable[bytes|str]) -> Iterator[bytes]:
    """StreamingResponse-compatible iterator. Errors never become success."""
    yield galaxy_sse("status",{"stage":"generating","model_called":True})
    try:
        for kind,detail in parse_azure_chat_sse(lines):
            yield galaxy_sse(kind,detail)
    except (StreamContractError,UnicodeError,ValueError):
        yield galaxy_sse("error",{"message":"AI stream incomplete; the draft is unverified. Do not retry immediately.",
                                  "retry_safe":False})
