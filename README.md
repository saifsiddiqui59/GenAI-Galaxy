# GenAI Galaxy Adaptive Interview Tutor — V4 P3 curriculum complete

**Continue V3 without replacing it.** `V3_REFERENCE.html` preserves the recovered V3 source. The curriculum retains 17 planets, 45 original groups and 230 V3 topics, plus 16 new gap topics. There are now **245 distinct authored eight-part lessons (246 covered topic entries)** and **0 incomplete topic overviews**. All lessons remain editorial-unverified pending source/SME review and spoken-duration testing; see `docs/COVERAGE_REPORT.md`.

## Local preview

```bash
cd GenAI-Galaxy-V4
python -m http.server 8000
# http://localhost:8000/index.html
```

Features: responsive 17-planet galaxy with animated orbits, atmospheric surfaces and a twinkling starfield; motion toggle and OS reduced-motion detection; chapter/group/topic navigation; private study account integration; open-ended typed/spoken answers with editable transcripts; lesson guidance and due-date scheduling; and a private Knowledge Vault UI. The browser STT engine can use a browser-operated remote service: see your browser's privacy policy.

**Security and scoring:** Local concept matching is only a provisional learning hint and **never marks a topic as mastered**. Authenticated Azure model reviews can be enabled only once a secure backend, rate-limit gateway, and Azure endpoint have been configured and tested. Even a model-reviewed answer needs critical source verification. Two high-scoring model-reviewed attempts are required for the local mastery flag.

## API code (implemented locally; not deployed)

`api/function_app.py` provides authenticated Azure Functions routes:

- `POST /api/practice/evaluate` — server-owned, allowlisted rubrics and Azure OpenAI evaluation; validates Supabase Auth JWT via `/auth/v1/user` on each request. Requires `GALAXY_EVAL_GATEWAY_RATE_LIMIT=active` after a **real external quota/rate-limit gateway** is established. Without it the route fails closed with 503. M3 also requires a backend-only APIM-injected gateway header, per-user quota enforcement and direct-ingress network restrictions.
- `POST /api/vault/extract` — only accesses a private Supabase document row and storage object owned by the verified user. PDF (selectable text only), DOCX, TXT, MD; checks file signatures, size, ZIP decompression, document ID and ownership; updates the private metadata row with <=60,000 characters. No malware scanner or OCR yet. The signed-in UI supports retrying extraction after an initial processing failure when the service is configured. Do not deploy without a malware-scanning/quarantine plan for untrusted uploads.
- `POST /api/speech/token` — issues short-lived Azure Speech STS tokens after user authentication. Requires a real API gateway quota and privately configured Speech key. There are no provider secrets in the static frontend.

The Blob static site loads only public endpoint URLs from `runtime-config.js`. Configure these after approval; **never embed model/Speech keys, Supabase service-role credentials, or private file tokens in the frontend.** Azure Blob Static Website alone cannot run the Python API.

## Local test commands

```bash
python -m pip install pypdf==5.9.0
python -m unittest discover -s tests -v
node tests/test_engine.cjs
node --check app.js
node --check runtime-config.js
python -m py_compile api/core.py api/function_app.py
python tests/browser_check.py  # Playwright/Chromium required; simulated mic, not real audio
python scripts/build_api_rubrics.py
python scripts/coverage_report.py
```

GitHub Actions actually passed all **3/3 jobs** on latest P3 documentation merge `accdecd9be31cc3274f3e75e5478a87e1d2458fd` ([run #39845004927](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39845004927)). The existing public Azure Blob preview was deployed earlier and is not automatically updated by merges. Manual-only deployment requires a protected `dev` environment. The live hosted browser acceptance script now checks hashes of all seven published assets against the checked-out release plus 246/246 coverage to prevent a stale preview being reported as current. Browser smoke tests simulate speech recognition and use mocked study data: they do not prove real microphone permissions, signed-in cloud data isolation, production model evaluation, Azure Speech or vault extraction. The original target `saifsiddiqui59/GenAI-Galaxy` returned 404 from the connected GitHub account, and that connection offers no repository-creation action. No new GitHub repo or cloud resource was created. RetailGrowthAI and WineShopPOS were not changed.

See `docs/PROJECT_STATE.md`, `docs/NEXT_TASK.md`, and `docs/INTERFACES_V1.md` for milestones and integration contracts.

## M4 GitHub workflow handoff

The private Galaxy GitHub remote is not yet created. GitHub access to the separate private RetailGrowthAI repository was verified and its coordinator CI/branch/PR practices were adapted into `docs/GITHUB_WORKFLOW.md`. Local Galaxy branches now support M2/M3/M4 stacked draft PRs; run `bash scripts/publish_github.sh --check` from an authenticated Windows Git Bash session. The helper checks owner/repository/privacy and refuses other remotes. No GitHub PR, Actions run or cloud deployment has been performed. Current local checks: **20 Python tests** plus Node and browser simulations.

## M3 quality scope

The M3 curriculum expansion and related scoring tests are locally available but NOT independently expert-reviewed. **128 / 147** model answers have 60–140 words; remaining shorter answers need timing edits. Topic coverage is not proof of technical correctness. Backend deployments need gateway network controls, actual quotas, test users and explicit Azure provisioning approval.


### M5 GitHub Actions / existing Azure account

Separate Galaxy-only `.github/workflows/galaxy-ci.yml` for push/PR tests and `.github/workflows/galaxy-azure-verify.yml` for **manual read-only OIDC checks** on RG `GenAI_Galaxy`, using Entra app `GenAI_Galaxy`. `.github/workflows/galaxy-static-deploy.yml` optionally uploads public assets only on manual main-branch `DEPLOY`, after protected DEV approval and verified existing storage account. See `docs/AZURE_GITHUB_OIDC.md`; **none of these have run remotely** because private `saifsiddiqui59/GenAI-Galaxy` repository is still unavailable. No cloud provisioning or deployment occurred.
