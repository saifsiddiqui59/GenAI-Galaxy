// V6.11 research-only preflight. A passing rig audit is NOT visual approval.
// Node 20+; no paid services, no model generation and no production writes.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';

const COMPONENT={5120:[1,'getInt8'],5121:[1,'getUint8'],5122:[2,'getInt16'],5123:[2,'getUint16'],5125:[4,'getUint32'],5126:[4,'getFloat32']};
const WIDTH={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};
const isInt=x=>Number.isInteger(x)&&x>=0;

export function parseGlb(input){
 const b=Buffer.from(input);
 if(b.length<20||b.readUInt32LE(0)!==0x46546c67)throw Error('Not a GLB');
 if(b.readUInt32LE(4)!==2)throw Error('GLB version must be 2');
 if(b.readUInt32LE(8)!==b.length)throw Error('GLB declared byte length mismatch');
 let off=12,json=null,bin=null;
 while(off<b.length){
  if(off+8>b.length)throw Error('Truncated GLB chunk header');
  const n=b.readUInt32LE(off),kind=b.readUInt32LE(off+4);off+=8;
  if(n%4||off+n>b.length)throw Error('Invalid GLB chunk size');
  if(kind===0x4e4f534a){if(json)throw Error('Duplicate JSON chunk');json=JSON.parse(b.subarray(off,off+n).toString('utf8').trim());}
  if(kind===0x004e4942){if(bin)throw Error('Duplicate BIN chunk');bin=b.subarray(off,off+n);}
  off+=n;
 }
 if(!json||!bin)throw Error('Self-contained GLB needs JSON and BIN chunks');
 if(!String(json.asset?.version??'').startsWith('2.'))throw Error('glTF 2.0 asset required');
 if(!json.buffers?.length||json.buffers.length!==1||json.buffers[0].uri)throw Error('External buffers unsupported in candidate');
 if(json.buffers[0].byteLength>bin.length||bin.length-json.buffers[0].byteLength>3)throw Error('BIN chunk length mismatch');
 return {gltf:json,bin};
}

function accessor(gltf,bin,index){
 const a=gltf.accessors?.[index],view=gltf.bufferViews?.[a?.bufferView],c=COMPONENT[a?.componentType],w=WIDTH[a?.type];
 if(!a||!view||!c||!w||!isInt(a.count)||!a.count||a.sparse||view.buffer!==0)throw Error('Invalid/unsupported accessor '+index);
 const stride=view.byteStride??c[0]*w,start=(view.byteOffset??0)+(a.byteOffset??0);
 if(stride<c[0]*w||stride%c[0]||start+(a.count-1)*stride+c[0]*w>(view.byteOffset??0)+view.byteLength||start+(a.count-1)*stride+c[0]*w>bin.length)throw Error('Accessor exceeds buffer view '+index);
 const dv=new DataView(bin.buffer,bin.byteOffset,bin.byteLength);
 return {count:a.count,type:a.type,componentType:a.componentType,read(i){
  if(i<0||i>=a.count)throw Error('Accessor index out of bounds');
  const vals=[];for(let j=0;j<w;j++)vals.push(dv[c[1]](start+i*stride+j*c[0],true));
  if(a.normalized&&a.componentType!==5126)return vals.map(v=>a.componentType===5121?v/255:a.componentType===5123?v/65535:a.componentType===5120?Math.max(-1,v/127):a.componentType===5122?Math.max(-1,v/32767):v);
  return vals;
 }};
}

