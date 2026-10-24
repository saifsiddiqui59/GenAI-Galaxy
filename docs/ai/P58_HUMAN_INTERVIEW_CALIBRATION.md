# P58 — Human-reviewed interview-grade readiness, no fabricated labels

The real Galaxy evaluator is an LLM judge with server-recomputed
five-dimensional weighted score. A model-reported score is **not** an
independent expert score or proof of technical correctness.

This source-only gate prepares the existing 10-case public/synthetic
`golden-galaxy-v1.jsonl` for a separate **consented expert review** without
restarting the owner-deferred 120-case benchmark or making model calls.

Before production grade certification:
1. Capture **actual deployed-model answers and scores**, without leaking
   candidate PII, credentials, JWTs or personal documents to GitHub.
2. Give the ten *questions and model outputs* to a real qualified technical
   reviewer **independent of the grading model**. The reviewer records
   five 0–4 rubric dimensions, exact expected technical truths, omissions,
   factual errors, and a concise reason for each.
3. Record only the expert labels and non-sensitive case IDs in a separate
   privately handled evidence JSON object. Do not commit personal grading
   data to this public repository.
4. Run `python scripts/gate_human_interview_grading.py <evidence.json>`.
   It fails closed if ten case IDs, independent reviewer attestation,
   real model-version provenance, explanations or rubric completeness
   are missing, or if mean absolute model-to-expert score gap exceeds 15.
   Structural checks **cannot verify reviewer identity**, and even a
   structural pass is not a claim of semantic accuracy.
5. Manually audit category coverage and grade high-quality concise
   interview answers fairly. The original `rag_chunking` baseline
   example is a description of a valid answer, **not an authentic
   candidate answer**; replace such placeholder test responses before
   collecting calibrated judgments. The existing RAG groundedness
   four-metric gate is separate from this interview-scoring contract.

No independent human grading evidence existed at time of this PR. This
script deliberately reports FAIL when evidence is missing; synthetic
tests are labeled fixtures, never shipped as signed-off calibration.
