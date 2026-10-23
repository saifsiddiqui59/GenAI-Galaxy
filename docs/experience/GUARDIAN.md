# P15-A — real CC0 Guardian model (source component)
Issue #60 · independent branch feat/p15-guardian-3d

Chosen ready-made 3D character: **RobotExpressive**, by Tomás Laulhé, modified by Don McCurdy, from the official Three.js model repository; CC0 1.0 (the official model README explicitly says CC0). This is an existing rigged GLB with 14 original animation clips including Idle, Walking, Wave, ThumbsUp and Dance. The component uses those REAL clips; not a custom robot made from primitives.

Pinned source URL: https://raw.githubusercontent.com/mrdoob/three.js/eba30de865cfbf31ac736f792defd9a60ff28d57/examples/models/gltf/RobotExpressive/RobotExpressive.glb
SHA256: 047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319
Expected 463988 bytes. npm assets step must run before build (Node 22+); output is local public/models/guardian.glb. No animation model downloaded in the browser from a third-party URL.
Provenance: https://github.com/mrdoob/three.js/blob/dev/examples/models/gltf/RobotExpressive/README.md

API: <Guardian phase="arriving|collecting|offering|idle|celebrating" />; animates actual model, cross-fades clips; reduced-power integration handled by coordinator. Loading/error fallback geometry keeps the home scene navigable. This phase is NOT precise physical grabbing/hand IK. D must drive miniature planet proxies and sack behavior. Future character replacement with a Quaternius CC0 monster is supported by keeping Guardian separately owned; do not assume assets in 3merillon's MIT *code* are independently licensed.

No cloud changes or runtime credentials. CI checks provenance and source contracts; coordinator will run full Vite build and real Playwright after integration.
