import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
test('day and night blend smoothly, with night-only moon, stars and lantern glow',()=>{
 const context={console};context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),context);context.IslandTime={phase:'day'};
 vm.runInContext(fs.readFileSync(new URL('../src/world/TropicalLighting.js',import.meta.url),'utf8').replace('export const','const').replace('export class','class')+';globalThis.Lighting=TropicalLighting;',context);
 const light=new context.Lighting(new context.THREE.Scene());light.addLanterns({terrainModel:{},terrainHitAt:()=>({point:{y:2}})});light.update(0);assert.equal(light.moon.material.opacity,0);assert.equal(light.sunOrb.material.opacity,1);
 context.IslandTime.phase='night';light.update(.1);assert.ok(light.night>0&&light.night<.2);for(let i=0;i<100;i++)light.update(.1);
 assert.ok(light.stars.material.opacity>.99);assert.ok(light.lanterns[0].light.intensity>1);assert.equal(light.lanterns[0].group.position.y,2);
 context.IslandTime.phase='day';for(let i=0;i<120;i++)light.update(.1);assert.ok(light.moon.material.opacity<.001);assert.ok(light.lanterns[0].light.intensity<.001);
});
