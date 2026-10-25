import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../',import.meta.url);
function runtime(){
 const context={console:{log(){},warn(){},error:console.error},TextDecoder,TextEncoder,URL,Blob};context.window=context;context.self=context;vm.createContext(context);
 for(const file of ['three.min.js','fflate.min.js','FBXLoader.js'])vm.runInContext(fs.readFileSync(new URL('assets/vendor/'+file,root),'utf8'),context);
 const T=context.THREE;T.FileLoader.prototype.load=function(path,onLoad,_progress,onError){try{const b=fs.readFileSync(new URL(path,root));onLoad(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));}catch(e){onError(e);}};
 T.TextureLoader.prototype.load=function(url){const resolved=this.manager.resolveURL((this.path||'')+url);assert.ok(fs.existsSync(new URL(resolved,root)),resolved);return new T.Texture();};
 T.FBXLoader.prototype.load=function(path,onLoad,_progress,onError){try{const bytes=fs.readFileSync(new URL(path,root));onLoad(this.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),path.slice(0,path.lastIndexOf('/')+1)));}catch(e){onError(e);}};
 vm.runInContext(fs.readFileSync(new URL('src/player/CharacterEmotes.js',root),'utf8').replace('export class CharacterEmotes','globalThis.CharacterEmotes=class CharacterEmotes'),context);
 return context;
}
test('all five dance archives load with valid textures, upright scale and animated bones',async()=>{
 const c=runtime(),e=Object.create(c.CharacterEmotes.prototype);e.cache=new Map();e.game={player:{group:new c.THREE.Group()}};
 for(let i=0;i<5;i++){
  const dance=await e.load(i);assert.ok(dance.clip.duration>0);assert.equal(dance.clip.tracks.length,195);
  dance.mixer.stopAllAction();const size=new c.THREE.Box3().setFromObject(dance.visual).getSize(new c.THREE.Vector3());assert.ok(Math.abs(size.y-1.85)<.001);assert.ok(size.y>size.z*2);
  const bones=[];dance.visual.traverse(o=>{if(o.isBone)bones.push(o)});assert.ok(bones.length>50);
  dance.mixer.stopAllAction();dance.mixer.clipAction(dance.clip).play();dance.mixer.update(0);const before=bones.map(o=>o.quaternion.toArray());dance.mixer.update(.35);
  assert.ok(bones.some((o,j)=>o.quaternion.toArray().some((v,k)=>Math.abs(v-before[j][k])>.001)));
  assert.equal(await e.load(i),dance);if(i>0)assert.equal(dance.visual,(await e.load(0)).visual);
 }
});
test('a dance loading in the background cannot start after leaving exploration',async()=>{
 const c=runtime(),e=Object.create(c.CharacterEmotes.prototype);let resolve;
 const player={velocity:{x:0,z:0},grounded:true,character:{visible:true},fallback:{visible:false}};
 e.game={player,state:{is:()=>true},follow:{mode:'third'}};e.kind=null;e.ui={};e.status={};e.load=()=>new Promise(r=>resolve=r);
 const playing=e.play('0');assert.equal(e.pending,true);e.game.state.is=()=>false;e.update(.016);assert.equal(e.pending,false);
 resolve({});await playing;assert.equal(e.kind,null);assert.equal(player.character.visible,true);
});

test('dance playback evaluates its pose before showing and plays the full clip once',async()=>{
 const c=runtime(),e=Object.create(c.CharacterEmotes.prototype);let loop,posed=false,front=false;
 const visual={visible:false},action={reset(){return this},setLoop(mode,count){loop=[mode,count];return this},play(){return this}};
 const mixer={stopAllAction(){},clipAction(){return action},update(dt){assert.equal(dt,0);assert.equal(visual.visible,false);posed=true}};
 e.kind=null;e.ui={};e.status={};e.game={save:{profiles:{profile:{inventory:['emote-4']}}},player:{character:{visible:true},fallback:{visible:false}},state:{is:()=>true},follow:{beginEmote(){front=true},endEmote(){}},refreshCameraButton(){}};
 e.load=async()=>({visual,mixer,clip:{duration:23.125}});await e.play('4');
 assert.ok(posed&&front&&visual.visible);assert.equal(e.duration,23.125);assert.deepEqual(loop,[c.THREE.LoopOnce,1]);assert.equal(action.clampWhenFinished,true);
});

test('unowned paid emotes cannot bypass the shop by invoking playback',async()=>{
 const c=runtime(),e=Object.create(c.CharacterEmotes.prototype);let loaded=false;e.status={};e.game={state:{is:()=>true},save:{profiles:{profile:{inventory:[]}}}};e.load=()=>{loaded=true};
 for(const n of ['1','2','3','4'])await e.play(n);assert.equal(loaded,false);assert.match(e.status.textContent,/Unlock/);
});
