import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const entry=new URL('../games/pickleball/index.html',import.meta.url),html=fs.readFileSync(entry,'utf8');
test('pickleball pack files exist and the projected baselines match the supplied court',()=>{
 const root=new URL('assets/tropical/pickleball_game_assets/',entry);
 const manifest=JSON.parse(fs.readFileSync(new URL('manifest.json',root),'utf8'));
 for(const item of manifest)assert.ok(fs.existsSync(new URL(item.file,root)),item.file);
 const projection=html.match(/const S=y=>[^;]+;/)[0];
 vm.runInNewContext(projection+`
 assert.ok(Math.abs(X(-10,-22)-518*1280/1672)<5);
 assert.ok(Math.abs(X(10,22)-1470*1280/1672)<5);
 assert.ok(Math.abs(Y(-22)-460*720/941)<5);
 assert.ok(Math.abs(Y(22)-861*720/941)<5);
 `,{assert});
});
test('new artwork draws in play and missing images retain the procedural fallback',()=>{
 const images=[],draws=[],nodes=new Map();let loaded=true;
 const ctx=new Proxy({drawImage(...args){draws.push(args);},createLinearGradient(){return{addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const node=()=>({style:{},hidden:false,addEventListener(){},setAttribute(){},getContext:()=>ctx});
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},createElement:node,addEventListener(){}};
 class Image{constructor(){images.push(this);}get complete(){return loaded;}get naturalWidth(){return loaded?985:0;}get naturalHeight(){return 1505;}set src(v){this.url=v;this.onload?.();}}
 const window={addEventListener(){}};
 const context={document,window,Image,localStorage:{getItem:()=>null,setItem(){}},matchMedia:()=>({matches:false}),performance:{now:()=>1000},innerWidth:1280,innerHeight:720,addEventListener(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){},setTimeout:()=>1,clearTimeout(){},structuredClone};
 let script=html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
 script=script.replace('})();','window.renderTest=()=>{begin(1);draw();};})();');
 vm.runInNewContext(script,context);window.renderTest();
 assert.ok(draws.some(a=>a[0].url?.endsWith('player_back.png')));
 assert.ok(draws.some(a=>a[0].url?.endsWith('opponent_front.png')));
 assert.ok(draws.some(a=>a[0].url?.endsWith('pickleball_ball.png')));
 assert.ok(draws.some(a=>a.length===9&&a[0].url?.endsWith('tropical_court_with_net.png')));
 loaded=false;assert.doesNotThrow(()=>window.renderTest());
});
