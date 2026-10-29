# V6.10 — restore original 3D Skull Master walking to planets

**Owner instruction:** Reject the 2D Genie in V6.8/V6.9. Restore the earlier 3D Skull Master with full legs/feet; he must **walk to a planet, stop, reach, collect, then walk to the next**, not slide or teleport across the galaxy.

## Implemented on isolated branch
- Restore actual KayKit Skeleton_Mage 41-bone rig, CC0 skull and anatomical parts and connected two-thigh/two-shin/two-foot geometry from original V6.7. Keep original V6.9 SVG files for rollback but never overlay them on the physical character.
- Restore straightened, lengthened hip-knee-ankle bones and short, face-open hood that keeps both feet visible.
- Deterministic 3D route to the *actual moving orbital world* using original collection clock: curved path, cumulative travelled distance, speed from path derivative, leg phase from world distance rather than milliseconds. It pauses when world contact occurs, without using folded-knee floor pickup animations.
- Place two contact discs under actual animated ankle bones and a subtle walkable spectral bridge tracing the same world-space route. No visible 2D follower/ghost.
- Keep 17 selectable orbiting worlds and stable world IDs, existing real arm IK, attached miniature/satchel and final offer, loading UI, mobile and reduced motion.
- **Limitations for visual acceptance**: a floating path of magical stepping stones is a fantasy bridge rather than terrestrial pavement. Mechanical gait and real foot-planting still require screenshot review for believable motion. Passing automated tests is not approval of the final animation.

## Release gates
1. Exact branch 3/3 ordinary GitHub CI with Node path/stride tests.
2. No-cloud Chromium screenshots: desktop entrance, mid-walk, arrival, contact, offering; mobile 390/360 and reduced motion. Assert each walk advances real distance, feet remain visible and stop at true orbital palm contact, 17 worlds still move and remain selectable. Inspect images.
3. Keep V6.9 preview, root Azure static site and other projects **untouched**. A *new* V6.10 immutable hosted preview requires approval of release workflow after real QA. No merging rejected art on the strength of numeric tests alone.
