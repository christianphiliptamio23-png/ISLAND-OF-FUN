import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || (process.env.PORT ? '0.0.0.0' : '127.0.0.1');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.gif':'image/gif','.mp4':'video/mp4','.glb':'model/gltf-binary','.fbx':'application/octet-stream','.wasm':'application/wasm'};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname === '/health') {
      res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
      res.end('island-of-fun');
      return;
    }
    const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, '');
    const safePath = requestedPath || 'menu/index.html';
    const file = resolve(root, safePath);
    if (!file.startsWith(root)) throw new Error('outside root');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    if(extname(file).toLowerCase()==='.mp4' && req.headers.range){
      const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start=match?.[1]?Number(match[1]):0;
      let end=match?.[2]?Number(match[2]):info.size-1;
      if(match&&!match[1]&&match[2]){start=Math.max(0,info.size-Number(match[2]));end=info.size-1;}
      end=Math.min(end,info.size-1);
      if(!match||start>end||start>=info.size){res.writeHead(416,{'Content-Range':'bytes */'+info.size});res.end();return;}
      res.writeHead(206,{'Content-Type':'video/mp4','Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${info.size}`,'Content-Length':end-start+1});
      res.end(req.method==='HEAD'?undefined:(await readFile(file)).subarray(start,end+1));return;
    }
    res.writeHead(200, {'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream','Content-Length':info.size,'Accept-Ranges':'bytes'});
    res.end(req.method==='HEAD'?undefined:await readFile(file));
  } catch {
    res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'});
    res.end('Not found');
  }
}).listen(port, host, () => console.log(`Island of Fun is running on ${host}:${port}`));
