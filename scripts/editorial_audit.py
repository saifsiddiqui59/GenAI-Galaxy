"""Reproducible editorial triage. Heuristics NEVER constitute SME validation."""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LESSONS = ROOT / "data" / "lessons.json"
REQUIRED = ("simple", "technical", "example", "project", "answer")
LIST_FIELDS = ("workflow", "mistakes", "followups", "keywords")
FLAG_PATTERNS = {
    "time-sensitive wording": re.compile(r"\b(?:preview|deprecated|latest|currently|newest|GA|20\d\d)\b", re.I),
    "absolute wording": re.compile(r"\b(?:always|never|guarantee|100%|completely|exactly)\b", re.I),
    "first-person delivery claim": re.compile(
        r"\b(?:I|we|our team)\s+(?:built|delivered|deployed|implemented|led|achieved|reduced|migrated|created|saved)\b", re.I),
    "vendor-specific explanation": re.compile(r"\b(?:azure|databricks|supabase|foundry|langgraph|openai)\b", re.I),
}


def audit(lessons):
    if not isinstance(lessons, dict):
        raise ValueError("Expected a dictionary of distinct lesson titles")
    summary = {"lesson_count": len(lessons), "structural_issues": [], "flag_counts": {x: 0 for x in FLAG_PATTERNS},
               "review_queue": []}
    for title, entry in sorted(lessons.items()):
        if not isinstance(entry, dict):
            summary["structural_issues"].append(title + ": invalid lesson object")
            continue
        for field in REQUIRED:
            if not isinstance(entry.get(field), str) or not entry[field].strip():
                summary["structural_issues"].append(title + ": missing " + field)
        for field in LIST_FIELDS:
            if not isinstance(entry.get(field), list) or not entry[field]:
                summary["structural_issues"].append(title + ": missing " + field)
        words = re.findall(r"\b[\w-]+\b", entry.get("answer", "") if isinstance(entry.get("answer"), str) else "")
        if not 60 <= len(words) <= 140:
            summary["structural_issues"].append(title + ": answer outside 60-140 approximate words")
        combined = " ".join(str(entry.get(k, "")) for k in REQUIRED)
        flags = [name for name, pat in FLAG_PATTERNS.items() if pat.search(combined)]
        for label in flags:
            summary["flag_counts"][label] += 1
        if flags:
            summary["review_queue"].append({"topic": title, "flags": flags})
    return summary


def main():
    data = json.loads(LESSONS.read_text(encoding="utf-8"))
    report = audit(data)
    print(json.dumps(report, indent=2, ensure_ascii=False))
    if report["structural_issues"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
