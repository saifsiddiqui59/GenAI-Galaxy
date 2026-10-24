# P53 — Isolated AI frontend preview

A **manual-only**, protected GitHub `dev` deployment to an existing
allowlisted Azure Storage account. No new account, function, model,
provider credentials or paid model calls.

**Preview URL, only after a successful actual publication**:
`https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-ai-p53/index.html`

The action copies fifteen explicitly named public frontend files, including
eight `features/*.js` scripts, and configures the public evaluator URL
in an ephemeral staging copy only. It requires the successful real protected
backend deployment of pinned SHA
`0be3c0d8f623f4141d26fee6952274607becf30e`, successful
exact-current-main CI, approved Galaxy-only OIDC credentials and a restricted
source diff since that backend pin.

All preview files are re-downloaded and byte-compared. The production root
`$web/index.html` is downloaded and SHA256-checked before and after, and
never uploaded. The V6 cinematic work and production homepage are not changed.

After this PR merges and its main CI succeeds, the owner-only GitHub
issue #183 command `PREVIEW_AI_<exact-current-main-SHA>` dispatches the
existing protected manual workflow. That command is **not** a paid AI test.

**Still not certified:** a positive signed-in model evaluation or tutor
response with human-reviewed correctness, no unauthorized public access,
functional phone/browser UI, actual Azure billed cost reconciliation, and
120-case calibration (explicitly deferred). Any timeout in the hosted
Function smoke must be diagnosed; do not call deployment alone a production pass.
