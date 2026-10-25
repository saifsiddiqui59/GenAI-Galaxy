/* The actual atlas worlds and their collected counterparts share one simulation clock.
 * The origin of each pickup is a snapshot of its real orbiting world, never a fake
 * orb at the guardian's feet. No account data or local persistence is involved.
 */
import {atlasLayout} from './worldAnchors.js';
import {COLLECT_START_MS,PER_WORLD_MS,smooth} from '../journey/choreography.js';
// One cinematic revolution of the entire constellation every 144 seconds.
// Keeping the SAME angular speed for all worlds preserves ordering and prevents
// planets colliding while still giving each a full visible 360° orbital path.
export const ORBIT_PERIOD_MS=144000;
export const ORBIT_CENTER=Object.freeze({x:4.48,y:.10});
export const ORBIT_Y_ASPECT=.76;
export function orbitAt(world,ms){
 const time=Math.max(0,Number.isFinite(ms)?ms:0);
 const theta=time/ORBIT_PERIOD_MS*2*Math.PI;
 const dx=world.x-ORBIT_CENTER.x,dy=(world.y-ORBIT_CENTER.y)/ORBIT_Y_ASPECT;
 const cosine=Math.cos(theta),sine=Math.sin(theta);
 return {...world,
  x:ORBIT_CENTER.x+dx*cosine-dy*sine,
  y:ORBIT_CENTER.y+(dx*sine+dy*cosine)*ORBIT_Y_ASPECT,
  z:world.z+.22*Math.sin(theta+world.index*.24)};
}
export function galaxySpaceAt(worldIndex,ms,compact=false,short=false){
 if(!Number.isInteger(worldIndex)||worldIndex<0||worldIndex>=17)throw Error('Invalid world');
 const w=orbitAt(atlasLayout()[worldIndex],ms);
 const k=compact?.58:1;
 return {index:worldIndex,x:(compact?-1.8:0)+w.x*k,y:(compact?(short?.75:1.15):0)+w.y*k,z:(compact?-2:0)+w.z*(compact?.7:1),scale:w.scale*k};
}
export function launchAt(order){
 if(!Number.isInteger(order)||order<0||order>16)throw Error('Invalid collection order');
 return COLLECT_START_MS+order*PER_WORLD_MS;
}
export function flightProgress(t){return smooth(t/.30)};
export function planetHiddenFromAtlas(ms,order,reducedMotion=false){
 if(order<0)return false;
 if(reducedMotion)return true;
 return ms>=launchAt(order);
}
