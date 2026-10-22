# GenAI Galaxy — assistant development rules

Before modifying features, read: `docs/PROJECT_STATE.md`, `docs/NEXT_TASK.md`, `docs/DECISIONS.md`, `docs/WORK_LOG.md`, `docs/ARCHITECTURE.md`, `docs/INTERFACES_V1.md`, `docs/PARALLEL_WORK.md`, `docs/CI_AUTOMATION.md`, `docs/COVERAGE_REPORT.md`.

1. Continue V3 via `V3_REFERENCE.html` and original 230 topic IDs. Do not reset or silently rewrite progress keys.
2. Never touch RetailGrowthAI or WineShopPOS code, databases, storage, repos, or deployment.
3. Keep V4 in its isolated **public** GenAI-Galaxy GitHub repository; never commit secrets or personal uploads. New Azure RG/storage requires explicit owner approval. Existing `voice_agent_call` Supabase is shared: do not access non-Galaxy tables or weaken their policies.
4. Never ship an Azure Speech subscription secret, Supabase service-role key, personal files, or provider API key to static JavaScript.
5. Preserve 17 chapter worlds, smooth motion, keyboard interaction and prefers-reduced-motion support.
6. No multiple-choice interview checks. Do not claim lexical keyword scoring is an LLM correctness evaluator.
7. Track factual/editorial evidence for every lesson; do not auto-expand 227 incomplete records with generic templates and declare success.
8. Work in small feature branches; run `scripts/checkpoint.sh`; update docs and add regression tests; publish via reviewed PR; never fake CI/deployment success.
9. Follow the RetailGrowthAI-inspired **Galaxy-only** Git/PR process in `docs/GITHUB_WORKFLOW.md`: never push to any other project, never self-merge stacked PRs, inspect real Actions logs before marking CI green.
10. For historical private-repo bootstrap, use `scripts/publish_github.sh` only from a clean Galaxy Git worktree under the correct GitHub account. `--check` is read-only; `--create-private` creates an empty private remote; `--publish` pushes and opens draft PRs only. The user-controlled Git Bash CLI login is separate from the ChatGPT GitHub connector.

Azure DEV and GitHub Actions: read `docs/AZURE_GITHUB_OIDC.md`. Never reuse RetailGrowthAI's Entra federation or Azure secrets. The Azure group/app name provided by owner is `GenAI_Galaxy`, but storage account needs separate verification. No cloud work on pushes/PRs; manual `dev` approval and confirmed existing account required for Azure deployments.

## P2 parallel stream rule (2026-10-22)

Use the **six explicit ownership scopes** in `docs/PARALLEL_WORK.md` when creating P2 branches or PRs. Only coordinator updates shared app files, CI and canonical docs and merges after actual 3/3 GitHub checks. Readiness work does not authorize hosted RLS tests, actual microphone use, Azure resource provisioning, frontend deployment or Supabase mutations; each requires separate explicit owner approval. Treat this repository as public in every security review.
