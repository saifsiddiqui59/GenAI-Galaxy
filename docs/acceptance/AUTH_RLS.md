# Auth and two-account RLS — acceptance gate

**Prepared, not run against hosted Supabase.** Only `saifsiddiqui59/GenAI-Galaxy` and the pre-existing `genai_study_*` tables + private `genai-study-docs` bucket are in scope.

## Before any manual live run

1. Obtain separate **explicit owner approval** for actual hosted fixture writes; an approved PR or a passing offline test is **not** authorization to run this.
2. Create/use two consenting, dedicated **Galaxy-only** Supabase Auth test users A and B, both with verified distinct UUIDs, confirmed email addresses and no customer data.
3. In GitHub's protected `dev` environment, manually set `GALAXY_SUPABASE_PUBLISHABLE_KEY` (anon/publishable, **never service-role**), `GALAXY_TEST_A_EMAIL`, `GALAXY_TEST_A_PASSWORD`, `GALAXY_TEST_B_EMAIL`, `GALAXY_TEST_B_PASSWORD`. Do not paste values into PRs or logs.
4. Confirm authentication redirect URL allowlist includes only the owner-approved Galaxy HTTPS static site. Real password recovery must verify email delivery, expired links, retry and account state without revealing whether an email exists.
5. Inspect `tests/live_rls_check.py` for the fixture namespace `__galaxy_rls_test__/` and cleanups; make sure nothing targets unrelated tenants/tables, and make sure `GALAXY_SUPABASE_URL` matches the exact pinned Galaxy project.
6. Owner starts the manually triggered `Galaxy two-account RLS acceptance (manual)` workflow **from main** with literal confirmation `TEST`, protected `dev` environment and the exact consented accounts. Never enable on push/PR.

## Evidence required to mark live acceptance passed

- Account A can create/read only its own progress, attempts, document metadata and Storage objects.
- Account B cannot read, update, delete or spoof account A's records, and vice versa. Verify row counts, zero affected rows and authorization responses; never accept a 200 status by itself as isolation proof.
- Confirm every temporary object was deleted under its real owner identity and no foreign user data was modified. Failure to clean up must be reported as a blocker, not silently ignored.
- Real account recovery request and password update use the authorized Supabase Auth recovery session; invalid/expired tokens do not update passwords.
- Save workflow URL/run ID, specific test observations and redacted logs. **Do not claim success from offline mocks**.

## Current evidence

GitHub CI can test only the **safety of the manual workflow, fail-closed project scope and key classes**. The live negative tests and real password-reset emails have not been run. This branch does not provision cloud resources, create test users, run the manual workflow or alter database policies.
