"use strict";
// P73 one-question workspace: progressive disclosure without removing features.
// Source-only checks run in CI; protected P61 hosted browser checks interaction.
const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");
const read=(name)=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
const js=read("app.js"),css=read("styles.css");
const html=js.slice(js.indexOf("function practiceMarkup()"),js.indexOf("// Deterministic transparent proxy"));
assert.ok(html.length>4000,"Interview markup exists");
for(const marker of [
 "One question. A clearer answer.",
 'class="interview-focus"',
 'class="interview-journey"',
 'class="interview-journey-steps"',
 'class="practice-help"',
 'class="practice-question-footer"',
 'class="practice-submit-actions"',
 'class="practice-more-actions"',
 'class="practice-evidence"',
 "Why this feedback? Review the evidence",
 "04 · Improved interview-ready answer",
]){
 assert.ok(html.includes(marker),`Missing progressive practice pattern: ${marker}`);
}
const count=(needle)=>html.split(needle).length-1;
for(const id of ["top-teach","top-hint","top-skip","tutor-reference","tutor-explain",
 "tutor-followup","tutor-question","spoken-answer","answer-form","evaluate-btn",
 "adaptive-teach","adaptive-skip","adaptive-next","adaptive-next-topic","adaptive-explain"]){
 assert.equal(count('id="'+id+'"'),1,"Existing control changed or duplicated: "+id);
}
// No tutor/model API or quota rewrites; no multiple-choice and no purchased model call.
assert.ok(!html.includes("data-choice="));
assert.ok(html.includes("Local check (free)"));
assert.ok(html.includes("uses model tokens"));
assert.ok(html.includes("NOT A FACTUAL GRADE"));
assert.ok(html.indexOf('id="top-skip"')<html.indexOf('id="spoken-answer"'),
 "Visible skip remains next to the question");
assert.ok(html.indexOf('class="practice-evidence"')<html.indexOf("04 · Improved interview-ready answer"),
 "Detailed evidence is optional but the improved answer remains visible");
for(const cls of [".interview-focus",".interview-journey",
 ".practice-help",".practice-more-actions",".practice-evidence"]){
 assert.ok(css.includes(cls),"Missing style: "+cls);
}
assert.ok(css.includes("@media(max-width:760px)"),"Mobile layout missing");
assert.ok(css.includes("focus-visible"),"Keyboard focus missing");
console.log("P73 focused interview UX and preserved feature contract PASS");
