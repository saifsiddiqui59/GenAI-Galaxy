# GenAI Galaxy — GitHub Actions to existing Azure resources (M5)

**LIVE status (2026-10-22):** GitHub OIDC login and resource-group read access passed (Action #39801831000); owner-approved initial Blob static preview was deployed using ephemeral management-plane key (Action #39803629502). The HTTPS site is https://gengalaxy1429841605.z29.web.core.windows.net/ and all eight public paths returned HTTP 200 in smoke #39804008329. Initial bootstrap and HTTP smoke workflows have been restored to manual-only. Sections below describe the **original M5 plan** and pre-approval state, not the current deployment status. The existing manual keyless deploy still needs account-scoped Storage Blob Data Contributor plus GitHub dev variable GALAXY_STORAGE_ACCOUNT.

**Prepared locally, not connected or deployed.** Scope: GitHub `saifsiddiqui59/GenAI-Galaxy`, Azure RG `GenAI_Galaxy`, Azure application named `GenAI_Galaxy` **as supplied by the owner** (its type is not verified: it could be an Entra app registration or an Azure App Service). The resource group and app were *not* independently read from Azure. OIDC specifically requires an **Entra app registration**; if the supplied app is an App Service, identify or create a distinct Entra app registration only after approval. Neither Azure CLI nor deployment identity is available in this chat. No GitHub repo exists at the requested name through the connected account (404).

## Two separate workflows

1. `.github/workflows/galaxy-ci.yml` runs Python curriculum/API, JS tutor, Chromium simulated-mic UI, and release safeguards on every feature push or PR. No Azure secrets or cloud writes. **Not run on GitHub yet**.
2. `.github/workflows/galaxy-azure-verify.yml` is manually invoked from `main`, restricted to this exact repository, uses `environment: dev` and passwordless OIDC, then **only reads** the Azure subscription and the existing `GenAI_Galaxy` resource group inventory. It does not verify the Entra app display name; the configured client ID identifies it.
3. `.github/workflows/galaxy-static-deploy.yml` is manually invoked from `main`, requires the exact text `DEPLOY` and the protected `dev` environment. It reruns tests then uploads the **seven allowlisted public frontend files** to a **verified, existing** Azure Storage static website in RG `GenAI_Galaxy`. It neither provisions resources nor enables the static website. It doesn't deploy the protected backend API, speech broker or APIM.

The original provisioning script `scripts/deploy_azure_static.sh` remains approval-gated and is **not** called by either GitHub workflow.

## Prerequisite setup (once repository is private and created)

1. Create an **empty private** [GitHub Galaxy repository](https://github.com/new) named `GenAI-Galaxy` under `saifsiddiqui59`, or run `scripts/publish_github.sh --create-private` from authenticated Git Bash. Publish the stacked PR branches and verify actual CI before merging. Never create these workflows in RetailGrowthAI.
2. In [Galaxy GitHub environments](https://github.com/saifsiddiqui59/GenAI-Galaxy/settings/environments), create `dev` and restrict **deployment branches to `main`**. Enable required-reviewer protection when supported.
3. Add *environment secrets*: `AZURE_CLIENT_ID` (the **application/client ID** of the Entra app registration (use `GenAI_Galaxy` only if that is indeed the registered identity)), `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID`. These are identifiers, not passwords. Do not store client secrets, storage keys, or Supabase service-role keys in GitHub or frontend.
4. In Entra **App registrations → the OIDC app (name `GenAI_Galaxy` only if verified) → Certificates & secrets → Federated credentials**, add an exact GitHub `dev` environment trust:
   - Issuer `https://token.actions.githubusercontent.com`
   - Audience `api://AzureADTokenExchange`
   - Subject for a new post-July-15-2026 GitHub repository: `repo:saifsiddiqui59@80577424/GenAI-Galaxy@<ACTUAL_GITHUB_REPO_ID>:environment:dev`
   - **Do not guess `<ACTUAL_GITHUB_REPO_ID>`**. Retrieve the repo's numeric ID after creation using `gh api repos/saifsiddiqui59/GenAI-Galaxy --jq '.id'`, and verify the real GitHub OIDC subject. Older repos may use a different default; follow GitHub's current official docs.
5. For **read-only verification**, assign the **Reader** role to the Entra service principal at scope of the existing `GenAI_Galaxy` resource group (not subscription-wide). The Entra app registration itself has no automatic Azure IAM access.
6. Run **Galaxy Azure OIDC + resource discovery (read-only)** on GitHub Actions `main`. Inspect actual logs and failures. A green login does **not** imply storage-data write permission.

## Deployment-specific gates (only after explicit release approval)

1. Identify the actual **existing Storage account inside `GenAI_Galaxy`**, with its `$web` static website enabled. Storage account names have **3–24 lowercase letters/digits only**, so `GenAI_Galaxy` **cannot** be a Storage account name. The user-provided *app* name does **not** identify the blob storage account.
2. Add `GALAXY_STORAGE_ACCOUNT` as a **`dev` environment variable** (not a secret; exact real storage account name). Never guess or create it.
3. Grant `Storage Blob Data Contributor` to the same Entra service principal, **scoped only to this specific Storage account**. Retain necessary Reader resource-group access for the initial checks.
4. Confirm only frontend files are public; no private resume, user uploads, `V3_REFERENCE.html`, migrations or API credentials. `runtime-config.js` contains public HTTPS endpoint addresses only; private backend controls must be live before exposing them.
5. Manually run **Galaxy static website deployment (manual, existing only)** on `main`, type `DEPLOY`, approve the protected environment when prompted, and inspect the actual job logs, website URL, cache behavior, auth errors and user isolation. No automatic `main` deployment is enabled.

## Security boundaries and common failures

- `AADSTS70025` / missing federated credential: add exact issuer/subject/audience to **this** Entra app, not RetailGrowthAI's app.
- Authorization denied to ARM: set narrowly scoped Reader on `GenAI_Galaxy` RG.
- Storage 403: `Storage Blob Data Contributor` needs assignment to the *storage data plane* at the correct account. Respect propagation delay rather than introducing account keys.
- Static website disabled: workflow intentionally stops; it never changes account settings.
- No GitHub repo/Secrets/Environment: workflow can't run; local syntax/unit testing is not a hosted Actions result.
- Local frontend-only deployment is **not** production readiness: Galaxy still requires a secured API gateway, tenant isolation, speech, malware scanning, data protection and full live tests.

References: [GitHub immutable OIDC subjects](https://docs.github.com/en/actions/reference/security/oidc), [Microsoft Entra immutable subject migration](https://learn.microsoft.com/en-us/entra/workload-id/workload-identities-github-immutable-subjects), [Azure static website GitHub Actions](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blobs-static-site-github-actions), [Azure resource naming rules](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/resource-name-rules).
