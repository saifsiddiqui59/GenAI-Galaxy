# Parallel Workstream Boundaries — P2 (2026-10-22)

This section supersedes the original broad assignments below. **Repo:** `saifsiddiqui59/GenAI-Galaxy` (public). Each P2 branch starts from the same verified main; contributors open **separate PRs**. No feature branch merges another feature branch. Only the coordinator reviews, resolves integration conflicts, merges to main, checks actual 3/3 Actions jobs after every merge, and updates canonical project state. Never touch RetailGrowthAI or WineShopPOS.

## Six independent branches and exclusive write ownership

| Stream | Branch | Outcome and write scope |
| --- | --- | --- |
| A — remaining lessons | `feat/p2-content-78` | Individually author **78 remaining overview-only topics** in `data/lessons.json`, regenerate `api/rubrics.json`, `docs/TOPIC_COVERAGE.csv` and `docs/COVERAGE_REPORT.md`. Own `tests/test_curriculum.py` and curriculum-only test additions. Preserve 246 topics/17 planets/original 230 IDs; label all unverified content editorial-unverified. |
| B — authentication and isolation readiness | `feat/p2-auth-rls-readiness` | Harden offline/mocked recovery and two-account RLS testing in `tests/live_rls_check.py`, `tests/test_live_rls_guards.py`, `tests/test_auth_sync.cjs`, `tests/test_auth_recovery.cjs`, `.github/workflows/galaxy-live-rls.yml`, `docs/acceptance/AUTH_RLS.md`. **No live credentials or hosted RLS execution without separate explicit approval** and dedicated A/B test accounts. |
| C — speech/mic acceptance readiness | `feat/p2-mic-browser-tests` | Extend browser-simulated mic tests in `tests/test_mic_lifecycle.cjs`, `tests/browser_check.py`, `speech/**`, `docs/acceptance/MICROPHONE.md`. Test cancel/race/error, accessibility, transcript preservation; make a physical mic test checklist. Real hardware/third-party speech validation is manual, not a fake CI success. |
| D — secure Azure backend release readiness | `feat/p2-azure-api-readiness` | Own `api/core.py`, `api/function_app.py`, `api/local.settings.example.json`, `tests/test_api_core.py`, `infra/azure/backend/**`, `docs/acceptance/BACKEND.md`. Prepare real gateway quota/ingress/JWT tests and a staging release/rollback design. **No Azure resource creation/deployment, live provider calls, key material or shared-Supabase mutations without approval.** Do not edit `api/rubrics.json`. |
| E — static preview release readiness | `feat/p2-static-preview-readiness` | Own `scripts/deploy_existing_static.sh`, `scripts/deploy_azure_static.sh`, `.github/workflows/galaxy-static-deploy.yml`, `.github/workflows/galaxy-static-smoke.yml`, `tests/test_azure_static.py`, `docs/acceptance/STATIC_RELEASE.md`. Prepare manual-only OIDC upload verification, host smoke, rollback and budget guards. **Do not upload/deploy to Azure until separately approved.** |
| F — content quality, public-repo audit and cost | `feat/p2-quality-security-cost` | Own `ops/**`, `docs/reviews/**`, `tests/test_release_guards.py` and additional static quality/security checks scoped to this stream. Analyze factual/source risks and interview spoken timing, public repo/history leak risks, Azure Blob spend estimates/alerts and production release signoff. Record findings, **do not claim SME signoff or access paid resources**; do not rewrite A's lessons or D's code. |

## Coordinator-only shared files

`app.js`, `index.html`, `styles.css`, `runtime-config.js`, `AGENTS.md`, `docs/PROJECT_STATE.md`, `docs/NEXT_TASK.md`, `docs/DECISIONS.md`, `docs/WORK_LOG.md`, `docs/PARALLEL_WORK.md`, `docs/INTERFACES_V1.md`, `docs/ARCHITECTURE.md`, `docs/CI_AUTOMATION.md`, `.github/workflows/galaxy-ci.yml`, and `scripts/checkpoint.sh` are coordinator-owned. Contributor PRs must not edit them. If a cross-cutting change is required, describe it in the PR for the coordinator to implement. This rule intentionally prevents conflicting changes in `app.js`, CI or canonical docs.

**Test ownership:** A: `tests/test_curriculum.py`; B: specified auth/RLS tests; C: mic and browser test; D: API core test; E: static Azure test; F: release-guards test. New test paths should be namespaced by workstream to avoid collisions. A may write `api/rubrics.json`, but D may only read it.

## Integration, actual validation and approval gates

1. Each contributor reads latest main, `AGENTS.md`, this file, interface docs and source-specific tests, commits only owned paths, opens PR targeting `main`, and reports actual run IDs and 3/3 job results. Never disable tests for green CI. No PR-creation claim without a link.
2. Coordinator checks PR file ownership, access boundaries, code/tests and secrets, merges individually (not in parallel), handles generated-artifact conflicts, and verifies **new main 3/3 CI after each merge**. Do not merge if any current required check is pending/failing.
3. None of these PRs may run the manual RLS workflow, deploy the public Blob preview, provision Azure/Functions/APIM, migrate a database, upload private files, or use a physical microphone on behalf of the owner. Each is a distinct owner approval gate.
4. The current Blob preview is **not** automatically synchronized to GitHub main. Code+CI passes prove source integration, not a live production-ready site. Do not conflate mocks with real isolation or human/content verification.
5. Coordinator records final verdict, remaining blockers and revised metrics in the canonical docs. If branch A is too large, it can split into subordinate batches with **non-overlapping** topic ownership and named generated artifact integration reserved for coordinator; keep the original 230 IDs unchanged.

## Original boundaries (historical)

# Parallel Workstream Boundaries

- Galaxy UI: `index.html`, `styles.css`, orbital renderer in `app.js` (coordinator integrates shared app).
- Curriculum: `data/**`, `docs/TOPIC_COVERAGE.csv`, `scripts/build_*.py`.
- Speech: `speech/**`, authenticated broker to be assigned after deployment approval.
- Learning: lesson/practice functions in `app.js`, evaluator server future work.
- Vault/security: `sql/**`, document worker future work; no changes to non-Galaxy data.
- QA/CI: `tests/**`, `.github/workflows/**`, `scripts/checkpoint.sh`.

Only coordinator edits shared `app.js`/interfaces and merges PRs; workers create branches and report blockers. All GitHub work stays isolated from RetailGrowthAI/WineShopPOS.

## V6 integration boundary

`feat/p35-v6-cinematic` / draft #131 owns isolated motion, scene/materials and visual QA; `feat/p35-v6-preview-release` is based on latest main and owns only protected publisher, its boundary tests and canonical release state. Keep visual source draft. Coordinator reviews source CI/screenshots and publisher independently; deploy only the new V6 prefix and verify hosted results.

## V6 final coordinator checkpoint

Draft source #131 is frozen and publisher #135 is merged. Hosted release #40022442803 and artifact #12532090063 complete the isolated V6 visual acceptance scope, with actual desktop/mobile screenshots opened. Shared main's concurrent P35 learning-module changes were preserved. Keep older visual PRs #96/#105 draft and do not integrate their art into production; physical-device and authenticated V6 checks remain explicit follow-ups.
