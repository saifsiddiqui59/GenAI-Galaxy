#!/usr/bin/env bash
set -euo pipefail
: "${GALAXY_SOURCE_ROOT:?Specify checked-out immutable Galaxy source}"
: "${GALAXY_STAGE:?Specify temporary stage directory}"
[[ -d "$GALAXY_SOURCE_ROOT/experience/dist" ]] || { echo 'Missing built Vite experience' >&2; exit 2; }
mkdir -p "$GALAXY_STAGE/lesson/data" "$GALAXY_STAGE/lesson/speech"
cp -a "$GALAXY_SOURCE_ROOT/experience/dist/." "$GALAXY_STAGE/"
for file in index.html styles.css app.js runtime-config.js; do
  install -m 0644 "$GALAXY_SOURCE_ROOT/$file" "$GALAXY_STAGE/lesson/$file"
done
for file in curriculum.json lessons.json; do
  install -m 0644 "$GALAXY_SOURCE_ROOT/data/$file" "$GALAXY_STAGE/lesson/data/$file"
done
install -m 0644 "$GALAXY_SOURCE_ROOT/speech/azure-speech-adapter.js" "$GALAXY_STAGE/lesson/speech/azure-speech-adapter.js"
python3 - "$GALAXY_STAGE" <<'PY'
from pathlib import Path
import sys
root=Path(sys.argv[1])
(root/"lesson/runtime-config.js").write_text("""/* Isolated no-paid Galaxy preview. */
window.GALAXY_EVALUATOR_URL='';
window.GALAXY_VAULT_EXTRACT_URL='';
window.GALAXY_SPEECH_BROKER_URL='';
""")
assert (root/"models/guardian.glb").stat().st_size==463988
assert (root/"index.html").is_file()
files=[p for p in root.rglob("*") if p.is_file()]
assert len(files)>=12
for file in files:
 if file.suffix not in {".js",".html",".css",".json"}: continue
 source=file.read_text()
 for token in ("sb_secret_", "service_role", "AZURE_CLIENT_SECRET","AZURE_SPEECH_KEY"):
  assert token.lower() not in source.lower(),f"Forbidden content in {file}"
print(f"Staged {len(files)} public files in isolated directory")
PY
