'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../../genie/progress/story.js'),'utf8');
const window={};vm.runInNewContext(code,{window,Math,Date,Object,Set,Array,Number,String}, {filename:'story.js'});
const {build,topicKey}=window.GalaxyProgressStory;
const subjects=Array.from({length:17},(_,i)=>({title:'World '+i}));
const topics=[
 {branch:'World 0',group:'G',title:'A',branchIndex:0},
 {branch:'World 0',group:'G',title:'B',branchIndex:0},
 {branch:'World 1',group:'G',title:'C',branchIndex:1},
 ...Array.from({length:15},(_,i)=>({branch:'World '+(i+2),group:'G',title:'E'+i,branchIndex:i+2}))
];
const key=t=>topicKey(t);
const own=(status,next_review_at)=>({user_id:'alice',status,next_review_at});
const progress={
 [key(topics[0])]:own(2),
 [key(topics[1])]:own(1),
 [key(topics[2])]:own(2,'2025-01-01T00:00:00.000Z')
};
const baseline=build({userId:'alice',subjects,topics,progress,now:Date.parse('2026-01-01')});
assert.equal(baseline.masteredWorlds.length,0,'a single unfinished topic blocks entire world mastery');
assert.equal(baseline.masteredTopicCount,2);
assert.equal(baseline.next.kind,'revision');
assert.equal(baseline.next.topic,'C');
assert.ok(!('userId' in baseline),'private identity is not returned');
const completed={...progress,[key(topics[1])]:own(2)};
const result=build({userId:'alice',subjects,topics,progress:completed});
assert.equal(result.masteredWorlds.length,1);
assert.equal(result.masteredWorlds[0].name,'World 0');
const forged={...progress,[key(topics[0])]:{user_id:'bob',status:2}};
assert.throws(()=>build({userId:'alice',subjects,topics,progress:forged}),/owner/);
assert.throws(()=>build({userId:'',subjects,topics,progress}),/Verified account/);
assert.throws(()=>build({userId:'alice',subjects:subjects.slice(1),topics,progress}),/17/);
const finished=Object.fromEntries(topics.map(t=>[key(t),own(2)]));
const all=build({userId:'alice',subjects,topics,progress:finished});
assert.equal(all.allWorldsMastered,true);
assert.equal(all.next.kind,'consolidation');
assert.equal(topics[0].title,'A','model never mutates curriculum');
console.log('Genie progress storytelling: accurate mastered worlds, revision priority, auth guard and no mutations PASS');
