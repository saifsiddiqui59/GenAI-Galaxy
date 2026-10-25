// P60 source-level interview layout contract. CI also runs browser mocks.
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(base,'app.js'),'utf8');
const css=fs.readFileSync(path.join(base,'styles.css'),'utf8');
const start=js.indexOf('function practiceMarkup()');
const end=js.indexOf('// Deterministic transparent proxy',start);
assert.ok(start>0&&end>start);
const html=js.slice(start,end);
for(const phrase of ['01 · AI QUESTION','02 · MY ANSWER','03 · AI FEEDBACK','04 · Improved interview-ready answer', 'Advanced options · learning modes, role & coaching','Topic picker & reference']){
 assert.ok(html.includes(phrase),phrase);
}
for(const command of ['top-teach','top-skip','evaluate-btn','evaluate-local','adaptive-next','adaptive-next-topic','tutor-reference','tutor-explain','tutor-followup','spoken-answer']){
 assert.ok(html.includes('id="'+command+'"'), 'Missing existing control '+command);
}
assert.ok(html.includes('Sign in for AI evaluation'));
assert.ok(html.includes('Local check (free)'));
assert.ok(html.includes('uses model tokens'));
assert.ok(html.includes('Not a factual grade') || html.includes('NOT A FACTUAL GRADE'));
assert.ok(css.includes('@media(max-width:900px)'));
assert.ok(css.includes('focus-visible'));
console.log('P60 focused interview layout and zero-cost control preservation PASS');
