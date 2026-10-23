# P19 — Final integration and release audit (2026-10-23)

## Evidence actually verified

- P18 adaptive learning merged to main in PR #83; uncertainty detection follow-up merged in PR #84; baseline `b494b90d1216e82c0adce1ceda57de37512ab295`.
- Main Actions run [39986377041](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39986377041) concluded success with three successful jobs: release-safety, browser-smoke and curriculum-and-api.
- Standalone guest P18 preview workflow run [39985076428](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39985076428) passed desktop/mobile Chromium; artifact 12515930467 expires 2026-10-30.
- P17 source SHA `a8fd2d9a19e93feb7e3dd84497851dc936632789` had successful validation run 39985122667 (three jobs). P16 source SHA `16616d06910497e6da25bc3c2a23a38f17291d0b` had successful run 39979315612. P15 source SHA `d1fdd415f7b12acef871575df2683d032315cbd8` had successful run 39973610901. These are source CI results, not evidence of live deployment.
- PRs [#69](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/69), [#78](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/78), and [#82](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/82) remain draft and **stacked** (P16 base P15, P17 base P16).
- GitHub compare shows P15 versus current main **diverged** (36 commits ahead, 24 behind), with modifications to shared `app.js`, `.github/workflows/galaxy-ci.yml` and canonical documentation. DO NOT merge #69/#78/#82 to main blindly: first reconcile P18 changes from #83/#84 and inspect the complete combined diff.
- P16 is ahead of P15 by 35 commits; P17 ahead of P16 by 19. The source-defined P17 Skeleton.fbx is a Quaternius CC0 real character, but docs explicitly say hand IK, bone-attached sack and cinematic scene acceptance are still outstanding.
- P18 hosted preview workflow `.github/workflows/galaxy-p18-hosted-preview.yml` exists and is manual-only; no successful hosted P18 publish run was verified. Public URL response could not be independently verified during this audit. Do not claim it is deployed.

## Release gates (no unapproved billing or changes to other projects)

1. **Integrate without regression:** on a fresh branch off current main, port/rebase P15 -> P16 -> P17 with tests, preserve P18 `app.js` and existing 230 original topic keys/17 worlds. Review source/license hashes, secrets, dependency install scripts and public assets. Do not merge draft contributor PRs individually into main.
2. **Run verified CI:** ensure curriculum-and-api, browser-smoke, release-safety (3/3) pass at the final integration commit; confirm required 3D build/Chromium tests actually ran.
3. **Visual/functional QA:** check at 1440x900 and 390x844, keyboard and reduced motion, all planet routes to lessons, satchel behavior, authenticated owner progress/RLS. Mark simulated/mocked tests distinctly from live user-data acceptance. Bone-attached satchel and hand alignment are not yet implemented.
4. **P18 isolated hosted guest preview:** if publishing is authorized, use protected `galaxy-p18-hosted-preview.yml` on main with `PREVIEW_P18`; verify upload byte parity and hosted Playwright. Only `$web/adaptive-preview/index.html` may change; public site root stays untouched.
5. **3D isolated hosted guest preview:** after approved and merged source/release workflow, run protected manual `DEPLOY_3D_PREVIEW` and verify hosted assets. Do not replace the root `index.html`, `app.js`, or P18 preview.
6. **Production gate:** only after real hosted acceptance and owner approval, release exact reviewed assets, hash-verify public site, and retain rollback. Do not run paid LLM evaluation, provision cloud resources, mutate shared Supabase tables, or deploy to WineShopPOS/RetailGrowthAI.

## Open non-automatable acceptance

Physical microphone permission/audio; real password-reset email; SME review and timing of 245 authored lessons; real authenticated two-user privacy and RLS acceptance where not already established by specific evidence.

## Current verdict

**P18 merged + source CI green. P15/P16/P17 source CI green but not yet integrated into main. Hosted P18/3D deployment and final production parity unverified.** This is an evidence record, not a completed release or authorization to bypass protected deployment gates.
