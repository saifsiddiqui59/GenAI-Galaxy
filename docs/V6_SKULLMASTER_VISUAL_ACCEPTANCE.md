# V6 Skull Master — visual acceptance and asset integration gate (2026-10-26)

**Status: NOT visually accepted. This source remains draft PR #235.** Do not present a green CI run as proof that the character is cinematic or release the branch to the existing V6/V6.1 public preview.

## Original owner requirements

- Immersive full-screen galaxy with all 17 actual curriculum planets visibly spinning and orbiting.
- Skull Master must be a scary bare skeletal character — no puppet, wizard hood, cape, low-poly gauntlets or plastic boots.
- It must approach **each actual moving planet**, reach with an animated hand, grasp at real contact, move the captured world into a **small soft fabric satchel**, and only then move the galaxy aside.
- The next learning planet must be held and clickable; desktop, tall phones and short phones must all be visually acceptable.

## Verified source work

- No more old mage hat, robe, boots, gloves or oversized orange eye mesh.
- Aged CC0 anatomical skull, tiny recessed ember eyes, curved ribs, tapered animated limb shafts, a cloth-shaped hip satchel and no giant flying disc pedestal.
- A final side-held learning planet keeps the offer outside the rib cage; an accessible screen-aligned target prevents clicks reaching unrelated atlas worlds.
- Deterministic original KayKit rig and 95 clips; orbital contact/hand IK remains checked for first three automatic pickups. 17 IDs and authenticated progress unchanged.
- Final code source `1ab3c7bfaeed854be493ffa7348ab4daca185410` passed 3/3 at Actions run #40308019159.
- Read-only anatomical model research source `d9fe52352a3cae54023658c36fe1fcf423795af7` passed 3/3 at #40308675685 (research step is non-deploying).

## What is still *rejected* on reviewed desktop/mobile screenshots

- The current KayKit skeleton, even with our new tapered shafts, still reads as a ladder-like, thin puppet at normal viewing distance.
- The rib cage, shoulders and hand anatomy are not yet credible human skeleton geometry. A motion-system check alone cannot certify a cinematic grasp.
- At pickup the character remains too small compared to dominant cartoon-looking planet icons. A high-quality art asset and targeted compositions are still needed.
- Fine bone wear, controlled dramatic lighting, believable stance and phone close-up must be judged on actual screenshot/video evidence.

## License-cleared anatomical replacement candidate — NOT integrated

- Original CC0 Innerscene asset: https://www.innerscene.com/tools/library/3d-parts/human-skeleton-simplified-anatomical-study-a93f4d8f
- Read-only verified 2026-10-26 artifact: `galaxy-v6-cc0-anatomy-research`, GitHub run #40308675685.
- Asset name: `human-skeleton.glb`, bytes `1443132`, SHA256 `e52d1b23cf15b574885846a7da30354defc0a3a51b679ded6cbc7c0c1965d996`.
- **322 individually named mesh nodes**, 322 meshes, 12 anatomically shaped rib pairs, full vertebrae, hands, pelvis, legs. **0 skins, 0 animations**.
- Thus it cannot be simply substituted for the KayKit 41-bone / 95-clip animated asset. A new rig / Blender skinning and animation retarget, or carefully mapped hierarchical rigid-body bone attachments, must be built and visually verified. Never claim downloaded CC0 candidate is already a working animated character.
- The CI research step is intentionally branch-only, bounded in time/size and nonblocking. No live service or unrelated repository uses the downloaded model.

## Required remaining P0 sequence

1. Import the candidate into a **source-controlled, reproducible** offline rigging pipeline, preserving license/provenance, checking SHA256. Do not depend on an unpinned runtime third-party URL.
2. Author anatomically plausible weights/attachments, rest pose and proportions; map hands/shoulders/feet to the animated rig or create a new matched armature. Reject brittle visual overlays of static anatomy.
3. Preserve/retarget walk, orbit approach, hand reach/contact, deposit and final one-hand offer. Recalibrate real IK and camera around new palm anchor; demonstrate three consecutive captures.
4. Record a short real rendered desktop/mobile motion clip and screenshots; review head/eye sockets, 12 true rib pairs, anatomical limbs, foot/hand silhouette, planet occlusion, and cloth satchel. Independent human visual sign-off required.
5. Only after source CI and image review: merge stacked PRs in review order and run the new *manual, protected*, fixed-SHA V6.2 isolated preview workflow. Never overwrite V6/V6.1/homepage or modify another project.

## Not part of release acceptance

Green 3/3 browser/source/security CI is necessary but insufficient. No Azure resource changes, model spend, Supabase writes, external live publishing, or production approvals have occurred in this art review.
