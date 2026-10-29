# P82 — PRO badges and zero-cost hold for all metered features

Scope: Galaxy-only FREE / PLUS / PRO subscription plans already deployed in Supabase `vfoghlhtnifpnbevgufa` (shared with Voice Agent; **no changes to any other app**). User asked to badge all money-costing features PRO, disable them, and display them in the existing plan.

## Plan and price policy

| Capability | FREE | PLUS | PRO |
|---|---|---|---|
| 246 curriculum lessons, local practice, keyword-based **not factual** checks | Available | Available | Available |
| Local mock interview, review scheduler, private progress | Available | Available | Available |
| Azure OpenAI answer grading | No | No | PRO · **Paused** |
| LangGraph tutor explain/clarify/follow-up using Azure OpenAI | No | No | PRO · **Paused** |
| Azure Speech fallback transcription | No | No | PRO · **Paused** |
| Server-side PDF/DOCX content extraction | No | No | PRO · **Paused** |

Basic local/browser microphone recognition is **not** an Azure Speech token request and stays available if the browser supports it. Supabase auth and user-owned private uploads/progress remain separate free account functionality. Document extraction is distinct from private file upload.

No tier has metered features activated yet, including manually assigned PRO. There is **no payment gateway, purchase button, paid plan price, automatic checkout or self-upgrade**. The old catalog table fields FREE=5, PLUS=10, PRO=20 are historical per-day quotas, NOT a promise of billable access. Upon a separate approved PRO launch, the maximum would be 20 model requests per UTC day and 50 globally, subject to existing auth/tenant quotas; PLUS and FREE cannot use paid models.

## Defense in depth

1. **Frontend**: P82 has a literal OFF constant `PRO_COST_FEATURES_ENABLED=false` and PRO badges in the Interview and Plans pages. Disabled buttons for Azure model tutoring, follow-ups, AI evaluation and server document extraction. Local scoring remains the active CTA and does not pretend to be a model grade. Azure Speech fallback is blocked; browser speech remains.
2. **Azure Function**: `GALAXY_PAID_FEATURES_ENABLED` is OFF unless backend-only environment is explicitly set to `active`. `enforce_pro_access()` checks current subscription via the normal user's JWT and existing Galaxy-owned `genai_study_my_subscription` RPC. No caller-supplied plan or backend secrets. Paid evaluator and paid tutor nodes gate before quota reservation or model request. Speech and document extraction return 503 while paused.
3. **Database**: Galaxy-only migration `20261029083000_galaxy_pro_paid_features_paused.sql` changes ONLY the existing quota RPC, retains its `galaxy_access_allowed()` approval gate, atomic lock, ownership, UTC/day caps and grants. Its `v_paid_features_released=false` intentionally refuses every reservation before touching usage. A future owner-authorized migration must both enable this server-owned launch flag and enforce a valid PRO subscription. No cross-project schema/table/user mutation.
4. **Tests**: offline tests verify FREE/PLUS/PRO fail closed and disabled buttons cannot send paid requests, while existing evaluator/tutor positive fixtures explicitly simulate a future PRO launch inside mocks only. Browser accessibility and old local-mode checks remain.

## Release boundaries

- GitHub merge is NOT live release. The static root website is unchanged until separate exact-SHA approved deployment.
- Database migration must be applied/verified on the actual Galaxy Supabase project separately. Until applied, old deployed quota rules permit legacy allocations.
- Existing Azure Function must be deployed to take effect. Previously deployed server behavior must not be assumed to change from a source merge.
- P0 [#192](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192) remains open; do not activate AI until reliable no-charge anonymous handler tests and signed-in tenant/quota tests pass. Even when Pro enabled, users must explicitly opt in to token-consuming actions.
