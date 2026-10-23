# P18 — Free adaptive-learning interview improvements

Date: 2026-10-23. **Existing V4 interface only.** Do not merge or publish unfinished Genie/3D P15–P17 work as a dependency.

## Implemented in app.js

- **I don't know · Teach me:** A user can select this instead of guessing. If their submitted answer begins with "I don't know", "I do not know", "not sure" or "no idea" (short response), the app opens source-authored simple explanation, example, and optionally a full reference answer. This path makes **no Azure/OpenAI call** and does not record a fake attempt.
- **Try a simple guided question:** Converts the current question to "What is [topic], and why might someone use it?" at Level 1. It does not score the explanation itself.
- **Skip / Next topic:** Always lets the learner continue to another distinct unmastered topic, then to a sequential topic if everything else is mastered. An untouched skipped topic becomes In Progress and is scheduled for review after one day, with confidence no higher than before and no invented scored attempt.
- **Post-answer actions:** Targeted retry or harder follow-up, View explanation, and Next topic (even for weak answers). No more forced infinite retry.
- **Level 3 completion:** After a strong third-level response, "Finish Level 3 · Next topic" advances to the next topic when clicked. Feedback remains visible until that action, so it isn't hidden unexpectedly.
- **Trust boundaries:** Local keyword matching does not mark mastery. The existing signed-in Azure model option and server-side quotas remain unchanged. No LLM calls, fine-tuning, payment gateway, new Azure AI resources or account changes are part of P18.
- **Revision:** Skipped topics show in the existing revision queue; rated attempts keep their existing review scheduling. This doesn't provide automated certified competence assessment.

## Verified evidence

The normal Galaxy CI covers:
- `tests/test_adaptive_flow.cjs` via existing `tests/test_engine.cjs`: uncertain answers, guide, skip/review scheduling, level 2/3 transitions and next-topic selection with **zero model calls**.
- `tests/browser_check.py` tests the real frontend markup and clicks in simulated desktop/mobile Chromium with no authenticated model request.
- `galaxy-p18-offline-preview.yml` builds and uses Playwright to verify the **exact downloadable standalone guest preview** with real inlined curriculum and lessons.

## Test link now (no cloud changes)

The GitHub Actions artifact `GenAI-Galaxy-P18-Adaptive-Learning-Test` contains `adaptive-learning-preview.html`, a single, fully interactive static HTML file plus desktop and mobile screenshots.

Download the ZIP from its successful run, extract and double-click `adaptive-learning-preview.html`. Works on desktop Chrome/Edge without Node or Python. Guest-only by design; Auth and AI endpoint are disabled. Do not treat a local concept result as a technical grade.

**P18 run:** https://github.com/saifsiddiqui59/GenAI-Galaxy/actions/runs/39985076428

## Optional direct HTTPS link after manual approval

A separate, manual-only, dev-environment-guarded workflow `galaxy-p18-hosted-preview.yml` is available **after merging P18 into main**. Owner selects **Run workflow**, branch `main`, and types `PREVIEW_P18`. It builds the same guest-only self-contained HTML, uses only the existing approved Galaxy storage account and OIDC, and uploads **only** `$web/adaptive-preview/index.html`. Original `$web/index.html`, `app.js`, model APIs and the separate 3D preview are **not modified**. The job downloads and verifies exact public Blob bytes, then runs desktop/mobile Playwright against the hosted URL.

Only **after successful hosted deployment** is the preview public link:
https://gengalaxy1429841605.z29.web.core.windows.net/adaptive-preview/index.html

This is deliberately NOT an automatic push deployment and NOT yet evidence of deployed success. Existing Azure Blob transactions may have a small cost; no new cloud resources or LLM tokens are required.

## Not implemented

- The older live production URL remains untouched until a separately approved production release.
- Signed-in, real Azure LLM answers are not re-tested because that would use paid tokens. Existing deployed model can incur normal PAYG usage if explicitly used in production.
- Expert verification of 245 lessons, actual microphones, account-recovery email and disabled Vault extraction are separate acceptance workstreams.
