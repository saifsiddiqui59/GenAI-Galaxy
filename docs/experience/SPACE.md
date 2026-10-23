# P15-B — Cinematic galaxy engine (source component)

Issue #61. R3F independent module in experience/src/space/DeepGalaxy.jsx. 17 interactive world spheres positioned on a seeded 3-armed field; physically shaded planet surfaces and optional orbit rings (gold = fully mastered; cyan = suggested). Starfield uses deterministic positions, not Math.random; GPU shader nebula backdrop uses local GLSL, not copyrighted images or external texture requests. Mobile lowers star count and disables continuous cloud motion.

API: GalaxyScene masteredWorlds={[{index:0},...]} recommendedIndex={1} selectedIndex={null} onSelect={(index)=>{}} reducedMotion={boolean}. Render inside R3F Canvas. A separate coordinator-owned DOM navigation list will make every planet keyboard-accessible; WebGL mesh clicks alone are not sufficient for accessible navigation.

Deep-space aesthetic is inspired by user's requested visual reference, not copied from another website. No server, data or auth modifications. This does not replace lesson pages. Performance and shader/viewport acceptance remain required after coordinator integrates the separate React bundle.
