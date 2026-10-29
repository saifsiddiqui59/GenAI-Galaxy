/* All 17 curriculum planets stay in ONE revolving galaxy.
 * Geometry is a shared circular orbit with small per-world periodic phase
 * changes: visually independent speeds, but no orbital overtaking/collisions.
 * Original atlas anchors, IDs and owner progress never change.
 * The same pure clock is used by rendered worlds, reach IK, and detached orbs.
 */
import {atlasLayout} from './worldAnchors.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,smooth} from '../journey/choreography.js';
import {cinematicLayoutAt} from './cinematicLayout.js';

// Every planet makes a full orbit in 70 seconds. Small zero-mean perturbations
// change its instantaneous velocity by up to ~6%, then close exactly on beat.
export const ORBIT_PERIOD_MS=70000;
export const ORBIT_PHASE_AMPLITUDE=.014;
export const PLANET_SPIN_PERIOD_MS=24000;
export const ORBIT_CENTER=Object.freeze({x:4.48,y:.10});
export const ORBIT_Y_ASPECT=1.0;
export const DESKTOP_ORBIT_SPREAD=1.10;
export const panoramicOrbitX=(x,compact=false)=>compact?x:ORBIT_CENTER.x+(x-ORBIT_CENTER.x)*DESKTOP_ORBIT_SPREAD;
const TAU=Math.PI*2;
const safeTime=(ms,reducedMotion=false)=>reducedMotion?0:Math.max(0,Number.isFinite(ms)?ms:0);

export function orbitAngleAt(index,ms,reducedMotion=false){
 const time=safeTime(ms,reducedMotion);
 const phase=index*.73;
 const harmonic=1+index%4;
 const cycle=TAU*time/ORBIT_PERIOD_MS;
 return cycle+ORBIT_PHASE_AMPLITUDE*(Math.sin(harmonic*cycle+phase)-Math.sin(phase));
}
export function planetSpinPeriodAt(index){
 return PLANET_SPIN_PERIOD_MS*(.78+(index%7)*.075);
}
export function planetSpinAt(index,ms,reducedMotion=false){
 return index+TAU*safeTime(ms,reducedMotion)/planetSpinPeriodAt(index);
}
export function planetTiltAt(index){
 // A static axial tilt complements the differing rotational speeds.
 return {x:(index%5-2)*.065,z:((index*3)%7-3)*.045};
}
export function orbitAt(world,ms,reducedMotion=false){
 const theta=orbitAngleAt(world.index,ms,reducedMotion);
 const dx=world.x-ORBIT_CENTER.x,dy=(world.y-ORBIT_CENTER.y)/ORBIT_Y_ASPECT;
 const cosine=Math.cos(theta),sine=Math.sin(theta);
 return {...world,
  x:ORBIT_CENTER.x+dx*cosine-dy*sine,
  y:ORBIT_CENTER.y+(dx*sine+dy*cosine)*ORBIT_Y_ASPECT,
  z:world.z+.22*Math.sin(theta+world.index*.24)-.22*Math.sin(world.index*.24)};
}
export function galaxySpaceAt(worldIndex,ms,compact=false,short=false,completedCount=0,reducedMotion=false){
 if(!Number.isInteger(worldIndex)||worldIndex<0||worldIndex>=17)throw Error('Invalid world');
 const w=orbitAt(atlasLayout()[worldIndex],ms,reducedMotion);
 const layout=cinematicLayoutAt(ms,compact,short,completedCount,reducedMotion);
 return {index:worldIndex,
  x:layout.position[0]+panoramicOrbitX(w.x,compact)*layout.scale[0],
  y:layout.position[1]+w.y*layout.scale[1],
  z:layout.position[2]+w.z*layout.scale[2],
  scale:w.scale*layout.scale[0]};
}
export function launchAt(order){
 if(!Number.isInteger(order)||order<0||order>16)throw Error('Invalid collection order');
 return COLLECT_START_MS+order*PER_WORLD_MS;
}
export function flightProgress(t){return smooth(t/.30)};
export function planetHiddenFromAtlas(ms,order,reducedMotion=false){
 if(order<0)return false;
 if(reducedMotion)return true;
 return ms>=launchAt(order)+CONTACT*PER_WORLD_MS;
}
