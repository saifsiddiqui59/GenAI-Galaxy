import test from 'node:test';
import assert from 'node:assert/strict';
import {auditGlb,parseGlb} from '../scripts/audit-skinned-rig.mjs';

function candidate({noSkin=false,noWalk=false,badWeight=false,missingIBM=false}={}){
 const blocks=[],views=[];
 function add(buffer){
  const b=Buffer.from(buffer),offset=blocks.reduce((s,x)=>s+x.length,0);
  const padded=Buffer.concat([b,Buffer.alloc((4-b.length%4)%4)]);
  blocks.push(padded);views.push({buffer:0,byteOffset:offset,byteLength:b.length});return views.length-1;
 }
 const float=a=>{const b=Buffer.alloc(a.length*4);a.forEach((v,i)=>b.writeFloatLE(v,i*4));return b};
 const ushort=a=>{const b=Buffer.alloc(a.length*2);a.forEach((v,i)=>b.writeUInt16LE(v,i*2));return b};
 const pos=add(float([0,0,0,1,0,0,0,1,0]));
 const joints=add(ushort([0,1,2,3,0,1,2,3,0,1,2,3]));
 const weights=add(float([badWeight?.2:1,0,0,0,1,0,0,0,1,0,0,0]));
 const ibm=add(float(Array.from({length:25},()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]).flat()));
 const times=add(float([0,1]));
 const rotations=add(float([0,0,0,1,0,.1,0,.995]));
 const indices=add(ushort([0,1,2]));
 const image=add(Buffer.from([137,80,78,71,13,10,26,10]));
 const jointNames=['hips','spine','chest','neck','head','leftUpperArm','leftLowerArm','leftHand','rightUpperArm','rightLowerArm','rightHand','leftThigh','leftKnee','leftFoot','rightThigh','rightKnee','rightFoot',...Array.from({length:8},(_,i)=>'Finger'+i)];
 const nodes=jointNames.map((name,i)=>({name,...(i<24?{children:[i+1]}:{})}));
 nodes.push({name:'SkinnedActor',mesh:0,...(!noSkin?{skin:0}:{})});
 const gltf={
  asset:{version:'2.0'},buffers:[{byteLength:blocks.reduce((s,b)=>s+b.length,0)}],bufferViews:views,
  accessors:[
   {bufferView:pos,componentType:5126,type:'VEC3',count:3},
   {bufferView:joints,componentType:5123,type:'VEC4',count:3},
   {bufferView:weights,componentType:5126,type:'VEC4',count:3},
   {bufferView:ibm,componentType:5126,type:'MAT4',count:25},
   {bufferView:times,componentType:5126,type:'SCALAR',count:2},
   {bufferView:rotations,componentType:5126,type:'VEC4',count:2},
   {bufferView:indices,componentType:5123,type:'SCALAR',count:3}
  ],nodes,skins:noSkin?[]:[{joints:Array.from({length:25},(_,i)=>i),...(!missingIBM?{inverseBindMatrices:3}:{})}],
  meshes:[{primitives:[{attributes:{POSITION:0,JOINTS_0:1,WEIGHTS_0:2},indices:6,material:0}]}],
  materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0}}}],textures:[{source:0}],images:[{bufferView:image,mimeType:'image/png'}],
  animations:[{name:noWalk?'idle':'walk_loop',samplers:[{input:4,output:5}],channels:[{sampler:0,target:{node:1,path:'rotation'}}]}]
 };
 const json=Buffer.from(JSON.stringify(gltf));
 const paddedJson=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const binary=Buffer.concat(blocks);
 const result=Buffer.alloc(12+8+paddedJson.length+8+binary.length);
 result.writeUInt32LE(0x46546c67,0);result.writeUInt32LE(2,4);result.writeUInt32LE(result.length,8);
 result.writeUInt32LE(paddedJson.length,12);result.writeUInt32LE(0x4e4f534a,16);paddedJson.copy(result,20);
 const off=20+paddedJson.length;result.writeUInt32LE(binary.length,off);result.writeUInt32LE(0x004e4942,off+4);binary.copy(result,off+8);
 return result;
}
test('genuine GLB with skinned mesh, inverse bind matrices, weights, textured material and walk clip passes technical preflight only',()=>{
 const data=candidate(),parsed=parseGlb(data),r=auditGlb(data);
 assert.equal(parsed.gltf.asset.version,'2.0');
 assert.equal(r.technicallyRigged,true,JSON.stringify(r.errors));
 assert.equal(r.visualAccepted,false,'numeric QA cannot approve art');
 assert.equal(r.skins,1);assert.equal(r.joints[0],25);
 assert.equal(r.skinnedPrimitives,1);assert.equal(r.weightedVertices,3);
 assert.deepEqual(r.walkingClips,['walk_loop']);assert.equal(r.texturedMaterials,1);
 assert.match(r.sha256,/^[a-f0-9]{64}$/);
});
test('reject unskinned model even with bones and textures',()=>{
 const r=auditGlb(candidate({noSkin:true}));
 assert.equal(r.technicallyRigged,false);
 assert(r.errors.some(x=>/No mesh node is bound/.test(x)));
});
test('reject missing walking clip instead of claiming gait ready',()=>{
 const r=auditGlb(candidate({noWalk:true}));
 assert.equal(r.technicallyRigged,false);
 assert(r.errors.some(x=>/walking animation/.test(x)));
});
test('reject non-normalized skin weights and missing inverse bind pose',()=>{
 for(const bad of [{badWeight:true},{missingIBM:true}]){
  const r=auditGlb(candidate(bad));assert.equal(r.technicallyRigged,false);
  assert(r.errors.some(x=>/weights|inverse bind/.test(x)),JSON.stringify(r.errors));
 }
});
test('reject truncated and corrupt GLB bytes',()=>{
 const b=candidate();
 assert.throws(()=>parseGlb(b.subarray(0,b.length-8)),/length mismatch/);
 const bad=Buffer.from(b);bad.writeUInt32LE(0,0);
 assert.throws(()=>parseGlb(bad),/Not a GLB/);
});
