# P3 curriculum editorial review — structural completion, not fact signoff

**2026-10-22.** This PR adds the 66 previously overview-only GenAI-Galaxy topics as independently worded, topic-specific eight-part study lessons and expands 19 older shorter answers. The original V3 topic paths remain unchanged.

| Measure | Structural result | Verification boundary |
| --- | --- | --- |
| Chapter worlds | 17 | Structural catalog test |
| Original V3 records | 230 | Catalog provenance test |
| V4 topics | 246 | All contain an expanded lesson |
| Distinct lesson records | 245 | One repeated title in two locations |
| Newly drafted in P3 | 66 | Tracked in `docs/P3_AUTHORED_TOPICS.json` |
| Interview answers 60–140 words | 245 / 245 | Word-count proxy, **not spoken duration** |
| Expert-verified coverage | Not established | No SME adjudication or fact-check signoff |

## Editorial review and source protocol

1. For each of the 245 distinct lessons, identify authoritative references (official vendor docs, deployed code/tests, or reviewed source contracts); record document date/version and any caveats. Do not infer current API product support from an outdated guide.
2. Have a suitable human reviewer independently check the substantive technical assertions, counterexamples, cross-product comparisons and safe failure behavior. A language model or static length check alone is not SME review.
3. Give each new reference answer a real spoken rehearsal and collect actual duration, intelligibility and follow-up clarity. The 60–140-word range is a *planning heuristic*, not measured 30–60 second speech.
4. Validate any personal employment, resume, certification, cost-saving or banking-project narrative against approved records. Project story answers deliberately separate prototypes, team contributions and future banking architectures.
5. Run a stable golden set of technical questions, misleading distractors, restricted financial tool requests, prompt-injection cases and tool-failure scenarios. Require source-grounded evidence and explicit negative authorization passes.
6. Review security claims separately: Supabase RLS, account verification, API gateway quotas, private Storage path checks and Azure deployment status must not be upgraded from proposed/tested source to live without hosted acceptance evidence.

## High-risk areas requiring external check

- Azure AI-102 exam scope and active Microsoft Learn certification status at interview time.
- Azure AI Foundry/OpenAI product features, quota, API versions and regional availability.
- Speech recognition languages/voices and managed token-broker security.
- LangGraph, search and MCP current library semantics versus examples.
- Databricks Lakeflow and materialized-view behavior against the exact runtime/SQL warehouse version.
- SQL/CDC data correctness across deletes, time zones, decimal rounding and late arrivals.
- Any organization-specific cost, SLA, production incident, team size or quantified achievement.

## Review states

All lessons remain `expanded_editorial_unverified` when explicitly marked. Legacy lesson entries that predate this status field are also **unverified**. Reviewers should not interpret an absent marker as approval. Do not label the curriculum fully verified until the review log contains a source/SME decision and spoken-duration evidence per title.

## Release acceptance

The updated public study content can be merged after code, generated-rubric, coverage, read-only browser and release-safety CI checks pass. **It is not automatically deployed** to Azure Blob. Hosted database tests, real microphone and server provisioning require their separately agreed owner gates.
