#!/usr/bin/env bash
# Owner-approved initial Galaxy public static-preview bootstrap.
set -euo pipefail
set +x
RG=GenAI_Galaxy
STORAGE=gengalaxy1429841605
REPO=saifsiddiqui59/GenAI-Galaxy
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

[[ "$GITHUB_REPOSITORY" == "$REPO" && "$GITHUB_REF" == "refs/heads/main" ]] || {
  echo "Refusing non-Galaxy or non-main deployment" >&2; exit 2;
}
[[ "$STORAGE" =~ ^[a-z0-9]{3,24}$ ]] || exit 2
[[ "$(az account show --query state -o tsv)" == "Enabled" ]] || exit 2
LOCATION="$(az group show -n "$RG" --query location -o tsv)"
[[ "$LOCATION" == "centralindia" ]] || { echo "Unexpected resource-group location" >&2; exit 2; }
FOUND="$(az storage account list --resource-group "$RG" --query "[?name=='gengalaxy1429841605'].name | [0]" -o tsv)"
if [[ -z "$FOUND" ]]; then
  echo "Creating one Standard_LRS StorageV2 account in $RG"
  az storage account create --resource-group "$RG" --name "$STORAGE"     --location "$LOCATION" --sku Standard_LRS --kind StorageV2     --https-only true --min-tls-version TLS1_2     --allow-blob-public-access false --allow-shared-key-access true     --output none --only-show-errors
else
  echo "Reusing existing named Galaxy account"
fi
ACTUAL_ID="$(az storage account show -g "$RG" -n "$STORAGE" --query id -o tsv)"
[[ "$ACTUAL_ID" == */resourceGroups/"$RG"/providers/Microsoft.Storage/storageAccounts/"$STORAGE" ]] || exit 2
[[ "$(az storage account show -g "$RG" -n "$STORAGE" --query kind -o tsv)" == "StorageV2" ]] || exit 2
[[ "$(az storage account show -g "$RG" -n "$STORAGE" --query sku.name -o tsv)" == "Standard_LRS" ]] || exit 2

# Contributor permits listing account keys; never log or persist the per-run value.
export AZURE_STORAGE_ACCOUNT="$STORAGE"
export AZURE_STORAGE_KEY
AZURE_STORAGE_KEY="$(az storage account keys list -g "$RG" -n "$STORAGE" --query '[0].value' -o tsv)"
[[ -n "$AZURE_STORAGE_KEY" ]] || { echo "No temporary upload authorization" >&2; exit 2; }
trap 'unset AZURE_STORAGE_KEY' EXIT
az storage blob service-properties update --account-name "$STORAGE"   --static-website true --index-document index.html --404-document index.html   --output none --only-show-errors

STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"; unset AZURE_STORAGE_KEY' EXIT
mkdir -p "$STAGE/data" "$STAGE/speech"
for FILE in index.html styles.css app.js runtime-config.js data/curriculum.json data/lessons.json speech/azure-speech-adapter.js; do
  [[ -f "$ROOT/$FILE" ]] || { echo "Missing approved asset: $FILE" >&2; exit 2; }
  install -m 0644 "$ROOT/$FILE" "$STAGE/$FILE"
done
if grep -Eiq 'AZURE_CLIENT_SECRET|AZURE_SPEECH_KEY|SUPABASE_SERVICE_ROLE_KEY|supabase_service_role' "$STAGE/runtime-config.js"; then
  echo "Refusing secret marker in frontend config" >&2; exit 2;
fi
az storage blob upload-batch --account-name "$STORAGE" --destination '$web'   --source "$STAGE" --overwrite true --only-show-errors --output none

SITE_URL="$(az storage account show -g "$RG" -n "$STORAGE" --query primaryEndpoints.web -o tsv)"
[[ "$SITE_URL" == https://*.web.core.windows.net/ ]] || {
  echo "Unexpected website URL" >&2; exit 2;
}
echo "GALAXY_STATIC_SITE_URL=$SITE_URL"
echo "Published seven allowlisted public assets only."
if curl --fail --silent --show-error --retry 5 --retry-delay 3 "$SITE_URL"index.html -o /dev/null; then
  echo "HTTP preview check: index.html reachable"
else
  echo "::warning::Static endpoint not yet reachable; verify after propagation"
fi
