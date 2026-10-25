import test from 'node:test';import assert from 'node:assert/strict';
import {createGameServer,publicPath} from '../server.mjs';
test('web-only server protects private files and removed online/APK routes',()=>{
 for(const p of ['/.git/config','/.env','/backend/api.mjs','/android/app/build.gradle','/scripts/setup-android-signing.ps1','/../server.mjs','/%2e%2e/server.mjs','/assets/../../.env','/assets\\..\\.env','/api/leaderboard','/api/apk'])assert.equal(publicPath(p),null,p);
 assert.ok(publicPath('/game.html'));assert.ok(publicPath('/assets/vendor/three.min.js'));
});
test('web-only static files and range responses work without database dependencies',async()=>{
 const server=createGameServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{let r=await fetch(base+'/api/leaderboard');assert.equal(r.status,404);r=await fetch(base+'/.git/config');assert.equal(r.status,404);r=await fetch(base+'/game.html',{headers:{Range:'bytes=0-9'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,10);r=await fetch(base+'/api/apk');assert.equal(r.status,404);}finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
