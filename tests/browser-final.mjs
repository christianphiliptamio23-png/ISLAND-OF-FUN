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
 await send('Runtime.enable');await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:base+'/menu/index.html'});await until('!!document.querySelector("#menu-account")');assert.equal(await evaluate('!!document.querySelector(".download-apk")'),false);
 if(!process.argv.includes('--minigames-only')){
 await send('Page.navigate',{url:base+'/game.html'});await until('!!document.querySelector(".island-emotes")');await evaluate('import("/src/core/Game.js").then(m=>{window.testGame=m.game;return true})');await until('testGame.state.is("EXPLORATION")');
 await evaluate('testGame.emotes.ui.open=true');await wait(200);assert.equal(await evaluate('document.querySelectorAll("[data-emote^=\\"buy:\\"]").length'),4);
 const before=await evaluate('testGame.save.profiles.profile.coins');await evaluate('document.querySelector("[data-emote=\\"buy:1\\"]").click()');assert.equal(await evaluate('testGame.save.profiles.profile.coins'),before-50);assert.equal(await evaluate('testGame.save.profiles.profile.inventory.includes("emote-1")'),true);
 await evaluate('testGame.save.data.settings.graphics="LOW";testGame.resize();IslandTime.choose("night")');await until('testGame.lighting[1].night>.5');assert.equal(await evaluate('IslandTime.phase'), 'night');
 await evaluate('testGame.emotes.play("1")');await until('testGame.emotes.kind==="1"');assert.equal(await evaluate('testGame.follow.distance'),6.5);await evaluate('testGame.emotes.stop()');
 await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true});await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:2});await wait(300);
 assert.ok(await evaluate('!document.querySelector("#mobile-controls").hidden'));
 for(const selector of ['#move-stick','[data-touch="run"]','[data-touch="jump"]','.island-emotes summary'])assert.ok(await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return r.left>=0&&r.top>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight+1})()`),selector);
 const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/final-phone.png',Buffer.from(screenshot.data,'base64'));
 }
 await send('Page.navigate',{url:base+'/games/pickleball/index.html'});await until('!!window.GameEconomy');await until('!!document.querySelector("[data-a=play]")');await evaluate('document.querySelector("[data-a=play]").click();document.querySelector("[data-a=go]").click()');await until('!document.querySelector("#hud").hidden');await wait(600);
 assert.ok(await evaluate('document.querySelector("#joy").getBoundingClientRect().width>=110'));assert.ok(await evaluate('document.querySelector("#bh").getBoundingClientRect().width>=60'));assert.ok(await evaluate('document.querySelector(".economy-dock").getBoundingClientRect().top<20'));
 let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/pickleball-final.png',Buffer.from(shot.data,'base64'));
 await send('Page.navigate',{url:base+'/games/basketball/index.html'});await until('!!window.GameEconomy');await until('!!document.querySelector("[data-a=levels]")');await evaluate('document.querySelector("[data-a=levels]").click();document.querySelector("[data-a=L0]").click()');await until('!document.querySelector("#hud").hidden');await wait(500);
 assert.ok(await evaluate('document.querySelector(".economy-toast").getBoundingClientRect().height<80'));
 shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/basketball-final.png',Buffer.from(shot.data,'base64'));
 assert.deepEqual(errors,[]);console.log('PASS: web-only menu, real emote purchase and playback, night transition, mobile landscape control bounds.');
 await send('Browser.close').catch(()=>{});
}finally{ws?.close();chrome.kill();server.closeAllConnections();await new Promise(r=>server.close(r));}
