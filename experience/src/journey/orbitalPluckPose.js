/* Deterministic orbital pluck: move the collector, not the planet.
 * t=0-.30: upright hover toward a future orbit point
 * t=.30-.50: reach to the world in its original orbit
 * t=.50: physical palm contact; only then the planet leaves the atlas
 * t=.50-.84: hand carries it to the satchel, not a floor pickup
 */
import {smooth,CONTACT,RELEASE} from './choreography.js';

export const PLUCK_REACH_BEGIN=.27;
export const PLUCK_REACH_END=CONTACT;
export function orbitalPluckPose(t){
 const u=Number.isFinite(t)?t:0;
 const approach=smooth(u/PLUCK_REACH_BEGIN);
 const reach=smooth((u-PLUCK_REACH_BEGIN)/(PLUCK_REACH_END-PLUCK_REACH_BEGIN));
 const returnToIdle=smooth((u-(RELEASE-.06))/.10);
 return Object.freeze({
  flight:'hover',
  requiresGround:false,
  sampleGroundWalk:false,
  sampleBendingPickup:false,
  travel:approach,
  reachWeight:reach*(1-returnToIdle),
  palmContact:u>=CONTACT,
  returnToIdle
 });
}
