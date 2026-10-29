/* Lock the stance ankle against travelled world distance on the actual
 * orbital walking route. All maths are derived from the deterministic clock,
 * so seeking/replay does not require stale per-frame IK state.
 */
import {walkingPathPoint,walkingRouteDistance} from '../journey/orbitalApproach.js';
import {STRIDE_DISTANCE} from './groundedStride.js';
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
export function invertRouteDistance(from,to,distance,compact=false){
 if(!from||!to)return 0;
 const len=walkingRouteDistance(from,to,1,compact);
 const d=clamp(Number.isFinite(distance)?distance:0,0,len);
 let lo=0,hi=1;
 for(let i=0;i<12;i++){
  const mid=(lo+hi)*.5;
  if(walkingRouteDistance(from,to,mid,compact)<d)lo=mid;else hi=mid;
 }
 return (lo+hi)*.5;
}
export function plantedFootCorrection(pose,side,compact=false){
 if(!pose?.walkingRouteFrom||!pose.walkingRouteTo||!pose.walking||!Number.isFinite(pose.walkDistance))
  return {dx:0,dy:0,dz:0,weight:0};
 const from=pose.walkingRouteFrom,to=pose.walkingRouteTo;
 const currentDistance=walkingRouteDistance(from,to,pose.walkingRouteProgress,compact);
 const prefix=pose.walkDistance-currentDistance;
 const offset=side==='left'?.5*STRIDE_DISTANCE:0;
 const n=Math.floor((pose.walkDistance-offset)/STRIDE_DISTANCE);
 const stanceStart=Math.max(prefix,offset+n*STRIDE_DISTANCE);
 const phase=(pose.walkDistance/STRIDE_DISTANCE)*Math.PI*2;
 const swing=Math.sin(phase)*(side==='left'?1:-1);
 const weight=clamp((-swing+.16)/.38)*clamp((pose.walkSpeed||0)/1.5);
 const startU=invertRouteDistance(from,to,stanceStart-prefix,compact);
 const planted=walkingPathPoint(from,to,startU,compact);
 const now=walkingPathPoint(from,to,pose.walkingRouteProgress,compact);
 const dx=clamp(now.x-planted.x,-.42,.42)*weight;
 const dy=clamp(now.y-planted.y,-.30,.30)*weight;
 const dz=clamp(now.z-planted.z,-.42,.42)*weight;
 return {dx,dy,dz,weight,stanceStart,worldPoint:planted};
}
