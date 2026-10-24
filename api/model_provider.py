"""Swappable, fail-closed Azure model adapter.

Current vetted provider: regional Azure OpenAI chat completions only.
Other providers must implement the same output contract and receive explicit
regional/privacy/licensing/cost approval before they are registered.
"""
from __future__ import annotations
import json
import re
from urllib.parse import quote, urlparse

PROVIDER_AZURE_OPENAI = "azure-openai"
API_VERSION = "2024-10-21"


class ProviderUnavailable(RuntimeError):
    pass


def configured_provider(settings):
    provider = settings.get("GALAXY_MODEL_PROVIDER", PROVIDER_AZURE_OPENAI)
    if provider != PROVIDER_AZURE_OPENAI:
        raise ProviderUnavailable("Model provider not approved")
    endpoint = settings.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
    deployment = settings.get("AZURE_OPENAI_DEPLOYMENT", "")
    key = settings.get("AZURE_OPENAI_API_KEY", "")
    parsed = urlparse(endpoint)
    if (not key or parsed.scheme != "https" or parsed.username or parsed.password
        or not parsed.hostname
        or not (parsed.hostname.endswith(".openai.azure.com")
                or parsed.hostname.endswith(".services.ai.azure.com"))
        or parsed.path not in ("", "/") or parsed.port not in (None, 443)
        or not re.fullmatch(r"[A-Za-z0-9_.-]{1,64}", deployment)):
        raise ProviderUnavailable("Azure OpenAI backend is not configured")
    return {
        "provider": provider,
        "deployment": deployment,
        "url": endpoint + "/openai/deployments/" + quote(deployment)
               + "/chat/completions?api-version=" + API_VERSION,
        "secret_key": key,
    }


def chat_json(*, messages, max_tokens, request_json, usage_counters, settings,
              timeout=28):
    """Return (validated object, bounded token counts), never credentials.

    Network access is performed by the caller's existing safe HTTP adapter,
    which explicitly blocks credential-bearing redirects.
    """
    model = configured_provider(settings)
    if (not isinstance(messages, list) or len(messages) != 2
        or [item.get("role") for item in messages] != ["system", "user"]
        or any(not isinstance(item.get("content"), str)
               or not item["content"] for item in messages)
        or type(max_tokens) is not int or not 50 <= max_tokens <= 2000):
        raise ProviderUnavailable("Invalid model request contract")
    response = request_json(
        model["url"], method="POST",
        payload={"messages": messages, "temperature": 0,
                 "max_tokens": max_tokens,
                 "response_format": {"type": "json_object"}},
        extra_headers={"api-key": model["secret_key"]},
        limit=50_000, timeout=timeout)
    try:
        message = response["choices"][0]["message"]["content"]
        content = json.loads(message)
        if not isinstance(content, dict):
            raise ValueError()
    except (KeyError, IndexError, ValueError, TypeError):
        raise ProviderUnavailable("Provider response did not match JSON contract") from None
    return content, usage_counters(response)
