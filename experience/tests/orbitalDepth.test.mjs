import test from 'node:test';
import assert from 'node:assert/strict';
import {atlasLayout} from '../src/space/worldAnchors.js';
import {cinematicLayoutAt} from '../src/space/cinematicLayout.js';
import {orbitAt,orbitInclinationAt,orbitDepthAt,orbitAngleAt,galaxySpaceAt,panoramicOrbitX,ORBIT_PERIOD_MS} from '../src/space/worldOrbit.js';

test('all 17 move in inclined depth, but keep original starts and exact closed trajectories',()=>{
 const worlds=atlasLayout();assert.equal(worlds.length,17);
 const inclinations=new Set(),ranges=[];
 for(const world of worlds){
  const a=orbitAt(world,0),end=orbitAt(world,ORBIT_PERIOD_MS);
  assert(Math.abs(a.x-world.x)<1e-9&&Math.abs(a.y-world.y)<1e-9&&Math.abs(a.z-world.z)<1e-9);
  assert(Math.hypot(end.x-a.x,end.y-a.y,end.z-a.z)<1e-9,'Orbit must close: '+world.index);
  const incline=orbitInclinationAt(world.index);
  inclinations.add(incline.toFixed(6));
  assert(Math.abs(incline)>.17 && Math.abs(incline)<.29);
  const zs=Array.from({length:141},(_,i)=>orbitDepthAt(world,i*ORBIT_PERIOD_MS/140));
  const range=Math.max(...zs)-Math.min(...zs);ranges.push(range);
  assert.equal(orbitDepthAt(world,14000,true),world.z);
  assert.deepEqual(orbitAt(world,12000,true),orbitAt(world,0,true));
 }
 assert.equal(inclinations.size,17,'all orbital inclinations must be distinct');
 assert(ranges.filter(r=>r>.45).length>=15,'planets need measurable 3D foreground/background travel: '+ranges);
 assert(ranges.some(r=>r>1.0),'no believable deep-space orbit excursion');
});

test('faster independent revolutions do not make planets intersect through a 70s loop',()=>{
 const worlds=atlasLayout();
 for(let ms=0;ms<=ORBIT_PERIOD_MS;ms+=125){
  const ps=worlds.map(w=>orbitAt(w,ms));
  for(let i=0;i<ps.length;i++)for(let j=0;j<i;j++){
   const a=ps[i],b=ps[j];
   const clearance=Math.hypot(a.x-b.x,a.y-b.y)-(a.scale+b.scale);
   assert(clearance>.12,`Unsafe XY clearance ${i}/${j}, t=${ms}, gap=${clearance.toFixed(3)}`);
   // 3D separation is never less than XY separation.
   assert(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)>=clearance+a.scale+b.scale-1e-9);
  }
 }
 const velocities=worlds.map(w=>orbitAngleAt(w.index,220)-orbitAngleAt(w.index,0));
 assert(new Set(velocities.map(v=>v.toFixed(6))).size>=12);
});

test('hand IK and real renderer resolve the same 3D moving planet depth on phones and desktop',()=>{
 const worlds=atlasLayout();
 for(const compact of [false,true])for(const short of [false,true]){
  for(const idx of [0,3,7,11,16]){
   for(const ms of [10000,27500,59000]){
    const w=worlds[idx],p=orbitAt(w,ms);
    const layout=cinematicLayoutAt(ms,compact,short,0,false);
    const world=galaxySpaceAt(idx,ms,compact,short,0,false);
    assert(Math.abs(world.x-(layout.position[0]+panoramicOrbitX(p.x,compact)*layout.scale[0]))<1e-9);
    assert(Math.abs(world.y-(layout.position[1]+p.y*layout.scale[1]))<1e-9);
    assert(Math.abs(world.z-(layout.position[2]+p.z*layout.scale[2]))<1e-9);
   }
  }
 }
});
