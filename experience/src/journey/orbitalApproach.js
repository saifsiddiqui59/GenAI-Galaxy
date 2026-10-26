/* Spatial pickup choreography. The guardian travels to each actual world,
 * rather than pulling its planet to a dummy pickup point near the feet.
 * All inputs are deterministic on the shared scene clock.
 */
import {galaxySpaceAt,launchAt} from '../space/worldOrbit.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,OFFER_SETTLE_MS,entranceAt,smoother} from './choreography.js';
import {guardianStageScale,guardianFloorY} from '../guardian/guardianFraming.js';

export function orbitContactAt(index,order,compact=false,short=false,total=0,reduced=false){
 if(!Number.isInteger(index)||index<0||index>16)throw Error('Invalid collection world');
 return galaxySpaceAt(index,launchAt(order)+PER_WORLD_MS*CONTACT,compact,short,total,reduced);
}
export function guardianApproachAt(ms,indexes=[],gripLocal={x:0,y:1.4,z:.3},compact=false,short=false,reduced=false){
 const safe=Array.isArray(indexes)?indexes.filter(i=>Number.isInteger(i)&&i>=0&&i<17).slice(0,17):[];
 const scale=guardianStageScale(compact,short);
 const initial=entranceAt(Math.min(Math.max(ms,0),COLLECT_START_MS),compact);
 const home={x:initial.x,y:guardianFloorY(compact,short),z:3.2};
 const homeEnd={...home,x:entranceAt(COLLECT_START_MS,compact).x};
 const homePose={...home,scale,walkWeight:initial.walkWeight,travel:0,orbitalTarget:null};
 if(reduced||!safe.length||ms<COLLECT_START_MS)return homePose;
 const toPosition=(index,order)=>{
  const world=orbitContactAt(index,order,compact,short,safe.length,reduced);
  return {x:world.x-gripLocal.x*scale,
          y:world.y-gripLocal.y*scale,
          z:world.z-gripLocal.z*scale,
          world};
 };
 const endOfCollections=COLLECT_START_MS+safe.length*PER_WORLD_MS;
 if(ms>=endOfCollections){
  const last=toPosition(safe[safe.length-1],safe.length-1);
  const u=smoother((ms-endOfCollections)/OFFER_SETTLE_MS);
  return {x:last.x+(homeEnd.x-last.x)*u,
   y:last.y+(homeEnd.y-last.y)*u,z:last.z+(homeEnd.z-last.z)*u,
   scale,walkWeight:1-u,travel:u,orbitalTarget:last.world};
 }
 const order=Math.min(safe.length-1,Math.floor((ms-COLLECT_START_MS)/PER_WORLD_MS));
 const now=toPosition(safe[order],order);
 const from=order?toPosition(safe[order-1],order-1):homeEnd;
 const t=(ms-launchAt(order))/PER_WORLD_MS;
 const u=smoother(t/CONTACT);
 return {x:from.x+(now.x-from.x)*u,
   y:from.y+(now.y-from.y)*u,
   z:from.z+(now.z-from.z)*u,
   scale,walkWeight:t<CONTACT?1-u*.35:0,travel:u,
   worldIndex:safe[order],orbitalTarget:now.world};
}
