# Workstream A — Genie cinematic visual polish

Issue #48 · Branch `feat/galaxy-genie-visual-polish` · Based on independent main.

**Deliverable:** A small decorative-only cosmic particle layer (18 particles by default; maximum 24) with deterministic placement, animation presets in CSS, and no external runtime dependency. JS API: `window.GalaxyGenieCosmicPolish.mount({host, count})` and `unmount()`.

**Integration contract:** Coordinator may add `genie/effects/cosmic-polish.css` and `genie/effects/cosmic-polish.js` to static deployment allowlists, then call `mount({host: document.getElementById('genie-guide')})` once after the PR #47 guide exists. Keep visual layer decorative and below buttons. Integrate only through coordinator-owned `index.html`, workflows and deployment scripts. No auto-load or auto-deploy occurs in this PR.

**Safety:** No user identity, progress, uploads, localStorage, paid provider, telemetry, animation libraries or new cloud resources. `prefers-reduced-motion` and `.no-motion` make effects static. Layout on mobile uses fewer visible sparkles. Upstream GitHub ideas are inspiration, not copied assets.

**Check:** `node tests/genie-visual/test_cosmic_polish.cjs`; `node --check genie/effects/cosmic-polish.js`. Need full integrated desktop/mobile screenshots after later coordinator PR.
