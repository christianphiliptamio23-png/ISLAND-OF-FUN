import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfileStore} from '../src/core/ProfileStore.js';
class Storage{values=new Map();getItem(k){return this.values.get(k)??null}setItem(k,v){this.values.set(k,String(v))}removeItem(k){this.values.delete(k)}}
test('emote purchases deduct exact prices, persist, and reject duplicate or invalid spending',()=>{
 const local=new Storage(),session=new Storage(),store=new ProfileStore(local,session);
 store.buy('emote-1');assert.equal(store.profile.coins,100);assert.ok(store.profile.inventory.includes('emote-1'));
 assert.throws(()=>store.buy('emote-1'),/Already owned/);assert.equal(store.profile.coins,100);
 assert.throws(()=>store.buy('emote-4'),/Not enough/);assert.throws(()=>store.buy('emote-99'),/not found/);assert.equal(store.profile.coins,100);
 const again=new ProfileStore(local,session);assert.ok(again.profile.inventory.includes('emote-1'));again.buy('emote-2');assert.equal(again.profile.coins,0);
});
