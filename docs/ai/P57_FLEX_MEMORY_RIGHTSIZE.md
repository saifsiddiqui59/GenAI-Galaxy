# P57 — Existing Flex Consumption memory rightsizing, reversible

## Verified problem

Protected on-demand Galaxy Flex app `gengalaxy-p3-1429841605`
uses 512 MB (approximately 0.25 CPU). After P56 lazy LangGraph import
deployed, anonymous routes still timed out up to 40 seconds in
[Galaxy no-charge smoke #40114453710](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40114453710)
and [runtime diagnostics #40114455199](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40114455199).
**Cause remains uncertain; increased resources are an experiment, not a fix guarantee.**

Microsoft documents 512 MB, 2048 MB and 4096 MB Flex sizes and
advises 2048 MB for most apps. Flex on-demand billing reflects instance
memory while actively executing; the `alwaysReady=[]` configuration
must remain empty, avoiding an idle baseline. Larger memory can increase
per-execution cost: do NOT assume free grants, zero bill, or fixed budget.
Source: https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan
and https://learn.microsoft.com/azure/azure-functions/pricing .

## Controlled rollout

This PR adds **no automatic resize**. After reviewed merge, green exact
main CI and owner authorization, post **only one** command to owner-only
Galaxy issue #183:
- `SCALE_FLEX_2048_<current 40-character main SHA>` — verifies existing
  app identity, subscription, maximum 2 instances, original 512 MB and
  `alwaysReady=[]`; changes **only** memory to 2048 MB, verifies response.
- `ROLLBACK_FLEX_512_<current 40-character main SHA>` — requires observed
  2048 MB, restores original 512 MB, verifies unchanged concurrency and no
  Always Ready.

Both commands dispatch the *same protected manual workflow* under the
Galaxy-only OIDC identity, not new resources or cloud credentials.
The workflow does not touch RetailGrowthAI, WineShopPOS, V6, Supabase
roles, quotas, model providers, billed smoke or frontend assets.

After scale success run previously merged `SMOKE_NOCHARGE_<SHA>`
twice with multiple-minute separation and owner-protected
`DIAG_BACKEND_<SHA>`. If two runs remain unstable, roll back and
inspect host indexing logs, worker memory, Function diagnostic
telemetry, and platform initialization failures. Do not retry
authenticated paid POST automatically because of double-charge risk.
A successful rightsizing job is **not** positive evaluator/tutor
acceptance, grading calibration or actual Azure cost reconciliation.
