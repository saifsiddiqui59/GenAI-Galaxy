# Workstream B — planet handoff animation

Issue #49 · Branch `feat/galaxy-genie-planet-handoff` · Independent main.

**API:** `window.GalaxyPlanetHandoff.run({sourceRect,targetRect,onNavigate,motion,signal,duration})`. The caller *must snapshot* the source planet bounds before hiding the Genie welcome modal. Can also provide `source` and `target` elements as alternatives. Promise resolves with `{animated,reason}`. Navigation callback is called once on all paths, including unsupported Web Animations API, missing rects, reduced-motion, cancellation and failure. If `onNavigate` itself throws, that application exception propagates.

**Integration:** After baseline #47, coordinator snapshots `#genie-gift-orb` rect before dismissing and the selected `[data-chapter]` element rect in the existing 17-world Galaxy, invokes the flight, then calls `chooseTopic(next)` in its completion callback. Keep Skip immediate. This module does not change study state or hide the modal.

**Performance:** One fixed-position div, compositor transforms and opacity, duration capped 120–950 ms, removed after completion/failure. No WebGL, server calls or third-party scripts. Ship CSS after coordinator review and static allowlist updates.

**Validation:** `node tests/handoff/test_planet_flight.cjs`; `node --check galaxy/handoff/planet-flight.js`. Need integrated browser tests for geometry on desktop/mobile and keyboard/reduced motion.
