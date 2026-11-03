/* All 17 curriculum planets stay in ONE revolving galaxy.
 * All 17 maintain safe original XY circles, plus individual inclined
 * foreground/background movement and bounded velocity variation.
 * Original atlas anchors, IDs and owner progress never change.
 * The same pure clock is used by rendered worlds, reach IK, and detached orbs.
 */
import {atlasLayout} from './worldAnchors.js';
import {COLLECT_START_MS,PER_WORLD_MS,CONTACT,smooth} from '../journey/choreography.js';
import {cinematicLayoutAt} from './cinematicLayout.js';

// Every planet makes a full orbit in 70 seconds. Small zero-mean perturbations
// change its instantaneous velocity by up to ~6%, then close exactly on beat.
export const ORBIT_PERIOD_MS=70000;
export const ORBIT_PHASE_AMPLITUDE=.025; // bounded independent orbital velocities
export const PLANET_SPIN_PERIOD_MS=24000;
export const ORBIT_CENTER=Object.freeze({x:4.48,y:.10});
export const ORBIT_Y_ASPECT=1.0;
export const DESKTOP_ORBIT_SPREAD=1.21;
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
  z:orbitDepthAt(world,ms,reducedMotion)};
}
// True foreground/background orbital excursion with alternating inclined
// planes. Preserve existing XY circles (and collision clearances), original
// anchors at t=0, exact 70s closure, and reduced-motion static coordinates.
// Hand IK and renderer both call orbitAt/galaxySpaceAt for the SAME moving XYZ.
export function orbitInclinationAt(index){
 if(!Number.isInteger(index)||index<0||index>=17)throw Error('Invalid orbital plane');
 return (index%2===0?1:-1)*(.18+.026*(index%5));
}
export function orbitDepthAt(world,ms,reducedMotion=false){
 if(reducedMotion)return world.z;
 const theta=orbitAngleAt(world.index,ms);
 const dx=world.x-ORBIT_CENTER.x,dy=(world.y-ORBIT_CENTER.y)/ORBIT_Y_ASPECT;
 const incline=Math.sin(orbitInclinationAt(world.index));
 const inclined=incline*(dx*Math.sin(theta)+dy*(Math.cos(theta)-1));
 const localDrift=.22*(Math.sin(theta+world.index*.24)-Math.sin(world.index*.24));
 return world.z+inclined+localDrift;
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
