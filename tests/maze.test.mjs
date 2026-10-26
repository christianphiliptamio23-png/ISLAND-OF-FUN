import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ProfileStore} from '../src/core/ProfileStore.js';
import {MazeBoothGame} from '../games/maze/MazeBoothGame.js';

class Storage{values=new Map();getItem(k){return this.values.get(k)??null}setItem(k,v){this.values.set(k,String(v))}removeItem(k){this.values.delete(k)}}
const html=fs.readFileSync(new URL('../games/maze/index.html',import.meta.url),'utf8');
function boot(){
  const elements=new Map(),messages=[];let clock=100;
  function element(id=''){const classes=new Set(),listeners={};return {id,listeners,children:[],style:{},classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),toggle(x,b){if(b)classes.add(x);else classes.delete(x)}},set innerHTML(value){this.children=[]},appendChild(e){this.children.push(e)},setAttribute(){},addEventListener(k,f){listeners[k]=f},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:112,height:112}),clientWidth:600,clientHeight:600,getContext:()=>({setTransform(){}})}}
  const get=id=>{if(!elements.has(id))elements.set(id,element(id.slice(1)));return elements.get(id)};
  const context={matchMedia:()=>({matches:false}),structuredClone,window:{devicePixelRatio:1,addEventListener(){}},parent:{postMessage:(data,origin)=>messages.push({data,origin})},document:{addEventListener(){},querySelector:get,querySelectorAll:s=>s==='.scr'?[get('#menu'),get('#game')]:[],createElement:()=>element()},location:{search:'?profile=test-id',origin:'http://localhost:8080',assign(){}},URLSearchParams,localStorage:new Storage(),performance:{now:()=>clock},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout(){}};
  let script=html.match(/<script>([\s\S]*?)<\/script>/)[1];const end=script.lastIndexOf('})();');script=script.slice(0,end)+'globalThis.mazeTest={gen,start,move,D,toggleMap,control,get joystick(){return joyCommand},get state(){return S}};'+script.slice(end);
  vm.runInNewContext(script,context);
  return {api:context.mazeTest,messages,elements,advance(){clock+=100}};
}
function pathTo(state,target){const {n,g,x,y}=state,start=y*n+x,end=target[1]*n+target[0],queue=[start],prev=new Map([[start,null]]),dirs=[[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]];
  for(let i=0;i<queue.length&&!prev.has(end);i++){const cell=queue[i],cx=cell%n,cy=Math.floor(cell/n);dirs.forEach(([dx,dy,bit],d)=>{if(g[cell]&bit){const next=(cy+dy)*n+cx+dx;if(!prev.has(next)){prev.set(next,{cell,d});queue.push(next)}}})}
  assert(prev.has(end),'Target must be reachable');const result=[];for(let c=end;c!==start;){const p=prev.get(c);result.unshift(p.d);c=p.cell}return result;
}

test('all ten maze levels have connected, reciprocal passages and a reachable exit',()=>{
  const {api}=boot();
  for(let i=0;i<10;i++){const m=api.gen(i);assert.equal(m.n,7+i*2);for(let y=0;y<m.n;y++)for(let x=0;x<m.n;x++){const cell=m.g[y*m.n+x];for(const [dx,dy,bit,opposite] of api.D)if(cell&bit){assert(x+dx>=0&&x+dx<m.n&&y+dy>=0&&y+dy<m.n);assert(m.g[(y+dy)*m.n+x+dx]&opposite)}}
    assert(pathTo({...m,x:0,y:0},[m.n-1,m.n-1]).length>0);
  }
});

test('maze movement respects walls and reaching the exit sends a real completion result',()=>{
  const {api,messages,advance}=boot();api.start(0);const first=api.state;
  const wall=api.D.findIndex(d=>!(first.g[0]&d[2]));advance();api.move(wall);assert.equal(first.x,0);assert.equal(first.y,0);
  const route=pathTo(first,[first.n-1,first.n-1]);for(const direction of route){advance();api.move(direction)}
  assert.equal(api.state.done,1);const win=messages.find(m=>m.data.type==='maze:win');assert(win);assert.equal(win.data.level,1);assert.equal(win.data.moves,route.length);assert(win.data.stars>=0&&win.data.stars<=3);assert.equal(win.origin,'http://localhost:8080');
  advance();api.move(0);assert.equal(messages.length,1);
});

test('first-person controls turn relative to facing and map blocks walking',()=>{
 const {api,advance}=boot();api.start(0);const s=api.state,heading=s.heading;
 api.control('right',1000);assert.equal(s.heading,heading+Math.PI/2);
 api.control('left',1300);assert.equal(s.heading,heading);
 const direction=(Math.round(heading/(Math.PI/2))+1)%4;
 api.toggleMap();advance();api.move(direction);assert.equal(s.moves,0);
 api.toggleMap();advance();api.control('forward',1600);assert.equal(s.moves,1);
 assert.equal(s.x,api.D[direction][0]);assert.equal(s.y,api.D[direction][1]);
});

