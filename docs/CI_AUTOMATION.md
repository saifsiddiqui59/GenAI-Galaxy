# GitHub Actions Plan (not yet run remotely)

Local `.github/workflows/galaxy-ci.yml` is ready to run on feature pushes and PRs. The `curriculum-and-api` job installs pinned Python dependencies, checks all 16 current Python tests, Node adaptive engine, syntax, source-owned rubrics and repeatable coverage output. The `browser-smoke` job installs Chromium/Playwright 1.57.0 and checks desktop/mobile and reduced-motion navigation plus a **simulated** microphone transcript.

All these tests passed locally on 2026-10-22. They have NOT run on GitHub because the Galaxy remote repository was unavailable. Never claim a green CI badge until a real Actions run has passed. Add staging integration and cross-user tests before release.

M3 local Python tests increased to 16; CI remains unverified remotely. Browser smoke checks continue to use mocked speech and are not real microphone or cloud-auth proof.

## M4 GitHub workflow readiness (not remotely executed)

Based on the RetailGrowthAI coordinator's verified process, the Galaxy workflow now runs three independent read-only jobs: `curriculum-and-api`, `browser-smoke`, and `release-safety`. It triggers on `main`, `feat/**`, `fix/**`, `chore/**` pushes and PRs to `main` or a feature branch (for stacked review). A separate `workflow_dispatch` trigger is available when the workflow lives on the default branch. Jobs have explicit timeout limits; superseded runs are cancelled.

`release-safety` checks that the publishing script pins Galaxy-only private repository/account/origin, that CI never deploys or uses secrets, and that the public runtime configuration remains URL-only. This is *targeted static checking*, not a full secret scan or live tenant-isolation proof. Syntax checks and local release-safety tests passed, but **GitHub Actions has not executed on Galaxy**. Do not copy RetailGrowthAI's CI run IDs as Galaxy evidence. See `docs/GITHUB_WORKFLOW.md` for the real PR and coordinator verification sequence.

## M5 GitHub Azure workflows (separate from CI)

`galaxy-azure-verify.yml` is a **manual** main-only `dev` OIDC read-only resource group inventory check. `galaxy-static-deploy.yml` is a **manual**, main-only, explicit DEPLOY + protected `dev` environment static upload to a verified existing Storage website. Neither workflow uses PR secrets, automatic cloud changes, account keys or provisioning. See `docs/AZURE_GITHUB_OIDC.md`. Both are **prepared locally only**, no GitHub Action run ID or Azure resource verification.
