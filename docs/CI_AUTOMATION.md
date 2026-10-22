# GitHub Actions Plan (not yet run remotely)

Local `.github/workflows/galaxy-ci.yml` is ready to run on feature pushes and PRs. The `curriculum-and-api` job installs pinned Python dependencies, checks all 16 current Python tests, Node adaptive engine, syntax, source-owned rubrics and repeatable coverage output. The `browser-smoke` job installs Chromium/Playwright 1.57.0 and checks desktop/mobile and reduced-motion navigation plus a **simulated** microphone transcript.

All these tests passed locally on 2026-10-22. They have NOT run on GitHub because the Galaxy remote repository was unavailable. Never claim a green CI badge until a real Actions run has passed. Add staging integration and cross-user tests before release.

M3 local Python tests increased to 16; CI remains unverified remotely. Browser smoke checks continue to use mocked speech and are not real microphone or cloud-auth proof.
