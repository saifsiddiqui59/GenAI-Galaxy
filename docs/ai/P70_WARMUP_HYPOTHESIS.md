# P70 — Does an initial Function POST warm the tutor? (manual, no AI model tokens)

## Official Microsoft evidence (25 October 2026)
- Flex Consumption scales to zero and can cold start after inactivity:
  https://learn.microsoft.com/en-us/azure/azure-functions/event-driven-scaling
- Flex Function host initialization has a non-configurable 30-second limit:
  https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan
- The language worker startup has a separate non-configurable 60-second limit:
  https://learn.microsoft.com/en-us/azure/azure-functions/functions-scale
- All HTTP-triggered functions are in one scale group; the platform may assign
  the next request to a different on-demand instance:
  https://learn.microsoft.com/en-us/azure/azure-functions/flex-consumption-plan
- Python HTTP concurrency defaults to one:
  https://learn.microsoft.com/en-us/azure/azure-functions/functions-concurrency

## The precise experiment
Run owner issue #183 command `TEST_WARM_THEN_TUTOR_<current main SHA>` only
after green exact-main CI. The manual-only DEV workflow performs **four bounded
anonymous POST requests**, sequentially, to the **already deployed** Function:
1. **Warm-up** evaluator POST, no bearer: require **401** and
   `X-Galaxy-Trace-Id` presence. This confirms Python produced a response.
   An Azure-generated OPTIONS **204 is not sufficient**.
2. Immediately POST to tutor with the same synthetic no-auth body, 95s bound:
   require application **401** with trace.
3. Immediately repeat one tutor POST (75s bound). If first tutor 503s but
   second 401s, transient cold start / routing becomes plausible; no automatic
   retry of signed-in requests is proposed.
4. Repeat evaluator POST once (35s bound) as a control.

Only public endpoint status, sanitized trace *presence* and DNS/TCP/TLS/
first-byte duration are reported. No JWT, provider key, personal answer,
quota reservation, Azure OpenAI query, new Function or scheduled keepalive.

**Interpretation:** a successful evaluator 401 followed by tutor 503
demonstrates that *warming evaluator did not solve the tutor route*.
It does **not** prove that Azure cannot warm another instance. Because the
host may scale to two on-demand HTTP group instances and Python concurrency
defaults to one, timing/affinity can affect outcomes. Never infer model
connectivity from successful unauthenticated 401s.

**Next phase:** only after repeated clean Python-generated 401s, run
independent protected real JWT authentication + quota verification. Only after
two independent no-charge smokes pass, invoke at most one evaluator and tutor
model request, with NO retries, using the existing gated live AI workflow.
Actual grading correctness still needs human review.

Plan compatibility: no Always Ready, 512MB, maximum 2, no new resource, no
long-running periodic warming. Single experimental invocations can still
count toward Azure Function on-demand execution meters.

Support: Basic Azure support generally includes subscription and billing,
but not production technical troubleshooting. No support-plan purchase is
required for this diagnostic and none is authorized here.
