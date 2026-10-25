import test from 'node:test';
import assert from 'node:assert/strict';
import {ProfileStore} from '../src/core/ProfileStore.js';
import {GAMES,COSTS,REWARDS} from '../src/core/Economy.js';
class Storage{map=new Map();getItem(k){return this.map.get(k)??null}setItem(k,v){this.map.set(k,String(v))}removeItem(k){this.map.delete(k)}}
function setup(){const local=new Storage(),session=new Storage();let day=new Date(2026,9,22,12);const p=new ProfileStore(local,session,()=>new Date(day));return {p,local,session,advance(n=1){day.setDate(day.getDate()+n)}};}
test('new wallets and all 70 sequential paid unlocks, first clears and Champion',()=>{
 const {p,advance}=setup();assert.equal(p.profile.coins,150);assert.equal(p.profile.tickets,2);assert.equal(p.profile.tokens,0);assert.equal(p.profile.gems,undefined);
 for(const game of Object.keys(GAMES)){
  assert.throws(()=>p.beginAttempt(game,2),/Unlock/);assert.throws(()=>p.unlock(game,2),/previous/);
  for(let n=1;n<=10;n++){if(n>1){while(p.profile.coins<COSTS[n-1]){advance();p.claimDaily();}const before=p.profile.coins;p.unlock(game,n);assert.equal(p.profile.coins,before-COSTS[n-1]);assert.equal(p.unlock(game,n),false);}const id=p.beginAttempt(game,n);assert.equal(p.finishAttempt(game,id).coins,REWARDS[n-1]);assert.equal(p.finishAttempt(game,id).coins,0);const beforeReplay=p.profile.coins,replay=p.beginAttempt(game,n),reward=n===1?30:2*COSTS[n-1];assert.equal(p.finishAttempt(game,replay).coins,reward);assert.equal(p.profile.coins,beforeReplay+reward);assert.equal(p.finishAttempt(game,replay).coins,0);}
 }
 assert.equal(Object.values(p.profile.progress).reduce((n,g)=>n+g.cleared.length,0),70);assert(p.profile.economy.achievements.includes('champion'));assert(p.profile.inventory.includes('champion'));
 const tokens=p.profile.tokens;p.awardBadges(p.profile);assert.equal(p.profile.tokens,tokens);
});
test('every replay win pays the full reward; duplicate and stale claims remain blocked',()=>{
 const {p,advance}=setup();const id=p.beginAttempt('chess',1);p.finishAttempt('chess',id);
 assert.equal(p.finishAttempt('chess',p.beginAttempt('chess',1)).coins,30);assert.equal(p.finishAttempt('chess',p.beginAttempt('chess',1)).coins,30);
 advance();assert.equal(p.finishAttempt('chess',p.beginAttempt('chess',1)).coins,30);assert.equal(p.finishAttempt('chess',p.beginAttempt('chess',1)).coins,30);
 assert.throws(()=>p.finishAttempt('chess',id),/no longer/);
});
test('retry charges only on success, caps at three, rejects completed and stale attempts',()=>{
 const {p}=setup();p.change(x=>x.tickets=8);const id=p.beginAttempt('maze',1);
 assert.throws(()=>p.retry('maze',id,()=>false),/No valid/);assert.equal(p.profile.tickets,8);
 assert.throws(()=>p.retry('maze',id,()=>{throw Error('restore failed')}),/failed/);assert.equal(p.profile.tickets,8);
 for(let i=0;i<3;i++)assert.equal(p.retry('maze',id,()=>true),i+1);
 assert.equal(p.profile.tickets,5);assert.throws(()=>p.retry('maze',id,()=>true),/Three/);
 const next=p.beginAttempt('maze',1);assert.throws(()=>p.retry('maze',id,()=>true),/No active/);p.finishAttempt('maze',next);assert.throws(()=>p.retry('maze',next,()=>true),/No active/);
});
test('shop prices, repeatable ticket packs, ownership and no negative balances',()=>{
 const {p}=setup();p.buy('ticket-1');assert.equal(p.profile.coins,50);assert.equal(p.profile.tickets,3);assert.throws(()=>p.buy('ticket-3'),/Not enough/);assert.equal(p.profile.coins,50);
 p.buy('flowers');assert.equal(p.profile.coins,20);assert.throws(()=>p.buy('flowers'),/Already/);p.equip('flowers');assert.equal(p.profile.avatar,'🌷');assert.throws(()=>p.equip('hat'),/not owned/);
 p.change(x=>{x.coins=540;x.tokens=5});p.buy('ticket-3');p.buy('ticket-3');assert.equal(p.profile.coins,0);assert.equal(p.profile.tickets,9);p.buy('dragon');assert.equal(p.profile.tokens,0);assert.throws(()=>p.buy('dolphin'),/Not enough/);
 assert.throws(()=>p.sendGift(),/disabled/);assert.equal(p.profile.coins,0);
});
test('daily cycle, daily and weekly quests, metrics deduplicate across retries',()=>{
 const {p,advance}=setup();for(let i=1;i<=7;i++){p.claimDaily();assert.equal(p.profile.economy.login,i);assert.throws(()=>p.claimDaily(),/Already/);advance();}p.claimDaily();assert.equal(p.profile.economy.login,1);advance(2);p.claimDaily();assert.equal(p.profile.economy.login,1);
 const id=p.beginAttempt('basketball',1);for(let i=1;i<=3;i++){p.metric('basketball',id,'baskets',i);p.metric('basketball',id,'baskets',i);}assert.equal(p.questList().find(q=>q.id==='basket').value,3);p.claimTask('basket');assert.throws(()=>p.claimTask('basket'),/already/);
 p.finishAttempt('basketball',id);for(const g of ['chess','cans','memory','maze'])p.finishAttempt(g,p.beginAttempt(g,1));assert.equal(p.questList().find(q=>q.id==='weekly').value,5);p.claimTask('weekly');advance();assert.equal(p.questList().find(q=>q.id==='basket').value,0);
});
test('migration preserves legacy progress and currencies without re-awarding first clears',()=>{
 const {p,local,session}=setup();const db=JSON.parse(local.getItem('island-of-fun-profiles-v1')),old=db.profiles[p.profile.id];delete old.economy;delete old.progress;delete old.tokens;old.gems=4;old.coins=900;old.basketball={unlocked:4,cleared:[1,2,3],bestScores:{1:3}};
 local.setItem('islandCanKnockdown',JSON.stringify({u:3,st:{0:3,1:2}}));local.setItem('island-of-fun-profiles-v1',JSON.stringify(db));
 const next=new ProfileStore(local,session);assert.equal(next.profile.coins,900);assert.equal(next.profile.gems,undefined);assert(next.profile.tokens>=4);assert.deepEqual(next.profile.progress.basketball.cleared,[1,2,3]);assert(next.profile.progress.cans.paid.includes(3));
 // Existing cleared levels receive the new win reward on each new attempt.
 assert.equal(next.finishAttempt('basketball',next.beginAttempt('basketball',1)).coins,30);assert.equal(next.finishAttempt('basketball',next.beginAttempt('basketball',1)).coins,30);
 next.createAccount('Saved Player');const profile=next.profile;assert.deepEqual(new ProfileStore(local,new Storage()).profile.progress,profile.progress);
 next.createAccount('Fresh Player');assert.equal(next.profile.coins,150);assert.deepEqual(next.profile.progress.cans.paid,[1]);
});
