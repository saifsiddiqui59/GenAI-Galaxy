# GenAI Galaxy — assistant development rules

Before modifying features, read: `docs/PROJECT_STATE.md`, `docs/NEXT_TASK.md`, `docs/DECISIONS.md`, `docs/WORK_LOG.md`, `docs/ARCHITECTURE.md`, `docs/INTERFACES_V1.md`, `docs/PARALLEL_WORK.md`, `docs/CI_AUTOMATION.md`, `docs/COVERAGE_REPORT.md`.

1. Continue V3 via `V3_REFERENCE.html` and original 230 topic IDs. Do not reset or silently rewrite progress keys.
2. Never touch RetailGrowthAI or WineShopPOS code, databases, storage, repos, or deployment.
3. Keep V4 in its own private GitHub repository. New Azure RG/storage requires explicit owner approval. Existing `voice_agent_call` Supabase is shared: do not access non-Galaxy tables or weaken their policies.
4. Never ship an Azure Speech subscription secret, Supabase service-role key, personal files, or provider API key to static JavaScript.
5. Preserve 17 chapter worlds, smooth motion, keyboard interaction and prefers-reduced-motion support.
6. No multiple-choice interview checks. Do not claim lexical keyword scoring is an LLM correctness evaluator.
7. Track factual/editorial evidence for every lesson; do not auto-expand 227 incomplete records with generic templates and declare success.
8. Work in small feature branches; run `scripts/checkpoint.sh`; update docs and add regression tests; publish via reviewed PR; never fake CI/deployment success.
