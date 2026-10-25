"""P77: offline SSE-streaming contract tests; cannot contact Azure or spend tokens."""
import json
import pathlib
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"experimental/ai_streaming"))
from stream_protocol import (
    StreamContractError, verified_stream_request, parse_azure_chat_sse,
    relay_tutor_sse, galaxy_sse
)

def frame(delta="",finish=None,usage=None):
    if usage is not None:
        raw={"choices":[],"usage":usage}
    else:
        raw={"choices":[{"delta":{"content":delta},"finish_reason":finish}]}
    return ("data: "+json.dumps(raw)+"\n\n").encode()

class StreamSafetyTests(unittest.TestCase):
    def test_single_gated_provider_request(self):
        messages=[{"role":"system","content":"Use server reference"},
                  {"role":"user","content":"What are tokens?"}]
        with self.assertRaises(StreamContractError):
            verified_stream_request(messages=messages,max_tokens=350,quota_reserved=False)
        request=verified_stream_request(messages=messages,max_tokens=350,quota_reserved=True)
        self.assertEqual(request["stream"],True)
        self.assertEqual(request["stream_options"]["include_usage"],True)
        self.assertEqual(request["messages"],messages)
        self.assertNotIn("api_key",request)
        for bad in (0,49,651,True,100.0):
            with self.subTest(bad=bad),self.assertRaises(StreamContractError):
                verified_stream_request(messages=messages,max_tokens=bad,quota_reserved=True)

    def test_live_token_deltas_then_bounded_completion(self):
        parts=[frame("Hello "),frame("🌎"),frame("!",finish="stop"),
               frame(usage={"prompt_tokens":20,"completion_tokens":3,"total_tokens":23}),
               b"data: [DONE]\n\n"]
        events=list(parse_azure_chat_sse(parts))
        self.assertEqual([kind for kind,_ in events],["delta","delta","delta","complete"])
        self.assertEqual("".join(x["text"] for kind,x in events if kind=="delta"),"Hello 🌎!")
        self.assertEqual(events[-1][1]["usage"]["total_tokens"],23)
        self.assertFalse(events[-1][1]["verified"],"Do not falsely label draft human-verified")
        encoded=list(relay_tutor_sse(parts))
        self.assertEqual(len(encoded),5)
        self.assertTrue(encoded[1].startswith(b"event: delta\n"))
        self.assertTrue(encoded[-1].startswith(b"event: complete\n"))

    def test_missing_done_or_bad_finish_never_awards_completion(self):
        for parts in ([frame("partial",finish="stop")],
                      [frame("partial",finish="length"),b"data: [DONE]\n\n"],
                      [frame("partial"),b"data: [DONE]\n\n"]):
            with self.subTest(parts=parts),self.assertRaises(StreamContractError):
                list(parse_azure_chat_sse(parts))
            events=list(relay_tutor_sse(parts))
            self.assertTrue(events[-1].startswith(b"event: error\n"))
            self.assertFalse(any(x.startswith(b"event: complete\n") for x in events))

    def test_invalid_stream_events_fail_closed(self):
        bads=[
            [b'data: {"error":{"code":"invalid"}}\n'],
            [b'data: {"choices":[{"delta":{"tool_calls":[]},"finish_reason":null}]}\n'],
            [b'data: {"choices":[{"delta":{"content":42},"finish_reason":null}]}\n'],
            [b'data: this is not json\n'],
            [frame("x"*2501),frame("",finish="stop"),b"data: [DONE]\n"],
            [b"data: [DONE]\n"],
            [b'\xff\xfe'],
        ]
        for parts in bads:
            with self.subTest(parts=parts),self.assertRaises(StreamContractError):
                list(parse_azure_chat_sse(parts))

    def test_no_sse_injection_or_sensitive_output(self):
        body=galaxy_sse("delta",{"text":"line1\nevent: complete\nline3","provisional":True})
        self.assertNotIn(b"\nevent: complete\n",body)
        self.assertEqual(body.count(b"event: delta"),1)
        for name in ("unknown","quota","retry"):
            with self.assertRaises(StreamContractError):
                galaxy_sse(name,{"value":"x"})

    def test_prototype_not_registered_with_live_function(self):
        live=(ROOT/"api/function_app.py").read_text()
        self.assertNotIn("from experimental.ai_streaming",live)
        self.assertNotIn("StreamingResponse",live)
        self.assertNotIn("PYTHON_ENABLE_INIT_INDEXING",(ROOT/"api/local.settings.example.json").read_text())

if __name__=="__main__":
    unittest.main()
