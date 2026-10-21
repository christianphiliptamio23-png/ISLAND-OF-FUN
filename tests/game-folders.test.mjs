import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
test('all local game module imports, stylesheets and supplied artwork resolve after moving',()=>{
  const pending=[new URL('src/core/Game.js',root)],seen=new Set();
  while(pending.length){
    const url=pending.pop();if(seen.has(url.href))continue;seen.add(url.href);
    assert(fs.existsSync(url),'Missing module '+url.pathname);
    const text=fs.readFileSync(url,'utf8');
    for(const match of text.matchAll(/(?:from\s*|import\s*\()(['"])(\.[^'"]+)\1/g))pending.push(new URL(match[2],url));
  }
  const html=fs.readFileSync(new URL('game.html',root),'utf8');
  for(const match of html.matchAll(/(?:href|src)="(\.\/[^"?]+)"/g))assert(fs.existsSync(new URL(match[1],root)),match[1]);
  for(const game of ['memory','cans','pickleball','chess','basketball','maze','shooting-range']){
    const entry=new URL(`games/${game}/index.html`,root);assert(fs.existsSync(entry));
    const text=fs.readFileSync(entry,'utf8');
    for(const match of text.matchAll(/(?:backdrop|backgroundImage|suppliedBg)\.src=['"]([^'"]+)/g))assert(fs.existsSync(new URL(match[1],entry)),match[1]);
  }
  for(const folder of ['memory','chess','basketball','maze','shooting-range'])assert(fs.existsSync(new URL(`games/${folder}/style.css`,root)));
});
