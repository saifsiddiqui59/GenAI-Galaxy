# V6.11 skinned Skull Master asset search and hard acceptance gate

**2026-10-31 · P0 #255 · draft PR #256 · research, NOT owner-approved art.**
Read owner rejection [issue comment 6544582010](https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/255#issuecomment-6544582010) and [PR comment 6544518007](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/256#issuecomment-6544518007). The prior 322-piece, unskinned anatomy attachment on a KayKit skeleton is **rejected**: disconnected brittle limbs, crossed legs, tiny desktop/mobile figure, floating bridge and diagram-like orbits. Three passing numeric workflows at 24d31f8 do not override screenshot failure.

## Sourced candidates (not yet approved for use)

| Candidate | License/provenance evidence | Technical claim | Why not accepted yet |
| --- | --- | --- | --- |
| [AutoSprite Skeleton Gunslinger](https://www.autosprite.io/free-3d-models/skeleton-gunslinger) | [Publisher CC0 page](https://www.autosprite.io/free/license) states all free assets generated on AutoSprite's own account, not customer submissions; expressly warns AI outputs might resemble third-party work. CC0 dedication asserted, **underlying originality not independently established**. | Direct unauthenticated 22.8 MB GLB link, advertised idle/walk/jog/sprint. Dark purple-lit skeleton in hat with large maul. | First candidate for **byte-level audit only**. Need actual geometry/skin/bind/texture/clip inspection, visual frame inspection, licensing risk assessment and owner art review. Hat/maul may conflict with Skull Master satchel and reaching choreography. No import approved. |
| [HotstrikeStudio Free Stylized Dark Fantasy Skeleton V1](https://sketchfab.com/3d-models/free-stylized-dark-fantasy-skeleton-v1-13b75487badc4c54a6e1644376fe6900) | Artist lists CC BY, 9,402 triangles, PBR 1024 textures, FBX/Blend/AccuRIG. | Rigged humanoid in T-pose, 11 texture files claimed. | No bundled walk clip established, only ~9k triangles, stylized; download bytes and full bind/skin validation not yet obtained. **Not a substitute for another toy.** |
| [Ghoulish Sentinel](https://sketchfab.com/3d-models/ghoulish-sentinel-rpg-enemy-5c58549257094d4b9d232916c9ece7de) | Artist lists CC BY, 191.8k triangles, PBR and FBX UE-compatible materials. | Dark-fantasy armored undead with cinematic aesthetic, rig/animation claimed by tags. | No independently retrieved downloadable bytes, bone hierarchy, animation or license packaging. Performance on mobile untested. **Blocked** pending actual downloadable licensed source. |
| [CreativeMachine Skeleton Rig](https://sketchfab.com/3d-models/skeleton-rig-ee87f94159cf4767b1977659db3fb7aa) | Artist lists CC BY, ~267k triangles and armature. | Anatomical rig, **untextured**. | Lacks costume/material quality and verified walk clips; not credible as final dark-fantasy character. |

Other CC0 options (KayKit/Quaternius/low-poly ghosts) were **not** selected: already known to produce the rejected toy/stylized appearance. The large CC BY-SA [Écorché anatomy model](https://github.com/Charleeh/ecorche) explicitly has no rig or poses, so it cannot solve the core blocker.

## Independent engineering checkpoint

- Added `experience/scripts/audit-skinned-rig.mjs`: parse GLB2 JSON/BIN bytes; reject malformed lengths, missing actual skin-to-mesh bindings, sparse/missing joint/weight accessors, invalid skin weights, disconnected joint hierarchy, invalid inverse bind matrices, absent named walking clips or broken animation samplers. Report real SHA-256, weighted vertex count, skinned triangles, material/texture counts and clip names. Flag low-poly/flat-material risks. **Always emit `visualAccepted:false`**, even when technical audit passes.
- Added negative and positive synthetic-binary tests in `experience/tests/skinnedRigAssetAudit.test.mjs`. Synthetic fixtures test the **auditor**, not real character appearance.
- Added isolated no-cloud, no-deploy `.github/workflows/galaxy-v611-rig-asset-audit.yml` to fetch the published AutoSprite candidate **ephemerally** and print a byte-level report. Do not treat a passing audit as permission to ship.
- Candidate must be kept out of public app assets until the rig, license, visual quality and mobile performance are reviewed. No Azure, paid AI, GPU, deployment or production writes.

## Acceptance sequence (hard gates)

1. **Provenance + bytes**: obtain an actual downloadable archive/GLB with source URL, license notice, hash, author provenance, size, textures, real skinned mesh and bind pose. No download = blocked, not assumed valid.
2. **Rig + animation**: inspect weighted mesh, connected pelvis/spine/shoulder/elbow/wrist/hip/knee/ankle joints, bind inverse matrices and a non-sliding walking clip. Validate in full-resolution rendered motion, not just animation names.
3. **Composition**: use a genuinely dark, adult, frightening sculpt with coherent cloak, hands, feet and visible skull face/eyes; remove incompatible props; attach the satchel to the actual rig. No dislocated or brittle bones, toy shoes, crossed shins or cartoon styling.
4. **Choreography**: foot contact must remain stable in world space over stance; heel strike/toe-off, gait direction, planted ankles, correct hand IK contact with **moving** planets, real bag/offer sequence. Do not apply rigid 322-piece anatomy retarget to new actor.
5. **Scene**: retain all 17 distinct orbital and axial motions, click/keyboard/lesson routes, reduced motion and non-WebGL fallback. Only after actor is credible, redesign cosmic parallax, 3D orbit depth and walkable route.
6. **Human pixel gate**: desktop 1440x900 and phone 390x844 / 360x740 actual screenshot sequence and real video, full silhouette and planets legible. Compare with rejected artifact [13045781890](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/41209113419). **Owner visual approval required before merge/deploy.**

**Current blocker:** No candidate has passed both actual binary rig inspection and cinematic visual inspection. No actor replacement, integration or art approval is claimed. Continue investigating legitimate source assets and gait/IK feasibility on this draft branch.

## Verified external candidate byte audit — 2026-10-31

The published AutoSprite GLB was **actually downloaded and parsed in GitHub Actions**, not merely inferred from its catalog listing. [Exact technical run #41210866299](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/41210866299) inspected SHA-256 `d200c0716355d50a48b34fc17e0eceeea8609e47f357c16c18df4886c89526f9`, **23,889,664 bytes**, 1 skinned mesh, **22 connected Mixamo joints**, 109,255 weighted vertices, 149,906 triangles, 1 textured material/image, inverse bind matrices and normalized skin weights. Clips: `idle` 2.5s, `walk_loop` 1.333s, `jog_fwd_loop` .917s, `sprint_loop` .667s. Audit found no structural errors. The initial naming warning about knees is because Mixamo uses `LeftLeg`/`RightLeg` as shin joints; the actual 22 names include left/right UpLeg → Leg → Foot → ToeBase and Arm → ForeArm → Hand.

**Important distinction:** This is a technically usable **rigged candidate**, not an accepted scary Skull Master. [The publisher thumbnail](https://www.autosprite.io/free-library/3d-models/skeleton-gunslinger/thumb.webp) depicts a stylized purple western skeleton with a cowboy hat and oversized hammer. It may not satisfy the owner's mature frightening gothic character direction; no full-resolution browser evaluation or gait contact measurement has been performed. Source itself disclaims similarity risks for AI-generated assets. **Do not import it into the shipped experience yet.**

Added isolated `experience/src/guardian/candidateSkinnedRig.js` with explicit Mixamo arm/leg chain discovery, existing real-hand IK, a pole-constrained 2-bone knee/ankle solver, world-space stance target integration and honest unreachable/error reporting. Its synthetic joint tests prove **algorithmic feasibility only**, not the real asset's walk, contact, satchel or appearance. The existing 17-planet scene is untouched.

Next independent action: render the verified candidate in a **local, isolated, non-production** preview at 1440×900 and 360×740, inspect real frames for adult frightening quality, test walk contact and hand IK on the downloaded GLB, then reject or advance it. If its purple cowboy design fails, source another licensed gothic rig rather than recoloring it or reviving the 322-part retarget prototype.
