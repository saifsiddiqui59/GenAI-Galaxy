import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDepthStars} from '../src/space/starDepthData.js';
test('deterministic sparse star positions keep near/middle/far depth independent',()=>{
 const first=makeDepthStars(22,-23,53),second=makeDepthStars(22,-23,53);
 assert.deepEqual(Array.from(first),Array.from(second));
 assert.equal(first.length,66);
 for(let i=0;i<first.length;i+=3){
  assert(Math.abs(first[i])<=24&&Math.abs(first[i+1])<=12.5);
  assert(first[i+2]>=-26&&first[i+2]<=-20);
 }
});
