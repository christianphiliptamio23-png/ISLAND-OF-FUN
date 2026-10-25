import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../games/shared/audio.js',import.meta.url),'utf8');
function setup(){
 const events={},contexts=[];let starts=0,now=0;
 const param=()=>({value:0,setValueAtTime(v){this.value=v;},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 class AudioContext{constructor(){this.currentTime=0;this.destination={};this.state='running';contexts.push(this);}createGain(){return{gain:param(),connect(){},disconnect(){}};}createOscillator(){return{frequency:param(),connect(){},disconnect(){},start(){starts++;},stop(){}};}resume(){this.state='running';return Promise.resolve();}suspend(){this.state='suspended';return Promise.resolve();}close(){return Promise.resolve();}}
 const document={hidden:false,addEventListener(k,f){events[k]=f;}};
 const window={AudioContext,addEventListener(k,f){events[k]=f;}};
 vm.runInNewContext(source,{window,document,localStorage:{getItem:()=>null},sessionStorage:{getItem:()=>null},performance:{now:()=>now}});
 return {api:window.GameAudio,events,document,contexts,get starts(){return starts;},advance(){now+=1000;}};
}
test('effects require a gesture, respect master/local mute and throttle repeated sounds',()=>{
 const e=setup();e.api.play('click');assert.equal(e.starts,0);e.events.pointerdown();e.api.play('click');assert.equal(e.starts,1);e.api.play('click');assert.equal(e.starts,1);
 e.advance();e.api.setSettings(()=>({master:0,effects:100}));e.api.play('win');assert.equal(e.starts,1);
 e.api.setSettings(()=>({master:50,effects:40}));assert.equal(e.api.volume(),.2);e.api.setEnabled(()=>false);e.api.play('pickup');assert.equal(e.starts,1);
 e.api.setEnabled(()=>true);e.api.play('pickup');assert.equal(e.starts,3);
});
test('existing audio uses one bus per context and silences when hidden',()=>{
 const e=setup();e.events.keydown();e.api.play('click');const ac=e.contexts[0],bus=e.api.output(ac);assert.equal(e.api.output(ac),bus);
 e.api.setSettings(()=>({master:80,effects:50}));assert.equal(bus.gain.value,.4);
 e.document.hidden=true;e.events.visibilitychange();assert.equal(bus.gain.value,0);assert.equal(ac.state,'suspended');
 e.document.hidden=false;e.events.visibilitychange();e.events.pointerdown();assert.equal(bus.gain.value,.4);assert.equal(ac.state,'running');
});
