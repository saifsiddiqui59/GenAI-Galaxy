const assert=require('node:assert/strict'),p=require('../features/milestones.js');
let x=p.summarize({progress:{a:{status:1}},attempts:[{serverReviewed:false}]});
assert.equal(x.counts.started,1);assert.ok(x.earned.some(y=>y.id==='first-topic'));
assert.ok(!x.earned.some(y=>y.id==='first-model-review'));
assert.ok(x.notice.includes('not independently verified'));
x=p.summarize({progress:Object.fromEntries(Array.from({length:10},(_,i)=>[i,{status:1}])),
 attempts:[{serverReviewed:true}]});
assert.equal(x.counts.started,10);
assert.ok(x.earned.some(y=>y.id==='first-model-review'));
console.log('P35 P3 motivation signals distinguish completion from mastery');
