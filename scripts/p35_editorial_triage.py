"""P35 P3 source-based editorial queue; structural audits do not fact-check lessons."""
from pathlib import Path
import json
import sys
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"scripts"))
from editorial_audit import audit

def triage(lessons):
    result=audit(lessons)
    flags=result["flag_counts"]
    queue=sorted(result["review_queue"],key=lambda r:(
        -(("absolute wording" in r["flags"])*4+("first-person delivery claim" in r["flags"])*3+
           ("time-sensitive wording" in r["flags"])*2),r["topic"]))
    return {"lesson_count":result["lesson_count"],"structural_issues":result["structural_issues"],
            "flag_counts":flags,"review_queue":queue,
            "warning":"Editorial keyword flags are triage only; every technical claim still needs SME/source review."}
def main():
    lessons=json.loads((ROOT/"data/lessons.json").read_text(encoding="utf-8"))
    print(json.dumps(triage(lessons),ensure_ascii=False,indent=2))
if __name__=="__main__":
    main()
