#!/usr/bin/env bash
# Provision or verify ONLY the dedicated Galaxy pay-as-you-go LLM.
# Runs with Azure GitHub OIDC in manual workflow. Never outputs API keys.
set -Eeuo pipefail
: "${AZURE_SUBSCRIPTION_ID:?Azure subscription must be configured}"
RG='GenAI_Galaxy'
NAME='gengalaxy-ai-sin-1429841605'
REGION='southindia'
DEPLOY='galaxy-gpt-41-mini'
MODEL='gpt-4.1-mini'
VERSION='2025-04-14'
CAPACITY='5'
SKU='Standard'

fail() { echo "::error::$*" >&2; exit 1; }
current_sub="$(az account show --query id -o tsv)"
[[ "$current_sub" == "$AZURE_SUBSCRIPTION_ID" && "$current_sub" == '3a5e8018-40a4-49e3-bcba-a9af3344f50e' ]] || fail 'Azure subscription mismatch'
rg_region="$(az group show -n "$RG" --query location -o tsv)"
[[ "${rg_region,,}" == 'centralindia' ]] || fail 'Existing Galaxy resource group is missing or in an unexpected region'

# A model can be deployed in South India while remaining in the approved Galaxy
# resource group. Regional Standard confines model processing to that region.
existing="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query id -o tsv 2>/dev/null || true)"
if [[ -z "$existing" ]]; then
  echo 'Creating dedicated Galaxy Azure OpenAI S0 resource (southindia)...'
  az cognitiveservices account create -g "$RG" -n "$NAME" -l "$REGION" \
    --kind OpenAI --sku S0 --custom-domain "$NAME" --yes -o none
else
  [[ "$existing" == */resourceGroups/"$RG"/providers/Microsoft.CognitiveServices/accounts/"$NAME" ]] ||
    fail 'Existing resource is outside the dedicated Galaxy resource group'
  echo 'Dedicated Galaxy Azure OpenAI resource already exists: reusing without modifying its SKU.'
fi

resource_id="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query id -o tsv)"
region="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query location -o tsv)"
kind="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query kind -o tsv)"
account_sku="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query sku.name -o tsv)"
[[ "$resource_id" == */resourceGroups/"$RG"/providers/Microsoft.CognitiveServices/accounts/"$NAME" ]] ||
  fail 'Azure OpenAI resource identity mismatch'
[[ "${region,,}" == "$REGION" && "$kind" == OpenAI && "${account_sku^^}" == S0 ]] ||
  fail 'Existing account is not the approved regional OpenAI S0 resource'

deployment="$(az cognitiveservices account deployment show -g "$RG" -n "$NAME" \
  --deployment-name "$DEPLOY" --query name -o tsv 2>/dev/null || true)"
if [[ -z "$deployment" ]]; then
  echo 'Deploying gpt-4.1-mini regional Standard pay-per-use (no reserved PTUs)...'
  # Fail if this subscription has insufficient model-specific regional quota.
  # Do not silently switch to GlobalStandard or another country/region.
  az cognitiveservices account deployment create -g "$RG" -n "$NAME" \
    --deployment-name "$DEPLOY" \
    --model-name "$MODEL" --model-version "$VERSION" --model-format OpenAI \
    --sku-name "$SKU" --sku-capacity "$CAPACITY" -o none
else
  echo 'Dedicated Galaxy model deployment already exists: validating, never replacing it.'
fi
actual_model="$(az cognitiveservices account deployment show -g "$RG" -n "$NAME" \
  --deployment-name "$DEPLOY" --query properties.model.name -o tsv)"
actual_version="$(az cognitiveservices account deployment show -g "$RG" -n "$NAME" \
  --deployment-name "$DEPLOY" --query properties.model.version -o tsv)"
actual_sku="$(az cognitiveservices account deployment show -g "$RG" -n "$NAME" \
  --deployment-name "$DEPLOY" --query sku.name -o tsv)"
[[ "$actual_model" == "$MODEL" && "$actual_version" == "$VERSION" && "$actual_sku" == "$SKU" ]] ||
  fail 'Existing Galaxy LLM deployment is not the approved pay-as-you-go regional model'

endpoint="$(az cognitiveservices account show -g "$RG" -n "$NAME" --query properties.endpoint -o tsv)"
[[ "$endpoint" == "https://$NAME.openai.azure.com/" || "$endpoint" == "https://$NAME.openai.azure.com" ]] ||
  fail 'Unexpected OpenAI endpoint on dedicated Galaxy resource'
echo "Dedicated Galaxy LLM verified: $MODEL ($VERSION), $REGION, $SKU, deployment $DEPLOY"
echo "Public resource endpoint: $endpoint"
echo 'API keys intentionally NOT retrieved or written to GitHub secrets in this step.'