export function auditGlb(input){
 const {gltf:g,bin}=parseGlb(input),errors=[],warnings=[];
 const skinNodes=(g.nodes??[]).filter(n=>isInt(n.skin)&&isInt(n.mesh));
 let triangles=0,skinnedPrimitives=0,weightedVertices=0;
 for(const [i,skin] of (g.skins??[]).entries()){
  if(!Array.isArray(skin.joints)||skin.joints.length<15)errors.push('Skin '+i+' lacks a usable adult joint hierarchy');
  if(!isInt(skin.inverseBindMatrices)){errors.push('Skin '+i+' lacks inverse bind matrices');continue;}
  try{
   const ibm=accessor(g,bin,skin.inverseBindMatrices);
   if(ibm.type!=='MAT4'||ibm.count!==skin.joints.length)errors.push('Skin '+i+' inverse bind count/type mismatch');
   else for(let j=0;j<ibm.count;j++){const m=ibm.read(j);if(m.some(v=>!Number.isFinite(v))||Math.abs(m[0]*m[5]*m[10])<1e-10)errors.push('Skin '+i+' invalid inverse bind matrix '+j);}
  }catch(e){errors.push(String(e.message));}
  for(const joint of skin.joints)if(!g.nodes?.[joint])errors.push('Skin '+i+' references missing joint '+joint);
 }
 if(!skinNodes.length)errors.push('No mesh node is bound to a skin');
 for(const node of skinNodes){
  const skin=g.skins?.[node.skin],mesh=g.meshes?.[node.mesh];
  if(!skin||!mesh){errors.push('Skinned node references missing mesh or skin');continue;}
  for(const p of mesh.primitives??[]){
   if(!isInt(p.attributes?.JOINTS_0)||!isInt(p.attributes?.WEIGHTS_0)||!isInt(p.attributes?.POSITION)){errors.push('Skinned primitive missing JOINTS_0/WEIGHTS_0/POSITION');continue;}
   try{
    const joints=accessor(g,bin,p.attributes.JOINTS_0),weights=accessor(g,bin,p.attributes.WEIGHTS_0),positions=accessor(g,bin,p.attributes.POSITION);
    if(joints.type!=='VEC4'||weights.type!=='VEC4'||joints.count!==positions.count||weights.count!==positions.count)throw Error('Skin vertex accessor types/counts mismatch');
    for(let k=0;k<positions.count;k+=Math.max(1,Math.floor(positions.count/256))){
     const ji=joints.read(k),wi=weights.read(k),sum=wi.reduce((a,b)=>a+b,0);
     if(!ji.every(x=>isInt(x)&&x<skin.joints.length)||!wi.every(x=>Number.isFinite(x)&&x>=0)||Math.abs(sum-1)>.025)throw Error('Invalid joint indices or non-normalized weights at vertex '+k);
    }
    skinnedPrimitives++;weightedVertices+=positions.count;
    const count=isInt(p.indices)?accessor(g,bin,p.indices).count:positions.count;
    if((p.mode??4)===4)triangles+=Math.floor(count/3);
   }catch(e){errors.push(String(e.message));}
  }
 }
 if(!skinnedPrimitives)errors.push('No valid skinned primitives');
 const clips=(g.animations??[]).map((a,i)=>({name:a.name??'(unnamed '+i+')',channels:a.channels?.length??0}));
 const walking=clips.filter(x=>/walk|stride|locomot|gait/i.test(x.name));
 if(!walking.length)errors.push('No named walking animation clip; cannot verify gait source');
 if(!clips.some(x=>x.channels>0))errors.push('No animation channels');
 for(const a of g.animations??[])for(const ch of a.channels??[]){
  const s=a.samplers?.[ch.sampler];
  if(!s||!g.nodes?.[ch.target?.node]){errors.push('Invalid animation target/sampler');continue;}
  try{const t=accessor(g,bin,s.input),v=accessor(g,bin,s.output);if(t.type!=='SCALAR'||t.count<2||v.count<2)errors.push('Animation channel lacks sampled motion');}
  catch(e){errors.push('Animation '+e.message);}
 }
 const images=(g.images??[]).length,materials=(g.materials??[]).length;
 const textured=(g.materials??[]).filter(m=>isInt(m.pbrMetallicRoughness?.baseColorTexture?.index)||isInt(m.normalTexture?.index)||isInt(m.emissiveTexture?.index)).length;
 if(!images||!textured)warnings.push('No actual texture-backed PBR materials; visual detail not established');
 if(triangles<15000)warnings.push('Under 15k skinned triangles; may read as a low-poly toy');
 const names=(g.skins??[]).flatMap(s=>s.joints??[]).map(j=>g.nodes?.[j]?.name??'').join(' ').toLowerCase();
 for(const [label,re] of [['pelvis',/hip|pelvis|root/],['legs',/thigh|upperleg|upleg/],['knees',/shin|calf|lowerleg|knee/],['feet',/foot|ankle/],['arms',/upperarm|arm/],['hands',/hand|wrist/]])if(!re.test(names))warnings.push('Unmapped joint semantics: '+label+' (manual mapping required)');
 const result={sha256:crypto.createHash('sha256').update(input).digest('hex'),bytes:input.length,skins:g.skins?.length??0,skinNodes:skinNodes.length,joints:(g.skins??[]).map(s=>s.joints?.length??0),skinnedPrimitives,weightedVertices,triangles,materials,images,texturedMaterials:textured,clips,walkingClips:walking.map(x=>x.name),errors,warnings,technicallyRigged:errors.length===0,visualAccepted:false};
 return result;
}

async function main(){
 const target=process.argv[2];if(!target)throw Error('Usage: node audit-skinned-rig.mjs <local.glb|https://source.glb>');
 let bytes;
 if(/^https:\/\//.test(target)){
  const u=new URL(target);
  if(!['pub-63ab27389d044634a73e89c1a0c6d4a6.r2.dev','raw.githubusercontent.com'].includes(u.hostname))throw Error('Unapproved download host');
  const response=await fetch(u,{signal:AbortSignal.timeout(60000),redirect:'error'});
  if(!response.ok)throw Error('Download HTTP '+response.status);
  bytes=Buffer.from(await response.arrayBuffer());
  if(bytes.length>80*1024*1024)throw Error('Candidate too large');
 }else bytes=await fs.readFile(target);
 const report=auditGlb(bytes);
 process.stdout.write(JSON.stringify({source:target,...report},null,2)+'\n');
 if(!report.technicallyRigged)process.exitCode=1;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main().catch(e=>{console.error(e);process.exitCode=1});
