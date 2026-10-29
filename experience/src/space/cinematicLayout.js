// Immersive full-viewport constellation — NEVER collapse to a right-side atlas.
// Keep all 17 original curriculum world positions and identical uniform scaling
// before, during, and after the Skull Master's orbit-to-palm collection.
// The UI may switch from intro to learning controls independently of this pose.
import {COLLECT_START_MS,PER_WORLD_MS} from '../journey/choreography.js';

// Retained for compatibility with prior public APIs; no reveal animation runs.
export const ATLAS_REVEAL_MS=1750;
export const atlasRevealStart=(completedCount=0)=>
 COLLECT_START_MS+(completedCount>0?PER_WORLD_MS:0);

export function cinematicLayoutAt(ms,compact=false,short=false,completedCount=0,reducedMotion=false){
 // The layout is intentionally time-invariant. On a phone, scale the whole
 // circular constellation to FIT the narrow viewport. Keep its centre at
 // exactly x=0; slightly increase visible mobile footprint without changing
 // collection contact geometry or moving the orbit after any pickup.
 const pose=compact?
   (short?
    {position:[-3.8528,.48,-1.5],scale:[.86,.86,.86]}:
    {position:[-4.2112,.62,-1.5],scale:[.94,.94,.94]}):
   {position:[-9.50,0,1.2],scale:[2.20,2.20,2.20]};
 return {progress:0,phase:'immersive',
  position:[...pose.position],scale:[...pose.scale]};
}
