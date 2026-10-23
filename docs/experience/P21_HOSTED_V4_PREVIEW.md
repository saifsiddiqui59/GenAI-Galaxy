# KayKit V4 3D review preview — hosted audit (2026-10-23)

## Proven verified state
- **Review-only interactive URL:** https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v4/index.html?demo=1
- Azure release: https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40008968388 — **SUCCESS**. 14 staged public files were hosted with identical SHA256 bytes. Existing $web/index.html and unrelated Azure containers were not uploaded or overwritten.
- Immutable 3D source: `9eb442613278f0eea3d5e57f63c832ef13f0ec4c` on `feat/p21-kaykit-cinematic-guardian`, PR #96 remains draft for further art QA.
- Release workflow source (PR #97, merged): `.github/workflows/galaxy-p21-kaykit-preview.yml` with existing dedicated GitHub OIDC protected environment `dev`. Upload restricted to `$web/previews/galaxy-3d-v4/`, 14 byte-for-byte HTTPS integrity checks.
- CI on source SHA: runs #40008306320 and #40008299990, all 3 validation jobs passing including Chromium 1440x900, 390x844, reduced-motion synthetic demo, actual GLB model loading, owner-scoped 17-world navigation, satchel and lesson handoff.

## Source and accessibility
KayKit Skeleton Mage model by Kay Lousberg under CC0 (95 real clips/41 rig bones), from https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 ; immutable upstream source and object hash recorded in `experience/scripts/fetch-kaykit.py` on P21. Animation rig endpoints are real `hand.l`/`hand.r`, not separate floating hands. Rendering uses original GLB atlas textures and `PickUp`, `Walking_A`, `Unarmed_Idle` clips with limited CCD IK. Preview demo mastery is **synthetic** only when `?demo=1`, not a database mutation.

## What remains unaccepted
- P21 is a **stylized low-poly review build**, not photoreal skeletal performance or final cinematic art acceptance.
- Pickup is scripted and arm-targeted, not verified rigid-body contact/collision simulation. Satchel visually follows real pelvis coordinate but cloth deformation is approximate.
- Screen captures were inspected and improved across multiple P19/P21 attempts, but independent human art approval remains mandatory for production.
- Live two-account Supabase RLS acceptance and production authentication were not run by this release; an opt-in guest demo does not establish that users have actual mastered progress.
- Hosted index/model/assets passed HTTPS byte-integrity verification, while full hosted authenticated interactive browser E2E was not executed against production credentials.
- The current root homepage was preserved. Do not merge P21 into main until review, and never use a green CI badge as art acceptance.
