"""Build a portable, guest-only P18 adaptive-learning preview from current repo.

Output is a standalone HTML file with inline CSS, curriculum and lesson data.
No Auth, Supabase, paid model requests, document uploads, or remote resources.
Do not use as a production/authentication test.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/adaptive-learning-preview.html"


def build():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    css = (ROOT / "styles.css").read_text(encoding="utf-8")
    app = (ROOT / "app.js").read_text(encoding="utf-8")
    subjects = json.loads((ROOT / "data/curriculum.json").read_text(encoding="utf-8"))
    lessons = json.loads((ROOT / "data/lessons.json").read_text(encoding="utf-8"))
    assert len(subjects) == 17 and len(lessons) == 245
    assert "async function initAuth(){\n try{" in app
    app = app.replace(
        "async function initAuth(){\n try{",
        "async function initAuth(){\n if(window.__GALAXY_OFFLINE_PREVIEW)return;\n try{",
        1,
    )
    assert "window.__GALAXY_OFFLINE_PREVIEW)return" in app
    # Prevent any accidental inline-script termination.
    app = app.replace("</script", "<\\/script")
    css = css.replace("</style", "<\\/style")
    dataset = json.dumps(
        {"curriculum": subjects, "lessons": lessons},
        separators=(",", ":"), ensure_ascii=False,
    ).replace("</", "<\\/")
    offline = """
<script>
window.__GALAXY_OFFLINE_PREVIEW = true;
window.GALAXY_EVALUATOR_URL = '';
window.GALAXY_VAULT_EXTRACT_URL = '';
window.GALAXY_SPEECH_BROKER_URL = '';
window.__GALAXY_OFFLINE_DATA = """ + dataset + """;
window.fetch = async function(input){
  const url = String(input);
  if(url === 'data/curriculum.json')
    return {ok:true,status:200,json:async()=>window.__GALAXY_OFFLINE_DATA.curriculum};
  if(url === 'data/lessons.json')
    return {ok:true,status:200,json:async()=>window.__GALAXY_OFFLINE_DATA.lessons};
  throw new Error('Offline guest preview blocks network API requests');
};
</script>
"""
    assert html.count('<link rel="stylesheet" href="styles.css">') == 1
    assert html.count('<script src="runtime-config.js" defer></script>') == 1
    assert html.count('<script src="app.js" defer></script>') == 1
    html = html.replace(
        '<link rel="stylesheet" href="styles.css">',
        "<style>" + css + "</style>"
    )
    html = html.replace(
        '<script src="runtime-config.js" defer></script>',
        offline,
    ).replace(
        '<script src="app.js" defer></script>',
        "<script>" + app + "</script>",
    )
    html = html.replace(
        '<title>GenAI Galaxy | Adaptive Interview Tutor</title>',
        '<title>GenAI Galaxy | P18 Guest-only Adaptive Preview</title>',
    )
    html = html.replace(
        '<button id="signin-btn" class="btn subtle">Sign in</button>',
        '<button id="signin-btn" class="btn subtle" disabled '
        'title="Offline preview cannot sign in">Guest-only demo</button>',
    )
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(html, encoding="utf-8")
    assert html.count("window.GALAXY_EVALUATOR_URL = '';") == 1
    assert "window.__GALAXY_OFFLINE_PREVIEW = true;" in html
    assert not '<script src="app.js"' in html
    print(f"P18_STANDALONE_GUEST_PREVIEW={OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    build()
