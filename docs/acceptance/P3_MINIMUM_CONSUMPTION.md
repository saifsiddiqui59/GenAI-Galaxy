# P3 minimum-cost backend — implementation and release gates

**2026-10-23 — Code implemented; paid Azure resources and database changes NOT deployed.**

## Decision: paid only when used

| Layer | Initial choice | Idle compute charge | Release posture |
|---|---|---|---|
| Frontend | existing Azure Storage static site | no server compute; small storage/transactions | deployed in prior approved workflow |
| Python evaluator | **Azure Functions Flex Consumption**, 512 MiB, max 2 on-demand instances, **zero Always Ready** | no always-ready compute; storage and request-related charges still apply | GitHub workflow is manual-only |
| Evaluator model | existing owner-approved **Azure OpenAI pay-as-you-go** deployment; `max_tokens=600` | no dedicated provisioned model throughput | backend secrets required |
| Login + hard AI quotas | existing Supabase Auth plus reviewed Galaxy-only atomic quota RPC | use existing project; database service plan remains separately billed | review-only SQL not applied |
| Speech | existing browser speech interface initially | no extra Azure Speech charges from MVP backend | server token route returns 503 in cheap profile |
| Documents | existing private bucket; no parsing/extraction | no scanner or permanent worker charge | server extraction route returns 503 until malware quarantine exists |
| APIM | **not provisioned** | avoids dedicated gateway tier | core Function itself validates Supabase JWT and reserves quota before any paid model call |

Official references: https://learn.microsoft.com/azure/azure-functions/pricing ; https://learn.microsoft.com/azure/azure-functions/flex-consumption-plan ; https://learn.microsoft.com/azure/api-management/api-management-sample-flexible-throttling .
In particular, APIM Consumption does not offer `rate-limit-by-key` / `quota-by-key` rules; don't pretend it provides per-user budget controls.

## Security and strict spend guardrails

- New `GALAXY_BACKEND_PROFILE=direct-consumption` applies **only** to `POST /api/practice/evaluate`. An absent/misspelled profile fails closed. The legacy `managed-gateway` mode still requires its internal trust header.
- A valid Supabase user JWT is checked using `https://vfoghlhtnifpnbevgufa.supabase.co/auth/v1/user`, pinned to this exact project. User owns the JWT; the public site receives no model/Speech keys.
- After parsing a valid request and before contacting the Azure OpenAI endpoint, the backend calls `/rest/v1/rpc/genai_study_reserve_evaluation` as **that same authenticated user**.
- Review-only SQL in `infra/azure/backend/galaxy_quota_REVIEW_ONLY.sql` defines **5 evaluations per user per UTC day** and **50 globally per UTC day**. A transaction-scoped advisory lock serializes reservations across serverless instances, protecting against racing concurrent requests. No caller can set counts/limits/user IDs. Quota refusal gives **429**, unavailable quota gives **503**, and neither calls the paid model.
- Two Galaxy-only RLS-protected counter tables have no direct `anon`/`authenticated` privileges; a tightly permissioned `SECURITY DEFINER` RPC verifies `auth.uid()`. Review the DDL before applying to shared Supabase.
- **Availability caveat:** a signed-in malicious user can invoke the public RPC directly to exhaust the global quota without causing paid model calls. This causes denial of service but not unbounded Azure AI spend. For wider exposure, use a stronger request-attestation or edge quota solution.
- The evaluator has an output cap but input context size and actual provider contract cost still matter; no hard currency-price guarantee is claimed.
- Speech token minting remains disabled: a short-lived token can authorize substantial audio consumption; HTTP-call count alone is **not** a safe audio-cost limit. The Vault extraction route remains disabled because format checks are **not** malware scanning.

## GitHub Actions sequence (no VS Code)

1. **Database gate:** Obtain separate permission to change *only* the two `genai_study_eval_*_daily` tables and one `genai_study_reserve_evaluation` routine inside shared Supabase project `vfoghlhtnifpnbevgufa`. SQL file is a **proposal**, not evidence of applied migration.
2. **Azure role gate:** Existing Galaxy OIDC principal client ID `737d67b7-4984-48bb-bb1f-5f62599f645c` has only storage-scoped access as previously verified. Provisioning needs an administrator to grant **Contributor scoped to the dedicated `GenAI_Galaxy` resource group**, or an appropriately constrained custom role. Never grant subscription-wide Contributor and never reuse RetailGrowthAI resources.
3. **GitHub `dev` environment:** Keep existing `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. Add protected secrets `GALAXY_SUPABASE_PUBLISHABLE_KEY`, `GALAXY_AZURE_OPENAI_ENDPOINT`, `GALAXY_AZURE_OPENAI_DEPLOYMENT`, `GALAXY_AZURE_OPENAI_API_KEY`. All model credentials stay out of the public repo and static JS. Verify the model deployment really exists and uses pay-as-you-go tokens (not reserved provisioned throughput).
4. **Provision:** Via GitHub Actions, manually run `Galaxy P3 Flex Consumption provision (manual, billed resources)` on `main` with literal `PROVISION`. This requests only backend storage `gengalaxyp31429841605` (private Standard_LRS) and Function App `gengalaxy-p3-1429841605` in existing RG `GenAI_Galaxy`, Central India; max 2 on-demand instances, 512 MiB, no always-ready instances. A global name collision, region unavailable or missing RBAC **must fail visibly**. No static site storage touched.
5. **Deploy:** Only after the reviewed quota SQL has actually been applied and the model deployment verified, run `Galaxy P3 deploy evaluator to existing Flex app (manual)` on `main` with literal `DEPLOY`. It refuses absent app, wrong OIDC identity/subscription, absent model secrets or always-ready configuration. Uses `Azure/functions-action@v1` with OIDC, not publish profiles.
6. **Acceptance:** Test unauthenticated/malformed/expired JWT denial without a model call; verify 5th request accepted, 6th gets HTTP 429; verify global 50/day block and DB outage returns 503 before paid work. Only then wire public evaluator URL into `runtime-config.js` under a separate reviewed **frontend-only** static deploy. Because we can't call the user's browser or microphone, neither is claimed tested.
7. **Rollback:** Disable the Functions app from the Azure portal or remove the public evaluator URL (approved static rollback). Quota SQL and source history remain for auditing. Remove/revoke Azure AI API key on suspected compromise.

## Remaining honest blockers

- The connected GitHub tool can commit workflows, review CI and merge PRs, but **cannot dispatch new manual workflows, configure GitHub dev secrets, or provision Azure directly**. The user must click the protected Actions control and arrange the narrow IAM role; cloud provisioning is not completed here.
- User requested no P4 monitoring work; do not introduce log analytics, always-on services, budgets, APIM dedicated tiers or monitoring resources without renewed approval.
- Real two-user Auth/RLS test workflow (with ephemeral users) has not been run because its protected GitHub secrets are not configured.
