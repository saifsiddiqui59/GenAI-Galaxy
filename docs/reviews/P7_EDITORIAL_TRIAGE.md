# P7 — Editorial evidence review queue (2026-10-23)

**Not SME certification.** A deterministic audit of all **245** distinct authored Galaxy reference lessons builds a prioritization queue. No source lessons have been rewritten or asserted technically correct through keyword matching.

| Automated signal | Flagged lessons | Meaning |
|---|---:|---|
| Time-sensitive language | 5 | Check references and effective version/date |
| Absolute wording | 67 | Check whether “never/always/exactly” has exceptions |
| First-person delivery claims | 1 | Match any claim to actual project evidence |
| Named vendor/framework behavior | 102 | Verify against current official documentation |
| Structured lesson inventory | 245 | Check eight-part field structure and approximate answer length |

The four flags **overlap**; their totals must not be summed into a count of distinct lessons.

## Specific editorial examples checked

- **Source citations:** Mentions an “effective” policy and currently effective charge schedule. Confirm the citation matches a true retrieved chunk and authorized, dated policy—not a fabricated page reference.
- **Bronze, Silver & Gold:** Distinguishes logical data contracts from separate systems. Validate “rollback/time travel” against log/file retention, and governance claims against the actual Unity Catalog deployment.
- **Window functions:** Uses a deterministic timestamp + tie-breaker example. Engine-specific null ordering and default window frame deserve source/version checks.
- **PySpark DataFrame operations:** Explicitly checks schema, bad-record quarantine, joins, shuffle skew and Delta idempotency. Review parser and Delta-version-specific behavior against actual code.
- **Token & cost telemetry:** Includes hypothetical monitoring design while noting the Galaxy evaluator is *not deployed*. Do not treat this as real model spend or operating experience.
- **Explain project ownership versus proof:** Explicitly distinguishes prototype clinic voice work from proposed banking adaptation. Verify interview project statements against code/logs rather than implying real banking deployment.

## Manual SME review workflow (still required)

Assign a technical reviewer, verify each lesson’s claims against official documentation or internally approved artifacts, attach source URL/version/check date, correct errors with PRs, and run an actual timed spoken answer. Record topic ID, reviewer, source, verdict, and correction. Code CI/regex matches cannot give a passing SME verdict.

Run offline audit in GitHub CI using `python -m unittest discover -s tests`; optional manual output through `python scripts/editorial_audit.py`. Do not add Azure monitoring or unapproved deployment to this editorial workstream.
