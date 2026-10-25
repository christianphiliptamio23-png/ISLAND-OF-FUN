import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ProfileStore} from '../src/core/ProfileStore.js';

class Vector3{
  constructor(x=0,y=0,z=0){Object.assign(this,{x,y,z})}
  clone(){return new Vector3(this.x,this.y,this.z)}
  copy(v){Object.assign(this,{x:v.x,y:v.y,z:v.z});return this}
  add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this}
  addScaledVector(v,s){return this.add(new Vector3(v.x*s,v.y*s,v.z*s))}
  lerp(v,t){this.x+=(v.x-this.x)*t;this.y+=(v.y-this.y)*t;this.z+=(v.z-this.z)*t;return this}
}
class Raycaster{hits=[];calls=0;set(){}intersectObjects(objects){this.calls++;this.lastObjects=objects;return this.hits}}
const context=vm.createContext({window:{THREE:{Vector3,Raycaster,MathUtils:{clamp:(v,a,b)=>Math.max(a,Math.min(b,v))}}}});
vm.runInContext(fs.readFileSync(new URL('../src/player/ThirdPersonCamera.js',import.meta.url),'utf8').replace('export class','class')+';globalThis.Camera=ThirdPersonCamera;',context);
function setup(){const input={dx:0,dy:0,zoom:0,clearMotion(){this.dx=this.dy=this.zoom=0}},player={group:{position:new Vector3(2,1.4,26),visible:true}},camera={position:new Vector3(),lookAt(v){this.target=v}};return {input,player,camera,follow:new context.Camera(camera,player,{group:{children:[]}},input)}}
test('first-person follows eye height immediately and hides the player, without orbit collisions',()=>{
  const {follow,player,camera,input}=setup();follow.setMode('first');input.dx=100;input.dy=200;follow.update(.016);
  assert.equal(player.group.visible,false);assert.equal(camera.position.y,3);assert.equal(camera.position.x,2);assert.equal(camera.position.z,26);
  assert.equal(input.viewYaw,-.4);assert(camera.target.y<camera.position.y);assert.equal(follow.ray.calls,0);assert.equal(input.dx,0);
  player.group.position.x=10;player.group.position.y=2;follow.update(.016);assert.equal(camera.position.x,10);assert.equal(camera.position.y,3.6);
});
test('third-person restores model, heading and zoom, and avoids scene obstacles',()=>{
  const {follow,player,camera,input}=setup();follow.distance=9;follow.yaw=.7;
  follow.setMode('first');input.zoom=-50;input.dy=10000;follow.update(.016);assert.equal(follow.firstPitch,1.3);assert.equal(follow.distance,9);
  follow.setMode('third');follow.ray.hits=[{object:{isSprite:true},distance:.1},{object:{},distance:3}];follow.update(0);
  assert(player.group.visible);assert.equal(input.viewYaw,.7);assert.equal(follow.distance,9);
  const target=camera.target;assert(Math.abs(Math.hypot(camera.position.x-target.x,camera.position.y-target.y,camera.position.z-target.z)-2.6)<1e-8);
  follow.ray.hits=[];input.zoom=-100;follow.update(.016);assert.equal(follow.distance,4);
  follow.setMode('invalid');assert.equal(follow.mode,'third');
});
test('foliage is excluded from camera collision and obstacle exit eases outward',()=>{
  const {follow,camera}=setup(),terrain={},water={},booth={};
  follow.world.group.children=[terrain,water,booth];follow.world.terrainModel=terrain;follow.world.water=water;
  follow.setMode('third');follow.ray.hits=[{object:{},distance:3}];follow.update(0);
  assert.deepEqual([...follow.ray.lastObjects],[booth]);
  assert.equal(follow.currentDistance,2.6);
  follow.ray.hits=[];follow.update(.016);
  assert.ok(follow.currentDistance>2.6&&follow.currentDistance<follow.distance);
  assert.ok(camera.position.z>26);
});
test('camera follows its smoothed focus without a second position lag',()=>{
  const {follow,player,camera}=setup();
  follow.setMode('third');follow.update(0);
  player.group.position.x+=2;follow.update(.016);
  assert.ok(follow.focus.x>2&&follow.focus.x<4);
  assert.equal(camera.position.x,follow.focus.x);
});
test('camera choice persists with the active profile',()=>{
  class Storage{values=new Map();getItem(k){return this.values.get(k)??null}setItem(k,v){this.values.set(k,String(v))}}
  const local=new Storage(),session=new Storage(),profiles=new ProfileStore(local,session);
  profiles.settings({cameraMode:'first'});assert.equal(new ProfileStore(local,session).profile.settings.cameraMode,'first');
  profiles.settings({cameraMode:'third'});assert.equal(new ProfileStore(local,session).profile.settings.cameraMode,'third');
});

test('emote camera faces the player and restores the previous view',()=>{
 const {follow,player,camera}=setup();player.group.rotation={y:Math.PI/2};follow.mode='first';follow.yaw=.7;follow.pitch=.4;follow.distance=9;
 follow.beginEmote();follow.update(0);assert.equal(follow.mode,'third');assert.equal(follow.yaw,Math.PI/2);assert.equal(follow.distance,6.5);assert.ok(camera.position.x>player.group.position.x+4);assert.ok(Math.abs(camera.position.z-player.group.position.z)<.001);
 follow.endEmote();assert.equal(follow.mode,'first');assert.equal(follow.yaw,.7);assert.equal(follow.pitch,.4);assert.equal(follow.distance,9);
});
