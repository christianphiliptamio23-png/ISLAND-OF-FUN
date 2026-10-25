import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ProfileStore} from '../src/core/ProfileStore.js';
import {BasketballBoothGame} from '../games/basketball/BasketballBoothGame.js';

class Storage {values=new Map();getItem(k){return this.values.get(k)??null}setItem(k,v){this.values.set(k,String(v))}removeItem(k){this.values.delete(k)}}
const profile=()=>new ProfileStore(new Storage(),new Storage());
const html=fs.readFileSync(new URL('../games/basketball/index.html',import.meta.url),'utf8');
const source=html.split('//SIM-START')[1].split('//SIM-END')[0];
const sim=vm.runInNewContext(source+';({LEVELS,newLevel,launch,tick,pos,STEP,RIMW})');

test('restored HTML has valid scripts and no external assets or packages',()=>{
  for(const script of html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
  assert(!/<(?:script|link|img)[^>]+(?:src|href)=["']https?:/i.test(html));
});

test('all ten levels score a downward basket after the required rings and finish the ball',()=>{
  assert.equal(sim.LEVELS.length,10);
  for(let i=0;i<10;i++){
    const l=sim.newLevel(i);assert(sim.launch(l,0,0));assert(!sim.launch(l,0,0));
    const hoop=sim.pos(l.d.basket,sim.STEP);l.ball.x=hoop.x+sim.RIMW/2;l.ball.y=hoop.y-.5;l.ball.vy=200;l.ring=(l.d.rings||[]).length;
    sim.tick(l,sim.STEP);assert.equal(l.score,1,'Level '+(i+1));
    for(let t=0;t<300;t++)sim.tick(l,sim.STEP);
    assert.equal(l.ball,null);assert.equal(l.score,1);
  }
});

test('a basket without the required ring does not count',()=>{
  const l=sim.newLevel(2);sim.launch(l,0,0);const k=sim.pos(l.d.basket,sim.STEP);l.ball.x=k.x+sim.RIMW/2;l.ball.y=k.y-.5;l.ball.vy=200;sim.tick(l,sim.STEP);assert.equal(l.score,0);assert(l.ev.some(e=>e.t==='need'));
});

test('basketball metadata cannot grant rewards or bypass paid unlocks',()=>{
 const p=profile();assert.throws(()=>p.recordBasketballWin(2,2),/earlier/);assert.throws(()=>p.recordBasketballWin(1,0),/Invalid/);
 const id=p.beginAttempt('basketball',1);assert.equal(p.finishAttempt('basketball',id).coins,30);
 const balance=p.profile.coins;assert.equal(p.recordBasketballWin(1,3).coins,0);assert.equal(p.profile.coins,balance);assert.equal(p.profile.basketball.bestScores[1],3);
 p.unlock('basketball',2);p.recordBasketballWin(2,2);assert.equal(p.profile.basketball.unlocked,2);
});

test('booth accepts messages only from its game frame and removes listeners on return',()=>{
  const original={location:globalThis.location,add:globalThis.addEventListener,remove:globalThis.removeEventListener};
  const listeners=new Map();globalThis.location={origin:'http://localhost:8080'};globalThis.addEventListener=(k,v)=>listeners.set(k,v);globalThis.removeEventListener=(k,v)=>{if(listeners.get(k)===v)listeners.delete(k)};
  try{
    const status={},button={},frame={contentWindow:{focus(){}},contentDocument:{querySelector(){return {}}},addEventListener(){},remove(){this.removed=true}};
    const host={querySelector:s=>s==='iframe'?frame:s==='button'?button:status,replaceChildren(){this.cleared=true}};
    const p=profile(),game=new BasketballBoothGame();let returned=0,synced=0;
    game.open(host,()=>returned++,()=>synced++,p);
    const receive=listeners.get('message'),message={type:'basketball:win',level:1,score:2};
    receive({origin:'https://other.example',source:frame.contentWindow,data:message});assert.equal(synced,0);
    receive({origin:location.origin,source:{},data:message});assert.equal(synced,0);
    receive({origin:location.origin,source:frame.contentWindow,data:message});assert.equal(synced,1);assert.equal(p.profile.basketball.unlocked,1);
    receive({origin:location.origin,source:frame.contentWindow,data:{type:'basketball:exit'}});
    assert.equal(returned,1);assert(frame.removed);assert(host.cleared);assert(!listeners.has('message'));assert(game.dead);
    assert(new URL(frame.src,location.origin).searchParams.get('profile')===p.profile.id);
  }finally{globalThis.location=original.location;globalThis.addEventListener=original.add;globalThis.removeEventListener=original.remove;}
});
