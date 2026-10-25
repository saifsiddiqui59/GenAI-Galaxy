// Pure seeded star-coordinate generator shared by WebGL and Node tests.
export function makeDepthStars(count=320,depth=-23,seed=53){
 const a=new Float32Array(Math.max(0,count)*3);
 let x=(seed>>>0)||1;
 const rand=()=>((x=(Math.imul(x,1664525)+1013904223)>>>0)/4294967296);
 for(let i=0;i<a.length;i+=3){
  a[i]=(rand()-.5)*48;
  a[i+1]=(rand()-.5)*25;
  a[i+2]=depth+(rand()-.5)*6;
 }
 return a;
}
