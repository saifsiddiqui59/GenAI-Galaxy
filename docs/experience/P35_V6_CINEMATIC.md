# V6 cinematic review — 24 October 2026

Status: isolated development preview; visual source remains draft. The production homepage is outside this release.

## Baseline and provenance

Verified main at start: `01fb5158fee780b20862e1c2452cef5802b9285b` (P33). Its validation run #40017569355 passed. Preserved V5 source `1fce489b449c6175bf03dea0346f33fcf35a7452`, draft PR #105, and its #96 ancestry; merged current main into the new V6 branch, resolving the lesson bridge without losing current learning/account modules.

Re-read Kay Lousberg's actual CC0 license at immutable upstream commit `15b62b9bad122f72926c10fb14d622c73819fa54`, `LICENSE.txt` blob `5de5a1e35003680bd6b97b4c247eed71d51a9fb7`. Model remains the existing 4,761,048-byte Skeleton Mage, Git blob `5f85aea26b4f33b88080d6eb57d25d1ae5d84d14`. Asset verifier checks the exact bytes and GLB manifest. No model replacement or newly licensed third-party textures. Planet/nebula surfaces are original procedural work. Historical MIT/CC0 notices remain intact.

## Changes verified through actual renders

- One frame-ordered simulation clock drives root trajectory, distance-matched walk cycle, weighted original clips, IK, miniature attachment and release. Wait for model loading before consuming the entrance; never rescale the shared cached GLTF during replay.
- Sample the real PickUp clip to obtain its contact location. Stage each mastered miniature at that point, attach it to the real right palm, carry it above the open hip satchel, release it through the mouth and hide it inside. Source clip transitions and the next-world reveal share the same clock.
- Solve both original arm chains for the offered planet. No floating proxy hands or synthetic authenticated mastery. Separate explicit sample mode remains visibly labeled; its diagnostic seek only manipulates presentation time, never saved progress.
- Original 512x256 desktop / 256x128 phone seamless surfaces, distinct ocean/ice/gas/desert palettes, directional key/rim lighting, warm companion light, nebula without the prior pinwheel artifact, expanded learning atlas, grounded observatory and open leather satchel.
- Warm readable typography, stronger next-world hierarchy, responsive phone camera/character scale, safe placements for short screens, reduced-motion and no-WebGL navigation.
- Demand rendering at up to 30fps, no shadow-map/postprocessing pass, no new cloud resources or model calls; hidden tab and motion-off stop the frame scheduler. Test observed idle motion-off rendering rather than inferring it from source.
- The isolated lesson package now includes current main's four public learning feature modules; the original stage helper omitted them. Main/root files are not uploaded.

## Visual QA and release boundaries

`tests/p35_v6_browser.py` runs against compiled, staged local files or the exact hosted URL supplied through `GALAXY_V6_URL`. Actual Chromium captures entrance, pickup, deposit and offering at 1440x900, 390x844 and 360x740, plus 1440x900 reduced motion. It observes one natural three-pickup sequence before deterministic frame inspection, checks palm/target error, stored-object occlusion, real 41-bone / 95-clip mesh, all 17 navigation entries, satchel contents, mobile character/UI separation, idle GPU frames, and nested lesson execution. It neither creates Auth users nor calls the paid evaluator.

Screenshots must be opened. Green assertions alone are not art acceptance. Local screenshots were opened and used to reject the first failed arm lookup and crowded small-phone composition. Retain PNG and numeric JSON evidence as GitHub Actions artifacts.

Before reporting a hosted V6 link: require exact source CI, separately reviewed main-only preview publisher, fixed existing storage/prefix, SHA256 parity for every staged file, unchanged root homepage hash, and actual hosted Chromium acceptance. Keep V6 source draft and #96/#105 unmerged. Physical-device GPU frame rates and signed-in V6 user journeys are not proven by synthetic Chromium.

## 27 October 2026 — orbiting galaxy / in-orbit pluck follow-up

- Replaced mechanically identical planetary motion with a **70-second complete elliptical revolution**, plus world-index-specific, closed-loop phase harmonics. Phase modulation is bounded (0.014 rad) so neighboring planets cannot overtake/collide. All 17 original curricular world indexes remain unchanged. Galactic motion continues at the full-screen intro, during collections and in the lesson atlas.
- Every world rotates on its **own tilted axis**, with deterministic index-based periods around the 24-second baseline (approximately 18.7–29.5 seconds), not the earlier single identical spin rate. Surface textures move with their spheres; relative angular velocities are testable.
- The model's approach still aims its root at the selected planet's **future predicted contact position**, but hand IK now tracks the planet's **actual position every frame** until physical contact. Once contacted, the planet is removed from its orbit and attached to the real palm, then delivered to the satchel. All ground-pick and crouching animations remain disabled in collection.
- Reduced-motion now freezes **both** orbit translation and axial rotation (the former was unintentionally animated). The already-present reduced-motion offering/lesson handoff stays intact.
- Unit tests sample the entire 360° revolution for same-orbit spacing, closed loops, unique spin velocities and the moving hand target on desktop/mobile scales. Chromium acceptance additionally compares actual diagnostics for every planet at two real simulation times; it rejects missing or non-rotating planets and checks distinct spin rates.
- Deployment remains a separate gated operation. The existing protected V6.2 publisher lives on `main` and is pinned to a different, older source SHA; merely passing source CI on this stacked **draft** cannot publish new code. No Azure deployment, production homepage replacement, protected environment bypass, or stacked PR merge is authorized by this doc.
