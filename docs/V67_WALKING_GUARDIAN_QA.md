# V6.7 Walking Skull Master and Wide Galaxy — source acceptance

## Owner's explicit visual feedback (2026-10-29)
1. A blank scene appears for around five seconds: show an immediate loading indicator rather than making the user guess.
2. Skull Master has no convincing feet, is visually poor, and seems to teleport instead of walking.
3. On desktop, the galaxy needs additional horizontal space so the character can move between and around planets.

## Source changes
- Vite HTML paints an accessible loading screen from first byte; React removes it when the real KayKit asset and rig become ready (no fixed arbitrary wait). Without WebGL the splash is removed and the existing accessible fallback remains.
- CC0 original 41-bone rig and 95 animations retained. KayKit `Walking_A` is sampled only while travelling. Its problematic lower-body crouch is overridden by an extended, canonicalized standing pose and controlled contralateral gait. Both original hip-knee-ankle chains now have 1.27× longer offsets and genuinely connected tibia/femur geometry, separate heel, forefoot and five toe meshes.
- Three-quarter entrance (rather than side profile) and reduced short hood/mantle keep the skull and both legs visible.
- Interpolated curved orbital path and walk-to-idle transition. At palm contact the path lands on the exact computed 3D source planet coordinate: the 17 curriculum worlds, owner progress, collection order, hand IK and lesson identity are not rewritten.
- Desktop-only horizontal orbit spread 1.20 (20%), circular orbit timing unchanged. Planet meshes retain spherical scales; mobile remains compact and dedicated full-screen.
- Commercial-rights and provenance of the existing pinned CC0 models remain unchanged; no new model download at runtime or cloud service usage.

## Verification and remaining release gates
- Source-level Node tests and three standard CI jobs are necessary but not sufficient for visual quality.
- `.github/workflows/galaxy-v67-local-visual-qa.yml` performs local-only Chromium desktop/mobile/short-mobile/reduced-motion testing, screenshots and lesson-click acceptance; no Azure or Supabase writes.
- View `desktop-entrance.png`, `desktop-approach.png`, `desktop-offering.png`, `mobile-entrance.png` screenshots **before** marking visual quality approved. Walking around planets in a weightless scene may still need an artist-quality character or grounded movement cues.
- Leave PR in draft if browser screenshots remain visually inadequate. **Do not represent an older live V6.6.1 URL as a V6.7 deployment.** Publishing the reviewed V6.7 requires an independent owner-approved static preview workflow and real hosted validation.
