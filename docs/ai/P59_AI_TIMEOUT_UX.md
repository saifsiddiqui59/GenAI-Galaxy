# P59 — Client timeouts, no automatic retry of quota-charged AI calls

Following repeated live Azure Flex HTTP timeouts on both 512 MB and
2048 MB (see workflows #40114453710, #40115569675, #40115573907),
the public AI UI must never leave learners waiting indefinitely.

This change makes **only** deliberate signed-in evaluator/tutor requests
use `aiJsonOnce` with one AbortController, bounded to 30 seconds
**including JSON response decoding**. The service might still process
a request after the browser aborts. Therefore:

- The browser **never retries** the same paid request automatically.
- A timeout does not invent a model grade or award mastery.
- The user sees an explicit message that a quota unit *may have been
  reserved* and that repeating immediately is unsafe.
- Local concept feedback/lesson stays available and honestly labeled
  provisional, not independently factual.
- Existing authorization epoch / signout and current-topic guards
  remain in place; no stale account response is shown or saved.
- No new Function settings, provider, paid model test, DB, Azure resource,
  storage upload, subscription grant or V6 animation code.

`tests/test_p59_ai_timeout.cjs` simulates an aborted request, aborted
JSON body, and explicit HTTP 429. It asserts precisely **one** outgoing
fetch in each scenario and is wired into the existing Node CI runner.

This is **UX resilience, not a fix for the failing Azure Function**.
Deploy it only to the reviewed isolated AI preview through a protected
existing-only workflow after CI and approved publication. Never
silently push new JS to the existing root site.
