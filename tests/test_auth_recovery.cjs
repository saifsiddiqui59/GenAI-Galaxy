'use strict';
// Offline tests only: no real Supabase accounts, credentials, or network.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','app.js'),'utf8').replace(/\nstart\(\);\s*$/,'\n');
const nodes=new Map();
function node(id){
 if(!nodes.has(id)){
  const classes=new Set(),labelClasses=new Set();
  nodes.set(id,{value:'',textContent:'',required:true,disabled:false,focus(){},
   classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle:(x,on)=>on?classes.add(x):classes.delete(x),contains:x=>classes.has(x)},
   closest:()=>({classList:{toggle:(x,on)=>on?labelClasses.add(x):labelClasses.delete(x)}})});
 }
 return nodes.get(id);
}
const calls=[],messages=[];
const auth={
 resetPasswordForEmail:async(email,options)=>{calls.push({type:'reset',email,options});return {error:null}},
 signUp:async()=>{calls.push({type:'signup'});return {data:{session:null},error:null}},
 signInWithPassword:async()=>{calls.push({type:'signin'});return {data:{session:{user:{id:'alice'}}},error:null}},
 getSession:async()=>({data:{session:{access_token:'local-test-only'}}}),
 getUser:async()=>({data:{user:{id:'alice'}}}),
 updateUser:async value=>{calls.push({type:'update',value});return {error:null}}
};
const ctx=vm.createContext({console,window:{},document:{getElementById:node},matchMedia:()=>({matches:false}),
 localStorage:{getItem:()=>null,setItem(){}},setTimeout,clearTimeout,Date,Math,JSON,URL,
 location:{origin:'https://galaxy.example',pathname:'/index.html',search:'?next=https://evil.invalid',hash:'#unsafe'},
 navigator:{},requestAnimationFrame:()=>0,performance:{now:()=>0},addEventListener(){}});
vm.runInContext(source,ctx);ctx.clientStub={auth};ctx.notices=messages;
vm.runInContext('state.client=clientStub;signedIn=async()=>{};notify=x=>notices.push(x)',ctx);
function mode(){return vm.runInContext('authMode',ctx)}
async function submit(){await vm.runInContext('authSubmit({preventDefault(){}})',ctx)}
(async()=>{
 vm.runInContext("authOpen('forgot')",ctx);
 assert.equal(mode(),'forgot');
 assert.equal(node('auth-password').required,false);
 node('auth-email').value='alice@example.invalid';
 await submit();
 assert.equal(calls.at(-1).type,'reset');
 assert.equal(calls.at(-1).options.redirectTo,'https://galaxy.example/index.html');
 assert.match(node('auth-message').textContent,/If an account exists/);
 vm.runInContext("setAuthMode('signup')",ctx);
 node('auth-password').value='sample-password';
 await submit();assert.equal(calls.at(-1).type,'signup');
 vm.runInContext("setAuthMode('signin')",ctx);
 node('auth-password').value='sample-password';
 await submit();assert.equal(calls.at(-1).type,'signin');
 vm.runInContext("authOpen('recovery')",ctx);
 assert.equal(node('auth-email').required,false);
 assert.equal(node('auth-password').minLength,8);
 node('auth-password').value='new-password-example';
 await submit();
 assert.equal(calls.at(-1).type,'update');
 assert.equal(mode(),'signin');
 assert.ok(messages.some(x=>x.includes('Password updated')));
 vm.runInContext("authOpen('recovery')",ctx);
 auth.getSession=async()=>({data:{session:null}});
 node('auth-password').value='another-password';
 await submit();
 assert.match(node('auth-message').textContent,/expired/);
 assert.equal(calls.filter(x=>x.type==='update').length,1);
 console.log('Auth recovery, reset redirect, expiry gate and sign-in/sign-up PASS');
})().catch(error=>{console.error(error);process.exitCode=1});
