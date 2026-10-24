import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS_ANCHORS,atlasLayout} from '../src/space/worldAnchors.js';
test('curated galaxy retains 17 unique curriculum-world indexes',()=>{
 const rows=atlasLayout();assert.equal(rows.length,17);
 assert.deepEqual(rows.map(r=>r.index),Array.from({length:17},(_,i)=>i));
 assert.deepEqual(atlasLayout(17),rows);
 assert.equal(atlasLayout(-2).length,0);
 assert.equal(atlasLayout(3).length,3);
 assert.equal(atlasLayout(30).length,17);
 assert.equal(ATLAS_ANCHORS.length,17);
});
test('non-spiral atlas separates clickable planets at normal size',()=>{
 const worlds=atlasLayout();
 for(const [i,a] of worlds.entries()){
  assert(Number.isFinite(a.x)&&Number.isFinite(a.y)&&Number.isFinite(a.z));
  for(const b of worlds.slice(i+1)){
   const distance=Math.hypot(a.x-b.x,a.y-b.y);
   assert(distance>a.scale+b.scale+.22, `crowded planets ${i} and ${b.index}: ${distance}`);
  }
 }
});
