import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {GAMES,COSTS,REWARDS} from '../src/core/Economy.js';
const source=fs.readFileSync(new URL('../games/shared/economy-bridge.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
test('all seven games award wins without creating an expandable wallet panel',()=>{
 for(const game of Object.keys(GAMES)){
  const nodes=[];let tick;
  function element(tag){const children=new Map();return {tag,hidden:false,textContent:'',classList:{add(){},remove(){}},setAttribute(){},append(){},addEventListener(){},remove(){},querySelector(s){if(!children.has(s))children.set(s,element('child'));return children.get(s);}};}
  const profile={id:'test',coins:150,tickets:2,tokens:0,progress:{[game]:{paid:[1],cleared:[]}},economy:{attempts:{}}};
  class Store{get profile(){return profile;}beginAttempt(){return 'attempt';}finishAttempt(){profile.coins+=30;return{coins:30};}}
  const window={addEventListener(){},dispatchEvent(){}};
  vm.runInNewContext(source,{ProfileStore:Store,GAMES,COSTS,REWARDS,location:{pathname:'/games/'+game+'/index.html'},window,parent:window,document:{querySelector:()=>element('boot'),createElement(tag){const e=element(tag);nodes.push(e);return e;},body:{append(){}}},setInterval:f=>(tick=f,1),clearInterval(){},Event:class{}});
  assert.ok(window.GameEconomy,game);assert.equal(nodes.some(n=>n.tag==='details'),false);
  const wallet=nodes.find(n=>n.className==='economy-dock economy-compact');assert.ok(wallet);assert.equal(wallet.innerHTML.includes('data-levels'),false);
  window.GameEconomy.enter(1,()=>{});window.GameEconomy.complete();window.GameEconomy.complete();tick();
  assert.equal(profile.coins,180);assert.equal(wallet.querySelector('[data-retry]').hidden,true);assert.ok(nodes.some(n=>n.className==='economy-toast'&&n.textContent.includes('+30')));
 }
});
