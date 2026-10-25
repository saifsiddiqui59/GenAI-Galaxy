import {attachSkullMasterCloak} from './skullMasterMantle.js';
/* Non-destructive visual style over the preserved, rigged CC0 KayKit asset.
 * Recolors only saturated red/magenta costume texels; preserves bones, UVs,
 * geometry, 95 original animation clips and original texture provenance.
 */
export const STYLE_PROFILE='skullmaster-midnight-violet';
export function isCostumeRed(r,g,b){return r>65&&r>g*1.35&&r>b*1.18&&r-g>36}
export function isPaleBone(r,g,b){
 const cream=r>=198&&g>=160&&b>=132&&r>=g&&g>=b&&r-g<=58&&g-b<=64;
 const white=r>=215&&g>=215&&b>=213&&Math.max(r,g,b)-Math.min(r,g,b)<=16;
 return cream||white;
}
export function remapCostumePixel(r,g,b){
 if(isPaleBone(r,g,b)){
  // Blue-grey bone replaces bright ivory; untouched emissive eye material stays amber.
  const tone=Math.max(.72,Math.min(1.12,(r+g+b)/650));
  return [Math.round(135*tone),Math.round(152*tone),Math.round(185*tone)];
 }
 if(!isCostumeRed(r,g,b))return [r,g,b];
 const light=Math.max(.35,Math.min(1.1,r/190));
 return [Math.min(255,Math.round(78*light)),Math.min(255,Math.round(50*light+g*.10)),Math.min(255,Math.round(157*light+b*.12))];
}
export function createStyledAtlas(original,THREE){
 if(!original?.image||typeof document==='undefined')return null;
 const img=original.image,width=img.width||img.videoWidth,height=img.height||img.videoHeight;
 if(!width||!height)return null;
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return null;
 ctx.drawImage(img,0,0,width,height);
 const data=ctx.getImageData(0,0,width,height);
 for(let i=0;i<data.data.length;i+=4){
  const [r,g,b]=remapCostumePixel(data.data[i],data.data[i+1],data.data[i+2]);
  data.data[i]=r;data.data[i+1]=g;data.data[i+2]=b;
 }
 ctx.putImageData(data,0,0);
 const map=new THREE.CanvasTexture(canvas);
 map.flipY=original.flipY;map.wrapS=original.wrapS;map.wrapT=original.wrapT;
 map.colorSpace=original.colorSpace;map.magFilter=original.magFilter;map.minFilter=original.minFilter;
 map.generateMipmaps=original.generateMipmaps;map.needsUpdate=true;
 return map;
}
export function styleKayKit(source,THREE){
 const mats=[];source.traverse(n=>{if(n.isMesh&&n.material)mats.push(n.material)});
 const map=mats.find(m=>m.name!=='Glow'&&m.map)?.map;
 const styled=createStyledAtlas(map,THREE);
 source.traverse(n=>{
  if(!n.isMesh||!n.material)return;
  n.material=n.material.clone();
  if(n.material.name==='Glow'){
   n.material.color.set('#ff8f2c');n.material.emissive.set('#f15c0f');
   n.material.emissiveIntensity=2.65;n.material.toneMapped=false;
  }else{
   if(styled)n.material.map=styled;
   // Direct per-mesh tint: cooler sculpted skull, without recoloring the glowing eyes.
   if(/Skeleton_Mage_(Skull|Jaw)$/.test(n.name))n.material.color.set('#879bad');
   n.material.roughness=.9;n.material.metalness=.02;
  }
 });
 const disposeMantle=attachSkullMasterCloak(source,THREE);
 const head=source.getObjectByName('head');
 const eyeLight=head?new THREE.PointLight('#ff8e30',.32,1.5):null;
 if(eyeLight){eyeLight.name='GalaxyEyeGlow';eyeLight.position.set(0,.12,.28);head.add(eyeLight)}
 return ()=>{disposeMantle();if(eyeLight){head.remove(eyeLight);eyeLight.dispose?.()}styled?.dispose();};
}
