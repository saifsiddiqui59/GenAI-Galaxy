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
 // circular constellation to FIT the narrow viewport; it still fills the
 // height and space background rather than drifting into the upper right.
 const pose=compact?
   {position:[-3.05,short?.48:.62,-1.5],scale:[.68,.68,.68]}:
   {position:[-8.30,0,1.2],scale:[1.85,1.85,1.85]};
 return {progress:0,phase:'immersive',
  position:[...pose.position],scale:[...pose.scale]};
}
