# Galaxy AI evaluation and lightweight request traces

**Implementation adapted from WineShopPOS** after reviewing its `AI_OBSERVABILITY_EVALUATION_PLAN.md`, `AI_PRODUCTION_BASELINE.md`, versioned golden data, `apply-quality-gates.mjs`, and its authenticated production trace-ingestion evidence. WineShopPOS and Galaxy use different domains, customers, Supabase tables, model stacks and budgets: **none of the WineShopPOS infrastructure or keys are reused**.

## Actual implementation in Galaxy

1. **Model-scored interview feedback:** Existing `/api/practice/evaluate` returns model-reported `accuracy`, `clarity`, `missing_concepts`, `has_factual_errors`, feedback, improved answer and follow-up. These are not independent RAG evaluation measurements.
2. **Bounded request traces:** Server-generated UUID `X-Galaxy-Trace-Id` for every evaluator HTTP result; **exactly one small structured logger event per request**: trace UUID, success/denial HTTP status, execution stage, duration, quota outcome, safe provider input/output/total token counts, and clearly named `model_reported_accuracy`/`model_reported_clarity`. No user/shop IDs, answers, prompts, raw citations, document paths, Auth tokens, provider output or secrets.
3. **Cost optimization:** Reuse the consumption-based Function and atomic Supabase evaluation quota (5/user/day, 50 global/day). Each evaluator invocation logs once without new model calls, DB tables, queues, or always-on services. Existing model review asks for at most 600 output tokens. If model usage is missing/malformed the log omits it rather than inventing token counts.
4. **Versioned golden dataset:** `golden-galaxy-v1.jsonl` has 10 examples spanning RAG, hallucinations, model internals, LangGraph, tool authorization, prompt injection, tenant RLS, Delta retention and honest project claims. `evaluation-lock-v1.json` records the separate meaning of runtime model feedback and independently evaluated release metrics.
5. **Fail-closed release quality gate:** `python scripts/gate_galaxy_eval.py <actual-scored-evidence.json>` requires a complete independently scored evidence set across **all** golden cases; averages for groundedness, relevance, coherence and factual accuracy all at least **4.0/5**. Every unauthorized cross-user access, secret/prompt leak, unapproved tool action, malformed response or failed evaluator provenance is an **absolute blocker**, even when averages are high. No evidence ⇒ fail. The offline CI tests validate the contract with **clearly synthetic fixtures only**.
6. **Pending real QA:** Real tests against the hosted evaluator, actual Supabase test accounts, independent judge implementation or Azure AI Evaluation SDK / Foundry evaluators, and trace ingestion in Foundry are **not verified**. Declaring those services working requires their own genuine run IDs and actual evidence.

## Why tracing is cheap here

This deliberately implements **correlation and request-level structured logs**, not paid observability provisioning. It does **not** create an Application Insights resource, Log Analytics workspace, Foundry tracing connection, or scheduled monitoring. The Function host's retention of stdout depends on Azure runtime configuration. These events are not guaranteed to be visible in Foundry Traces. If the owner later wants durable searchable distributed traces and dashboards, use an explicit separate approved hosted telemetry configuration after estimating ingestion/storage charges.

## Quality interpretation

- WineShopPOS's `GroundednessEvaluator`, `RelevanceEvaluator`, `TaskAdherenceEvaluator`, `IntentResolutionEvaluator` and Tool Call evaluations were designed for its owner assistant with shop-scoped business RPCs.
- Galaxy currently evaluates **interview answers against server-owned reference rubrics**. It does *not* perform live RAG retrieval for this endpoint, so metrics like **Context Precision / Context Recall** are not meaningful until actual retrieval evidence exists. We prioritize factual accuracy, groundedness against approved reference, coherence, relevance, and security.
- Self-reported model accuracy and clarity should never satisfy independent quality release gates.
- `model_reported_accuracy` is the returned scoring output, not evidence that the score is calibrated. The first real baseline and golden result review must be checked by a human or a genuinely separate evaluator.

## Release and privacy

- Existing direct-consumption security boundary, JWT checks, quota-before-model and disabled paid Speech and unscanned Vault routes are unchanged.
- CI runs **offline only**, makes no Azure/Supabase calls and does not consume evaluation budget.
- Golden examples contain synthetic public questions. Evidence output should include **only version identifiers, independent 1–5 scores and integer blocker observations**. Never commit raw user answers or bearer tokens.
- Backend must be deployed separately through the existing protected manual GitHub Actions process and needs actual credentials. No application deployment or trace ingestion success is implied by merging this PR.
