# GitHub coordination — adapted from RetailGrowthAI (Galaxy-only)

> **Current state, 2026-10-22:** the ChatGPT GitHub connector was verified as `saifsiddiqui59`, and it can read/write the private **RetailGrowthAI** repository. However `saifsiddiqui59/GenAI-Galaxy` returned GitHub `404`, and the connector did **not** expose a `create_repository` action. No Galaxy remote, PR or GitHub Actions run has been created or verified. The steps below are instructions and preflight code, not a successful publication log.

## What we reuse from the RetailGrowthAI agent

- Read `AGENTS.md` and canonical state/next-task/decision/log/interface/CI docs before changing code.
- Work on small feature branches, assign disjoint path ownership and let a coordinator integrate.
- Use stacked PRs where there are dependencies, retargeting to `main` after each lower PR merges.
- Let **GitHub Actions** run reproducible build/security tests on PR/push. Use read-only workflow permissions, no deploy secrets on PRs, timeouts and concurrency cancellation.
- Read the *actual run ID*, conclusion, individual job states and failed logs. Do not confuse a successful smoke test with live Supabase Auth/RLS, real STT, Azure service or editorial content verification.
- Record verified evidence, failed tests and blockers in `PROJECT_STATE.md`, `NEXT_TASK.md`, `DECISIONS.md`, `WORK_LOG.md` after each integrated milestone. Do not edit RetailGrowthAI or WineShopPOS.

## First publish (Windows VS Code / Git Bash)

1. Restore the delivered Galaxy V4 archive containing its `.git` history, open its directory in VS Code and use Git Bash.
2. Install [GitHub CLI](https://cli.github.com/) and run `gh auth login --hostname github.com`. The GitHub connection inside ChatGPT and GitHub CLI login on Windows are **separate** permissions.
3. Run `bash scripts/publish_github.sh --check`. It checks the account and reports whether the target exists; it does not modify GitHub.
4. If absent, run `bash scripts/publish_github.sh --create-private` to create an **empty private** `saifsiddiqui59/GenAI-Galaxy` remote (no RetailGrowthAI/WineShopPOS access or modifications).
5. Run `bash scripts/checkpoint.sh`, then `bash scripts/publish_github.sh --publish`. Publishing refuses a nonprivate repo, an unexpected Git remote, the wrong account or an unclean worktree. It pushes the four known Galaxy branches and opens three *draft* PRs; it does not merge any PR.
6. Verify each push and PR's actual workflow runs in the `GenAI-Galaxy` Actions tab. Fix failures on the relevant branch; only merge after code review and passing checks.

**When the remote exists:** a later ChatGPT conversation with the GitHub connector can directly read files, create branches/PRs, inspect Actions and push fixes, just like the RetailGrowthAI coordinator. It cannot access this local ZIP until the source is published or supplied in the conversation.

## Proposed stacked review order

| Stage | Branch | PR base | Scope |
|---|---|---|---|
| Baseline | `main` | — | Preserved V3 reference, initial V4 shell, original curriculum |
| M2 | `feat/m2-interview-foundations` | `main` | Secure API drafts, speech UI, grading boundary and tests |
| M3 | `feat/m3-curriculum-hardening` | `feat/m2-interview-foundations` | Expanded lessons and backend trust controls |
| M4 | `chore/m4-github-readiness` | `feat/m3-curriculum-hardening` | GitHub bootstrap, CI hardening, documentation |
| M5 | `chore/m5-azure-actions` | `chore/m4-github-readiness` | Azure read-only OIDC workflow and manual existing-static-site deployment |

After M2 merges, rebase/retarget M3 to `main`; after M3 merges, retarget M4 to `main`. Do **not** merge stacked PRs into main without checking the resulting diff and post-merge CI. Git history has been retained, but no remote action has happened.

## M5 Azure read-only and manually approved static workflow

See `docs/AZURE_GITHUB_OIDC.md`. The existing resource group and Entra app are both reported by the owner as `GenAI_Galaxy`; neither has been verified through Azure. `GenAI_Galaxy` is NOT a valid storage account name. A new `chore/m5-azure-actions` branch is stacked on M4 for two **manually triggered** Azure workflows. They do not run on normal CI/PRs. The read-only workflow checks OIDC and RG access; the static upload requires a verified **existing** storage account, explicit `DEPLOY` acknowledgement, tests and a protected environment. **No remote actions have run.**

## CI gates versus real-world verification

GitHub workflows can check Python content tests, Node practice engine, static-safety safeguards and simulated browser STT. They cannot validate real microphone permissions, actual Azure API token issuance, billing safety, cross-user isolation in the shared live Supabase project or correctness of 246 expert explanations without separate staging tests. Add an isolated disposable-Supabase security job only after a migration-led Galaxy-only test fixture has been reviewed. **Never** run RetailGrowthAI migrations against `voice_agent_call` or vice versa.

Cloud provisioning requires separate explicit approval; this Git workflow never provisions Azure or mutates Supabase.
