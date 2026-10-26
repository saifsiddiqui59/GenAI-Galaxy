/* A skeletal torso without wizard robes, cape, hood, hat or bulky armour.
 * Geometry is owned by the existing chest bone: all original animations,
 * hand IK and the separately licensed anatomical skull remain intact.
 */
export const BARE_SKULL_PROFILE=Object.freeze({
  ribs:6,bone:'#68747a',shadow:'#252f3a',sternum:'#7f8992'
});
export function attachBareSkullTorso(source,THREE){
 const chest=source.getObjectByName('chest');
 if(!chest?.isBone)return ()=>{};
 const hidden=['Skeleton_Mage_Hat','Skeleton_Mage_Body']
  .map(name=>source.getObjectByName(name)).filter(Boolean);
 const visibility=hidden.map(mesh=>mesh.visible);
 hidden.forEach(mesh=>{mesh.visible=false});
 const torso=new THREE.Group();torso.name='SkullMasterBareRibCage';chest.add(torso);
 const boneMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.bone,roughness:.88,metalness:.04});
 const shadowMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.shadow,roughness:.98,metalness:0});
 const sternumMat=new THREE.MeshStandardMaterial({color:BARE_SKULL_PROFILE.sternum,roughness:.9,metalness:.03});
 function pipe(points,radius,material){
  const path=new THREE.CatmullRomCurve3(points.map(v=>new THREE.Vector3(...v)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(path,20,radius,6,false),material);
  mesh.castShadow=true;torso.add(mesh);return mesh;
 }
 // Real volume comes from separated, curved ribs; the dark inner cavity
 // remains visible through gaps rather than a flat painted sweater.
 for(let i=0;i<BARE_SKULL_PROFILE.ribs;i++){
  const y=.32-i*.125,span=.34+(i===0?-.06:i===5?-.07:0);
  for(const side of [-1,1]){
   pipe([[side*.055,y,.43],[side*.19,y+.045,.45],
      [side*span,y+.01,.29],[side*(span+.035),y-.045,.08],
      [side*(span-.07),y-.085,-.13 ]],.014,
      i%3===0?sternumMat:boneMat);
  }
 }
 pipe([[0,.40,.40],[0,.15,.45],[0,-.15,.46],[0,-.43,.42]],.036,sternumMat);
 // Short collarbones and visible dark spine replace costume shoulder pads.
 for(const side of [-1,1])pipe([[0,.42,.40],[side*.22,.48,.36],[side*.43,.42,.18]],.029,boneMat);
 pipe([[0,.42,-.14],[0,.10,-.21],[0,-.30,-.20],[0,-.49,-.12]],.047,shadowMat);
 const glow=new THREE.PointLight('#e76c28',.18,1.2);glow.position.set(0,.02,.38);torso.add(glow);
 return ()=>{
  hidden.forEach((mesh,i)=>{mesh.visible=visibility[i]});
  chest.remove(torso);
  torso.traverse(n=>{if(n.isMesh)n.geometry?.dispose()});
  boneMat.dispose();shadowMat.dispose();sternumMat.dispose();glow.dispose?.();
 };
}
