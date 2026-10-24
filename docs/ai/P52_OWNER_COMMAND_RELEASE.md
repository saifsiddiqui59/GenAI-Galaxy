# P52 — Owner-only manual GitHub Actions dispatch bridge

This addresses a current connector gap: the GitHub integration can comment
and inspect runs but cannot directly execute `workflow_dispatch`. It does
NOT make Azure deployments automatic. Trigger source is an **owner-authored
issue comment** on the immutable [issue #183](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/183).

The bridge is scoped to GitHub user ID 80577424, the exact public Galaxy
repository, non-PR issue #183, `main` and **exact main SHA matching the
command**. It requires a successful exact-commit three-job main CI run and
refuses if main has changed. It has GitHub Actions dispatch permission but
does not receive cloud keys. Downstream `dev` OIDC secrets/environment and
hard-coded target checks remain unchanged.

Accepted command bodies (replace SHA with current 40-char `main` SHA):
- `DEPLOY_BACKEND_<SHA>`: triggers existing protected
  `galaxy-p3-flex-deploy.yml` with `DEPLOY`; existing pay-as-you-go
  Function and model ONLY, not a new provider or Azure resource.
- `TEST_RLS_<SHA>`: triggers existing protected
  `galaxy-ephemeral-rls.yml` with `TEST`; two temporary Galaxy
  Auth accounts with full cleanup, no paid AI.
- `SMOKE_NOCHARGE_<SHA>`: triggers existing manual `READONLY` workflow
  and only anonymous CORS/401 checks on the existing Function.

The bridge does **NOT** dispatch the paid one-model-call smoke, re-provision
models or Functions, publish the public root website, change IAM, touch
other projects, or bypass any `dev` environment protection. Each downstream
Action must be separately verified through its run status and logs;
dispatch success does not mean deployment success.

Initial source preparation does not itself issue release commands. Cloud
deployment/acceptance requires the owner to approve actual live execution,
and source merged into main with green CI. Every command must use exact
current reviewed main SHA, so unrelated parallel V6 merges invalidate stale
commands. See private Cost Hub issue #10 for that separate blocked runner.
