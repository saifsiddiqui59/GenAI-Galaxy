# Azure Blob static preview — authorized release

On 2026-10-22 the owner approved creating a public Azure Blob static website in resource group GenAI_Galaxy (centralindia). Target storage: gengalaxy1429841605, GPv2 Standard_LRS, HTTPS/TLS 1.2, anonymous blob-container access disabled. The special $web static-website endpoint is public and Azure usage is billable.

The initial bootstrap uploads **only** index.html, styles.css, app.js, runtime-config.js, data/curriculum.json, data/lessons.json, speech/azure-speech-adapter.js. No private documents, vault uploads, resumes, API backend, credentials, reference files or Git metadata.

The dedicated GitHub OIDC principal has Contributor on GenAI_Galaxy, but not Storage Blob Data Contributor. The initial bootstrap temporarily retrieves an account key from Azure ARM, uses it only in the runner environment to configure the public static website and upload allowlisted files, and does not print, save or commit it. For later manual releases, prefer granting Storage Blob Data Contributor on only this account and setting the dev environment variable GALAXY_STORAGE_ACCOUNT=gengalaxy1429841605 for galaxy-static-deploy.yml.

The one-time job requires Galaxy main, the exact merge commit marker [galaxy-bootstrap-approved], and the protected dev GitHub environment, with unit and JS checks before it runs. Remove its automatic push trigger once scheduled, leaving only manual invocation with typed confirmation.

This is a **static frontend preview**, not the production backend. Model evaluation, Speech broker, authenticated document extraction, real multi-user Supabase isolation, and 98 incomplete lessons remain pending.