#!/usr/bin/env bash
# Upload allowlisted public assets to an EXISTING Azure static website.
# Never creates a resource group, storage account, site setting or credential.
set -euo pipefail

: "${GALAXY_AZ_RG:?Set GALAXY_AZ_RG to the explicitly verified resource group}"
: "${GALAXY_AZ_STORAGE:?Set GALAXY_AZ_STORAGE to the existing storage account name}"
if [[ "$GALAXY_AZ_RG" != 'GenAI_Galaxy' ]]; then
  echo 'Refusing a non-Galaxy resource group.' >&2
  exit 2
fi
if [[ ! "$GALAXY_AZ_STORAGE" =~ ^[a-z0-9]{3,24}$ ]]; then
  echo 'Invalid Storage account name: 3-24 lowercase alphanumeric characters required.' >&2
  exit 2
fi
# Never target another storage account, even within the same resource group.
if [[ "$GALAXY_AZ_STORAGE" != 'gengalaxy1429841605' ]]; then
  echo 'Refusing upload: not the owner-approved existing GenAI-Galaxy static account.' >&2
  exit 2
fi
command -v az >/dev/null || { echo 'Azure CLI required.' >&2; exit 2; }
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ARM check proves the storage account is in the exact intended RG.
resource_id="$(az storage account show --resource-group "$GALAXY_AZ_RG" --name "$GALAXY_AZ_STORAGE" --query id --output tsv)"
[[ "$resource_id" == */resourceGroups/"$GALAXY_AZ_RG"/providers/Microsoft.Storage/storageAccounts/"$GALAXY_AZ_STORAGE" ]] || {
  echo 'Storage account was not verified inside the requested resource group.' >&2
  exit 2
}
# Requires only Azure Storage data-plane read permission. Do not enable a site here.
website_enabled="$(az storage blob service-properties show --account-name "$GALAXY_AZ_STORAGE" --auth-mode login --query staticWebsite.enabled --output tsv)"
if [[ "${website_enabled,,}" != true ]]; then
  echo 'Static website is disabled. Stop; do not auto-enable or provision.' >&2
  exit 2
fi

stage="$(mktemp -d)"
trap 'rm -rf "$stage"' EXIT
mkdir -p "$stage/data" "$stage/speech"
# Explicit list: never copy the V3 reference, resume, .git, .env, SQL or server source.
for file in index.html styles.css app.js runtime-config.js data/curriculum.json data/lessons.json speech/azure-speech-adapter.js; do
  [[ -f "$ROOT/$file" ]] || { echo "Missing public asset: $file" >&2; exit 2; }
  install -m 0644 "$ROOT/$file" "$stage/$file"
done
if grep -Eiq '(service_role|AZURE_CLIENT_SECRET|AZURE_SPEECH_KEY|SUPABASE_SERVICE_ROLE_KEY)' "$stage/runtime-config.js"; then
  echo 'Unexpected secret-like setting in public runtime config.' >&2
  exit 2
fi
az storage blob upload-batch --account-name "$GALAXY_AZ_STORAGE" --auth-mode login --destination '$web' --source "$stage" --overwrite true --only-show-errors
# Do not print SAS URLs, blob keys or tenant identifiers.
echo 'Static public assets uploaded to the existing Galaxy storage account.'
