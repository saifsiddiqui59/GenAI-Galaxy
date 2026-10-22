# Next Tasks — M4

1. **Content:** Hand-author and technically review the remaining 98 incomplete topic entries. Update 19 shorter 30–60-second model answers, test spoken response times and add expert references. Verify missing historical transcripts/files when supplied; no false claim of exhaustive audit.
2. **Remote Git/CI:** Create or grant access to a **new private** `saifsiddiqui59/GenAI-Galaxy` repository; publish saved local Git commits as small PRs and verify actual Actions run IDs before merging. The current connector cannot create repositories and the requested name returns 404.
3. **Supabase live RLS:** Create two isolated test users and test signed-in progress, attempt rows, own-private uploads and denied cross-user access. No cross-user production data or schemas should be altered without approval.
4. **Azure staging (approval required):** Explicitly approve new Azure RG/storage/API budget, APIM per-user quotas, function ingress restrictions, managed secret provisioning, security scanning/quarantine and logging. An internal header alone is insufficient. Set private env vars only after these controls work.
5. **Real-world validation:** Test microphone permissions/accents, Azure Speech token expiry, model-judge calibration against human-labeled answers, PDFs with tables/scans, DOCX malware response, web accessibility and performance on real browsers.
6. **Knowledge Vault:** Add malware scanning and asynchronous extraction status before production; OCR only if approved, plus evidence-linked lesson generation and user retention controls.
