# Next Tasks — after Azure static preview (2026-10-22)

## Completed, independently checked
- Private Galaxy repo, GitHub Actions CI, feature PRs #1–#5, and dedicated Entra GitHub OIDC trust.
- Resource group GenAI_Galaxy in centralindia, one low-cost GPv2 Standard_LRS account gengalaxy1429841605, and Blob $web static website.
- Website: https://gengalaxy1429841605.z29.web.core.windows.net/ ; GitHub Actions HTTP smoke #39804008329 verified all eight routes as HTTP 200. No additional cloud backend resources deployed.

## Remaining, in dependency order
1. **Browser acceptance:** Owner inspect real site on mobile/desktop, planet clicks, content, reduced-motion setting and microphone permission. GitHub browser test uses simulated STT, not live hardware.
2. **Live authentication / isolation:** Verify existing Supabase voice_agent_call sign-in, progress rows, RLS, vault permissions, password/reset and negative two-user tests using Galaxy-only fixtures. Never modify unrelated tenants/projects.
3. **Repeat deployments:** Set GitHub dev environment variable GALAXY_STORAGE_ACCOUNT=gengalaxy1429841605; assign narrowly scoped Storage Blob Data Contributor only on this account to the Galaxy OIDC service principal if using existing manual keyless deploy workflow. The initial bootstrap's temporary account key was not persisted.
4. **Private API architecture:** Scope and approve secure Azure Functions + APIM/gateway, per-user quotas, JWT checks, direct-ingress restrictions, Speech broker, model judge, malware scanning and secure document extraction. Do not turn these on merely because the website is live.
5. **Content:** Author the remaining 98 overview-only topics individually. Complete reference verification, SME sign-off, interview-answer timing and regression checks; no generic filler or claiming model review is a factual grade.
6. **Monitoring/cost:** Set Azure spending alert and estimate blob capacity/request costs; retain explicit manual control over further Azure provisioning.

**Site is a publicly accessible frontend preview, not production readiness.**

**Automated browser acceptance update:** Live guest-mode Playwright passed in GitHub Actions #39804869900 for desktop/mobile/reduced motion. Manual owner review of UX, actual microphone/STT permission, real Supabase sign-in and user isolation are still outstanding.
