# GenAI Galaxy Project State — 2026-10-22

**M3 LOCAL DEVELOPMENT/TESTS — NOT GITHUB-PUBLISHED OR DEPLOYED.**

V3 source is preserved without modification. The 17 original chapter/planet identifiers and 230 original topic IDs remain; 16 reviewed-for-duplication discovery records yield 246 topic entries.

## M3 local changes

- Wrote 98 additional distinct topic-specific eight-part lesson records across RAG/prompt engineering, LangGraph/agents/MCP, banking speech, eval/quality, LLM internals, security and Databricks. **147 unique written lessons map to 148 topic entries** (Semantic similarity is in two chapters). The remaining **98 entries are overview-only**, not falsely marked complete.
- Open-answer practice now asks retry questions about **reference concepts not explicitly mentioned**, rather than a generic retry every time. Offline keywords still never award mastery.
- Added user-triggered retry of failed private PDF/DOCX text extraction when the optional authenticated server is configured. Stored files are not silently sent to another provider.
- Added a fail-closed gateway-attestation guard to **all three** Azure Function routes. Production additionally requires APIM per-user quotas, stripping/unforgeably injecting the secret header, and **network-level restriction of direct Function ingress**. A shared secret header alone is not security/proof of rate limiting.
- Regenerated server-owned rubrics and topic-by-topic coverage. Current content lacks SME signoff and live response-timing tests: 128 of 147 reference answers are 60–140 words.

## Verification and blockers

Local unit tests: **16 Python passed**; Node engine passed; app and Functions syntax checks passed; Playwright Chromium desktop/mobile/reduced-motion and simulated browser-STT checks passed. These validate a prototype, **not** cloud services or microphone hardware. Full staging test and two-user Supabase RLS / storage isolation remain unverified. No paid cloud resources created and existing Supabase project was not mutated.

GitHub private repository `saifsiddiqui59/GenAI-Galaxy` continues to return **404** through the connected GitHub account. The connector exposes no repository-creation operation. No remote PR, Actions run or Azure deployment happened. RetailGrowthAI and WineShopPOS were untouched.

Local served-site Playwright navigation was also attempted but **blocked by the execution environment's localhost restriction**; this is neither a product-pass nor an application failure and is excluded from completed test claims.

## M4 — GitHub coordination readiness (local only, 2026-10-22)

Read RetailGrowthAI `AGENTS.md`, CI documentation, parallel-work plan and coordinator state through the GitHub connection. Verified identity `saifsiddiqui59` and write permission on the separate private RetailGrowthAI repository; no changes to it. Verified that `saifsiddiqui59/GenAI-Galaxy` returns 404 and is absent from the authenticated repository list; the available GitHub connector has no `create_repo` operation.

Implemented a Galaxy-only Git Bash publishing helper, documented an M2/M3/M4 stacked draft-PR sequence, added read-only safety CI (third job), bounded CI timeouts/concurrency, static config/repository guard tests and the missing public runtime-config deploy asset. Local **20 Python tests** and Node learning-engine/syntax checks passed. Mocked Playwright desktop/mobile/reduced-motion navigation and microphone transcription also passed. Reproducible rubric and coverage artifacts matched committed state: **148/246 authored entries, 98 incomplete**.

No GitHub remote, PR, actual GitHub Actions run, Supabase mutation or Azure deployment was created or verified in M4. Browser tests still mock voice and backend. Production readiness remains blocked by the prerequisites in `NEXT_TASK.md`.

## M5 — existing Azure + GitHub Actions wiring (LOCAL ONLY, 2026-10-22)

Owner supplied `GenAI_Galaxy` for both Azure resource group and Azure application. Neither Azure object has been verified through a cloud connection. Read RetailGrowthAI's separate OIDC workflow and official GitHub/Microsoft OIDC guidance without changing RetailGrowthAI or WineShopPOS. Prepared Galaxy-specific manual read-only OIDC/RG-inventory workflow and a separately gated workflow to upload an allowlist of public static site files to an existing Storage account. Added fail-closed deploy helper, unit guard tests, and exact app/RG GitHub environment setup instructions (`docs/AZURE_GITHUB_OIDC.md`). Resource group, storage and Entra trust remain unverified. Galaxy repo remains 404: **no hosted GitHub Actions run, OIDC login, Azure deployment or cloud mutation occurred**.
