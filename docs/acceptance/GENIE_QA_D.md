# Workstream D — Genie animation QA, accessibility and performance acceptance

Issue #51 · Branch `test/galaxy-genie-experience-qa` · Independent main.

This stream creates an auditable synthetic/manual acceptance matrix with 14 blocking cases and Python CI policy checks. It owns only `tests/experience/**`, `tests/test_genie_experience_policy.py` and this document. It does not modify PR #47, shared UI, workflows or other workstream paths.

## Required manual acceptance (not yet performed)

- Check 1440×900 desktop, 390×844 phone, 320px narrow viewport and Chrome/Edge current builds; confirm skip stays visible and genie/planet aren't clipped.
- Check real device prefers-reduced-motion and the in-app Motion toggle separately. No sudden full-screen effects when either is disabled.
- Real signed-in test must use an owner-approved disposable Galaxy-only test account. Confirm no guide before successful account-data load; test two isolated accounts and genuine RLS cross-user denial. Synthetic Playwright does not prove production login.
- Check no flashing/strobing content, no keyboard trap after dismissal, Escape/Skip and Accept focus behavior, and readable contrast.
- Profile runtime using browser devtools; target visual flight <=950ms, CLS <=0.1 and **zero third-party runtime network requests from animation**. These are targets, not measured results.
- Check once/day experience and account switching; ensure no ghost animation, no duplicated navigation and no account identity in logs or DOM.
- Review static deployment allowlist, runtime content hashes and GitHub 3/3 per PR after coordinator integration. Host remains unchanged until a separately approved manual Azure deploy.

## Automated tests

`python -m unittest tests.test_genie_experience_policy -v` or existing `python -m unittest discover -s tests -v`. Scenario matrix identifies tests that must be extended by the coordinator on integration, but does not falsely mark them as executed. No paid services, backend or hosted credentials used.
