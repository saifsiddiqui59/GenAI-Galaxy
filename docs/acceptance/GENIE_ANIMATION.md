# Genie Guardian — Phase 1 Login Animation

**Scope:** UI-only, separate feature branch. Does not touch Azure resources, real Auth users, Supabase policies/data, curriculum, or other repositories.

## What the experience does

1. After **successful, owner-scoped signed-in progress/attempts/docs loading**, summon a custom SVG genie over the existing Galaxy screen.
2. Show a fabric sack with mini planets representing only **whole mastered chapter worlds**: all topics in that chapter must have progress status \`2\`. An incomplete chapter is **not** visually claimed as completed. Provisional offline keyword scoring cannot award mastery.
3. Offer the chapter containing the recommended next topic (overdue revision first, otherwise first unmastered topic). Both hands move toward the glowing presentation orb. The next chapter name is displayed outside the SVG.
4. "Accept this planet" takes the user to that recommended **topic lesson**. "Skip" or Escape dismisses without changing the user's navigation.
5. Replay suppression: once per **local calendar day per browser/profile and hashed account ID**, recorded in localStorage. Suppression is cosmetic only, not sensitive progress/account authorization. Clearing browser storage permits replay.
6. Default galaxy motion toggle and \`prefers-reduced-motion\` disable the entrance/choreography, while retaining a static recommendation screen. Focus starts at Skip, loops across Skip/Accept, and returns on dismissal.
7. Does **not** appear for guests, failed auth, pending password recovery, or private-sync failures.

## Open-source inspiration and asset ownership

- Tween.js (MIT) — https://github.com/tweenjs/tween.js : reference for staggered easing/motion choreography.
- SVG Character Animator — https://github.com/molauu/svg-character-animator : reference for animatable grouped SVG character anatomy.
- Original character artwork, geometry, choreography and styles were built for Galaxy in \`index.html\`, \`styles.css\` and \`genie/guide.js\`. **No upstream images/code/assets were copied** and **no new remote JS dependency was added**. The browser's CSS transform/keyframe engine is sufficient for Phase 1; full 3D/rigged character motion is a possible later scope, not a claimed existing feature.

## Validation and review

- \`node --check app.js && node --check genie/guide.js\`
- \`python -m unittest discover -s tests -v\`
- \`python tests/browser_check.py\` (Playwright, three viewport/motion runs; tests synthetic guide state, NOT real Supabase login).
- Existing GitHub Actions Galaxy CI runs 3 jobs; review actual PR run status before merge.
- Static public allowlist gains only \`genie/guide.js\`, and the existing-only static staging and live asset byte-parity policy are updated to include it.

## Release gate

New animation source is **not on the Azure-hosted public preview** merely because it is committed. A later reviewed merge to \`main\` and separately approved manual \`dev\` static deployment are required. Never auto-deploy from this branch. Follow up with an optional genuine sign-in UX check using a dedicated consenting Galaxy test account; do not create paid cloud resources for this feature.

## Design limitations

This is a stylized illustrated 2D SVG mascot with layered animation, not a 3D movie-quality genie. No music, autoplay audio, background model calls, telemetry, new payments or personal data embedded in page HTML.
