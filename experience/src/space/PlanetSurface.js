import * as THREE from 'three';
// Tiny deterministic CPU texture, no network/paid imagery; mobile <= 64x32 pixels.
export function planetSurfaceTexture(index,hex,compact=false){
 const w=compact?64:128,h=compact?32:64;
 const pixels=new Uint8Array(w*h*4);
 const color=new THREE.Color(hex);
 const gas=index%3===1;
 for(let y=0;y<h;y++){
  const v=y/h,lat=(v-.5)*Math.PI;
  for(let x=0;x<w;x++){
   const u=x/w,lon=u*Math.PI*2,seed=index*1.371;
   const wave=Math.sin(lon*7.1+Math.cos(lat*9.3+seed)*2.3)
     *Math.cos(lat*11.7+Math.sin(lon*4.1+seed));
   const fractal=.5*Math.sin(lon*16+lat*18+seed)+.25*Math.cos(lon*31-lat*22+seed);
   const belts=Math.sin(lat*(gas?31:13)+wave*(gas?3:6)+seed);
   const continents=Math.sin(lon*5+wave*2)*Math.cos(lat*6+fractal*2);
   const terrain=gas?(.55+.22*belts+.08*fractal):(.54+.19*continents+.17*wave+.08*fractal);
   const shade=THREE.MathUtils.clamp(terrain,.19,.95);
   const a=(y*w+x)*4;
   pixels[a]=Math.round(255*THREE.MathUtils.clamp(color.r*shade+(gas?.045:.01),0,1));
   pixels[a+1]=Math.round(255*THREE.MathUtils.clamp(color.g*shade+(gas?.03:.02),0,1));
   pixels[a+2]=Math.round(255*THREE.MathUtils.clamp(color.b*shade+.045,0,1));
   pixels[a+3]=255;
  }
 }
 const texture=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.magFilter=THREE.LinearFilter;
 texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=!compact;
 texture.wrapS=THREE.RepeatWrapping;
 texture.needsUpdate=true;
 return texture;
}
