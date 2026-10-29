# V6.9 — Cinematic Skull Master visual iteration (2026-10-29)

## Owner's outstanding acceptance
- V6.8 technically passed but visual design was rated roughly 4/10: original baby-faced Genie, flat floating sprite, insufficient full-screen presence, style mismatch and crowded mobile.
- Owner requested to continue all pending visual work, not alter unrelated apps.

## Design approach
- Retain the **floating Genie concept**, not the rejected legged skeleton. Replace the visible original 2026 cartoon SVG with a new **original layered cinematic Skull Master** at `experience/public/models/cinematic-skull-genie.svg`: mature skeletal face, tapered hood, carved eyes, gold runes, cloth mantle, separated jointed skeletal arms, ritual orb, spectral trailing robes and star particles.
- Animate independent head, shoulder/arm layers, cloth, tail, orbit runes, eyes and levitation. Honor `prefers-reduced-motion`.
- Leave `experience/public/models/original-genie.svg` unchanged as a rollback reference.
- Keep existing non-rendered KayKit rig only for exact tested hand-to-planet contact. **This still incurs legacy model download and load latency**; visual QA does not indicate optimization complete.
- Enlarge desktop Guardian scale and use responsive mobile bounds. Desktop orbit X spread expands from 1.12 to 1.21, reflected in the exact visible orbits, reach coordinates, trails, planet hit areas and diagram rings. Do not alter 17 world IDs, mastery/progress, speech, lesson navigation.
- Preserve the first-paint loading overlay. Do not pretend a vector illustration alone reduces 3D loading cost.

## Safety and acceptance
1. Require normal GitHub 3/3 CI, exact-head branch tests and no Azure writes.
2. Run `galaxy-v69-cinematic-skull-visual-qa` across desktop, 390px mobile, 360px mobile and reduced motion. Open screenshot evidence, inspect actual face/arms/readability, avoid collisions and oversize.
3. Do not merge/publish until artist-quality review. If approved, deploy only with a separate existing-identity OIDC workflow under a new immutable `previews/galaxy-3d-v69` prefix after exact source CI; never overwrite the site root.
