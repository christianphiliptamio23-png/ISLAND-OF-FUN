import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../games/shared/time-of-day.js',import.meta.url),'utf8');
function clock(saved){let now=1000000,tick;const events={},data=new Map(saved?[['island-of-fun-time-of-day-v1',saved]]:[]),document={readyState:'loading',documentElement:{dataset:{}},addEventListener(){}};const window={addEventListener(k,f){events[k]=f;},dispatchEvent(){}};
 vm.runInNewContext(source,{window,document,Date:{now:()=>now},localStorage:{getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},setInterval:f=>(tick=f,1),clearInterval(){},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
 return {api:window.IslandTime,document,data,events,advance(ms){now+=ms;tick();}};
}
test('time cycle changes at five-minute boundaries and repeats after twenty minutes',()=>{const c=clock();assert.equal(c.api.phase,'morning');c.advance(299999);assert.equal(c.api.phase,'morning');c.advance(1);assert.equal(c.api.phase,'day');c.advance(300000);assert.equal(c.api.phase,'afternoon');c.advance(300000);assert.equal(c.api.phase,'night');c.advance(300000);assert.equal(c.api.phase,'morning');});
test('manual time persists, freezes the cycle and resumes Auto from the chosen phase',()=>{const c=clock();c.api.choose('night');c.advance(900000);assert.equal(c.api.phase,'night');const saved=c.data.get('island-of-fun-time-of-day-v1');assert.equal(clock(saved).api.phase,'night');c.api.choose('auto');assert.equal(c.api.phase,'night');c.advance(300000);assert.equal(c.api.phase,'morning');c.api.choose('invalid');assert.equal(c.api.mode,'auto');});
test('island emotes restore the walking character when moving, pausing or finishing',()=>{
 const context={window:{THREE:{}}};vm.runInNewContext(fs.readFileSync(new URL('../src/player/CharacterEmotes.js',import.meta.url),'utf8').replace('export class CharacterEmotes','globalThis.CharacterEmotes=class CharacterEmotes'),context);
 for(const reason of ['move','pause','finish']){const e=Object.create(context.CharacterEmotes.prototype),player={velocity:{x:reason==='move'?1:0,z:0},grounded:true,character:{visible:false},fallback:{visible:false}};
 Object.assign(e,{game:{player,state:{is:()=>reason!=='pause'},follow:{mode:'third'}},ui:{},status:{},visual:{visible:true},kind:'dance',elapsed:reason==='finish'?9:0,originalCharacterVisible:true,originalFallbackVisible:false});e.update(.016);assert.equal(e.kind,null);assert.equal(e.visual.visible,false);assert.equal(player.character.visible,true);assert.equal(player.fallback.visible,false);}
});
