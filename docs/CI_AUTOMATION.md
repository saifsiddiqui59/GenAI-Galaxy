# GitHub Actions Plan (not yet run remotely)

Local `.github/workflows/galaxy-ci.yml` is ready to run on feature pushes and PRs. The `curriculum-and-api` job installs pinned Python dependencies, checks all 16 current Python tests, Node adaptive engine, syntax, source-owned rubrics and repeatable coverage output. The `browser-smoke` job installs Chromium/Playwright 1.57.0 and checks desktop/mobile and reduced-motion navigation plus a **simulated** microphone transcript.

All these tests passed locally on 2026-10-22. They have NOT run on GitHub because the Galaxy remote repository was unavailable. Never claim a green CI badge until a real Actions run has passed. Add staging integration and cross-user tests before release.

M3 local Python tests increased to 16; CI remains unverified remotely. Browser smoke checks continue to use mocked speech and are not real microphone or cloud-auth proof.

## M4 GitHub workflow readiness (not remotely executed)

Based on the RetailGrowthAI coordinator's verified process, the Galaxy workflow now runs three independent read-only jobs: `curriculum-and-api`, `browser-smoke`, and `release-safety`. It triggers on `main`, `feat/**`, `fix/**`, `chore/**` pushes and PRs to `main` or a feature branch (for stacked review). A separate `workflow_dispatch` trigger is available when the workflow lives on the default branch. Jobs have explicit timeout limits; superseded runs are cancelled.

`release-safety` checks that the publishing script pins Galaxy-only private repository/account/origin, that CI never deploys or uses secrets, and that the public runtime configuration remains URL-only. This is *targeted static checking*, not a full secret scan or live tenant-isolation proof. Syntax checks and local release-safety tests passed, but **GitHub Actions has not executed on Galaxy**. Do not copy RetailGrowthAI's CI run IDs as Galaxy evidence. See `docs/GITHUB_WORKFLOW.md` for the real PR and coordinator verification sequence.

## M5 GitHub Azure workflows (separate from CI)

`galaxy-azure-verify.yml` is a **manual** main-only `dev` OIDC read-only resource group inventory check. `galaxy-static-deploy.yml` is a **manual**, main-only, explicit DEPLOY + protected `dev` environment static upload to a verified existing Storage website. Neither workflow uses PR secrets, automatic cloud changes, account keys or provisioning. See `docs/AZURE_GITHUB_OIDC.md`. Both are **prepared locally only**, no GitHub Action run ID or Azure resource verification.

## V6 pinned preview acceptance

The separate V6 publisher reads exact-source Actions results, requires successful curriculum-and-api/browser-smoke/release-safety jobs, then uses protected dev OIDC for only the fixed existing-storage prefix. It compares every staged hosted SHA256 and the before/after root index hash. Hosted Chromium PNG/JSON/manifest evidence is retained for 14 days as `galaxy-v6-hosted-evidence`. No cloud execution on PR/push.

## V6 verified CI and hosted evidence

Source validation #40021350132: 3/3 success at `6614f7903c52b81f471083321a49f8870b5becdc`. Publisher PR #135: core 3/3 #40021933086 plus V5 browser #40021933103 success. Replacement main run #40022214773: 3/3 success after another chat's update cancelled the initial post-merge run. Protected deployment/hosted-browser #40022442803: both jobs success, 18 hosted SHA256 matches and unchanged homepage. Artifact #12532090063 contains 13 PNGs, four browser JSON records and three parity/source files; its SHA256 is `7c8e7017fd3c38bb99c6fd01b81431b03f3ee7a2f2eec14a9d07e8d70e477126`. Actual hosted PNGs were downloaded and opened.
