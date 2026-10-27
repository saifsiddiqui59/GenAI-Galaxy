import * as THREE from 'three';
// Original seamless spherical materials. No remote images, unclear asset rights or API calls.
const pixelsCache=new Map();
const palettes=[
 ['#092947','#247a9d','#79aa81','#e4e1c4'],
 ['#48346e','#8468a4','#bda0c8','#efe0e7'],
 ['#552e31','#aa603f','#dfaa71','#f3e1b6'],
 ['#142d40','#3b728b','#8bb7c5','#e3f3f5'],
 ['#123a36','#387c6b','#90b18a','#e0d8ae'],
 ['#6a3c32','#b4815f','#d8bf90','#eee0bb']
];
const rgb=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));
const mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const clamp=x=>Math.max(0,Math.min(1,x));
function terrain(x,y,z,seed){
 let sum=0,amp=.52,f=2.8;
 for(let i=0;i<5;i++){
  sum+=amp*Math.sin(x*f+Math.sin(z*f*.8+seed))*Math.cos(y*f*.91+Math.sin(x*f*.64-seed));
  f*=2.13;amp*=.48;
 }
 return sum;
}
export function planetSurfaceTexture(index,hex,compact=false){
 const w=compact?256:512,h=w/2,key=index+':'+w;
 let pixels=pixelsCache.get(key);
 if(!pixels){
  pixels=new Uint8Array(w*h*4);
  const palette=palettes[index%palettes.length].map(rgb),gas=index%6===1||index%6===5;
  for(let y=0;y<h;y++){
   const lat=(y/(h-1)-.5)*Math.PI,sy=Math.sin(lat),cy=Math.cos(lat);
   for(let x=0;x<w;x++){
    const lon=x/w*Math.PI*2,sx=Math.cos(lon)*cy,sz=Math.sin(lon)*cy;
    const n=terrain(sx,sy,sz,index*1.713);
    let c;
    if(gas){
     const band=.5+.5*Math.sin(sy*35+n*8+Math.sin(lon*3)*.22);
     c=mix(palette[0],palette[2],.23+.68*band);
     const fine=Math.sin(sy*145+n*22)*.055;c=c.map(v=>v*(1+fine));
    }else{
     const t=clamp((n+.35)*1.25);
     c=t<.48?mix(palette[0],palette[1],t/.48):mix(palette[2],palette[3],clamp((t-.48)*1.4));
     const ice=clamp((Math.abs(sy)-.89+n*.06)*9);
     c=mix(c,palette[3],ice);
     const cloud=clamp((terrain(sx*1.7,sy*1.7,sz*1.7,index+7)-.38)*1.3);
     c=mix(c,[236,241,247],cloud);
    }
    const at=(y*w+x)*4;
    for(let k=0;k<3;k++)pixels[at+k]=Math.round(c[k]);
    pixels[at+3]=255;
   }
  }
  pixelsCache.set(key,pixels);
 }
 const texture=new THREE.DataTexture(pixels,w,h,THREE.RGBAFormat);
 texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;
 texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
 texture.generateMipmaps=true;texture.needsUpdate=true;
 return texture;
}
