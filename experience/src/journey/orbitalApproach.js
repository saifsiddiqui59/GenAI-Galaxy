/* V6.10 — distance-driven route for the ORIGINAL walking 3D Skull Master.
 * The body reaches the *actual* moving orbital planet; physics and IDs remain
 * unchanged. No position teleports, animation-time sliding or invented pickup.
 * The same deterministic clock drives route length, leg strides and collection.
 */
import {galaxySpaceAt,launchAt} from '../space/worldOrbit.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,OFFER_SETTLE_MS,entranceAt,smoother} from './choreography.js';
import {guardianStageScale,guardianFloorY} from '../guardian/guardianFraming.js';

const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const DISTANCE_SAMPLES=18;
const APPROACH_SECONDS=PER_WORLD_MS*CONTACT/1000;
const xyzDistance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
const heading=(dx,dz)=>clamp(Math.atan2(dx,Math.abs(dz)+.50),-1.18,1.18);

export function orbitContactAt(index,order,compact=false,short=false,total=0,reduced=false){
 if(!Number.isInteger(index)||index<0||index>16)throw Error('Invalid collection world');
 return galaxySpaceAt(index,launchAt(order)+PER_WORLD_MS*CONTACT,compact,short,total,reduced);
}
// A gently bowed, continuous pathway in 3D. Its footstep ribbons are drawn
// on the SAME route, not beside a teleporting character.
export function walkingPathPoint(from,to,u,compact=false){
 const t=clamp(u),dx=to.x-from.x,dz=to.z-from.z;
 const length=Math.max(.001,Math.hypot(dx,dz));
 const bow=(compact?.16:.48)*Math.sin(Math.PI*t);
 return {x:from.x+dx*t-(dz/length)*bow,
         y:from.y+(to.y-from.y)*t,
         z:from.z+dz*t+(dx/length)*bow};
}
export function walkingRouteDistance(from,to,u,compact=false){
 const n=Math.max(1,Math.ceil(DISTANCE_SAMPLES*clamp(u))),end=clamp(u);
 if(!end)return 0;
 let prev=walkingPathPoint(from,to,0,compact),distance=0;
 for(let i=1;i<=n;i++){
  const p=walkingPathPoint(from,to,end*i/n,compact);
  distance+=xyzDistance(prev,p);prev=p;
 }
 return distance;
}
export function guardianApproachAt(ms,indexes=[],gripLocal={x:0,y:1.4,z:.3},compact=false,short=false,reduced=false){
 const safe=Array.isArray(indexes)?indexes.filter(i=>Number.isInteger(i)&&i>=0&&i<17).slice(0,17):[];
 const scale=guardianStageScale(compact,short);
 const entry=entranceAt(Math.min(Math.max(ms,0),COLLECT_START_MS),compact);
 const enterStart=entranceAt(0,compact);
 const floorY=guardianFloorY(compact,short);
 const home={x:entry.x,y:floorY,z:3.2};
 const homeEnd={x:entranceAt(COLLECT_START_MS,compact).x,
   y:floorY+(compact?(short?.26:.34):0),z:3.2};
 const entranceDistance=Math.abs(homeEnd.x-enterStart.x);
 const entryU=clamp(ms/1800);
 const entrySpeed=Math.abs(homeEnd.x-enterStart.x)*(30*entryU*entryU*(entryU-1)*(entryU-1))/1.8;
 const homePose={...home,
  y:floorY+(compact?(homeEnd.y-floorY)*smoother((ms-1600)/600):0),
  scale,walkWeight:reduced?0:Math.min(1,entrySpeed/1.1),speed:reduced?0:entrySpeed,
  walkDistance:reduced?0:Math.abs(entry.x-enterStart.x),yaw:entry.yaw,
  travel:0,routeFrom:null,routeTo:null,routeProgress:0,orbitalTarget:null};
 if(reduced||!safe.length||ms<COLLECT_START_MS)return homePose;
 const toPosition=(index,order)=>{
  const world=orbitContactAt(index,order,compact,short,safe.length,reduced);
  return {x:world.x-gripLocal.x*scale,
          y:world.y-gripLocal.y*scale,
          z:world.z-gripLocal.z*scale,world};
 };
 const places=safe.map((world,i)=>toPosition(world,i));
 const routeStart=i=>i===0?homeEnd:places[i-1];
 const prefixDistance=order=>{
  let distance=entranceDistance;
  for(let i=0;i<order;i++)distance+=walkingRouteDistance(routeStart(i),places[i],1,compact);
  return distance;
 };
 const endOfCollections=COLLECT_START_MS+safe.length*PER_WORLD_MS;
 if(ms>=endOfCollections){
  const last=places[places.length-1],seconds=OFFER_SETTLE_MS/1000;
  const t=clamp((ms-endOfCollections)/OFFER_SETTLE_MS),u=smoother(t);
  const pos=walkingPathPoint(last,homeEnd,u,compact);
  const speed=t>=1?0:walkingRouteDistance(last,homeEnd,clamp(u+.007),compact)
    -walkingRouteDistance(last,homeEnd,clamp(u-.007),compact);
  const rate=Math.max(0,speed)*60/seconds; // bounded deterministic finite difference
  return {...pos,scale,walkWeight:Math.min(1,rate/1.3),
   speed:rate,walkDistance:prefixDistance(safe.length)+walkingRouteDistance(last,homeEnd,u,compact),
   yaw:heading(homeEnd.x-last.x,homeEnd.z-last.z),travel:u,routeFrom:last,routeTo:homeEnd,
   routeProgress:u,orbitalTarget:last.world};
 }
 const order=Math.min(safe.length-1,Math.floor((ms-COLLECT_START_MS)/PER_WORLD_MS));
 const now=places[order],from=routeStart(order);
 const t=(ms-launchAt(order))/PER_WORLD_MS;
 const walkingFraction=clamp(t/CONTACT),u=smoother(walkingFraction);
 const pos=walkingPathPoint(from,now,u,compact);
 // Route length controls animation phase. When the feet stop at palm contact,
 // elapsed time alone cannot keep the legs cycling as the model slides.
 const walked=walkingRouteDistance(from,now,u,compact);
 const du=clamp(walkingFraction+.006),dv=clamp(walkingFraction-.006);
 const distanceDifference=walkingRouteDistance(from,now,smoother(du),compact)
     -walkingRouteDistance(from,now,smoother(dv),compact);
 const speed=walkingFraction>=1?0:Math.max(0,distanceDifference)/(.012*APPROACH_SECONDS);
 const before=walkingPathPoint(from,now,clamp(u-.015),compact);
 const after=walkingPathPoint(from,now,clamp(u+.015),compact);
 const yaw=heading(after.x-before.x,after.z-before.z);
 const weight=Math.min(1,speed/1.3);
 return {...pos,scale,speed,walkWeight:weight,
  walkDistance:prefixDistance(order)+walked,yaw,travel:u,routeFrom:from,routeTo:now,
  routeProgress:u,worldIndex:safe[order],
  orbitalTarget:galaxySpaceAt(safe[order],ms,compact,short,safe.length,reduced),
  contactTarget:now.world};
}
