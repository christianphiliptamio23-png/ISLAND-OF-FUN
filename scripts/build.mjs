import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,'dist');
// Only this generated directory may be replaced; never delete a supplied path.
if(path.dirname(output)!==root||path.basename(output)!=='dist')throw Error('Unsafe output path');
console.log('Building static game in '+output);
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
for(const name of ['assets','games','menu','src','styles','game.html','manifest.webmanifest'])fs.cpSync(path.join(root,name),path.join(output,name),{recursive:true});
fs.writeFileSync(path.join(output,'index.html'),'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/menu/index.html"><a href="/menu/index.html">Open Island of Fun</a>');
let bytes=0,files=0;
function scan(folder){for(const entry of fs.readdirSync(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())scan(p);else{bytes+=fs.statSync(p).size;files++;}}}
scan(output);console.log(`${files} deployment files, ${(bytes/1024/1024).toFixed(2)} MiB. Test profiles, screenshots, and local server tools excluded.`);
