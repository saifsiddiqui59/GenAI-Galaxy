# Next Tasks — M5

1. Create empty **private** `saifsiddiqui59/GenAI-Galaxy`; connected GitHub has no create-repository action and repo returns 404. Publish prepared Git branches from local ZIP using Git Bash and helper. Review and merge PRs only after **real** green GitHub Actions results.
2. Follow `docs/AZURE_GITHUB_OIDC.md`: add protected `dev` environment, three AZURE_* identifiers, federated credential on Azure app **GenAI_Galaxy** using actual immutable repo ID, and narrow Reader on existing Azure RG **GenAI_Galaxy**. Run read-only manual verification; inspect logs. Do not copy RetailGrowthAI's trust.
3. For optional static-site release, identify actual Azure Storage account (cannot be `GenAI_Galaxy`, an invalid Storage name), configure `GALAXY_STORAGE_ACCOUNT`, grant only that Storage account Blob Data Contributor and explicitly invoke manual `DEPLOY` after approved review. No auto-provision/deploy.
4. Continue 98 overview-only lessons, manual content QA, live auth/voice/tenant-isolation testing, frontend API gateway setup and safe document pipeline. Do not label prototype production-ready.

GitHub checks run on push and PR only **after** the remote exists. Current status: local-only and blocked from triggering GitHub Actions or verifying Azure resources.
