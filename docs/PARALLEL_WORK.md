# Parallel Workstream Boundaries

- Galaxy UI: `index.html`, `styles.css`, orbital renderer in `app.js` (coordinator integrates shared app).
- Curriculum: `data/**`, `docs/TOPIC_COVERAGE.csv`, `scripts/build_*.py`.
- Speech: `speech/**`, authenticated broker to be assigned after deployment approval.
- Learning: lesson/practice functions in `app.js`, evaluator server future work.
- Vault/security: `sql/**`, document worker future work; no changes to non-Galaxy data.
- QA/CI: `tests/**`, `.github/workflows/**`, `scripts/checkpoint.sh`.

Only coordinator edits shared `app.js`/interfaces and merges PRs; workers create branches and report blockers. All GitHub work stays isolated from RetailGrowthAI/WineShopPOS.
