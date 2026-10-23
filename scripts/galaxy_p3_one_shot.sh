#!/usr/bin/env bash
# Run from Galaxy main. Stops on any failure; never logs secret values.
set -Eeuo pipefail
REPO='saifsiddiqui59/GenAI-Galaxy'
ENV='dev'
fail() { echo "ERROR: $*" >&2; exit 1; }

command -v gh >/dev/null || fail 'Install GitHub CLI (gh) first.'
command -v git >/dev/null || fail 'Install Git first.'
gh auth status >/dev/null 2>&1 || gh auth login
name="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
[[ "$name" == "$REPO" ]] || fail 'Use Galaxy repository, not another project.'
[[ "$(git branch --show-current)" == main ]] || fail 'Use the main branch.'

env_names="$(gh secret list -R "$REPO" -e "$ENV" --json name -q '.[].name')" || fail 'Cannot check dev secrets.'
repo_names="$(gh secret list -R "$REPO" --json name -q '.[].name')" || fail 'Cannot check repo secrets.'
has_secret() { grep -Fxq "$1" <<< "$env_names"$'\n'"$repo_names"; }

ensure_secret() {
  local label="$1" supplied="$2"
  if has_secret "$label"; then echo "EXISTS: $label"; return; fi
  if [[ -z "$supplied" ]]; then
    echo "MISSING: $label"
    IFS= read -r -s -p "Paste $label (hidden): " supplied </dev/tty || fail "Missing $label"
    echo
  fi
  [[ -n "$supplied" ]] || fail "Empty $label"
  case "$label" in
    GALAXY_SUPABASE_PUBLISHABLE_KEY)
      [[ "$supplied" == sb_publishable_* || "$supplied" == eyJ* ]] || fail 'Invalid Supabase public key format';;
    GALAXY_SUPABASE_ADMIN_KEY)
      [[ "$supplied" == sb_secret_* || "$supplied" == eyJ* ]] || fail 'Invalid Supabase Auth admin key format';;
    GALAXY_AZURE_OPENAI_ENDPOINT)
      supplied="$(printf '%s' "$supplied" | sed 's#/$##')"
      [[ "$supplied" == https://*.openai.azure.com || "$supplied" == https://*.services.ai.azure.com ]] || fail 'Invalid Azure OpenAI endpoint';;
  esac
  printf '%s' "$supplied" | gh secret set "$label" -R "$REPO" -e "$ENV" || fail "Cannot save $label"
  env_names="$env_names"$'\n'"$label"
  unset supplied
  echo "SAVED: $label"
}
ensure_secret AZURE_CLIENT_ID '737d67b7-4984-48bb-bb1f-5f62599f645c'
ensure_secret AZURE_SUBSCRIPTION_ID '3a5e8018-40a4-49e3-bcba-a9af3344f50e'
ensure_secret AZURE_TENANT_ID ''
public_key="$(sed -n "s/^const SB_PUBLISHABLE_KEY='\([^']*\)'.*/\1/p" app.js | head -n 1)"
[[ "$public_key" == sb_publishable_* ]] || fail 'Galaxy public key missing from app.js'
ensure_secret GALAXY_SUPABASE_PUBLISHABLE_KEY "$public_key"
unset public_key
ensure_secret GALAXY_SUPABASE_ADMIN_KEY ''
# Dedicated model is created/verified by the model workflow using OIDC.
# No endpoint, model deployment or API key is requested from the user.

vars="$(gh variable list -R "$REPO" -e "$ENV" --json name -q '.[].name')" || fail 'Cannot access dev variables.'
if ! grep -Fxq GALAXY_STORAGE_ACCOUNT <<< "$vars"; then
  gh variable set GALAXY_STORAGE_ACCOUNT -R "$REPO" -e "$ENV" -b 'gengalaxy1429841605' || fail 'Cannot configure public Galaxy storage name'
fi

last_run() {
  gh run list -R "$REPO" --workflow "$1" --branch main --event workflow_dispatch --limit 30 --json databaseId -q '[.[].databaseId] | max // 0'
}
run_workflow() {
  local wf="$1" key="$2" val="$3" extra="${4-}" prev id tries
  prev="$(last_run "$wf")" || fail "Cannot inspect $wf"
  echo "START: $wf"
  if [[ -n "$extra" ]]; then
    gh workflow run "$wf" -R "$REPO" --ref main -f "$key=$val" -f "$extra" || fail "Cannot dispatch $wf"
  else
    gh workflow run "$wf" -R "$REPO" --ref main -f "$key=$val" || fail "Cannot dispatch $wf"
  fi
  id=0
  for ((tries=1;tries<=60;tries++)); do
    id="$(last_run "$wf")" || fail "Cannot inspect run of $wf"
    if [[ "$id" =~ ^[0-9]+$ ]] && (( id > prev )); then break; fi
    sleep 3
  done
  [[ "$id" =~ ^[0-9]+$ ]] && (( id > prev )) || fail "No new workflow run found for $wf"
  echo "https://github.com/$REPO/actions/runs/$id"
  if ! gh run watch "$id" -R "$REPO" --compact --exit-status; then
    gh run view "$id" -R "$REPO" --log-failed || true
    fail "$wf failed. All subsequent steps skipped."
  fi
  echo "PASSED: $wf"
}

run_workflow galaxy-ephemeral-rls.yml confirm TEST
run_workflow galaxy-p3-model-provision.yml confirm PROVISION_MODEL
run_workflow galaxy-p3-flex-provision.yml confirm PROVISION
run_workflow galaxy-p3-flex-deploy.yml confirm DEPLOY
run_workflow galaxy-ephemeral-live-ai.yml confirm TEST
run_workflow galaxy-static-deploy.yml confirm_deploy DEPLOY enable_evaluator=AI_READY
echo 'SUCCESS: Supabase Auth, dedicated pay-as-you-go Galaxy LLM, Flex backend, live AI and static frontend Actions all passed.'
echo 'https://gengalaxy1429841605.z29.web.core.windows.net/'
