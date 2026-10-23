# P21 — KayKit Guardian replacement (visual rejection of P19)
## Why
P19 screenshots at 1440x900 and 390x844 show a plain grey Quaternius model and an unconvincing detached orb; green Chromium navigation checks were **not** visual quality acceptance. Do not ship that aesthetic.

## Adopted, existing open-source art and code
- Kay Lousberg / KayKit **Character Pack: Skeletons 1.0**, actual Mage character with atlas texture, skeleton and animations. Upstream: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0 , path `addons/kaykit_character_pack_skeletons/Characters/gltf/Skeleton_Mage.glb`.
- Upstream fixed commit `15b62b9bad122f72926c10fb14d622c73819fa54`, immutable Git blob `5f85aea26b4f33b88080d6eb57d25d1ae5d84d14`, byte count 4,761,048. Downloader validates Git blob SHA1, GLB header and animation manifest, then prints names from the actual file during CI.
- **CC0 1.0 Universal**, publisher Kay Lousberg; proof: https://github.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0/blob/main/LICENSE.txt . Attribution is optional but retained here.
- Three.js + R3F + Drei are open-source dependencies. Camera damp/locomotion approach is informed by 3merillon's MIT React-Three-Fiber-Character-Controller: https://github.com/3merillon/React-Three-Fiber-Character-Controller , with its existing MIT notice already retained in P17.

## Preserved contracts
- Exactly the existing 17 learning chapters and world ids, each linking to the original eight-part lessons.
- `completedWorlds` is **exclusively** authenticated owner-scoped, or explicit `?demo=1` synthetic test data marked as such. No fabricated mastery writes.
- Scene requires actual animated KayKit mesh; original model's diffuse atlas is preserved (no flat-cream material override).
- Browser script must examine source asset, bone and animation diagnostics, with 1440x900, 390x844, pickup, satchel, offering, reduced-motion and warp screenshots. Human review of actual screenshots is mandatory, not implied by CI.

## Open visual gates
- Precise KayKit bone aliases and IK must be verified against actual GLB rig diagnostics rather than guessed.
- No announcement of success until full visual quality review after Chromium screenshots.
- Hosted link must not be presented until isolated Azure deployment and per-asset HTTP verification succeed.
