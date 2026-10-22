# Next Tasks — M3

1. **Publish safely:** Owner creates a new *private* `saifsiddiqui59/GenAI-Galaxy` repository or grants a connection that supports repo creation. Push preserved local Git main and feature branch, open small PRs, inspect actual GitHub Actions runs and fix failures. No CI run yet.
2. **Editorial:** Author and independently review remaining **197** topic lessons; validate 30–60-second delivery, references, examples and rubric questions; finish full historical conversation audit if transcripts become available.
3. **Live identity/security:** Add two test accounts, run negative Supabase row/object RLS tests, and check login, uploads and synchronization across distinct browsers. No production user data in tests.
4. **Backend deployment gate:** Approve Azure provisioning/resources and estimate costs; configure Functions with managed secret storage, strict allowed origin, HTTPS, API gateway per-user quotas, abuse logging and malicious-file quarantine. Never enable eval/Speech token route by flipping a flag until the actual gateway exists.
5. **Production testing:** Deploy restricted staging environment only after approval; validate real Azure model judge calibration, speech token expiration and microphone behavior, PDF/DOCX processing, malformed ZIP/PDF handling, performance, keyboard/screen reader/reduced-motion and mobile layout.
6. **Content vault enhancement:** Add antivirus scanner/quarantine and user-facing asynchronous processing states, scanned-PDF OCR where approved, evidence-linked lesson generation with source citations and privacy/retention policy.
