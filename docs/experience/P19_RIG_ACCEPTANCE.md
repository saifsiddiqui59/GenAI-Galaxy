# P19 — Skeleton rig anchor groundwork

Source branch: `feat/p19-guardian-rig-anchors` (stacked on P17). Scope: `experience/src/guardian/{rigAnchors.js,SkeletonGuardian.jsx}`, `experience/tests/rigAnchors.test.mjs`.

Implemented real-bone name discovery and strict left-hand/right-hand/waist validation, world-space grip midpoint computation, and development-only animated pose diagnostics. Unknown rigs fail closed instead of fabricating attachment. This **does not** implement inverse kinematics, two-hand grip constraints, pickup, or waist-following sack; P16 world-space effects remain visually unaccepted.

Verification: `node --test experience/tests/rigAnchors.test.mjs` for pure bone resolver. Browser visual gate remains mandatory at 1440x900, 390x844, pickup, sack, hand-over, warp and reduced motion. In local dev inspect `window.__galaxySkeletonDiagnostics.rig`, `gripMidpoint` and `waistPosition` after animation. A source-level CI pass is never a visual signoff.

Parallel ownership proposal (unstarted): A `experience/src/guardian/**` and `experience/tests/rigAnchors*`; B `experience/src/effects/**` and collection tests; C `experience/src/space/**`; D `experience/src/portal/**`; E tests/browser, auth and integration docs. Coordinator alone changes `experience/src/App.jsx`, preview workflow, shared canonical docs. No live homepage overwrite, paid evaluator or user-progress mutation permitted.
