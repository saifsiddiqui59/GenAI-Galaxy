import test from 'node:test';
import assert from 'node:assert/strict';
import {phaseAt,COLLECT_START_MS,PER_WORLD_MS,TOTAL_WORLDS} from '../src/journey/story.js';
test('seventeen mastered planets retain deterministic per-planet pickup state',()=>{
 assert.equal(TOTAL_WORLDS,17);
 assert.deepEqual(phaseAt(0,3),{phase:'arriving',visible:0,activeIndex:-1});
 assert.deepEqual(phaseAt(COLLECT_START_MS+100,3),{phase:'collecting',visible:0,activeIndex:0});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS+100,3),{phase:'collecting',visible:1,activeIndex:1});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS*2+100,3),{phase:'collecting',visible:2,activeIndex:2});
 assert.deepEqual(phaseAt(COLLECT_START_MS+PER_WORLD_MS*3+600,3),{phase:'offering',visible:3,activeIndex:-1});
});
test('skip and reduced motion do not fake progress or replay pickups',()=>{
 assert.deepEqual(phaseAt(0,0,true),{phase:'offering',visible:0,activeIndex:-1});
 assert.deepEqual(phaseAt(0,3,true),{phase:'offering',visible:3,activeIndex:-1});
 assert.deepEqual(phaseAt(99999,17),{phase:'offering',visible:17,activeIndex:-1});
 assert.equal(phaseAt(COLLECT_START_MS+PER_WORLD_MS*17-1,17).visible,16);
});