test('first-person rays stop at walls and pass through connected cells',()=>{
 const context={window:{}};vm.runInNewContext(fs.readFileSync(new URL('../games/maze/first-person.js',import.meta.url),'utf8'),context);
 const {cast,render}=context.window.MazeView,s={n:2,g:[2,8,0,0]};
 assert.equal(cast(s,.5,.5,0).dist,1.5);
 assert.equal(cast(s,.5,.5,Math.PI).dist,.5);
 assert.equal(cast(s,.5,.5,Math.PI/2).dist,.5);
 const gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient:()=>gradient},{get:(o,k)=>k in o?o[k]:()=>{}});
 const {api}=boot();for(let i=0;i<10;i++){api.start(i);assert.doesNotThrow(()=>render(ctx,api.state,960,540,1000));}
});

test('phone joystick tracks its own finger, has a dead zone and resets on release or map',()=>{
 const {api,elements}=boot();api.start(0);const stick=elements.get('#maze-joystick').listeners;
 const event=(x,y,id=1)=>({clientX:x,clientY:y,pointerId:id,preventDefault(){}});
 stick.pointerdown(event(56,56));assert.equal(api.joystick,null);
 stick.pointermove(event(56,0));assert.equal(api.joystick,'forward');
 stick.pointermove(event(112,56,2));assert.equal(api.joystick,'forward');
 stick.pointermove(event(112,56));assert.equal(api.joystick,'strafeRight');
 stick.pointerup(event(112,56));assert.equal(api.joystick,null);
 stick.pointerdown(event(56,112));assert.equal(api.joystick,'back');
 api.toggleMap();assert.equal(api.joystick,null);
 stick.pointerdown(event(56,0));assert.equal(api.joystick,null);
 api.toggleMap();stick.pointerdown(event(0,56));assert.equal(api.joystick,'strafeLeft');
 stick.pointercancel(event(0,56));assert.equal(api.joystick,null);
});

test('maze metadata preserves best runs without awarding duplicate wallet rewards',()=>{
 const p=new ProfileStore(new Storage(),new Storage()),one=p.createAccount('Maze Player');
 assert.throws(()=>p.recordMazeWin(2,3,10,50),/earlier/);assert.throws(()=>p.recordMazeWin(1,4,10,50),/Invalid/);
 const id=p.beginAttempt('maze',1);p.finishAttempt('maze',id);const balance=p.profile.coins;
 p.recordMazeWin(1,1,30,50);p.recordMazeWin(1,3,20,40);p.recordMazeWin(1,0,60,100);
 assert.equal(p.profile.coins,balance);assert.equal(p.profile.maze.bestStars[1],3);assert.equal(p.profile.maze.bestTimes[1],20);assert.equal(p.profile.maze.bestMoves[1],40);
 p.createAccount('Another Player');assert.equal(p.profile.maze,undefined);p.selectAccount(one.id);assert.equal(p.profile.maze.bestStars[1],3);
});

test('maze booth scopes frame events, seeds profile progress and cleans up on return',()=>{
  const original={location:globalThis.location,add:globalThis.addEventListener,remove:globalThis.removeEventListener},listeners=new Map();
  globalThis.location={origin:'http://localhost:8080'};globalThis.addEventListener=(k,v)=>listeners.set(k,v);globalThis.removeEventListener=(k,v)=>{if(listeners.get(k)===v)listeners.delete(k)};
  try{
    const frame={contentWindow:{focus(){}},contentDocument:{querySelector:()=>({})},addEventListener(){},remove(){this.removed=true}},button={},status={},host={querySelector:s=>s==='iframe'?frame:s==='button'?button:status,replaceChildren(){this.cleared=true}};
    const p=new ProfileStore(new Storage(),new Storage());p.finishAttempt('maze',p.beginAttempt('maze',1));p.unlock('maze',2);p.recordMazeWin(1,3,20,40);const game=new MazeBoothGame();let returned=0,saved=0;game.open(host,()=>returned++,()=>saved++,p);
    const url=new URL(frame.src,location.origin);assert.equal(url.searchParams.get('unlocked'),'2');assert.equal(JSON.parse(url.searchParams.get('stars'))[0],3);
    const receive=listeners.get('message'),data={type:'maze:win',level:2,stars:2,time:30,moves:60};receive({origin:'https://other.example',source:frame.contentWindow,data});receive({origin:location.origin,source:{},data});assert.equal(saved,0);
    receive({origin:location.origin,source:frame.contentWindow,data});assert.equal(saved,1);assert.equal(p.profile.maze.unlocked,2);
    receive({origin:location.origin,source:frame.contentWindow,data:{type:'maze:exit'}});assert.equal(returned,1);assert(frame.removed);assert(host.cleared);assert(!listeners.has('message'));
  }finally{globalThis.location=original.location;globalThis.addEventListener=original.add;globalThis.removeEventListener=original.remove;}
});
