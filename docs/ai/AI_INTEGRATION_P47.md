# AI integration milestone: evidence-anchored interview grading

Scope: source-only, no paid provider calls, no new resources, no production
release. This change deliberately does NOT edit V5/V6 3D Galaxy scenes.

## Verified starting point (24 October 2026)

- Main SHA at branch creation: `62103139b95082ac1257a5607f995d501fab4581`.
- Existing GPT-4.1-mini regional PAYG + Flex Functions and authenticated
  evaluation route have successful earlier release/smoke evidence in
  `docs/NEXT_TASK.md` P13. Do not provision another model.
- The existing direct-consumption path reserves an atomic Supabase quota
  BEFORE calling the model. Speech/Vault remain disabled in cheap mode.
- PR #165 remains open; its arbitrary 65% missing-concept cap must NOT
  be merged alongside this replacement.

## What this source change does

- One existing Azure chat-completion call returns five 0..4 dimensions:
  direct answer (35%), technical correctness (30%), essential coverage
  (25%), decision reasoning (5%), clarity (5%).
- The server recomputes total (0..100); it does not trust a model-reported
  total. Rejects unquoted evidence, missing fields and contradicted
  perfect-score assessments.
- Exact candidate quotes are checked to exist in that candidate's answer.
  This *does not* prove technical correctness or validate the model's
  semantic inference. Avoid using model scores as human certification.
- Existing output fields remain backward-compatible:
  `review_status`, `accuracy`, `clarity`, `missing_concepts`,
  `has_factual_errors`, `feedback`, `improved_answer`, `followup`.
  Additional `score_breakdown`, `correct_points`, `incorrect_claims`,
  `why_score`, and `score_provenance` explain the result.
- UI shows answer strengths, incorrect claims, why the score was assigned,
  weighted dimensions, improved answer, then next question.
- Tests are offline fixtures, not benchmark labels or real model QA.

## Risks and release gates

1. A model might return nonexact quotes or conflicting assessments. Such
   results fail closed instead of issuing a misleading score; monitor actual
   rate of invalid outputs in approved staging before serving real learners.
2. Question-specific reference is in `api/rubrics.json`, but many topics
   have broad expected-concepts lists, not separately SME-ranked requirements.
   Human review is necessary to distinguish essential and optional content.
3. Human-reviewed benchmark calibration including excellent concise answers,
   factual errors, irrelevant replies, hallucinations and prompt injections
   is deferred at owner's request. No production-grade fairness claim.
4. No approved new paid benchmark, Function deploy, Static website deploy
   or authenticated hosted test was executed by this PR.
5. Existing quota is limited (FREE five per user/day; global 50 per UTC day
   in the direct consumption policy, subject to deployed plan controls).
   A failed post-quota upstream request can consume a reserved unit.
6. The prompt uses exactly one model call. Do not add LangGraph/multi-agent
   latency and installation weight to the single-node grading path. Introduce
   LangGraph in a separate conversational tutor graph only if a real
   branching/interrupt workflow is needed, with a measured latency budget.
7. Provider-side pricing and actual billed Azure costs have not been
   measured by this change. Do not advertise savings from shorter prompts.

## Safe next workstreams

A. Interview tutor route and conversational continuity; preserve current auth
   and quota middleware, fail closed on authorization changes.
B. Provider adapter + price-configured per-request usage telemetry, verified
   against actual Azure billing in the separate private Azure-Cost-Hub.
C. Mobile-first interview view cleanup, keyboard/screen-reader flows.
D. Approval-gated staging validation and a later owner-approved human
   benchmark. No 120-case benchmark in this initial integration stage.
