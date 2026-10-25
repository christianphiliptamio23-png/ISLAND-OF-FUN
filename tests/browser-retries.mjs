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

const hooks={
 basketball:"window.retryProbe=()=>{const before=structuredClone(L);takeShot(0,0);L.ball=null;mode='lose';const ok=GameEconomy.retry();return {ok,restored:L.left===before.left&&L.score===before.score&&L.ball===null};};",
 'shooting-range':"window.retryProbe=()=>{scr='play';now+=1000;const before=structuredClone(S);shoot(0,0);const ok=GameEconomy.retry();return {ok,restored:S.ammo===before.ammo&&S.shots===before.shots&&JSON.stringify(S.tg)===JSON.stringify(before.tg)};};",
 memory:"window.retryProbe=()=>{cancelAll();G.state='first';G.cards.forEach(c=>flip(c,false));const a=0,b=G.cards.findIndex(c=>c.sym.key!==G.cards[a].sym.key);pick(a);pick(b);const ok=GameEconomy.retry();return {ok,restored:G.moves===0&&G.pairs===0&&!G.cards[a].up&&!G.cards[b].up&&G.state==='first'};};",
 maze:"window.retryProbe=()=>{const before=structuredClone(S);const d=D.findIndex(d=>S.g[S.y*S.n+S.x]&d[2]);S.lastMove=-1000;move(d);const ok=GameEconomy.retry();return {ok,restored:S.x===before.x&&S.y===before.y&&S.moves===before.moves&&JSON.stringify(S.stars)===JSON.stringify(before.stars)};};",
 chess:"window.retryProbe=()=>{const before=toFEN(G.pos);doMove(G.pos.legal()[0],false);G.tok++;Eng.cancel();G.busy=false;doMove(G.pos.legal()[0],false);const ok=GameEconomy.retry();return {ok,restored:toFEN(G.pos)===before&&G.sans.length===0&&!G.busy};};",
 cans:"window.retryProbe=()=>{S.ph='aim';cam=0;drag={x:AX-80,y:AY+40};const before={balls:S.balls,x:S.cans[0].position.x,y:S.cans[0].position.y};launch();Body.setPosition(S.cans[0],{x:900,y:900});S.cans[0].ko=1;S.ph='aim';const ok=GameEconomy.retry();return {ok,restored:S.balls===before.balls&&S.cans[0].position.x===before.x&&S.cans[0].position.y===before.y&&!S.cans[0].ko};};",
 pickleball:"window.retryProbe=()=>{const before=structuredClone(M);M.ev=[{t:'start'}];M.state='rally';endRally(M,1,'lost');handle();const ok=GameEconomy.retry();return {ok,restored:JSON.stringify(M.score)===JSON.stringify(before.score)&&M.state==='serve'&&M.server===before.server};};"
};
ws.addEventListener('message',async e=>{const m=JSON.parse(e.data);if(m.method!=='Fetch.requestPaused')return;try{const game=new URL(m.params.request.url).pathname.split('/')[2];let html=fs.readFileSync('games/'+game+'/index.html','utf8');html=html.replace("window.addEventListener('economy-ready'",hooks[game]+"window.addEventListener('economy-ready'");await send('Fetch.fulfillRequest',{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html; charset=utf-8'}],body:Buffer.from(html).toString('base64')});}catch(error){console.error(error);}});
await send('Fetch.enable',{patterns:[{urlPattern:'*games/*/index.html*',resourceType:'Document',requestStage:'Request'}]});
try{
 for(const game of Object.keys(hooks)){
  errors.length=0;await send('Page.navigate',{url:'http://127.0.0.1:8080/games/'+game+'/index.html'});await waitFor('!!window.GameEconomy && !!window.retryProbe');
  await evaluate(`(()=>{const key='island-of-fun-profiles-v1',db=JSON.parse(localStorage.getItem(key));db.profiles[GameEconomy.profile().id].tickets=10;localStorage.setItem(key,JSON.stringify(db));document.querySelector('[data-levels]').click();document.querySelector('.economy-levels button').click();})()`);
  if(game==='cans'){await new Promise(r=>setTimeout(r,2500));await evaluate('document.querySelector("[data-levels]").click();document.querySelector(".economy-levels button").click()');}
  const result=await evaluate('retryProbe()');assert.equal(result.ok,true,game+' retry');assert.equal(result.restored,true,game+' restores full state');assert.equal(await evaluate('GameEconomy.profile().tickets'),9);assert.equal(await evaluate('GameEconomy.retry()'),false);assert.equal(await evaluate('GameEconomy.profile().tickets'),9);
  assert.equal(errors.length,0,errors.join('\n'));console.log('PASS actual browser restore:',game,'and no double-charge');
 }
}finally{await send('Fetch.disable');ws.close();}
