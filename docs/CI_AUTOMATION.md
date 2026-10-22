# CI Automation

`galaxy-ci.yml` runs `python -m unittest discover -s tests -v`, `node tests/test_engine.cjs`, `node --check app.js`, `node --check speech/azure-speech-adapter.js` on pushes/PRs. This definition is **only local** until a private GitHub repo is created and code pushed; no GitHub Actions run has occurred.

Browser/E2E tests should be added to the next PR; no CI badge or production claim until a real run passes.
