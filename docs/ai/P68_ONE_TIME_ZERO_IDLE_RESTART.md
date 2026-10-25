# P68 — One-time guarded restart of existing on-demand Azure Function

### Proven incident
Two independent, no-token live probes reproduced tutor POST HTTP 503 at
~60.9s (runs #40175161718 and #40175629376). The second observed
`app_trace_present=false`, unlike evaluator's prompt HTTP 401
with `app_trace_present=true`. Fast network TLS and a missing app-level
trace point toward the host/worker/gateway, **not** a confirmed model bug.
Microsoft documents a distinct, non-configurable 60-second language-specific
worker startup timeout. That is consistent with, not proof of, this failure.
See [Azure Functions scale documentation](https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale).

### Controlled remediation (no additional idle cost)
Owner command after exact-main CI: `RESTART_ONCE_<current-main-40-char-SHA>`
on existing GitHub issue #183. Invokes the protected DEV-only manual
`galaxy-p68-one-time-restart.yml` workflow.

- Requires dedicated Galaxy OIDC, existing `GenAI_Galaxy` resource group
  and exact already-provisioned `gengalaxy-p3-1429841605` app identity.
- Checks app Running, `instanceMemoryMB=512`,
  `maximumInstanceCount=2` and `alwaysReady=[]`.
- Performs **exactly one** Azure CLI `az functionapp restart`. No new
  resources, Function plan upgrade, Always Ready setting, appsettings
  write, redeployment or billing workspace.
- Validates unchanged app identity, 512 MB, max instances 2 and zero
  Always Ready **after restart**.
- Calls existing P66 **anonymous-only** evaluator/tutor HTTP 401/CORS
  acceptance, with a 100s maximum on one request per route and no
  automatic retries. No bearer JWT or AI model call.
- A restart may momentarily interrupt active Function requests. This
  is a controlled DEV incident remedy, **not** proof of a permanent fix.
- Persistent 503s without `X-Galaxy-Trace-Id` after restart should be
  escalated to Azure hosting support using time-correlated, private
  host telemetry. Cost-bearing monitoring remains separate approval.

Require at least **two independent no-charge acceptance passes** before
unlocking one bounded authenticated evaluator+tutor test. Human reviewer
grading correctness remains an independent P1 gate.
