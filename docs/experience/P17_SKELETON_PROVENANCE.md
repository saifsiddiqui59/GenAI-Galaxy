# P17 Skeleton Guardian — verified upstream reuse

## Actual reused assets and code
- **Mesh and animations:** Quaternius, *Animated Monster Pack*, August 2018, CC0-1.0, https://opengameart.org/content/lowpoly-animated-monsters. The build fetches the original archive and extracts **Animated Monster Pack by @Quaternius/FBX/Skeleton.fbx**; the CI run verified actual 433,820 FBX bytes and SHA256 `be0a5992b677e563c6c9601e76fdcb9d50e91c195aebb1eb70604fbfe8fb26d5`. It is a genuine existing skeletal 3D asset, not a homemade low-poly robot or primitive placeholder.
- **Character-controller code:** *React-Three-Fiber-Character-Controller*, by 3merillon, copyright 2025, MIT. `SkeletonGuardian.jsx` adapts the controller's **target-position / smoothed-position mobile vector interpolation**, rather than claiming we copied its entire physical-character-controller world. Source: https://github.com/3merillon/React-Three-Fiber-Character-Controller/blob/main/src/components/CharacterController.tsx. Its MIT notice is included in `docs/experience/P17_UPSTREAM_MIT_LICENSE.txt`. We do NOT port Rapier physics, jumping, procedural terrain, or the developer's unnamed model since Galaxy requires a scripted entry sequence and the character-model license isn't documented by the source README.
- **Rendering:** Three.js FBXLoader and Drei useAnimations load genuine model/clip data from the static build.

## Honest remaining tasks
1. Validate full scene snapshots at 1440x900 and 390x844; a successful compile is not a visually accepted skeleton.
2. Make sack truly follow the skeleton waist bone and align offering orb with both hand bones, with stable retargeted pickup clip or procedural IK. Current P16 satchel and offered orb are separate scene objects, not true bone-attached grip.
3. Verify full end-to-end hosted preview only after protected Azure deployment workflow runs.
4. Confirm archived source sha and model appearance remain consistent. Upstream asset retrieval can fail; in this case build must fail and release must not silently revert to RobotExpressive.

## Do not claim
No completed fully IK-driven pickup is currently implemented, no public Azure URL has been verified, and no original upstream GLB from 3merillon was imported. Character-only replacement in PR #82 is a first verifiable correction.
