#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m unittest discover -s tests -v
node tests/test_engine.cjs
node --check app.js
node --check runtime-config.js
python -m py_compile api/core.py api/function_app.py
bash -n scripts/checkpoint.sh scripts/publish_github.sh scripts/deploy_azure_static.sh
node --check speech/azure-speech-adapter.js
echo 'Local checks passed. Remote CI and cloud deployment must be verified separately.'
