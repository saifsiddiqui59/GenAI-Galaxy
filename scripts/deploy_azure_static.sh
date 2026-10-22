#!/usr/bin/env bash
set -euo pipefail
# Provision and deploy ONLY after explicit approval. Dry run without approval.
if [[ "${1:-}" != '--approve-provisioning' ]]; then
  echo 'Blocked: requires explicit provisioning approval and --approve-provisioning flag.' >&2
  exit 2
fi
: "${GALAXY_AZ_RG:?Set GALAXY_AZ_RG for a new dedicated resource group}"
: "${GALAXY_AZ_STORAGE:?Set globally unique GALAXY_AZ_STORAGE (lowercase)}"
GALAXY_AZ_REGION="${GALAXY_AZ_REGION:-centralindia}"
az group create --name "$GALAXY_AZ_RG" --location "$GALAXY_AZ_REGION"
az storage account create --name "$GALAXY_AZ_STORAGE" --resource-group "$GALAXY_AZ_RG" --location "$GALAXY_AZ_REGION" --sku Standard_LRS --kind StorageV2 --allow-blob-public-access true
az storage blob service-properties update --account-name "$GALAXY_AZ_STORAGE" --auth-mode login --static-website --index-document index.html --404-document index.html
cd "$(dirname "$0")/.."
# Deploy only runtime assets, never V3 source, local reports, or confidential documents.
mkdir -p /tmp/genai-galaxy-static/{data,speech}
cp index.html styles.css app.js /tmp/genai-galaxy-static/
cp data/curriculum.json data/lessons.json /tmp/genai-galaxy-static/data/
cp speech/azure-speech-adapter.js /tmp/genai-galaxy-static/speech/
az storage blob upload-batch --account-name "$GALAXY_AZ_STORAGE" --auth-mode login --destination '$web' --source /tmp/genai-galaxy-static --overwrite true
az storage account show --name "$GALAXY_AZ_STORAGE" --resource-group "$GALAXY_AZ_RG" --query primaryEndpoints.web -o tsv
