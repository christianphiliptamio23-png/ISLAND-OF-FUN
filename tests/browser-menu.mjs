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
 await send('Page.navigate',{url:'http://127.0.0.1:8080/menu/index.html'});await waitFor('!!document.querySelector("#menu-account")');
 await evaluate('localStorage.clear();sessionStorage.clear();location.reload()');await new Promise(r=>setTimeout(r,500));await waitFor('!!document.querySelector("#menu-account")');
 for(const mobile of [false,true]){
  await send('Emulation.setDeviceMetricsOverride',{width:mobile?390:1366,height:mobile?844:768,deviceScaleFactor:1,mobile});
  await evaluate('document.querySelector("#logo-intro")?.remove();document.querySelector("[data-msg=Shop]").click()');
  for(const page of ['quests','daily','passport','achievements','gifts','inventory','shop']){await evaluate(`document.querySelector('[data-econ="page:${page}"]').click()`);assert.equal(await evaluate('document.querySelector(".menu-modal").hidden'),false);}
  if(!mobile){
   await evaluate(`document.querySelector('[data-econ="preview:flowers"]').click()`);assert.equal(await evaluate('document.querySelector("#menu-panel-title").textContent'),'Confirm purchase');
   await evaluate(`document.querySelector('[data-econ="buy:flowers"]').click()`);
   assert.equal(await evaluate('JSON.parse(localStorage.getItem("island-of-fun-profiles-v1")).profiles[sessionStorage.getItem("island-of-fun-guest-id")].coins'),120);
   await evaluate(`document.querySelector('[data-econ="page:inventory"]').click();document.querySelector('[data-econ="equip:flowers"]').click()`);
   assert.equal(await evaluate('document.querySelector(".avatar").textContent'),'🌷');
  }
  await evaluate(`document.querySelector('[data-econ="page:gifts"]').click()`);assert.equal(await evaluate(`document.querySelector('[data-econ="send"]').disabled`),true);
  assert.equal(await evaluate('document.querySelector(".menu-panel").getBoundingClientRect().right <= innerWidth+1'),true);
  if(mobile){const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('.browser-test/gift-preview-phone.png',Buffer.from(shot.data,'base64'));}
  console.log('PASS',mobile?'phone':'desktop','shop, purchase confirmation, inventory, quests, login, achievements, passport, gift preview');
 }
 assert.equal(errors.length,0,errors.join('\n'));
}finally{ws.close();}
