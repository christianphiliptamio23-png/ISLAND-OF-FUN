import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfileStore,QUESTS} from '../src/core/ProfileStore.js';

class MemoryStorage {
  values=new Map();
  getItem(key){return this.values.get(key)??null}
  setItem(key,value){this.values.set(key,String(value))}
  removeItem(key){this.values.delete(key)}
}
function setup(){const local=new MemoryStorage(),session=new MemoryStorage();let day=new Date(2026,9,21,12);return {local,session,store:new ProfileStore(local,session,()=>day),nextDay(){day=new Date(2026,9,22,12)}}}

test('guest names persist through Play and reload but fresh guest sessions get separate profiles',()=>{
  const {store,local,session}=setup(),guest=store.profile;
  assert(guest.guest);assert.match(guest.name,/^[A-Za-z]+\d{3}$/);
  assert.equal(new ProfileStore(local,session).profile.id,guest.id);
  const other=new ProfileStore(local,new MemoryStorage());
  assert.notEqual(other.profile.id,guest.id);
  assert.equal(new ProfileStore(local,session).profile.id,guest.id);
});

test('Create Account transfers guest rewards, inventory and progress and survives another session',()=>{
  const {store,local}=setup();store.claimDaily();store.recordPlay();store.recordVisit('chess');store.buy('fox');const guest=store.profile;
  const account=store.createAccount('Island Player');
  assert.equal(account.guest,false);assert.equal(account.coins,guest.coins);assert.equal(account.avatar,'🦊');assert.deepEqual(account.visits,['chess']);
  assert.equal(new ProfileStore(local,new MemoryStorage()).profile.id,account.id);
  assert.throws(()=>store.createAccount('island player'),/already exists/);
  assert.throws(()=>store.createAccount('<bad>'),/3–24/);
});

test('accounts keep separate balances and a new account cannot clone an existing account balance',()=>{
  const {store}=setup();const first=store.createAccount('First Player');store.claimDaily();const firstCoins=store.profile.coins;
  const second=store.createAccount('Second Player');assert.equal(second.coins,250);
  store.selectAccount(first.id);assert.equal(store.profile.coins,firstCoins);
  store.useGuest();assert(store.profile.guest);assert.equal(store.profile.coins,250);
  store.selectAccount(second.id);assert.equal(store.profile.name,'Second Player');
});

test('daily and welcome gifts cannot be claimed twice and daily gift resets tomorrow',()=>{
  const {store,nextDay}=setup();store.claimDaily();assert.equal(store.profile.coins,350);assert.equal(store.profile.tickets,2);assert.equal(store.profile.gems,1);
  assert.throws(()=>store.claimDaily(),/already/);assert.equal(store.profile.coins,350);
  store.claimMail();assert.equal(store.profile.coins,400);assert.throws(()=>store.claimMail(),/already/);
  nextDay();store.claimDaily();assert.equal(store.profile.coins,500);
});

test('quests and daily events require real exploration and award once',()=>{
  const {store,nextDay}=setup();assert.throws(()=>store.claimQuest('explore'),/Complete/);assert.throws(()=>store.claimEvent(),/three/);
  store.recordPlay();store.claimQuest('explore');assert.throws(()=>store.claimQuest('explore'),/already/);
  store.recordVisit('chess');store.recordVisit('chess');assert.equal(store.profile.dailyVisits.ids.length,1);
  store.recordVisit('memory');store.recordVisit('target');store.claimQuest('visit');store.claimDaily();store.claimQuest('gift');
  assert(QUESTS.every(q=>store.profile.claims.includes(q.id)));store.claimEvent();assert.throws(()=>store.claimEvent(),/already/);
  nextDay();assert.throws(()=>store.claimEvent(),/three/);store.recordVisit('chess');assert.equal(store.profile.dailyVisits.ids.length,1);
});

test('shop validates funds, prevents duplicate purchases and equips only owned avatars',()=>{
  const {store}=setup();store.buy('fox');assert.equal(store.profile.coins,175);assert.equal(store.profile.avatar,'🦊');
  assert.throws(()=>store.buy('fox'),/already/);assert.equal(store.profile.coins,175);
  assert.throws(()=>store.buy('crown'),/Not enough/);assert.equal(store.profile.coins,175);
  assert.throws(()=>store.equip('panda'),/not owned/);store.equip('default');assert.equal(store.profile.avatar,'🎪');store.equip('fox');assert.equal(store.profile.avatar,'🦊');
});

test('friend cards round-trip without accepting arbitrary names or duplicate contacts',()=>{
  const a=setup().store,b=setup().store;a.createAccount('Player One');b.createAccount('Player Two');
  a.addFriend(b.friendCard());assert.equal(a.profile.friends[0].name,'Player Two');assert.throws(()=>a.addFriend(b.friendCard()),/already/);
  assert.throws(()=>a.addFriend(a.friendCard()),/own/);assert.throws(()=>a.addFriend('bad'),/player card/);
  assert.throws(()=>a.addFriend('IOF:'+encodeURIComponent(JSON.stringify({name:'<script>'}))),/player card/);
});

test('settings and game saves share the active account without discarding menu progress',()=>{
  const {store,local,session}=setup();store.createAccount('Game Player');store.settings({master:0,sensitivity:1.5,graphics:'LOW'});store.recordVisit('chess');
  const inGame=new ProfileStore(local,session);assert.equal(inGame.profile.settings.master,0);assert.equal(inGame.profile.settings.graphics,'LOW');
  inGame.updateGame({coins:300,tickets:4,settings:{sensitivity:1.8}});
  assert.equal(store.profile.coins,300);assert.deepEqual(store.profile.visits,['chess']);assert.equal(store.profile.settings.sensitivity,1.8);
  const legacy=JSON.parse(local.getItem('island-of-fun-v2'));assert.equal(legacy.username,'Game Player');assert.equal(legacy.coins,300);
});
