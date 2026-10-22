# Existing Azure Blob static preview — release preparation

**This branch does not deploy or update Azure.** It adds local safety guards for the only approved storage account `gengalaxy1429841605` inside resource group `GenAI_Galaxy` (Central India).

## Required authorization before publishing

1. Owner explicitly approves **frontend-only** update to the existing website `https://gengalaxy1429841605.z29.web.core.windows.net/`; never create a new resource group, account, identity, function or API.
2. Verify GitHub `main` has all 3 CI jobs green and the commit selected for release is reviewed. Check public asset allowlist: `index.html`, `styles.css`, `app.js`, `runtime-config.js`, `data/curriculum.json`, `data/lessons.json`, `speech/azure-speech-adapter.js`. No HTML resume references, private documents, uploaded notes, .env, SQL or credentials.
3. Confirm the protected GitHub `dev` environment variable `GALAXY_STORAGE_ACCOUNT` matches exactly `gengalaxy1429841605` and separate Galaxy OIDC environment secrets point to the approved Azure subscription. Use least-privileged Storage Blob Data Contributor **at the one account scope**, not the whole subscription.
4. Existing-only script checks the exact account/resource-group combination in ARM, verifies the static website is already enabled and authenticates using `--auth-mode login` before any write. The script refuses another (even valid) account name.
5. Back up the current allowlisted static site assets and record hashes/commit SHA before an authorized overwrite; validate the rollback source and owner approval route.

## Actual deployment (not authorized by this PR)

- Owner separately approves manual `Galaxy static website deployment (manual, existing only)`, launched on `main` with `DEPLOY` confirmation and protected `dev` approval. No automatic push/PR cloud operation.
- After publication, run manual read-only static HTTP smoke and verify live guest website, all seven assets, 17 planets, search/navigation, mobile layout and reduced-motion. Then request consented auth/microphone acceptance using dedicated accounts and hardware. Passing HTTP 200 alone does not prove content freshness or real auth.
- Roll back by republishing the previously backed-up allowlisted files to the same account through the approved deployment process; report the cause and actual deployed SHA.

## Still missing

Cloud IAM check for the current OIDC service principal, manual approval, backup of live assets, live target access and actual browser/user acceptance. GitHub CI's fake Azure CLI test verifies refusal and asset scope **offline only**.
