import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ShootingBoothGame} from '../games/shooting-range/ShootingBoothGame.js';

const html=fs.readFileSync(new URL('../games/shooting-range/index.html',import.meta.url),'utf8');
function boot(profile='guest-one',values=new Map()){
  const messages=[],listeners=new Map(),images=[],draws=[],gradient={addColorStop(){}},ctx=new Proxy({createLinearGradient:()=>gradient,drawImage:(...args)=>draws.push(args)},{get:(o,k)=>k in o?o[k]:()=>{}});
  const canvas=()=>({style:{},getContext:()=>ctx,addEventListener(){}});
  const context={structuredClone,Image:class{constructor(){images.push(this)}},URLSearchParams,location:{search:'?profile='+profile+'&sound=0',origin:'http://localhost:8080'},localStorage:{getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v)},document:{getElementById:()=>canvas(),createElement:canvas,addEventListener(){}},parent:{postMessage:(data,origin)=>messages.push({data,origin})},innerWidth:1280,innerHeight:720,requestAnimationFrame(){}};
  context.window={devicePixelRatio:1,addEventListener:(k,f)=>listeners.set(k,f)};
  const source=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/window\.addEventListener\('economy-ready'[^\n]*\n\}\)\(\);/ ,`globalThis.api={openLevel,end,exitGame,get save(){return save},get state(){return S},get screen(){return scr},fire(){scr='play';now+=1000;for(const t of S.tg)t.rt=0;const t=S.tg.find(t=>t.k!=='d'&&!S.bk.some(k=>Math.abs(t.p[0]-k.cx)<=k.w/2&&Math.abs(t.p[1]-k.y)<=k.h/2));shoot(...t.p)}};\n})();`);
  vm.runInNewContext(source.replace('get save(){return save}',"drawBackground,drawCounter,levels:LV,miss(){scr='play';now+=1000;shoot(0,0)},get save(){return save}"),context);return {api:context.api,messages,listeners,values,images,draws};
}
test('every level has two spare bullets and the increased target speed at every level',()=>{
  const {api}=boot();
  for(let i=0;i<10;i++){
    api.openLevel(i);const base=api.levels[i],state=api.state;
    assert.equal(state.ammo,state.goal+2);
    for(let j=0;j<state.tg.length;j++)assert(Math.abs(state.tg[j].v-base.T[j].v*(1+.06*i)*1.755)<1e-8);
    if(i===1){assert.equal(state.goal,7);assert.equal(state.ammo,9)}
  }
});
test('two missed shots still allow a perfect finish; a third exhausts ammo early',()=>{
  const {api}=boot();api.openLevel(0);api.miss();api.miss();
  for(let i=0;i<5;i++)api.fire();assert.equal(api.state.win,1);assert.equal(api.state.ammo,0);
  api.openLevel(0);api.miss();api.miss();api.miss();
  for(let i=0;i<4;i++)api.fire();assert.equal(api.state.win,0);assert.equal(api.state.over,1);assert.equal(api.state.ammo,0);
});
test('local backdrop replaces both scenery and counter with a loading fallback',()=>{
  const {api,images,draws}=boot(),image=images[0];
  assert.equal(image.src,'./assets/Tropical%20shooting%20range%20backdrop.png');
  api.drawBackground();assert.notEqual(draws.at(-1)[0],image);
  Object.assign(image,{complete:true,naturalWidth:1672,naturalHeight:941});
  api.drawBackground();assert.equal(draws.at(-1)[0],image);assert.deepEqual(draws.at(-1).slice(1),[0,0,1280,720]);
  api.drawCounter();assert.equal(draws.at(-1)[0],image);assert.deepEqual(draws.at(-1).slice(-4),[0,585,1280,135]);
});
test('supplied shooting game scores real hits, unlocks levels and saves per profile',()=>{
  const {api,values}=boot();api.openLevel(0);
  for(let i=0;i<5;i++)api.fire();
  assert.equal(api.state.hits,5);assert.equal(api.state.ammo,2);assert.equal(api.state.win,1);assert.equal(api.save.u,2);
  assert.equal(boot('guest-one',values).api.save.u,2);assert.equal(boot('guest-two',values).api.save.u,1);
  for(let i=1;i<10;i++){api.openLevel(i);assert(api.state.tg.length>0);assert.equal(api.state.ammo,api.state.goal+2);api.end(1)}
  assert.equal(api.save.u,10);assert.equal(api.save.d.length,10);
});
test('Back to Island posts a same-origin exit; Escape pauses and resumes',()=>{
  const {api,messages,listeners}=boot();api.openLevel(0);api.fire();
  const escape=()=>listeners.get('keydown')({key:'Escape',preventDefault(){}});
  escape();assert.equal(api.screen,'pause');escape();assert.equal(api.screen,'play');
  api.exitGame();assert.equal(messages[0].data.type,'shooting:exit');assert.equal(messages[0].origin,'http://localhost:8080');
});
test('booth focuses game, rejects unrelated exit messages and cleans up once',()=>{
  const original={location:globalThis.location,add:globalThis.addEventListener,remove:globalThis.removeEventListener},listeners=new Map();
  globalThis.location={origin:'http://localhost:8080'};globalThis.addEventListener=(k,f)=>listeners.set(k,f);globalThis.removeEventListener=k=>listeners.delete(k);
  try{
    const handlers=new Map(),frame={contentWindow:{focus(){this.focused=true}},contentDocument:{querySelector:()=>({})},addEventListener:(k,f)=>handlers.set(k,f),remove(){this.removed=true}},button={},status={classList:{add(){}}},host={querySelector:s=>s==='iframe'?frame:s==='button'?button:status,replaceChildren(){this.cleared=true}};
    let left=0;const game=new ShootingBoothGame();game.open(host,()=>left++,{profile:{id:'guest-one',settings:{master:100,effects:100}}});
    assert.equal(new URL(frame.src,location.origin).searchParams.get('profile'),'guest-one');handlers.get('load')();assert(frame.contentWindow.focused);
    const receive=listeners.get('message'),data={type:'shooting:exit'};
    receive({origin:'https://other.example',source:frame.contentWindow,data});receive({origin:location.origin,source:{},data});assert.equal(left,0);
    receive({origin:location.origin,source:frame.contentWindow,data});game.exit();assert.equal(left,1);assert(frame.removed);assert(host.cleared);assert(!listeners.has('message'));
  }finally{globalThis.location=original.location;globalThis.addEventListener=original.add;globalThis.removeEventListener=original.remove}
});
