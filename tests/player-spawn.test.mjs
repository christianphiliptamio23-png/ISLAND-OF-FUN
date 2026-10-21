import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class Vector3 {
  constructor(x=0,y=0,z=0){this.set(x,y,z)}
  set(x,y,z){Object.assign(this,{x,y,z});return this}
  length(){return Math.hypot(this.x,this.y,this.z)}
  clone(){return new Vector3(this.x,this.y,this.z)}
  copy(v){return this.set(v.x,v.y,v.z)}
  add(v){return this.set(this.x+v.x,this.y+v.y,this.z+v.z)}
  lerpVectors(a,b,t){return this.set(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,a.z+(b.z-a.z)*t)}
}
const elements=new Map();
const context=vm.createContext({window:{THREE:{Vector3,MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}}},document:{querySelector(s){if(!elements.has(s))elements.set(s,{hidden:true,classList:{add(){},remove(){}}});return elements.get(s)}},console});
function load(path,name){const source=fs.readFileSync(new URL(path,import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export class','class').replace('export const game = new Game();','');vm.runInContext(source+`;globalThis.${name}=${name};`,context);return context[name]}
const Player=load('../src/player/PlayerController.js','PlayerController');
// Game has its own top-level T binding, so evaluate it in a separate lexical block.
const gameSource=fs.readFileSync(new URL('../src/core/Game.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replace('export class','class').replace('export const game = new Game();','');
vm.runInContext(`{${gameSource};globalThis.Game=Game;}`,context);
function action(){return {time:0,weight:0,paused:false,reset(){this.time=0;return this},setEffectiveWeight(w){this.weight=w;return this},play(){this.playing=true;return this},fadeOut(){return this},fadeIn(){return this},stopFading(){return this},getClip(){return {duration:2}}}}
function player(){const p=Object.create(Player.prototype);Object.assign(p,{group:{position:new Vector3(0,-5,26),rotation:{}},velocity:new Vector3(),grounded:true,input:{keys:new Set(['w']),jump:true,clearMotion(){}},limbs:[],animationActions:{walk:action()}});p.mixer={update(){p.evaluatedTime=p.currentAction?.time}};return p}

test('spawn waits for terrain and then uses bridge deck height, resetting motion',()=>{
  const p=player();p.velocity.set(3,-2,1);p.vertical=-4;p.island={terrainHitAt:()=>null};
  assert.equal(p.respawn(),false);assert.equal(p.group.position.y,-5);
  p.island.terrainHitAt=(x,z)=>{assert.equal(x,0);assert.equal(z,26);return {point:{y:1.3819}}};
  assert.equal(p.respawn(),true);assert.equal(p.group.position.y,1.4119);
  assert.equal(p.velocity.length(),0);assert.equal(p.vertical,0);assert.equal(p.grounded,true);assert.equal(p.input.keys.size,0);assert.equal(p.input.jump,false);
  assert.equal(p.currentAction.playing,true);assert.equal(p.currentAction.weight,1);assert.equal(p.evaluatedTime,.25);
});
test('walk-only model starts posed, resumes walking and returns to a full-weight rest pose',()=>{
  const p=player();p.animateCharacter(0,0);const walk=p.currentAction;
  assert.equal(walk.paused,true);assert.equal(walk.time,.25);assert.equal(walk.weight,1);
  p.velocity.set(0,0,3.8);p.animateCharacter(.016,1);assert.equal(walk.paused,false);assert.equal(p.currentAction,walk);
  p.velocity.set(0,0,0);p.animateCharacter(.016,2);assert.equal(walk.paused,true);assert.equal(walk.weight,1);
  p.grounded=false;p.animateCharacter(.016,3);assert.equal(walk.paused,false);assert.equal(p.currentAction,walk);
});
test('authored idle animation plays when available',()=>{
  const p=player();p.animationActions.idle=action();p.animateCharacter(0,0);
  assert.equal(p.currentAction,p.animationActions.idle);assert.equal(p.currentAction.paused,false);assert.equal(p.currentAction.weight,1);
});
test('entrance remains hidden until spawn succeeds, then camera uses bridge height',()=>{
  const p=player();let ready=false;p.island={terrainHitAt:()=>ready?{point:{y:1.38}}:null};
  const g=Object.create(context.Game.prototype);let state='TRANSITION';
  Object.assign(g,{player:p,world:{},scene:{},time:0,transition:{elapsed:0,start:new Vector3(),target:new Vector3()},camera:{position:new Vector3(),lookAt(v){this.target=v}},state:{set(v){state=v}},input:{clearMotion(){}}});
  g.transitionFrame(1);assert.equal(g.transition.switched,undefined);assert.equal(state,'TRANSITION');assert.equal(g.transition.elapsed,.6);
  ready=true;g.transitionFrame(.016);assert.equal(g.transition.switched,true);assert.equal(p.group.visible,false);assert.equal(g.camera.target.y,3.41);
  g.transitionFrame(2);assert.equal(state,'EXPLORATION');assert.equal(p.group.visible,true);assert.equal(p.currentAction.paused,true);assert.equal(g.camera.position.y,5.41);
});
