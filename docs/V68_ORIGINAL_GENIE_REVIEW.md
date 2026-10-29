# V6.8 — Return to the original Genie (2026-10-29)

## Owner feedback
The experimental anatomical skeleton has visibly incorrect proportions and awkward folded legs. The owner explicitly authorized using the older Genie character if it produces a better result.

## Decision
Restore the **original, hand-authored 2026 Galaxy Genie SVG** from immutable in-repo history `0ca9cc809b86cec07a2a640ffc01a2df39953b89`. The Genie is an **intentionally floating illustrated character**, not a walking humanoid. Do not promise that a legless Genie is walking.

## Implementation
- Original source SVG is packaged locally at `experience/public/models/original-genie.svg`. Reuse its original shapes, palette, waving arms, mist and sparkles; no new external art or license dependency.
- A first-paint loading indicator appears in `experience/index.html` before React or 3D bundles fetch. It clears on actual guardian readiness; the 17-world non-WebGL navigation is still available.
- The old skeleton remains **visually hidden** but still drives the existing validated 3D hand positions, collection, satchel, miniatures, final planet offer and click hit area. This is an **intermediate compatibility architecture**: it does not yet remove the old asset download cost, and the loading screen does not claim to shorten load time.
- The Genie illustration follows the world-space body path via camera projection. Mobile character size is smaller, and its image never steals pointer events from real planet controls.
- Desktop orbit widening uses a deterministic 12% horizontal spread, and applies the same mapping to the visible planets, orbit lines and contact points. Planet mesh radii are unchanged. The mobile orbit stays at previous scale and positions.
- The original user progress identifiers, 17 planets, lesson mapping, auth state and reduced-motion behavior are unchanged.

## Release and quality gates
- PR and source-only tests do not prove visual appeal. Review `desktop-entrance.png`, `desktop-approach.png`, `desktop-offering.png` and mobile screenshots from the branch's `galaxy-v68-genie-visual-qa` run.
- Do not overwrite the public homepage or previous V6.5/V6.6 previews. Any V6.8 hosted URL must come from a separate approved immutable release, a verified artifact SHA and successful hosted browser acceptance.
- If this Genie is preferred, close draft PR #247 (skeletal V6.7) as superseded rather than merging the visually rejected skeleton experiment.
