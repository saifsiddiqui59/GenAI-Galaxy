import test from 'node:test';
import assert from 'node:assert/strict';
import {articulatedHoverAt} from '../src/guardian/articulatedHover.js';

test('Skull Master has oppositely animated knees and full body motion during entrance',()=>{
 const a=articulatedHoverAt(950,'arriving');
 const b=articulatedHoverAt(1400,'arriving');
 assert(a.active>0);
 assert(Math.abs(a.leftThigh)>.08);
 assert.equal(a.leftThigh,-a.rightThigh);
 assert(a.leftKnee>0 || a.rightKnee>0);
 assert.notEqual(a.leftThigh,b.leftThigh);
 assert(Math.abs(a.spine)>.001);
 assert(Math.abs(a.pelvis)<.013&&Math.abs(a.chest)<.023);
});
test('motion remains controlled during orbit plucks and is disabled for reduced motion',()=>{
 for(const ms of [100,950,4500,18000,90000]){
  for(const phase of ['arriving','collecting','offering','idle']){
   const m=articulatedHoverAt(ms,phase);
   assert(Math.abs(m.leftThigh)<.241);
   assert(m.leftKnee>=0&&m.leftKnee<=.281);
   assert(Math.abs(m.spine)<.036);
   assert(Object.values(m).every(Number.isFinite));
   const r=articulatedHoverAt(ms,phase,true);
   for(const key of Object.keys(r)) assert(Math.abs(r[key])===0,'reduced motion '+key);
  }
 }
});
