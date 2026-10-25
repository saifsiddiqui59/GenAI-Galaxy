/* P38 review: original, procedural cloth geometry layered onto the CC0 KayKit rig.
   No external GLB, procedural face replacement, or destructive remeshing.
   The hood follows the real head bone; mantle follows chest; all 95 animations stay alive.
*/
export const SKULLMASTER_PROFILE=Object.freeze({
  headScale:.90,hoodFrontGap:.73,hoodRings:6,cloakLength:1.48,
  outer:'#1b1429',inner:'#070a14',trim:'#4e3c61'
});
function surface(THREE,sections,start,end,segments=32){
 const vertices=[],uvs=[],indices=[];
 for(let i=0;i<sections.length;i++){
  const {y,r,z=0}=sections[i];
  for(let j=0;j<=segments;j++){
   const phi=start+(end-start)*j/segments;
   vertices.push(Math.sin(phi)*r,y,Math.cos(phi)*r+z);
   uvs.push(j/segments,i/(sections.length-1));
  }
 }
 for(let i=0;i<sections.length-1;i++)for(let j=0;j<segments;j++){
  const a=i*(segments+1)+j,b=a+segments+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setIndex(indices);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.computeVertexNormals();
 return geometry;
}
function addCloth(parent,geometry,color,THREE,roughness=.96){
 const mat=new THREE.MeshStandardMaterial({color,roughness,metalness:0,side:THREE.DoubleSide});
 const mesh=new THREE.Mesh(geometry,mat);
 mesh.castShadow=true;mesh.receiveShadow=true;
 parent.add(mesh);
 return mesh;
}
export function attachSkullMasterCloak(source,THREE){
 const head=source.getObjectByName('head');
 const chest=source.getObjectByName('chest');
 const hat=source.getObjectByName('Skeleton_Mage_Hat');
 if(!head?.isBone||!chest?.isBone)return ()=>{};
 if(hat)hat.visible=false;
 const attached=[];
 const hood=new THREE.Group();hood.name='SkullMasterDarkHood';
 head.add(hood);attached.push([head,hood]);
 // Open face wedge at the FRONT (+Z). Sides and back wrap around the skull.
 const ring=[
  {y:-.14,r:.42,z:-.06},{y:.05,r:.51,z:-.055},
  {y:.30,r:.60,z:-.07},{y:.54,r:.58,z:-.11},
  {y:.74,r:.42,z:-.13},{y:.90,r:.08,z:-.12}
 ];
 addCloth(hood,surface(THREE,ring,SKULLMASTER_PROFILE.hoodFrontGap,
  Math.PI*2-SKULLMASTER_PROFILE.hoodFrontGap),SKULLMASTER_PROFILE.outer,THREE);
 // Contrast lining deepens the eyes without covering the real animated face.
 const inner=ring.map(v=>({...v,r:v.r-.045,z:v.z-.015}));
 addCloth(hood,surface(THREE,inner,SKULLMASTER_PROFILE.hoodFrontGap,
  Math.PI*2-SKULLMASTER_PROFILE.hoodFrontGap),SKULLMASTER_PROFILE.inner,THREE);
 for(const phi of [SKULLMASTER_PROFILE.hoodFrontGap,2*Math.PI-SKULLMASTER_PROFILE.hoodFrontGap]){
  const points=ring.map(({y,r,z})=>new THREE.Vector3(Math.sin(phi)*r,y,Math.cos(phi)*r+z));
  const path=new THREE.CatmullRomCurve3(points);
  addCloth(hood,new THREE.TubeGeometry(path,24,.026,6,false),SKULLMASTER_PROFILE.trim,THREE,.65);
 }
 // A rounded, tapering front canopy completes the hood above the eyes.
 // Unlike a flat visor it has changing curvature across both X and Y.
 const canopySections=[
  {y:.51,r:.62,z:.08},{y:.66,r:.56,z:.045},
  {y:.81,r:.40,z:-.01},{y:.96,r:.18,z:-.055},{y:1.02,r:.024,z:-.07}
 ];
 const frontHood=addCloth(hood,surface(THREE,canopySections,
   2*Math.PI-SKULLMASTER_PROFILE.hoodFrontGap,
   2*Math.PI+SKULLMASTER_PROFILE.hoodFrontGap,24),SKULLMASTER_PROFILE.outer,THREE,.9);
 frontHood.name='SkullMasterCurvedCanopy';
 // Delicate dark roll around the facial opening; do not cross the eye line.
 const frontRimPoints=[];
 for(let k=0;k<=20;k++){
  const phi=-SKULLMASTER_PROFILE.hoodFrontGap+
   2*SKULLMASTER_PROFILE.hoodFrontGap*k/20;
  frontRimPoints.push(new THREE.Vector3(.624*Math.sin(phi),.51,
    .624*Math.cos(phi)+.08));
 }
 const frontRim=new THREE.CatmullRomCurve3(frontRimPoints);
 addCloth(hood,new THREE.TubeGeometry(frontRim,24,.018,6,false),'#3d2750',THREE,.88);
 const cape=new THREE.Group();cape.name='SkullMasterMantle';
 chest.add(cape);attached.push([chest,cape]);
 // Back panel drapes from shoulder below waist. Real head/hand bones remain free.
 const segments=20,rows=12,vertices=[],uvs=[],indices=[];
 for(let i=0;i<=rows;i++){
  const t=i/rows,halfWidth=.39+.34*t, y=.16-t*SKULLMASTER_PROFILE.cloakLength;
  for(let j=0;j<=segments;j++){
   const u=j/segments,x=(u*2-1)*halfWidth;
   const ripple=Math.sin(u*Math.PI*7+t*2.8)*.027*t;
   vertices.push(x+ripple,y,(-.33-.18*t)-.055*Math.sin(u*Math.PI));
   uvs.push(u,t);
  }
 }
 for(let i=0;i<rows;i++)for(let j=0;j<segments;j++){
  const a=i*(segments+1)+j,b=a+segments+1;
  indices.push(a,b,a+1,b,b+1,a+1);
 }
 const geo=new THREE.BufferGeometry();
 geo.setIndex(indices);geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geo.computeVertexNormals();
 const capeCloth=addCloth(cape,geo,SKULLMASTER_PROFILE.outer,THREE);
 capeCloth.name='SkullMasterCapeCloth';
 capeCloth.userData.restPositions=geo.attributes.position.array.slice();
 capeCloth.userData.columns=segments+1;
 geo.attributes.position.setUsage(THREE.DynamicDrawUsage);
 // Shoulder drapes soften pale arm/armor silhouettes without intercepting palm IK.
 for(const side of [-1,1]){
  const piece=new THREE.Mesh(new THREE.ConeGeometry(.29,.74,10,1,true),
    new THREE.MeshStandardMaterial({color:'#2c1a40',roughness:.95,side:THREE.DoubleSide}));
  piece.position.set(side*.37,-.24,-.13);piece.rotation.z=side*.32;
  cape.add(piece);
 }
 // Restore only display-owned objects and generated GPU resources.
 return ()=>{
  if(hat)hat.visible=true;
  for(const [parent,group] of attached){
   parent.remove(group);
   group.traverse(o=>{if(o.isMesh){o.geometry?.dispose();o.material?.dispose()}});
  }
 };
}
