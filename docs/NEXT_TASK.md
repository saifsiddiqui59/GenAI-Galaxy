# Next Tasks — M4

1. **Content:** Hand-author and technically review the remaining 98 incomplete topic entries. Update 19 shorter 30–60-second model answers, test spoken response times and add expert references. Verify missing historical transcripts/files when supplied; no false claim of exhaustive audit.
2. **Remote Git/CI:** Create or grant access to a **new private** `saifsiddiqui59/GenAI-Galaxy` repository; publish saved local Git commits as small PRs and verify actual Actions run IDs before merging. The current connector cannot create repositories and the requested name returns 404.
3. **Supabase live RLS:** Create two isolated test users and test signed-in progress, attempt rows, own-private uploads and denied cross-user access. No cross-user production data or schemas should be altered without approval.
4. **Azure staging (approval required):** Explicitly approve new Azure RG/storage/API budget, APIM per-user quotas, function ingress restrictions, managed secret provisioning, security scanning/quarantine and logging. An internal header alone is insufficient. Set private env vars only after these controls work.
5. **Real-world validation:** Test microphone permissions/accents, Azure Speech token expiry, model-judge calibration against human-labeled answers, PDFs with tables/scans, DOCX malware response, web accessibility and performance on real browsers.
6. **Knowledge Vault:** Add malware scanning and asynchronous extraction status before production; OCR only if approved, plus evidence-linked lesson generation and user retention controls.

## M4 GitHub handoff

1. Use the steps in `docs/GITHUB_WORKFLOW.md` to create the empty **private** `saifsiddiqui59/GenAI-Galaxy` remote with GitHub CLI, or create it in the GitHub web UI and reconnect ChatGPT. No existing RetailGrowthAI repo should be reused.
2. From an authenticated Windows Git Bash session, run `bash scripts/publish_github.sh --check`, then `--create-private` if absent, then after local checks `--publish`. This pushes known branches and opens **draft stacked PRs**, not a main merge.
3. Review full PR diffs and three individual GitHub Actions jobs; record real run URLs, conclusion and failures. Fix failed branches before retargeting or merging. Mainline post-merge CI must also be inspected.
4. Only then continue 98 unfinished lessons, expert content signoff, real Speech/Azure Auth integration and staged Supabase two-user isolation. Cloud provisioning still needs explicit approval.
