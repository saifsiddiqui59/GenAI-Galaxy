# V6 P51 cinematic interaction QA — 2026-10-24

This draft builds atop P35 V6 + P51 visual polish; it is NOT a deployed, production or authenticated experience.

## Confirmed source defects and fixes

| Finding | Before | Draft fix | Acceptance |
| --- | --- | --- | --- |
| Offered planet not clickable | Mesh had no select handler | Pointer/touch pick sphere plus clearly named clickable HTML label uses the same validated `select`/WarpGate route | Chromium actual projected sphere click navigates to exact next-world lesson |
| Planet names missing | `(hover||recommended)&&!lowPower` removed all phone labels and most desktop titles | Every planet has a numbered marker and full accessible name; hover/recommended/selected shows full title; full 17-world navigator retains all complete names | Desktop/390/360 show 17 distinct readable number anchors; never pile 17 full title cards on top of the Genie |
| Fake floor pickup | Miniatures materialized near Genie even before being collected | All 17 worlds move through deterministic gentle orbits; current completed planet detaches from its real timed orbital position, flies to actual palm, follows genuine clip to satchel then becomes a named clickable atlas marker | Capture mid-flight origin, contact, deposit, final stored states for 3 demo worlds; no data persistence |
| Satchel inventory misleading | Badge shows all mastered planets before animation deposits them | Display stored count from actual timeline; preserve true mastery data | 0 to 3 increments on actual deposit, skip/reduced motion yields 3, all worlds remain clickable |
| Costume lacks reference depth | Red low-poly hat/costume and white-yellow eyes | Keep source CC0 model/95 clips, recolor targeted red costume texels to violet and warm eye glow | Inspect actual screenshots on phone and desktop; this does **not** replace pointed wizard hat with user's hooded reference |

## Rules / remaining acceptance

- No account writes, secrets, license changes, motion changes to private progress, added paid services or external GLB downloads.
- Synthetic demo mastery and screen-time seek are clearly labeled, never persisted or used to claim authenticated mastery.
- All 17 original chapter identifiers and full lesson/keyboard navigation remain; source scene markers retain clickable access even after storage animation.
- Required: all 3 GitHub CI jobs at **the actual final SHA**, visual inspection of screenshot artifact desktop/390x844/360x740/reduced motion, realistic device pointer/touch and GPU acceptance, separate protected preview publisher review and signed-in authorization acceptance.
- P35 preview live URL still serves the old byte-pinned source `6614f7903c52b81f471083321a49f8870b5becdc`. Do not claim that draft #175 is live.
