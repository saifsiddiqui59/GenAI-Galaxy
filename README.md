# GenAI Galaxy Adaptive Interview Tutor — V4 local milestone

**V3 continuity:** V3 source recovered as `V3_REFERENCE.html`; its 17 chapters, 230 topic records, 45 groups, and existing Supabase topic keys are preserved. V4 adds 16 identified gap topics, a 3D-style CSS planet galaxy, open-answer practice with browser STT and optional Azure Speech adapter, 19 expanded eight-part lessons, and a private Knowledge Vault frontend.

## Run locally

```bash
cd GenAI-Galaxy-V4
python -m http.server 8000
# Open http://localhost:8000/index.html
```

No package installation is required for the static frontend. Online Supabase sign-in uses a pinned ESM version of supabase-js. The current V4 app is a preview, **not a deployed production service**.

## Tests

```bash
python -m unittest discover -s tests -v
node tests/test_engine.cjs
node --check app.js
node --check speech/azure-speech-adapter.js
python tests/browser_check.py  # requires local Playwright + Chromium; mock data smoke
```

## Deployment design (approval gate)

- Host `index.html`, `styles.css`, `app.js`, `data/`, and `speech/` under the Azure storage account static website `$web` container.
- Create **new** Azure resource group/storage only after explicit approval. `scripts/deploy_azure_static.sh` will not run without `--approve-provisioning`.
- Existing Supabase `voice_agent_call`: verified `genai_study_progress`, `genai_study_attempts`, `genai_study_documents` RLS enabled, and `genai-study-docs` is a **private** bucket limited to **8 MiB**. No schema changes have been made.
- Browser Web Speech API works only in supported secure contexts and may use remote recognition. Unsupported browsers can type. For Azure fallback, deploy an authenticated HTTPS token broker, set `window.GALAXY_SPEECH_BROKER_URL` in a secure runtime configuration, and bundle the pinned Speech SDK.
- PDF/DOCX file upload and private metadata storage are implemented in code; **parsing/lesson generation is not**. TXT/MD source-derived question drafts are explicitly labeled provisional.
- Keyword rubric is a *coverage proxy*, not semantic/correctness scoring. A production answer evaluator needs a secured authenticated API and validated SME question rubric.

## Current limits

Chromium desktop/mobile/reduced-motion smoke tests ran successfully with local mocked JSON, not a deployed backend. Cloud operations were inspected read-only; no test user signup, bucket upload, cross-user RLS test, microphone permission test, external Azure Speech broker, Azure provisioning, GitHub Actions run, or deployed site is verified. The `saifsiddiqui59/GenAI-Galaxy` repository returns 404 through GitHub connection.

See [coverage report](docs/COVERAGE_REPORT.md) and [project state](docs/PROJECT_STATE.md).
