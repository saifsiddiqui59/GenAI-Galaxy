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
