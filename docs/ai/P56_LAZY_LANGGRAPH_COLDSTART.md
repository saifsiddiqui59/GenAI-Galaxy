# P56 — Isolate expensive LangGraph import from evaluator and anonymous startup

## Trigger

Backend Azure deployment #40101916768 succeeded, and owner-protected
anonymous runtime diagnostics #40103801088 found the Function App `Running`
with four registered functions, including `evaluate` and `tutor`.
The same job confirmed expected evaluator OPTIONS 200 and anonymous POST
401, but `tutor` OPTIONS timed out after 40 seconds. Earlier hosted no-charge
smokes #40102276516 and #40103576334 also had intermittent timeout failures.
These are genuine reliability failures, not proof of paid model quality.

## Source-only focused change

`api/function_app.py` no longer imports `tutor_graph` (and its
`langgraph` transitive modules/graph compilation) at **module import**.
Instead, the tutor handler imports and compiles the existing graph only
**after successful JWT authentication and after OPTIONS preflight returns**.

This preserves the existing LangGraph tutor implementation, one quota-
controlled paid model call, free reference/quiz modes, authorization,
interview evaluator behavior and fail-closed error handling. It reduces
work required on new Function workers just to serve evaluator/anonymous
requests, and can help on cold-start/limited-memory 512 MiB Flex workers.
**It is a plausible optimization, not a confirmed root cause.**

Normal GitHub CI remains no-network. New regression checks prove the
module-level import is absent and authentication/preflight precede the
lazy graph import. No new resource, IAM role, always-ready instance,
secret, model/provider, paid AI test, public website upload, Supabase
mutation, V6 change or speech/vault activation.

## Required verification

After CI and merge, rerun the existing, manually owner-controlled Galaxy
P3 Flex **DEPLOY** workflow for this exact source SHA (no provisioning), then
run the manual no-charge evaluator+tutor CORS/anonymous route acceptance
and read-only diagnostic. If the tutor still times out, record the precise
failure; inspect Azure worker logs/traffic instead of claiming solved.

Deployment success, no-charge anonymous 401, real user RLS, human
interview accuracy and Azure Cost Management billed spend are distinct.
The 120-case human golden suite remains deferred.
