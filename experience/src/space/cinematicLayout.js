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
 const from=compact?
  {position:[-2.78,short?.55:.87,-3.65],scale:[.65,.65,.65]}:
  {position:[-7.45,-.04,-1.3],scale:[1.65,1.65,1.65]};
 const to=compact?
  {position:[-1.8,short?.75:1.15,-2],scale:[.58,.58,.7]}:
  {position:[0,0,0],scale:[1,1,1]};
 const blend=(a,b)=>a+(b-a)*progress;
 return {progress,phase:progress===1?'atlas':progress===0?'immersive':'transition',
  position:from.position.map((v,i)=>blend(v,to.position[i])),
  scale:from.scale.map((v,i)=>blend(v,to.scale[i]))};
}
