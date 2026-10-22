# Azure API/backend DEV readiness (source only)

**No Azure Function, APIM, model or Speech endpoint has been deployed by this branch.** This is a checklist for a future owner-approved DEV release, not proof that a gateway already exists.

## Trust boundaries

1. Authenticate the end user by validating a Supabase access token against the pinned Galaxy project via HTTPS; do not trust a user UUID, storage path, or topic key submitted in an API body.
2. API Management must authenticate caller identity and impose **per-user** quotas independently of route-level environment markers. Strip an incoming `X-Galaxy-Internal-Token` header before injecting a trusted upstream value; do not treat this shared header as tenant authentication.
3. Azure Function ingress must reject direct public bypass around APIM (private endpoint, VNet integration/access restrictions, or supported equivalent). A static header without network isolation is not sufficient.
4. Scope private documents to both verified owner UUID and document UUID in all PostgREST reads/writes. Before Storage download, validate exact owned object-prefix, forbid traversal, control characters, empty segments and invalid user UUID.
5. Before parsing PDF/DOCX, add malware scanning/quarantine, upload approval, file size and decompression limits, MIME/signature tests, timeout budget and explicit audit events. The current parser validates format and size but is **not** a malware scanner.
6. Keep Azure OpenAI and Speech credentials behind the backend only. Consider managed identity where possible. Never expose service-role keys, provider secrets or gateway shared secret in `runtime-config.js` or GitHub workflow logs.

## Offline verification on this branch

- Unit tests cover fail-closed gateway secret checks, owner-bound document queries and strict private object-path checks (wrong user, traversal, empty segments, control characters and oversized input).
- No network tests, signed-in JWT authorization probes or cross-tenant Storage attempts are run on PR/push; these require the dedicated approved DEV environment and two test accounts.

## Owner approval gate: only then deploy DEV

- Approve explicit subscription, resource group `GenAI_Galaxy`, planned Function hosting tier/APIM network and expected monthly ceiling before any provisioning.
- Confirm gateway routing and origin-blocking in a staging test; demonstrate missing/fake/expired JWT denial, direct origin denied, replayed/forged owner IDs denied, and per-user rate-limit 429 on a dedicated fixture account.
- Confirm rollback: disable public ingress/gateway route, restore previous Function package, invalidate faulty config and preserve isolated audit logs. Never apply schema migrations to the shared database without an additional separate approval.

## Outstanding blockers

Actual gateway policy, real network origin isolation, malware scanning/quarantine, hosted JWT/RLS negative acceptance, integration load tests, cost budget and explicit Azure backend deployment approval.
