# P55 — Owner-gated existing-only Azure Function diagnostics

The previously protected Function source deployment completed in
[run #40101916768](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40101916768),
but the **real anonymous** hosted routes in
[run #40102276516](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40102276516)
timed out on both original attempts. This is genuine runtime uncertainty.

This independent read-only workflow avoids any paid model call, Function
deployment, appsettings/secret read, cloud role modification, provider
provisioning, new resources or Supabase writes.

After its reviewed merge and green main CI, issue #183 allows
`DIAG_BACKEND_<exact current main SHA>`. It invokes a separately
protected manual `DIAGNOSE` workflow using existing Galaxy-only OIDC.
The job queries only existing Function app identity/state/hostnames,
always-ready scale configuration and **function names only**. It then issues
four bounded anonymous OPTIONS/POST probes to the two fixed Azure Function
paths. Only origin and synthetic invalid JSON are sent; no bearer/tenant/
provider credentials, no valid paid model evaluation, no quota reservation.
Probe expects 200 on approved-Origin OPTIONS, 401 on anonymous POST.

Observe job logs for actual control-plane/routing outcomes. A failed
function listing/HTTP check must NOT be called a successful hosted tutor.
Do not log private appsettings, JWT, URL SAS/function keys, Azure API keys,
Cost Management invoices or unrelated shared tenants.

Scope: diagnose existing host only. Human-graded model calibration,
a signed-in positive AI call (paid), actual billing reconciliation and
physical device testing remain unverified. 120-case golden suite deferred.
