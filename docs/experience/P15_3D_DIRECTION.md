# GenAI Galaxy P15 — cinematic 3D preview

This is a separate 3D home prototype, not a replacement of the current live site.

## Experience
- 17 selectable learning planets over a procedurally shaded nebula and deterministic starfield.
- A READY-MADE CC0 rigged RobotExpressive character with existing Walking, Wave, Idle and ThumbsUp skeletal clips; not a homemade geometric genie.
- Completed chapter proxies appear progressively in a clickable sack; the original planets remain on the galaxy and stay selectable. A recommendation is highlighted.
- Walk-in → sequential miniature collection → next-world offer. Skip/Replay, reduced motion and accessible 17-world list. Choosing a planet calls the same original world-entry warp.
- Chapter index (integer 0–16 only) hands off to the original lesson page via index.html?galaxyWorld=n; existing 8-part lessons remain untouched.
- The preview does not pretend to read a real account. Sample mastery appears only with ?demo=1 and is visibly labeled synthetic; otherwise no completed worlds are shown.

## Reuse and license
- Official RobotExpressive by Tomas Laulhe (modified Don McCurdy), explicitly CC0: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md
- Immutable upstream GLB SHA and SHA256 checked at build-time in experience/scripts/fetch-guardian.mjs. Source asset not stored in git; after build the model is served LOCALLY from the compiled app and no external browser asset host is needed.
- Three.js/R3F are open-source. React Bits and 3merillon's controller are VISUAL/TECHNICAL INSPIRATION ONLY; copying a character mesh would require separate asset licensing. Our portal CSS/JS is original. Optional Quaternius CC0 monster replacement only once verified.

## Build and acceptance
Node 22 or later. From repo root: cd experience, npm install --no-audit --no-fund, npm run build, npm run dev. The real GitHub CI must build the production Vite dist and verify the pinned model download before claiming this preview is working.
Existing root app browser tests are not complete 3D device tests. Manual keyboard, mobile GPU, FPS, WebGL fallback, motion, scene clipping and real authenticated Supabase integration remain additional acceptance gates.

## Release
Source PRs #64–67 are independent draft PRs, integration work tracked by issue #68. The integration branch copies their modules without merging. Never deploy the Azure root site or modify shared database as part of this work. A separate owner-approved manual preview deployment can come after review. Full skeletal finger-gripping inverse-kinematics has NOT been implemented yet; walking and presentation clips are real.