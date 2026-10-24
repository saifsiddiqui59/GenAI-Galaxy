# P49 — Shared Azure Model Adapter and Safe Cost Telemetry

This workstream extends the already merged P47 grading and P48 LangGraph tutor.
It is **source-only**: no new Azure resource, provider deployment, paid AI
evaluation, SQL migration, production website upload or 3D Galaxy edit.

## Model and usage path

- Both `model_review` and `tutor_model_response` use
  `api/model_provider.py:chat_json` instead of two independently maintained
  Azure endpoint/client implementations.
- The provider remains pinned to the existing regional Azure OpenAI
  Chat Completions endpoint. `GALAXY_MODEL_PROVIDER=azure-openai` is the only
  allowed provider. An unapproved provider fails closed.
- URL validation rejects non-Azure hosts, HTTP, credentials, query strings,
  fragments, nonstandard ports and invalid deployment IDs.
- Only one model call occurs after existing authenticated per-user and global
  Supabase quota reservation. Model secrets never appear in static JavaScript.
- The provider-reported usage fields are `input_tokens`, `output_tokens`,
  `total_tokens`, and optional `cached_input_tokens`. Invalid counts are
  excluded rather than silently coerced.
- `X-Galaxy-Trace-Id` is preserved; no user identity, question, answer, JWT
  or model output is recorded in this structured event.

## Distinguish token estimates from Azure actuals

Configuring the following backend-only keys is OPTIONAL:

| Environment setting | Meaning |
| --- | --- |
| `GALAXY_PRICE_SOURCE` | `azure-official-verified` or `azure-billing-contract-verified` |
| `GALAXY_PRICE_ASOF` | Date the owner actually checked rates, ISO yyyy-mm-dd |
| `GALAXY_INPUT_INR_PER_1M` | Verified INR rate per 1,000,000 noncached input tokens |
| `GALAXY_OUTPUT_INR_PER_1M` | Verified INR rate per 1,000,000 output tokens |
| `GALAXY_CACHED_INR_PER_1M` | Verified cached-input INR rate, required when cache usage is reported |

**Do not populate these with guesses or converted USD prices.** The values
must reflect the actual chosen deployment, regional pricing SKU, billing
agreement, applicable currency, applicable tax treatment and effective date.
No price values are included in source. The source field is a *human declaration*
and not cryptographic proof of verification. Require receipt/owner review.

The estimator refuses a missing, malformed, future-dated or over-45-day-old
pricebook. When rates are not verified, token usage still appears but
`estimated_model_cost` is OMITTED; unknown cost is never labeled ₹0.

The API response can include:
`token_usage: {input_tokens, output_tokens, total_tokens, cached_input_tokens?}`
and, **only if configured**, `estimated_model_cost: {currency:INR,
model_cost_estimate_inr,kind,price_asof,source}`.
The web interface labels the estimate as *not Azure billed cost*.

These amounts exclude non-model Azure charges, taxes, free allocations,
price tier nuances, other workloads, and delayed Azure Cost Management data.

## Validation and release limits

- Offline regression tests verify provider authorization, URL injection
  defense, response parsing, actual reported counters, cache accounting,
  currency formatting, pricing staleness and absence of PII in logs.
- All these tests are synthetic contract checks — NOT proof of model accuracy,
  real Azure prices, real invoice totals or real production latency.
- P49 does not dispatch Azure workflows. Source+CI does not deploy the live
  Function or replace the public static website automatically.
- Cost Hub private repo remains a distinct financial system and its last
  verified offline checks/report runs were failing; do not expose its reports
  or copy credentials into GenAI-Galaxy.
- Reconcile aggregated estimated token charges with actual Azure billing only
  after a verified private report has succeeded; provider usage and Azure
  billed actuals must remain separate labeled measures.
- Owner has deferred the 120-case human-reviewed golden benchmark; no new paid
  benchmark calls were made. Production-calibration signoff remains open.
