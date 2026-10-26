import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitalPluckPose,PLUCK_REACH_BEGIN} from '../src/journey/orbitalPluckPose.js';
import {CONTACT,RELEASE,PER_WORLD_MS,COLLECT_START_MS} from '../src/journey/choreography.js';
import {planetHiddenFromAtlas,galaxySpaceAt} from '../src/space/worldOrbit.js';
import {guardianApproachAt} from '../src/journey/orbitalApproach.js';

test('pluck never uses crouch, walking or ground pickup',()=>{
 for(const t of [0,.14,.27,.39,.49,.5,.61,.79,1]){
  const p=orbitalPluckPose(t);
  assert.equal(p.flight,'hover');
  assert.equal(p.requiresGround,false);
  assert.equal(p.sampleGroundWalk,false);
  assert.equal(p.sampleBendingPickup,false);
  assert(p.reachWeight>=0&&p.reachWeight<=1);
 }
 assert(PLUCK_REACH_BEGIN<CONTACT);
 assert(orbitalPluckPose(.38).reachWeight>.3,'arm starts reaching before contact');
 assert(orbitalPluckPose(CONTACT).reachWeight>.99,'hand fully reaches the orbit at pickup');
 assert(orbitalPluckPose(.65).reachWeight>.99,'hand holds the plucked sphere after contact');
 assert(orbitalPluckPose(RELEASE+.06).reachWeight<.001,'release resets the reach');
});
test('collector reaches source orbit before the planet can detach',()=>{
 const selected=[0,2,4],grip={x:.32,y:1.6,z:.24};
 for(let order=0;order<selected.length;order++){
  const contactMs=COLLECT_START_MS+(order+CONTACT)*PER_WORLD_MS;
  const beforeMs=contactMs-1;
  assert.equal(planetHiddenFromAtlas(beforeMs,order),false);
  assert.equal(planetHiddenFromAtlas(contactMs,order),true);
  const orbit=galaxySpaceAt(selected[order],contactMs,false,false,selected.length);
  const body=guardianApproachAt(contactMs,selected,grip,false,false);
  for(const axis of ['x','y','z'])
   assert(Math.abs(body[axis]+grip[axis]*body.scale-orbit[axis])<1e-8,axis);
  const prior=guardianApproachAt(COLLECT_START_MS+(order+.4)*PER_WORLD_MS,selected,grip,false,false);
  assert.equal(prior.worldIndex,selected[order]);
  assert(prior.travel>.8,'collector has glided beside planet before reaching');
 }
});
