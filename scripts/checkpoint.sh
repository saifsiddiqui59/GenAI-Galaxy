#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
python -m unittest discover -s tests -v
node tests/test_engine.cjs
node --check app.js
node --check speech/azure-speech-adapter.js
echo 'Local checks passed. Remote CI and cloud deployment must be verified separately.'
