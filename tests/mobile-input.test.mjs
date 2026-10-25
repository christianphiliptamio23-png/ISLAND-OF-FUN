import test from 'node:test';
import assert from 'node:assert/strict';
import {InputManager} from '../src/core/InputManager.js';
import {MobileControls} from '../src/core/MobileControls.js';
class Element {
  constructor(){this.listeners={};this.style={};this.children={};this.firstElementChild={style:{}};}
  addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}
  emit(type,event={}){for(const fn of this.listeners[type]||[])fn(event);}
  setPointerCapture(){}
  setAttribute(k,v){this[k]=v;}
  querySelector(k){return this.children[k]??=new Element();}
  getBoundingClientRect(){return {left:0,top:0,width:120,height:120};}
}
test('touch camera uses coordinates and releases capture after cancellation',()=>{
  globalThis.addEventListener=()=>{};
  const canvas=new Element(),input=new InputManager(canvas);
  canvas.emit('pointerdown',{pointerId:1,clientX:20,clientY:30});
  canvas.emit('pointermove',{pointerId:2,clientX:500,clientY:500});
  assert.equal(input.dx,0);
  canvas.emit('pointermove',{pointerId:1,clientX:45,clientY:22});
  assert.equal(input.dx,25);assert.equal(input.dy,-8);
  canvas.emit('pointercancel',{pointerId:1});
  canvas.emit('pointermove',{pointerId:1,clientX:100,clientY:100});
  assert.equal(input.dx,25);assert.equal(input.drag,false);
});
test('joystick supports simultaneous actions and resets when entering a booth',()=>{
  globalThis.addEventListener=()=>{};globalThis.matchMedia=()=>({matches:true});
  globalThis.document={createElement:()=>new Element(),body:{append(){}},addEventListener(){}};
  let state='EXPLORATION',visits=0;
  const game={input:{clearMotion(){}},state:{is:s=>s===state},interactions:{near:{},interact(){visits++;}}};
  const controls=new MobileControls(game);controls.update();
  controls.stick.emit('pointerdown',{pointerId:1,clientX:120,clientY:0,preventDefault(){}});
  assert.ok(game.input.touchMove.x>0);assert.ok(game.input.touchMove.y<0);
  assert.ok(Math.hypot(game.input.touchMove.x,game.input.touchMove.y)<=1.001);
  controls.root.querySelector('[data-touch="jump"]').onclick();assert.equal(game.input.jump,true);
  controls.runButton.onclick();assert.equal(game.input.touchRun,true);
  controls.root.querySelector('[data-touch="explore"]').onclick();assert.equal(visits,1);
  state='MINIGAME';controls.update();assert.equal(controls.root.hidden,true);
  assert.deepEqual(game.input.touchMove,{x:0,y:0});assert.equal(game.input.touchRun,false);
  controls.root.querySelector('[data-touch="explore"]').onclick();assert.equal(visits,1);
  state='EXPLORATION';controls.update();assert.equal(controls.enabled,true);assert.equal(controls.root.hidden,false);
  controls.stick.emit('pointerdown',{pointerId:2,clientX:110,clientY:60,preventDefault(){}});assert.ok(game.input.touchMove.x>.8);
});
