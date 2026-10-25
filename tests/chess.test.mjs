import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ChessBoothGame} from '../games/chess/ChessBoothGame.js';

test('new chess page has valid scripts and uses its built-in engine',()=>{
  const html=fs.readFileSync(new URL('../games/chess/index.html',import.meta.url),'utf8');
  for(const script of html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
  assert.match(html,/window\.ChessGame=.*onExit/);
  assert.doesNotMatch(html,/stockfish\.js|fetch\(|https?:\/\//i);
  assert.match(html,/href="\.\/theme\.css"/);
  const theme=fs.readFileSync(new URL('../games/chess/theme.css',import.meta.url),'utf8');
  for(const asset of ['chess_background.webp','chess_game_ui_sheet.webp','chess_level_select_ui_sheet.webp']){
    assert.match(theme,new RegExp(asset));
    assert(fs.existsSync(new URL(`../games/chess/assets/${asset}`,import.meta.url)));
  }
});

test('chess booth opens the new page and returns to exploration',()=>{
  let loaded,exits=0;
  const originalAdd=globalThis.addEventListener;
  const originalRemove=globalThis.removeEventListener;
  const originalLocation=globalThis.location;
  let messageHandler;
  globalThis.addEventListener=(type,fn)=>{if(type==='message')messageHandler=fn};
  globalThis.removeEventListener=(type,fn)=>{if(type==='message'&&messageHandler===fn)messageHandler=null};
  globalThis.location={origin:'http://localhost:8080'};
  const frame={contentWindow:{ChessGame:{onExit:null},focus(){}},addEventListener(type,fn){if(type==='load')loaded=fn},remove(){this.removed=true}};
  const button={};
  const host={querySelector(selector){return selector==='iframe'?frame:button},replaceChildren(){this.cleared=true}};
  try{
    new ChessBoothGame().open(host,()=>exits++);
    assert.equal(frame.src,'/games/chess/index.html');
    loaded();frame.contentWindow.ChessGame.onExit();
    assert.equal(exits,1);assert.equal(frame.removed,true);assert.equal(host.cleared,true);
  }finally{
    if(originalAdd===undefined)delete globalThis.addEventListener;else globalThis.addEventListener=originalAdd;
    if(originalRemove===undefined)delete globalThis.removeEventListener;else globalThis.removeEventListener=originalRemove;
    if(originalLocation===undefined)delete globalThis.location;else globalThis.location=originalLocation;
  }
});
