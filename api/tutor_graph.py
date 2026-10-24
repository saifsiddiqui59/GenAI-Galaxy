"""Low-token, branching LangGraph tutor orchestrator.

Reference and quiz routes are server-owned and free. Only explain, clarify,
and followup routes enter the single paid model node, after JWT+quota checks
in the caller. Compiled once per Function worker; no state persistence.
"""
from __future__ import annotations
from typing import Callable, TypedDict
from langgraph.graph import START, END, StateGraph

ALLOWED_MODES = frozenset(("reference", "quiz", "explain", "clarify", "followup"))
FREE_MODES = frozenset(("reference", "quiz"))


class TutorState(TypedDict, total=False):
    mode: str
    rubric: dict
    message: str
    history: list
    model_call: Callable
    reply: str
    next_question: str
    model_called: bool
    usage: dict


def validate_tutor_request(body: object, valid_topics: set[str]) -> dict:
    """Validate before invoking any graph node (particularly the billed node)."""
    from core import InputError, topic_key, validate_interview_history
    if not isinstance(body, dict):
        raise InputError("Invalid tutor request")
    key = topic_key(body.get("topic_key"), valid_topics)
    mode = body.get("mode")
    if mode not in ALLOWED_MODES or not isinstance(mode, str):
        raise InputError("Unsupported tutor mode")
    message = body.get("message", "")
    if not isinstance(message, str) or len(message)>1200 or (
        mode not in FREE_MODES and not 3 <= len(message.strip()) <= 1200
    ):
        raise InputError("Tutor message must be 3 to 1200 characters")
    history = validate_interview_history(body.get("history"))
    return {"topic_key": key, "mode": mode, "message": message.strip(),
            "history": history}


def _route(_: TutorState) -> dict:
    # No LLM intent classifier. A restricted, client-selected mode is cheaper
    # and more predictable than unconstrained router generation.
    return {}


def _destination(state: TutorState) -> str:
    if state["mode"] in FREE_MODES:
        return state["mode"]
    return "model"


def _reference(state: TutorState) -> dict:
    rubric=state["rubric"]
    return {"reply":rubric["reference_answer"],
            "next_question":rubric["question"],"model_called":False,"usage":{}}


def _quiz(state: TutorState) -> dict:
    question=state["rubric"]["question"]
    return {"reply":question,"next_question":question,
            "model_called":False,"usage":{}}


def _model(state: TutorState) -> dict:
    # Single paid call. The injected callable MUST reserve quota before call.
    result=state["model_call"](state)
    if not isinstance(result, dict):
        raise RuntimeError("Tutor provider did not return structured output")
    reply=result.get("reply")
    next_question=result.get("next_question")
    usage=result.get("usage",{})
    if (not isinstance(reply,str) or not 5<=len(reply.strip())<=2500
        or not isinstance(next_question,str) or
        not 5<=len(next_question.strip())<=400 or not isinstance(usage,dict)):
        raise RuntimeError("Tutor output validation failed")
    return {"reply":reply.strip(),"next_question":next_question.strip(),
            "usage":usage,"model_called":True}


def build_graph():
    workflow=StateGraph(TutorState)
    workflow.add_node("route",_route)
    workflow.add_node("reference",_reference)
    workflow.add_node("quiz",_quiz)
    workflow.add_node("model",_model)
    workflow.add_edge(START,"route")
    workflow.add_conditional_edges("route",_destination,
        {"reference":"reference","quiz":"quiz","model":"model"})
    for name in ("reference","quiz","model"):
        workflow.add_edge(name,END)
    return workflow.compile()


TUTOR_GRAPH=build_graph()


def invoke_tutor(mode: str, rubric: dict, message: str, history: list,
                 model_call: Callable) -> dict:
    state=TUTOR_GRAPH.invoke({"mode":mode,"rubric":rubric,"message":message,
                              "history":history,"model_call":model_call})
    return {name:state[name] for name in ("reply","next_question","usage","model_called")}
