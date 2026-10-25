// Single shared cinematic transition: immersive opening -> one featured world pickup
// -> the entire remaining constellation glides to its familiar right-side atlas.
// Keep all 17 world IDs and orbit positions unchanged; transform their parent only.
import {COLLECT_START_MS,PER_WORLD_MS,smoother} from '../journey/choreography.js';
export const ATLAS_REVEAL_MS=1750;
export function atlasRevealStart(completedCount=0){
 // First real pickup completes before the atlas moves aside. When there is
 // nothing completed, the galaxy shifts after the entrance instead.
 return COLLECT_START_MS+(completedCount>0?PER_WORLD_MS:0);
}
export function cinematicLayoutAt(ms,compact=false,short=false,completedCount=0,reducedMotion=false){
 const start=atlasRevealStart(completedCount);
 const progress=reducedMotion?1:smoother((Math.max(0,Number(ms)||0)-start)/ATLAS_REVEAL_MS);
 // Keep each planet spherical (uniform xyz scale) and compensate depth with
 // the initial z-offset so spreading the orbit does not send it far from camera.
 // Give Skull Master breathing room in front of the constellation.
 // The large original opening was visually crowded despite being fullscreen.
 const from=compact?
  {position:[-6.45,short?.48:.82,-1.5],scale:[1.45,1.45,1.45]}:
  {position:[-10.6,0,1.2],scale:[2.4,2.4,2.4]};
 // Portrait: atlas floats to the upper right, leaving the walking Genie
 // legible on lower left while keeping each planet perfectly spherical.
 const to=compact?
  {position:[-.70,short?2.0:2.12,-2.3],scale:[.52,.52,.52]}:
  {position:[0,0,0],scale:[1,1,1]};
 const blend=(a,b)=>progress===1?b:progress===0?a:a+(b-a)*progress;
 return {progress,phase:progress===1?'atlas':progress===0?'immersive':'transition',
  position:from.position.map((v,i)=>blend(v,to.position[i])),
  scale:from.scale.map((v,i)=>blend(v,to.scale[i]))};
}
