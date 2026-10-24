# GenAI-Galaxy — read-only Azure Cost Management via existing OIDC

## Scope and status
This is a **source-only** manually invoked GitHub Actions workflow. It does not
create resources, change IAM, run model calls, grant subscription permissions,
or run on push/pull requests. No Azure Cost Management query has been executed
as part of this PR, so **current actual costs and access rights are unverified**.

Workflow: `.github/workflows/galaxy-cost-management-readonly.yml`
Parser: `scripts/report_galaxy_azure_cost.py`
Scope: **GenAI_Galaxy resource group only**, existing Azure subscription and
GitHub `dev` OIDC environment. Costs from other resource groups, billing-level
purchases, taxes, credits and some marketplace fees are not comprehensively
covered by this resource-group view.

## How to verify access
After this PR is reviewed and merged:

1. Open GitHub Actions > **Galaxy Azure Cost Management (manual, read-only)**.
2. Run workflow on `main`, select `CHECK`, and complete any existing `dev`
   environment approval.
3. The job authenticates with the existing Galaxy OIDC app and POSTs a read-only
   `ActualCost` / `MonthToDate` Azure Cost Management Query API request
   (version 2025-03-01), within only the `GenAI_Galaxy` resource group.
4. `CHECK` reports authorization success or failure **without printing
   monetary amounts**. A 403 may require **Cost Management Reader** at the
   `GenAI_Galaxy` resource-group scope, or enabling cost visibility under the
   applicable billing agreement. Do not grant broad subscription Contributor
   for this task.
5. If explicitly willing to publish costs in a **public repository's**
   GitHub Actions logs/summary, rerun with `REPORT_PUBLIC`. This mode outputs
   a month-to-date total and Azure service breakdown grouped by billing
   currency. **It is not private.** Never enable this mode automatically.
6. For confidential ongoing reports, design and approve a separate
   authenticated private destination; do not publish costs or credentials into
   GitHub Actions artifacts, public logs or static frontend.

## Known boundaries
- The Microsoft Cost Management REST API is read-only for this POST; calling it
  does not alter resources, assign roles, or implement a spending limit.
- Azure cost data can lag and must not be confused with a finalized invoice.
- If pagination is returned, the script fails rather than displaying incomplete
  totals.
- No Azure browser session, TinyFish browser profile, password, tenant-wide
  billing role or another project's credentials are needed for the OIDC method.
- The current GitHub connector can author/review this workflow but cannot run
  `workflow_dispatch` jobs or directly impersonate the Azure OIDC identity
  outside Actions. Running the manual action remains a user-controlled step.
- Official docs:
  https://learn.microsoft.com/en-us/rest/api/cost-management/query/usage?view=rest-cost-management-2025-03-01
  https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/understand-work-scopes
