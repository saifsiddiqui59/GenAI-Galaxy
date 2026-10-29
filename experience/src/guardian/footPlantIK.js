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

/* V6.10.1: A foot has a fixed WORLD-SPACE landing target for the complete
 * stance half-cycle. The old correction used the moving ankle to define the
 * "floor"; that feedback loop made both ankles drift with the character.
 * Compute the landing by arc-length from the immutable approach route.
 * Contact sites are also used by the WALKWAY and footfall discs.
 */
const smoothly=x=>{const t=clamp(x);return t*t*(3-2*t)};
export function walkingFootTarget(pose,side,compact=false,scale=1,floorOffset=0){
 if(!['left','right'].includes(side))throw Error('Unknown foot side');
 if(!pose?.walkingRouteFrom||!pose.walkingRouteTo||
   !Number.isFinite(pose.walkDistance)||!Number.isFinite(pose.walkingRouteProgress))
  return null;
 const from=pose.walkingRouteFrom,to=pose.walkingRouteTo;
 const routeProgress=clamp(pose.walkingRouteProgress);
 const travelled=walkingRouteDistance(from,to,routeProgress,compact);
 const prefix=pose.walkDistance-travelled;
 const d=pose.walkDistance;
 // Right foot lands at quarter strides, left at three-quarter strides;
 // each stance target is CONSTANT over a half-cycle of travelled distance.
 const strideIndex=Math.floor(d/STRIDE_DISTANCE);
 const phase=2*Math.PI*d/STRIDE_DISTANCE;
 const swing=Math.sin(phase)*(side==='left'?1:-1);
 const center=(strideIndex+(side==='left'?.75:.25))*STRIDE_DISTANCE;
 const stanceDistance=side==='left'&&d/STRIDE_DISTANCE-strideIndex<.5
    ?center-STRIDE_DISTANCE:center;
 const local=clamp(stanceDistance-prefix,0,walkingRouteDistance(from,to,1,compact));
 const u=invertRouteDistance(from,to,local,compact);
 const spot=walkingPathPoint(from,to,u,compact);
 const behind=walkingPathPoint(from,to,clamp(u-.009),compact);
 const ahead=walkingPathPoint(from,to,clamp(u+.009),compact);
 const dx=ahead.x-behind.x,dz=ahead.z-behind.z;
 const length=Math.max(.0001,Math.hypot(dx,dz));
 const sideSign=side==='left'?-1:1;
 const lane=.20*scale;
 const landing={x:spot.x-sideSign*dz/length*lane,
   y:spot.y+floorOffset*scale,
   z:spot.z+sideSign*dx/length*lane};
 // Lock until toe-off; soften the transitions so the knees cannot snap.
 const contact=smoothly(clamp((-swing+.30)/.65));
 const movement=clamp((pose.walkSpeed||0)/.42);
 const weight=pose.walking?contact*movement:0;
 return {...landing,weight,contact,phase,stanceDistance,
   routeU:u,routeProgress,side};
}
