# P218 — CC0 high-detail Skull Master experiment

Original visual reference: user-supplied hooded skeleton with glowing amber eyes, dark cloak and staff. Do not claim reference image is itself a reusable 3D model.

## Verified third-party asset provenance
- Name: ScatteringSkull (human anatomical skull), Khronos glTF Sample Assets
- Upstream license: CC0-1.0
- License: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/8f492390ddc7a2ae221a1369ef560589cf8c70fb/Models/ScatteringSkull/LICENSE.md
- Immutable download: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/8f492390ddc7a2ae221a1369ef560589cf8c70fb/Models/ScatteringSkull/glTF-Binary/ScatteringSkull.glb
- Git blob SHA-1: `9e1927babc5791067ccf2004bda7e59a40cac753`
- Source file size: 8,959,044 bytes
- Asset author: Vladimir Petkovic, per upstream README
- Build-time deterministic CC0 derivative: 627,700 bytes, 17,311 vertices / 35,181 triangles
- Verified optimized asset SHA256: `b702cf9bacb631c7c3133a7a480c2c5a15f5da3017de4895313f7e7fab8cea30`
- Optimizer: `experience/scripts/simplify_cc0_skull.py`; vertex clustering at 4.5 mm, 16-bit indices, omits unused SSS textures/tangents while retaining anatomy
- Original KayKit Skeleton Mage retains its existing separate CC0 source.

## Architecture
- Pinned build-time downloader fails closed on hash/length changes.
- Bundle optimized asset under `experience/public/models/cc0/ScatteringSkull.glb` before Vite build; no public runtime fetch.
- Expected GLB optimization shrinks original 8.96 MB to 0.63 MB for low-power 3D devices.
- Scene-clock P220 fix is also included on the experimental branch and independently reviewed in PR #221.
- Clone and normalize skull, parent it under original KayKit `head` bone.
- Hide only KayKit original skull/jaw/eye display mesh, preserving original 95 animation clips, arm chain, hand IK, satchel origin, planet IDs, lessons and progress.
- Restore original meshes and dispose replacement material on unmount.
- Does NOT claim the static CC0 skull itself is fully skinned/rigged: it moves through the genuine existing KayKit head bone.

## Approval / fallback
- New model is visual-only and experimental. Validate front/back orientation, skull scale and clip compatibility with hosted browser screenshots on desktop and mobile before merging.
- If build cannot validate the downloaded asset, fail closed.
- If the rendered model is worse than original, keep P216, reject the experiment.
- No production, Azure, Supabase, or homepage changes.
