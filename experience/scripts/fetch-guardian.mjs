/* Fetch one CC0 asset from an immutable GitHub revision, verify exact bytes.
 * No runtime CDN required. Source: official three.js RobotExpressive.
 */
import { get } from 'node:https';
import { createHash } from 'node:crypto';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
const SOURCE='https://raw.githubusercontent.com/mrdoob/three.js/eba30de865cfbf31ac736f792defd9a60ff28d57/examples/models/gltf/RobotExpressive/RobotExpressive.glb';
const EXPECTED='047f5e5fb3bb6d378bd1df16ca6137f2a596c99b3a1b5690b4020c05aaf6f319';
const output=resolve('public/models/guardian.glb');
function verify(buffer){
 if(buffer.length!==463988) throw Error('Guardian asset byte count differs from pinned source');
 const sha=createHash('sha256').update(buffer).digest('hex');
 if(sha!==EXPECTED) throw Error('Guardian CC0 asset SHA256 mismatch '+sha);
 return buffer;
}
async function download(url){
 return await new Promise((resolve,reject)=>{
  get(url,{timeout:16000,headers:{'User-Agent':'GenAI-Galaxy-CC0-model-fetch'}},resp=>{
   if(resp.statusCode!==200){resp.resume();reject(Error('Guardian source HTTP '+resp.statusCode));return;}
   const parts=[];let size=0;
   resp.on('data',chunk=>{size+=chunk.length;if(size>500000){resp.destroy(Error('Oversized asset'));return;}parts.push(chunk)});
   resp.on('end',()=>resolve(Buffer.concat(parts)));
   resp.on('error',reject);
  }).on('error',reject);
 });
}
try{
 try{verify(await readFile(output));console.log('Pinned CC0 model already verified');process.exit(0);}
 catch(error){if(error.code!=='ENOENT'&&/SHA256|byte count/.test(error.message))throw error;}
 const buffer=verify(await download(SOURCE));
 await mkdir(dirname(output),{recursive:true});
 await writeFile(output,buffer);
 console.log('Fetched pinned CC0 RobotExpressive guardian ('+buffer.length+' bytes, SHA256 verified)');
}catch(e){console.error(e.message);process.exitCode=1;}
