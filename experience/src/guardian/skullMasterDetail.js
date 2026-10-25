/* Original, royalty-safe detail treatment for the existing KayKit skeleton rig.
 * Keeps the 95 clips and hand anchors intact; no replacement GLB or outside art.
 */
export const MASTER_ART={clothResolution:128,clothBump:.065,collarScale:1.05};
export function clothHeight(x,y){
 const a=Math.sin(x*.39+y*.13)*Math.cos(y*.46-x*.11);
 const b=Math.sin(x*1.37+y*.93)*.27;
 const c=Math.sin(y*2.33-x*.67)*.14;
 return Math.max(0,Math.min(255,Math.round(125+32*a+20*b+12*c)));
}
function weaveTexture(THREE){
 if(typeof document==='undefined')return null;
 const canvas=document.createElement('canvas'),n=MASTER_ART.clothResolution;
 canvas.width=n;canvas.height=n;
 const ctx=canvas.getContext('2d');if(!ctx)return null;
 const image=ctx.createImageData(n,n);
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const i=(y*n+x)*4,h=clothHeight(x,y);
  image.data[i]=h;image.data[i+1]=h;image.data[i+2]=h;image.data[i+3]=255;
 }
 ctx.putImageData(image,0,0);
 const texture=new THREE.CanvasTexture(canvas);
 texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
 texture.repeat.set(3,4);texture.colorSpace=THREE.NoColorSpace;
 texture.needsUpdate=true;
 return texture;
}
function curve(THREE,coords,color,radius=.012){
 const spline=new THREE.CatmullRomCurve3(coords.map(a=>new THREE.Vector3(...a)));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(spline,32,radius,6,false),
   new THREE.MeshStandardMaterial({color,metalness:.32,roughness:.58}));
 return mesh;
}
export function addSkullMasterDetail(source,THREE){
 const head=source.getObjectByName('head'),chest=source.getObjectByName('chest');
 const hood=source.getObjectByName('SkullMasterDarkHood');
 const mantle=source.getObjectByName('SkullMasterMantle');
 if(!head||!chest||!hood||!mantle)return ()=>{};
 const noise=weaveTexture(THREE),added=[];
 if(noise)for(const group of [hood,mantle])group.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.material||!mesh.material.isMeshStandardMaterial)return;
  mesh.material.bumpMap=noise;mesh.material.bumpScale=MASTER_ART.clothBump;
  mesh.material.roughness=.94;mesh.material.needsUpdate=true;
 });
 // Raised ribbing follows the head instead of appearing as a fixed-screen mask.
 const trim=curve(THREE,[[-.46,.70,.04],[-.38,.84,.16],[0,.96,.10],[.38,.84,.16],[.46,.70,.04]],'#46345e',.022);
 trim.name='SkullMasterHoodSeam';hood.add(trim);added.push([hood,trim]);
 // Dim bronze clasps and collar in place of bright toy-like chest armour.
 const collar=new THREE.Group();collar.name='SkullMasterCollar';
 chest.add(collar);added.push([chest,collar]);
 const m=new THREE.MeshStandardMaterial({color:'#4c3d56',roughness:.77,metalness:.18});
 for(const side of [-1,1]){
  const clasp=new THREE.Mesh(new THREE.DodecahedronGeometry(.086,0),m.clone());
  clasp.position.set(side*.30,.13,.32);clasp.rotation.y=side*.38;
  collar.add(clasp);
 }
 const left=[[-.30,.13,.33],[-.19,.03,.41],[0,-.02,.45],[.19,.03,.41],[.30,.13,.33]];
 collar.add(curve(THREE,left,'#6e5777',.011));
 return ()=>{
  for(const [group,object] of added){
   group.remove(object);
   object.traverse(node=>{if(node.isMesh){node.geometry?.dispose();node.material?.dispose()}});
  }
  if(noise)for(const group of [hood,mantle])group.traverse(mesh=>{
   if(mesh.isMesh&&mesh.material&&mesh.material.bumpMap===noise){
    mesh.material.bumpMap=null;mesh.material.needsUpdate=true;
   }
  });
  noise?.dispose();
 };
}
