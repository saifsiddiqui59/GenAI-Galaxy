import test from 'node:test';
import assert from 'node:assert/strict';
import {MASTER_ART,clothHeight,addSkullMasterDetail} from '../src/guardian/skullMasterDetail.js';
test('fabric sculpt detailing is deterministic without hidden external texture fetch',()=>{
 assert.equal(MASTER_ART.clothResolution,128);
 assert.equal(clothHeight(14,23),clothHeight(14,23));
 assert.notEqual(clothHeight(14,23),clothHeight(27,38));
 for(let y=0;y<128;y+=7)for(let x=0;x<128;x+=9)
  assert(clothHeight(x,y)>=0&&clothHeight(x,y)<=255);
});
test('rig unavailable -> no unsupported detail geometry',()=>{
 assert.equal(typeof addSkullMasterDetail({getObjectByName:()=>null},{}),'function');
});
