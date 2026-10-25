# P74 — Mobile lesson cleanup + truthful AI progress states (25 October 2026)

## User's screenshot and request
Owner provided a 390px-class iPhone screenshot of the **static lesson reading page**, not the AI tutor response. Huge, separately padded Simple explanation, Technical explanation and Real-world example cards fill multiple screens. Owner also requested understandable "Connecting" and "Finding best answer" labels and streamed text.

## Implemented now: safe, static frontend only

- **Lesson screen:** preserve every one of the eight original editorial sections and 17 topic worlds. Show the first three essentials (Simple, Technical, Real-world example) as compact cards and group the five deeper sections under native `details/summary`; none of the curriculum is discarded. Reduce mobile padding/line height/top heading space; retain project examples, mistakes, 30–60 second answer, notes and both paths into practice.
- **AI tutor + evaluator:** visible `role=status` live-region messages: Connecting securely → Finding the best answer → Still waiting for Azure / no duplicate request → Receiving and validating. The stages are **client elapsed-time UI labels**, not verified backend/worker/LLM trace phases.
- **UI arrival:** CSS-only subtle reveal of the **already complete and validated** model answer/grade, removed under `prefers-reduced-motion`. This **is not token-by-token model streaming**. No fake partial scores, answer text or tool execution stages.
- **Single call and trust boundaries preserved:** both AI routes remain explicit user click, JWT and server quota, same 90-second AbortController, no retries, no changes to auth, data, model secrets, LangGraph, Azure Function, billed model, Azure resources, V6/Genie, production homepage, Supabase tables or production users.

## Why true server streaming is not shipped in this release

Official Microsoft docs: https://learn.microsoft.com/en-us/azure/azure-functions/functions-bindings-http-webhook-trigger#http-streams-1 . To enable Python v2 HTTP Streams, add FastAPI HTTP extension and `PYTHON_ENABLE_INIT_INDEXING=1`, and **migrate the existing HttpRequest/HttpResponse routes** because the original HTTP behavior changes. This is not safe during the existing intermittent pre-handler `503` P0 https://github.com/saifsiddiqui59/GenAI-Galaxy/issues/192.

Azure OpenAI supports streamed Chat Completions with `stream=true`, but this backend currently requests strict validated JSON grades and one quota-controlled model call. A later, isolated protocol must handle SSE frames, complete output validation, stream errors, billing/partial-token usage and cancellation (aborted browser requests can still be billed), plus no-regression of existing four Function routes. Never label this release genuine LLM token streaming.

## Acceptance

- `tests/test_p74_lesson_ai_wait.cjs`: all lesson sections, responsive UI, explicit wait stages and no secret extra model requests.
- Existing P59/60/73, mock interview, security and private data tests unchanged.
- Protected P61 preview manual release after all 3 source CI succeed: inspect actual hosted iPhone 390×844 and desktop 1440×900 screenshots on both **lesson** and **interview** before/after local-only assessment, check 8 sections in DOM, five deeper sections closed, no horizontal overflow, and original homepage byte identity.
- Paid model calls intentionally excluded, and 503 P0 remains open.

**Screenshot note:** Browser chrome and iOS bottom-bar overlays shown in the user's in-app browser are controlled by iOS, not Galaxy; layout padding and page cards are ours to correct.
