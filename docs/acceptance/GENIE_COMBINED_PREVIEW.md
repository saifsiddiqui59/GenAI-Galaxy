# Genie Guardian — Combined Preview

Draft integration PR #58 builds on baseline PR #47 and combines independent PRs #52 (cosmic visuals), #53 (flight), #54 (validated progress), and #55 (quality gates). Coordinator issue #56 tracks reviews.

Sequence: verified sign-in and owner-scoped progress load → Genie appears with fully mastered worlds in sack → glowing next chapter offered with both hands → bounded planet flight → recommended lesson. Missing anchors, reduced motion, Abort and animation failures all fall back to navigation. Skip/Escape dismiss without navigation. No mastery is awarded by cosmetic features.

Integrated GitHub Actions run #39963863799 passed 3/3 synthetic curriculum/API, browser and release-security jobs. Synthetic screenshots are attached to the browser job as galaxy-genie-previews. Tests do not establish real Supabase login, hardware device quality or hosted website deployment.

Release order: review baseline #47, review each module PR, inspect net coordinator integration diff, require fresh 3/3 CI, merge only in controlled sequence. Hosted Azure static deployment is a separate owner-approved manual protected operation after main merge and must pass public asset hash parity. No new paid AI calls, backend provisioning, or shared Supabase mutations are part of these PRs.
