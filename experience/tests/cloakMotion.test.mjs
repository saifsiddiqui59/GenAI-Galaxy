import test from 'node:test';
import assert from 'node:assert/strict';
import {cloakSway,moveSkullMasterCloak} from '../src/guardian/cloakMotion.js';
test('cloak remains anchored at chest while hem responds to walk and idle',()=>{
 for(const t of [0,80,550,1700,2500])for(const column of [0,.4,1]){
  const shoulder=cloakSway(t,0,column,true);
  assert.deepEqual(shoulder,{x:0,z:0});
  const hem=cloakSway(t,1,column,true);
  const idle=cloakSway(t,1,column,false);
  assert(Math.abs(hem.x)<=.046&&Math.abs(hem.z)<.093);
  assert(Math.abs(idle.x)<=Math.abs(hem.x)+1e-9);
  assert(Math.abs(idle.z)<=Math.abs(hem.z)+1e-9);
 }
 assert.notDeepEqual(cloakSway(0,1,.4),cloakSway(550,1,.4));
});
test('missing rig has safe no-op and does not fabricate mesh',()=>{
 assert.equal(moveSkullMasterCloak({getObjectByName:()=>null},0),false);
});
