import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import {resolve,normalize,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('.',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.mp4':'video/mp4','.glb':'model/gltf-binary','.fbx':'application/octet-stream','.wasm':'application/wasm'};
export function publicPath(pathname){
 let decoded;try{decoded=decodeURIComponent(pathname);}catch{return null;}
 if(decoded.includes('\\')||decoded.includes('\0')||decoded.split('/').some(x=>x==='..'||x.startsWith('.')))return null;
 const path=normalize(decoded).split(sep).join('/').replace(/^[/\\]+/,'')||'menu/index.html';
 if(!/^(assets|games|menu|src|styles)\//.test(path)&&!['game.html','manifest.webmanifest'].includes(path))return null;
 const target=resolve(root,path);return target.startsWith(root+sep)?target:null;
}
export function createGameServer(){
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'text/plain'});res.end('island-of-fun');return;}
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   const file=publicPath(url.pathname);if(!file)throw Error('private path');const info=await stat(file);if(!info.isFile())throw Error('not a file');
   const ext=extname(file).toLowerCase();const headers={'Content-Type':types[ext]||'application/octet-stream','Content-Length':info.size,'Accept-Ranges':'bytes','Cache-Control':['.html','.js','.mjs','.css','.json'].includes(ext)?'no-cache':'public, max-age=3600'};
   let start=0,end=info.size-1,status=200;
   if(req.headers.range){const m=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);start=m?.[1]?Number(m[1]):0;end=m?.[2]?Number(m[2]):end;if(m&&!m[1]&&m[2]){start=Math.max(0,info.size-Number(m[2]));end=info.size-1;}end=Math.min(end,info.size-1);if(!m||(!m[1]&&!m[2])||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}status=206;headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;headers['Content-Length']=end-start+1;}
   res.writeHead(status,headers);if(req.method==='HEAD'){res.end();return;}createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  }catch{if(!res.headersSent)res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
 });
 return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||8080),host=process.env.HOST||(process.env.PORT?'0.0.0.0':'127.0.0.1');createGameServer().listen(port,host,()=>console.log(`Island of Fun is running on ${host}:${port}`));
}
