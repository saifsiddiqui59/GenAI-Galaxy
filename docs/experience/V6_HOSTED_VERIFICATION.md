# V6 hosted cinematic verification — 24 October 2026

[Open verified V6 preview](https://gengalaxy1429841605.z29.web.core.windows.net/previews/galaxy-3d-v6/index.html?demo=1)

## Immutable release

- Source: `6614f7903c52b81f471083321a49f8870b5becdc` (draft [#131](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/131), stacked on V5 #105).
- Publisher: merged [#135](https://github.com/saifsiddiqui59/GenAI-Galaxy/pull/135). Only existing `GenAI_Galaxy/gengalaxy1429841605`, prefix `previews/galaxy-3d-v6`.
- [Source CI #40021350132](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40021350132): curriculum-and-api, browser-smoke and release-safety all success. Local checkpoint: 131 Python checks and existing Node/syntax checks; 11 rig/choreography checks.
- Publisher PR CI #40021933086: 3/3 success; extra hosted V5 #40021933103 success.
- Main CI #40022214773: 3/3 success on `ac76e5b`, preserving the concurrent learning integration after the earlier publisher main run was cancelled.
- [Protected deployment + hosted Chromium #40022442803](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40022442803): source-ci and publish both success. No new cloud resources, paid model requests, Supabase mutation or production art merge.

## Actual hosted acceptance

All **18 staged files** matched their hosted SHA256. Before/after homepage SHA256 remained `f424fd286a706eca24f0cc674e7d68165f6cdceb04a064e11775b450177ebf6b`. The uploader addressed only the V6 prefix.

| Chromium variant | Result | Rendered stages |
| --- | --- | --- |
| Desktop 1440x900 | Passed | Entrance, pickup, deposit, offering |
| Phone 390x844 | Passed | Entrance, pickup, deposit, offering |
| Short phone 360x740 | Passed | Entrance, pickup, deposit, offering |
| Reduced motion 1440x900 | Passed | Static offering |

The test observed the natural three-world source PickUp sequence before presentation-only frame seeking. It checked the actual 41-bone / 95-clip textured GLB, palm contact/IK distance, release into the satchel, stored-object visibility, all 17 world entries, short-phone body/UI separation, motion-off idle frame count, no page exceptions and the bounded nested lesson route. It did not create users or award mastery.

Downloaded [hosted artifact #12532090063](https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/40022442803/artifacts/12532090063), verified ZIP SHA256 `7c8e7017fd3c38bb99c6fd01b81431b03f3ee7a2f2eec14a9d07e8d70e477126`, opened the actual hosted desktop entrance/pickup/deposit/offering and both phone offering images. Evidence includes 13 PNGs, four numeric JSON records, the 18-file hash manifest, homepage hash and source SHA. These are genuine browser captures, not generated mockups.

## Visual and interaction changes

Shared clip/IK/prop timing and distance-matched walking replace the drifting independent clocks. Each miniature is staged at the source clip's real contact point, stays on the right palm during lift/carry and is released into an open hip satchel. Both original arm chains support the next world, with a blended reveal. The original CC0 model/atlas remains byte-pinned and its immutable upstream license was re-read; provenance is in the source branch's P35 document.

Brighter key/rim lighting, original higher-resolution seamless planetary surfaces, a nebula without the earlier pinwheel artifact, a clearer learning atlas, grounded observatory, restrained gold typography, responsive phone framing and demand rendering improve the presentation without adding a paid rendering backend. Motion-off/reduced-motion stops the scheduler; hidden tabs pause it.

## Remaining limits

Physical-device GPU frame rates and a consented signed-in V6 end-to-end journey are **not verified**. Demo mastery is explicitly synthetic and never persisted. The original 17 world IDs, owner-scoped data boundaries and lesson handoff remain. #96, #105 and #131 remain draft; no production 3D merge is claimed. Parallel main learning work after P34 is independent of this frozen preview snapshot.
