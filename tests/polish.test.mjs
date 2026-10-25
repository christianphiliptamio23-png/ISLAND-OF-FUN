import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../games/shared/polish.js',import.meta.url),'utf8');
function environment(reduced){
  const nodes=[];
  const context={window:{},location:{pathname:'/games/chess/index.html'},innerWidth:800,innerHeight:600,matchMedia:()=>({matches:reduced}),setTimeout:()=>1,clearTimeout(){},document:{hidden:false,addEventListener(){},body:{append(){}},createElement(){const node={style:{},children:[],setAttribute(){},append(n){this.children.push(n);},get childElementCount(){return this.children.length},animate(){return {};}};nodes.push(node);return node;}}};
  vm.runInNewContext(source,context);return {api:context.window.MiniFX,nodes};
}
test('results track session wins, reset current streak on loss, and preserve best streak',()=>{
  const {api}=environment(true);api.result(true);api.result(true);api.result(false);api.result(true);
  assert.equal(api.stats.wins,3);assert.equal(api.stats.streak,1);assert.equal(api.stats.best,2);
});
test('reduced motion suppresses particles and repeated celebrations stay bounded',()=>{
  const quiet=environment(true);quiet.api.result(true);assert.equal(quiet.nodes.length,2);
  const active=environment(false);active.api.result(true);active.api.result(true);
  assert.equal(active.nodes[0].childElementCount,48);
});
