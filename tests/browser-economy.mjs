import fs from 'node:fs';
import assert from 'node:assert/strict';
const tabs=await(await fetch('http://127.0.0.1:9223/json')).json();
const ws=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
let serial=0;const pending=new Map(),errors=[];
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
await send('Runtime.enable');await send('Page.enable');
const waitFor=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,100));}throw Error('Timed out: '+expression+' '+errors.join('\n'));};
try{
 for(const mobile of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1366,height:mobile?844:768,deviceScaleFactor:1,mobile});
  await send('Emulation.setTouchEmulationEnabled',{enabled:mobile});
  for(const game of ['chess','basketball','shooting-range','cans','memory','maze','pickleball']){
   errors.length=0;await send('Page.navigate',{url:'http://127.0.0.1:8080/games/'+game+'/index.html'});
   await waitFor('!!window.GameEconomy && !document.querySelector("#economy-loading")');
   assert.equal(await evaluate('document.querySelector(".economy-dock").getBoundingClientRect().right <= innerWidth'),true);
   await evaluate('document.querySelector(".economy-dock").open=true;document.querySelector("[data-levels]").click()');
   assert.equal(await evaluate('document.querySelectorAll(".economy-levels button").length'),10);
   await evaluate('document.querySelector(".economy-levels button").click()');
   // Can Knockdown needs the existing external physics package to finish loading.
   if(game==='cans'){await new Promise(r=>setTimeout(r,2500));await evaluate('document.querySelector("[data-levels]").click();document.querySelector(".economy-levels button").click()');}
   assert.equal(await evaluate(`!!window.GameEconomy.profile().economy.attempts[${JSON.stringify(game)}]`),true,game+' started');
   assert.equal(errors.length,0,game+': '+errors.join('\n'));
   console.log('PASS',mobile?'phone':'desktop',game,'wallet, level gate, start, no runtime errors');
   if(mobile&&game==='chess'){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/chess-phone.png',Buffer.from(shot.data,'base64'));}
  }
 }
}finally{ws.close();}
