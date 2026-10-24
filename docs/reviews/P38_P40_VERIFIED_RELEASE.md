# Galaxy P38–P40 verified low-cost acceptance — 2026-10-24

## Deployed and checked
- P38 security PR [#149](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/149), merge `e1e47a53654bdf4d8aa941ede41f0fcfc78b0567`. Login/account-switch epoch guards now discard stale AI evaluations, and only one evaluation may be pending per client. Offline tests defer authorization/model responses and assert no cross-user feedback/progress contamination. Existing Azure static app-only [release #40075478550](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40075478550) succeeded.
- P39 lesson-linked misconception guard [#152](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/152), merge `55b4355889535f30b26281330119f1537410c716`. Four bounded, affirmative-pattern warnings with source references for false token/word equivalence, citations as proof, Delta time travel despite VACUUM file deletion, and tool calls without authorization. Does not certify factual correctness. Prevents known flagged answers from receiving automatic difficulty/mastery credit even if the existing model reports a high score. Negative golden and safe negation tests are offline. Existing Azure static [release #40075933731](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40075933731) succeeded: app.js, index.html and the new source-linked module were uploaded and read-back verified.
- P40 browser acceptance [#156](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/156), merge `37e9e2e7fc795e7c410ecab86867118e4959d422`. Protected, owner-command, **guest-only** hosted Chromium run [#40076278633](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40076278633) **SUCCESS**. Verified exact remote file SHA256 parity; actual known-bad interview answer produced a visible limited-warning banner with no mastery credit or paid evaluator request; passed desktop 1440x900, mobile 390x844 and reduced motion 1440x900. Screenshots artifact `Galaxy-P40-Hosted-Guest-Screens` (#12552968837, seven-day retention). No real credentials, writable cloud state, model tokens or microphone use.
- Stale, nonmergeable privacy PR #127 closed as **superseded**, because private coaching text purge is already in main and P38 adds the in-flight model-result protection.

## Live use and explicit limitations
- Public existing Galaxy website: https://gengalaxy1429841605.z29.web.core.windows.net/ . No new paid cloud service, subscription checkout, bulk LLM eval, authentication user or unrelated project modified by P38–P40.
- A warning is a **limited rule match**, not an independent semantic evaluator. No warning does not mean factually accurate. Existing AI model accuracy/clarity percentages are *model-reported estimates*, not independent graded truth.
- Quality release gate under `scripts/gate_galaxy_eval.py` still requires independently collected judge/human evidence for all frozen cases. Do **not** invent scores, call paid evaluators without consent, or mark the quality gate as passed based solely on these tests.
- Hosted guest acceptance is not signed-in user acceptance. Real account login/recovery, permissions, Azure model behavior in production and actual physical microphone remain separate.
- The V6 3D preview remains isolated, not merged into production learning UI; its own GPU/physical-device approval is separate.
- Per owner's direction, **super-admin activation and approval enforcement are deferred**. Do not make them a dependency for learning UI work.
- Curriculum SME verification for all 245 lesson records and production-grade semantic AI interviews remain editorial/quality tasks; static heuristics do not replace a factual reviewer.

## Safe next work
1. Obtain consented signed-in E2E acceptance for learning progress, authentication/recovery, private vault and account isolation using only Galaxy users.
2. Collect independent expert or explicitly authorized model-judge evidence for the fixed golden dataset; apply strict zero-blocker and metric thresholds without manufacturing pass results.
3. Have experts review curriculum factual details and evaluate candidate answers across GenAI/Databricks/Agents topics.
4. Verify accessibility/performance on real devices and optional microphone with informed consent, without audio retention.
