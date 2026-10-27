/* Keep an orbit-following Skull Master in view on narrow phones and desktop.
 * This only changes the cinematic camera, not curriculum state or world positions.
 * Return to the fixed camera for the final learning atlas.
 */
import {COLLECT_START_MS,PER_WORLD_MS,OFFER_SETTLE_MS,smooth} from '../journey/choreography.js';
export function cameraTrackingAt(ms,position,activeIndex,completedCount,reducedMotion=false){
 const base={x:0,y:.3,z:12.5};
 if(reducedMotion||!position||!Number.isFinite(position.x)||!Number.isFinite(position.y))return base;
 const elapsed=ms-COLLECT_START_MS;
 if(elapsed<0)return base;
 const last=COLLECT_START_MS+completedCount*PER_WORLD_MS;
 if(completedCount<=0)return base;
 const approach=activeIndex>=0?
   smooth(((elapsed%PER_WORLD_MS)/PER_WORLD_MS)/.30):
   1-smooth((ms-last)/OFFER_SETTLE_MS);
 const strength=Math.max(0,Math.min(1,approach));
 if(strength===0)return base;
 // Point the camera toward the real moving character, leaving enough
 // rightward space for the currently orbiting planet. A tighter cinematic
 // lens at grasp time makes the fingers and the contact visible to viewers.
 return {x:Math.max(-9,Math.min(9,position.x*.82*strength)),
         y:.3+Math.max(-4,Math.min(5,(position.y+.8)*.58*strength)),
         z:12.5-4.4*strength};
}
