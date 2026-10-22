# Microphone and speech — browser acceptance checklist

**Offline CI exercises a simulated SpeechRecognition object. It is not evidence of a working physical microphone or Azure broker.** Do not enable or call real Azure Speech without a separately approved, JWT-validated gateway.

## Before live hardware testing

1. Obtain owner approval for publishing the updated static preview to the **existing** GenAI-Galaxy Blob website. No deployment is authorized by this PR.
2. On the approved HTTPS site, inspect desktop Chrome and Edge, and the relevant mobile browser. Verify the microphone feature is supported; if not, the text answer remains fully usable.
3. Test permission **allow**, **deny**, blocked browser permissions, missing device, and browser prompt cancellation. For each failure, the typed answer must remain intact and the microphone control must return to an accessible idle state.
4. Test start/stop/start, partial and final transcripts, rapid navigation to another topic, retry and sign-out while recognition is active. Neither stale callbacks nor delayed Azure broker startup may add text to a new response.
5. Test interim transcript replacing itself rather than duplicating words; stop preserves final transcript, subsequent input appends only intentionally. Test long speech clipped to the supported draft length.
6. Verify button text/aria-pressed/keyboard activation and reduced-motion behavior; no microphone should start merely from page load.
7. Record real device/browser/version, observed result and any permission/provider error; do not save recordings or access tokens to issue comments.

## Production restrictions

- Azure Speech fallback is disabled until a dedicated authenticated token broker, short-lived tokens, real per-user quota enforcement and safe origin network restrictions are approved and live.
- Backend/API credentials must not be embedded in static JavaScript, browser localStorage or the public repository.
- Missing microphone hardware, denied permission, failed WebSocket or unavailable Azure region must result in **typed-answer fallback** with no personal data leakage.

## Evidence

PR GitHub CI can substantiate deterministic start/stop, late-result, permission-rejection, re-entry and sign-out simulations. Real microphone/STT performance, language recognition and user experience are separate owner-executed acceptance gates.
