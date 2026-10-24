/* The actual atlas worlds and their collected counterparts share one simulation clock.
 * The origin of each pickup is a snapshot of its real orbiting world, never a fake
 * orb at the guardian's feet. No account data or local persistence is involved.
 */
import {atlasLayout} from './worldAnchors.js';
import {COLLECT_START_MS,PER_WORLD_MS,smooth} from '../journey/choreography.js';
export const ORBIT_PERIOD_MS=48000;
export function orbitAt(world,ms){
 const t=Math.max(0,Number(ms)||0)/ORBIT_PERIOD_MS*2*Math.PI;
 const a=t+(world.index*2.399963229728653);
 return {...world,x:world.x+.13*Math.cos(a),y:world.y+.11*Math.sin(a),z:world.z+.06*Math.sin(a*.7)};
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
