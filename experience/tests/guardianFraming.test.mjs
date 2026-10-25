import test from 'node:test';
import assert from 'node:assert/strict';
import {guardianStageScale,guardianFloorY} from '../src/guardian/guardianFraming.js';

test('Skull Master becomes clearly larger on desktop without oversized mobile figure',()=>{
 const large=guardianStageScale(false,false);
 assert(large>=1.2&&large<=1.28);
 assert.equal(guardianStageScale(true,true),.68);
 assert.equal(guardianStageScale(true,false),.77);
 assert.equal(guardianStageScale(false,true),large);
});
test('platform remains anchored to original floor coordinates in every viewport',()=>{
 assert.equal(guardianFloorY(false,false),-2.25);
 assert.equal(guardianFloorY(true,true),-.95);
 assert.equal(guardianFloorY(true,false),-1.58);
});
