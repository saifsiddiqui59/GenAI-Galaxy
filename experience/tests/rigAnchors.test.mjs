import test from 'node:test';
import assert from 'node:assert/strict';
import {discoverRigAnchors,gripMidpoint,waistPosition} from '../src/guardian/rigAnchors.js';
const vec=(x=0,y=0,z=0)=>({x,y,z,add(other){this.x+=other.x;this.y+=other.y;this.z+=other.z;return this},multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this}});
const bone=(name,position)=>({isBone:true,name,getWorldPosition:()=>vec(...position)});
const root=bones=>({traverse:fn=>bones.forEach(fn)});
test('Quaternius/Mixamo-like hands and hips resolve from real bones',()=>{
 const rig=discoverRigAnchors(root([bone('mixamorigLeftHand',[1,2,3]),bone('mixamorigRightHand',[3,2,3]),bone('Hips',[0,1,0])]));
 assert.equal(rig.readyToOffer,true);
 assert.equal(rig.readyForSatchel,true);
 assert.deepEqual(gripMidpoint(rig,()=>vec()),vec(2,2,3));
 assert.deepEqual(waistPosition(rig,()=>vec()),vec(0,1,0));
});
test('unknown/one-handed skeleton refuses fabricated pose',()=>{
 const rig=discoverRigAnchors(root([bone('Spine42',[0,0,0]),bone('leftHand',[0,0,0])]));
 assert.equal(rig.readyToOffer,false);
 assert.equal(rig.readyForSatchel,false);
 assert.equal(gripMidpoint(rig,()=>vec()),null);
});
test('invalid coordinates cannot produce a bogus grip',()=>{
 const rig=discoverRigAnchors(root([bone('leftHand',[NaN,0,0]),bone('rightHand',[1,0,0])]));
 assert.equal(gripMidpoint(rig,()=>vec()),null);
});
