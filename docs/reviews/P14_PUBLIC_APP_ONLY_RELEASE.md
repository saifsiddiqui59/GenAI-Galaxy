# P14 production UI hotfix — release and validation

**Intent:** The approved GenAI-Galaxy public website still serves the older JavaScript and shows an instant local keyword score. P14's reviewed JavaScript adds clear local (free) vs model-based scoring choices and persistent error reasons. The underlying Azure OpenAI smoke previously succeeded on run #39952989858. Do not make any new paid AI calls for this fix.

The new protected workflow `.github/workflows/galaxy-p14-hotfix-app-only.yml` is manual-only. Unlike the full-site publisher, it uploads **only `$web/app.js`** on the existing account `gengalaxy1429841605` in `GenAI_Galaxy`. It requires:

- Typed confirmation `PUBLISH_P14_APP_ONLY` on GitHub branch `main`.
- The pre-existing Galaxy OIDC principal and `dev` environment.
- Exact reviewed P14 commit ancestry and `app.js` Git blob `04f1e03ee347d51d88f6bf942a3b8921d02e5c65`.
- The current live `$web/app.js` must still match the old verified Git blob `bcfbbfcf638b2844d14703cff69306593223ea4e`. If a concurrent developer already changed the live app, this workflow **must abort**, not overwrite.
- Post-upload re-download and byte verification. All other public files, model credentials, APIs, SQL and user data remain unchanged.

Only after the upload passes does the workflow run **actual Azure public website Playwright** checks in Chromium (desktop, mobile, reduced motion). The browser blocks all `/api/practice/evaluate` requests, verifies the approved evaluator URL is configured and the guest UI is transparently local-only, and stores public guest screenshots. A genuine authenticated AI evaluation is **not** run because the owner prohibited billable AI QA.

This fixes the live P14 UI without merging or publishing incomplete P15/P16 3D preview work and without triggering model/fine-tuning/payment/monitoring operations.

## Manual execution

Actions → **Galaxy P14 pinned frontend-only hotfix (manual, no AI calls)** → Run workflow → branch `main` → input `PUBLISH_P14_APP_ONLY`. Confirm all three jobs (validate, publish, live-playwright) succeed.

Source PR merge alone does **not** publish the site. The GitHub integration in this conversation cannot invoke `workflow_dispatch`; never bypass the protected manual gate with a push-triggered deployment.

## Recovery and rollback

If the live hash is unexpected, inspect the active deployment and coordinate with parallel P15/P16 work. Never force an overwrite. For a genuine rollback, use a separately authorized, reviewed manual deployment of the previously saved old `app.js` (or the complete approved site), not an automatic revert.

Playwright evidence alone checks website UX and safety; it is not proof of an authenticated model response or factual scoring accuracy.
