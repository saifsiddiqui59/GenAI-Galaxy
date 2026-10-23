# Genie Preview on existing Azure Blob static website

Status: deployment workflow prepared; no Azure upload has occurred yet.

Deployment uses .github/workflows/galaxy-genie-storage-preview.yml on main, manually triggered by entering DEPLOY_PREVIEW in GitHub Actions. It uses the existing protected dev environment and existing Galaxy Azure OIDC service principal, not storage account keys.

Immutable source: 0ca9cc809b86cec07a2a640ffc01a2df39953b89 from combined draft PR #58. The deployment copies only a fixed public file allowlist into the separate previews/genie-0ca9cc80 prefix in the existing $web container; it does not replace the site's root index.html.

Preview-only launcher scripts/genie-preview-demo.js shows the genie with three SYNTHETIC finished worlds, without a sign-in or Supabase fixture. Visiting ?demo=genie triggers the original animation and shows a Replay button. The evaluator URL remains disabled; there are no paid calls.

Steps: (1) review and merge the workflow-only publisher pull request to main after Galaxy 3/3 CI; (2) visit GitHub Actions > Galaxy Genie storage preview (manual, isolated) > Run workflow > main > enter DEPLOY_PREVIEW; (3) approve the protected dev environment if prompted; (4) open the link printed in the successful job summary.

The intended path is /previews/genie-0ca9cc80/index.html?demo=genie on the verified Galaxy static website. Do not treat it as a live URL until the protected run succeeds and hosted file checksums match.

No full-site deployment, real Auth/RLS testing, new Azure resources, payment, secrets, or Supabase mutations are involved.