import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {createGameServer} from '../server.mjs';
const dir=path.resolve('.browser-test/final-'+Date.now());fs.mkdirSync(dir,{recursive:true});
const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--remote-debugging-port=0','--enable-unsafe-swiftshader','--use-angle=swiftshader','--user-data-dir='+dir,'about:blank'],{windowsHide:true,stdio:'ignore'});
let ws;const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 let port;for(let i=0;i<150;i++){try{port=fs.readFileSync(path.join(dir,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await wait(200);}}if(!port)throw Error('Chrome did not start');
 const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let serial=0;const pending=new Map(),errors=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const until=async expression=>{for(let i=0;i<160;i++){if(await evaluate(expression))return;await wait(200);}throw Error('Timeout: '+expression+' '+errors.join('\n')+' '+JSON.stringify(await evaluate('({url:location.href,ready:document.readyState,text:document.body?.innerText.slice(0,400)})')));};

 await send('Runtime.enable');await send('Page.enable');
 for(const mobile of [false,true]){
 await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1280,height:mobile?844:800,deviceScaleFactor:1,mobile});
 await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
 for(const game of ['chess','memory','basketball','cans','shooting-range','maze','pickleball']){
 await send('Page.navigate',{url:base+'/games/'+game+'/index.html'});
 await until('document.querySelector(".play-guide")?.open');
 assert.equal(await evaluate('document.querySelector(".guide-controls h2 span").textContent'),mobile?'Touch':'Keyboard & mouse');
 assert.ok(await evaluate('document.querySelector(".play-guide").scrollWidth<=document.querySelector(".play-guide").clientWidth+1'));
 assert.equal(await evaluate('window.started=false;window.PlayGuide.before(()=>window.started=true)'),false);
 assert.equal(await evaluate('window.started'),false);
 assert.equal(await evaluate('document.querySelector(".play-guide").scrollTop'),0);
 if(game==='pickleball'){
 const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/guide-'+(mobile?'phone':'desktop')+'.png',Buffer.from(shot.data,'base64'));
 }
 await evaluate('document.querySelector(".guide-start").click()');assert.equal(await evaluate('window.started'),true);
 assert.equal(await evaluate('!!document.querySelector(".play-guide")'),false);
 if(game==='pickleball'){
 await until('!!window.GameEconomy');await evaluate('document.querySelector("[data-a=play]").click();document.querySelector("[data-a=go]").click()');await until('!document.querySelector("#hud").hidden');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("#tc")).display!=="none"'),mobile);
 }
 console.log('PASS '+game+' '+(mobile?'touch':'desktop'));
 }
 }
 assert.deepEqual(errors,[]);await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();server.closeAllConnections();await new Promise(r=>server.close(r));}
