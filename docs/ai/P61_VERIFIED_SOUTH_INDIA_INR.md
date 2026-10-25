# P61 — Verified South India Regional Standard GPT-4.1 mini INR retail token meters

**Reference check date:** 2026-10-25 (UTC).
**Provider source:** Microsoft Azure Retail Prices REST API (not USD conversion).
**Filter:** `armRegionName eq 'southindia' and contains(skuName,'4.1')`, `currencyCode=INR`.
**Selected account/deployment:** existing `gengalaxy-ai-sin-1429841605`,
South India, `galaxy-gpt-41-mini`, `gpt-4.1-mini` version `2025-04-14`,
`Standard` (regional, not global, not batch or fine-tuned).

| Exact Azure meter SKU | Retail INR / 1K tokens | Backend INR / 1M | Meter ID |
| --- | ---: | ---: | --- |
| `gpt 4.1 mini Inp regnl` | 0.0422 | 42.2 | `7ca44ee4-48c4-5fae-9880-e880a3015337` |
| `gpt 4.1 mini Outp regnl` | 0.1689 | 168.9 | `3eb7aea7-33d2-5be3-a87d-04be825c632d` |
| `gpt 4.1 mini cached Inp regnl` | 0.0106 | 10.6 | `a1a0a97c-4335-5733-884f-bc4b366e8b82` |

Price meter effective date: 2025-11-01. Filter API result returned all three
meters as INR retail. Microsoft documentation warns non-USD public retail values
are **budget references**, not the actual contract invoice price, and may exclude
applicable discounts or taxes. Pricing can change; this document does not prove
actual billed INR charges. Consult Cost Management privately for actual spend.

Exact documented endpoint:
`https://prices.azure.com/api/retail/prices?currencyCode=INR&%24filter=armRegionName%20eq%20'southindia'%20and%20contains(skuName%2C'4.1')`

The existing *protected* backend deployment is the only writer of those backend
price settings; it must verify the named existing model/deployment and
`alwaysReady=[]` before writing. No model key, pricebook, or secret is
published through the static site. `api/model_costs.py` additionally refuses
unknown/cached missing values and prices over 45 days old, and omits the
estimate entirely if invalid. User reports say **estimated model tokens,
not Azure billed cost**. No environment setting has been changed merely by
merging this source PR; protected owner-only backend redeploy is separate.

No new model, Azure service, Always Ready instance, monitoring sink, payment
provider, paid test, Supabase migration or V6 change.
