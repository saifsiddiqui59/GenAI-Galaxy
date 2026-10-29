# V6.10 — restore original 3D Skull Master walking to planets

**Owner instruction:** Reject the 2D Genie in V6.8/V6.9. Restore the earlier 3D Skull Master with full legs/feet; he must **walk to a planet, stop, reach, collect, then walk to the next**, not slide or teleport across the galaxy.

## Implemented on isolated branch
- Restore actual KayKit Skeleton_Mage 41-bone rig, CC0 skull and anatomical parts and connected two-thigh/two-shin/two-foot geometry from original V6.7. Keep original V6.9 SVG files for rollback but never overlay them on the physical character.
- Restore straightened, lengthened hip-knee-ankle bones and short, face-open hood that keeps both feet visible.
- Natural walking segment expanded to 4.5 seconds before actual palm contact; the previously observed 2.4-second traverse made the Skeleton appear to skate.\n- Deterministic 3D route to the *actual moving orbital world* using original collection clock: curved path, cumulative travelled distance, speed from path derivative, leg phase from world distance rather than milliseconds. It pauses when world contact occurs, without using folded-knee floor pickup animations.
- Place two contact discs under actual animated ankle bones and a subtle walkable spectral bridge tracing the same world-space route. No visible 2D follower/ghost.
- Keep 17 selectable orbiting worlds and stable world IDs, existing real arm IK, attached miniature/satchel and final offer, loading UI, mobile and reduced motion.
- **Limitations for visual acceptance**: a floating path of magical stepping stones is a fantasy bridge rather than terrestrial pavement. Mechanical gait and real foot-planting still require screenshot review for believable motion. Passing automated tests is not approval of the final animation.

## Release gates
1. Exact branch 3/3 ordinary GitHub CI with Node path/stride tests.
2. No-cloud Chromium screenshots: desktop entrance, mid-walk, arrival, contact, offering; mobile 390/360 and reduced motion. Assert each walk advances real distance, feet remain visible and stop at true orbital palm contact, 17 worlds still move and remain selectable. Inspect images.
3. Keep V6.9 preview, root Azure static site and other projects **untouched**. A *new* V6.10 immutable hosted preview requires approval of release workflow after real QA. No merging rejected art on the strength of numeric tests alone.

## Actual V6.10 rendered QA and remaining quality blockers (2026-10-29)
- Source and 3/3 CI pass with deterministic 4.5-second walk per planet and three completed pickup cycles. Browser checks desktop/mobile/short-phone/reduced, real asset, full 17 orbiting worlds, exact palm contact and user navigation.
- Video artifacts of natural actual R3F browser run were captured. Automated acceptance does **NOT** establish visual quality.
- We inspected the browser footage and still found the skeleton's legs/feet read as suspended rather than planted on the spectral walkway; figure resembles a puppet, and the route can feel like motion through empty space. The earlier 2.4-second sequence also visibly skated; 4.5s improved timing but not physical contact.
- Added deterministic stance-foot correction to actual thigh/knee/ankle rig. It passed Chrome screenshot/motion QA; visually, ankle soles and bridge still need better grounding. Treat as **unaccepted DRAFT**, do not merge or deploy or call production-ready.
- Next release gate is rendered proof of real heel-strike/toe-off and convincing foot-to-walkway contact (or a better pre-rigged full-body walking model), without losing orbital collision-free route or the 17 original worlds.

## 2026-10-29 follow-up — independently verified foot grounding
- Real browser test caught **0.4303 unit** ankle-to-planted-target distance in the earlier revision. This was not acceptable and failed the new release gate.
- Stable heel target / calibrated bone height reduced actual desktop stance errors to **0.139 and 0.1149 units**; mobile **0.1572/0.1096**, compact phone **0.1351/0.0872**. The visual QA passed 4 viewports and 70 Node tests; source remains isolated in PR #254.
- Refined giant square hood and introduced short split cloth panels around the pelvis, leaving both knees/ankles visible. New screenshots still required after this art revision.
- No Azure publish/production release. Owner requested real walking between orbiting planets, not the 2D floating SVG.

- Visual QA exposed a serious regression: first split-waist robe ended below the knees and completely concealed both walking feet. It was **rejected**. Shortened the panel drop to 0.26 local units and added a regression limit; original anatomical thigh/knee/feet remain exposed for real walking. Review the next rendered screenshot before approval.
