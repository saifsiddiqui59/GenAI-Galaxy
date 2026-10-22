# P4 Release execution evidence — 2026-10-22

## Authorization and scope
The owner provided a broad go-ahead to complete remaining GenAI-Galaxy work. This is authorization to attempt *Galaxy-only* release operations, not proof that external credentials, required device access, a spend limit, or protected GitHub workflow dispatch controls are available. Never touch RetailGrowthAI or WineShopPOS. The shared `voice_agent_call` Supabase project also contains unrelated tables and functions; do not mutate these through a Galaxy task.

## Independently observed
- Last pre-P4 `main`: `accdecd9be31cc3274f3e75e5478a87e1d2458fd`; GitHub run [#39845004927](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39845004927) 3/3 passed, including curriculum/API, browser-smoke (simulated speech) and release-safety.
- PRs #31 and #32 are merged; P3 branch is already contained in main. 17 worlds, 246/246 expanded topic entries, 245 unique lessons, 246 source-owned rubrics and no incomplete entries. All remain editorial-unverified.
- Read-only live catalog inspection on Supabase project `voice_agent_call` confirms RLS enabled on the three `genai_study_*` tables, with authenticated owner-matching SELECT/INSERT/UPDATE/DELETE policies where appropriate. The `genai-study-docs` bucket is private with an 8 MiB max and owner-prefixed object policies.
- These catalog facts do **not** establish live two-user sign-in, cross-account denial, recovery email or private-object accessibility. Actual authenticated network fixture tests have not been run.
- Initial Azure Blob preview previously passed guest-only hosted-browser acceptance but is from an older deployment. A GitHub merge never updates the seven published files.
- The GitHub connection available for this review can inspect and merge PRs and read Actions jobs, but exposes **no manual workflow-dispatch action**; no authenticated Azure management tool is connected. Do not bypass the protected manual-only workflow by adding a push trigger.
- Supabase security advisors also reported findings on **unrelated** legacy schemas (including a publicly executable SECURITY DEFINER function). Do not silently change these shared-project objects in this Galaxy PR; their owner must assess them separately.

## P4 improvements
- Strengthened `tests/live_site_browser_check.py` so the hosted test must verify exact SHA-256 byte parity of **all seven** allowlisted files against the selected GitHub checkout. It also requires 17 worlds, 245 unique hosted lesson objects and 246 covered topic placements.
- Added source-only `release-safety` regression to make removing those parity checks a test failure.
- Corrected outdated root README curriculum counts and CI assertions.
- Result: passing an HTTP 200 guest-browser smoke against an *older* site cannot be represented as a current P4/P3 production publication. This change does not itself publish assets.

## Remaining tasks / evidence criteria
1. **Static publication:** Use `.github/workflows/galaxy-static-deploy.yml` on approved `main`, input `DEPLOY`, exact existing storage `gengalaxy1429841605`, protected `dev` environment and required account-scoped Blob Data Contributor. Back up the seven existing assets first; do not create a second storage account. Record successful deployment run, commit SHA, and subsequently run `galaxy-live-browser.yml` to prove exact hosted/source parity.
2. **Live RLS and password recovery:** Two distinct, preapproved Galaxy-only Auth credentials and a publishable key in protected `dev` secrets are necessary. Run `galaxy-live-rls.yml` with `TEST`, inspect denial evidence and cleanup. Test actual allowed-origin recovery email on a dedicated account. Never use service-role or unrelated clinic identities.
3. **Real mic:** After the authorized static publication, execute `docs/acceptance/MICROPHONE.md` on actual desktop/mobile hardware. CI mock recognition cannot certify physical microphone, provider behavior, accuracy or permission prompts.
4. **Backend:** `api/function_app.py` is source-only. Configure and validate verified JWT, independent APIM per-user quotas, private/restricted Function ingress, protected model/Speech secrets, malware quarantine, negative tenant isolation, rollback and telemetry before hosted API enablement. Publish a cost ceiling and exact SKU plan before provisioning.
5. **Editorial:** Independently source/SME review 245 lessons and measure spoken interview timings. No AI-only checklist is human signoff.
6. **Security/cost:** Audit *public Git history* as well as current files for real secrets; revoke leaked credentials before history cleanup. Evaluate live regional Azure subscription prices/usage, establish an approved budget and alerts. Microsoft public pricing page often returns blanks for selected rates, so no fabricated monthly quote is recorded here.

## Current verdict
Offline/source integration is structurally complete, but hosted release, real-user isolation, microphone and expert validation remain open. Do not describe the production product as complete until actual run IDs and device evidence are recorded.
