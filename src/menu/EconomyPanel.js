import {CATALOG,GAMES,COSTS,DAILY} from '../core/Economy.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const action=(a,label,disabled=false)=>`<button data-econ="${esc(a)}" ${disabled?'disabled':''}>${label}</button>`;
const rewards=r=>[['coins','Fun Coins'],['tickets','Retry Tickets'],['tokens','Prize Tokens']].filter(([k])=>r[k]).map(([k,n])=>`${r[k]} ${n}`).join(' · ');
export function economyPanel(store,panel,refresh){
 let current='shop',tab='Gifts';
 const show=(page='shop',choice)=>{
  current=page;if(choice)tab=choice;const p=store.profile;
  const nav=`<nav class="economy-nav">${[['shop','Shop'],['inventory','Inventory'],['quests','Quest Board'],['daily','Daily Login'],['passport','Passport'],['achievements','Achievements'],['gifts','Gift Inbox']].map(([id,n])=>action('page:'+id,n)).join('')}</nav>`;
  let content='',title='Carnival '+page;
  if(page==='shop'){
   title='Carnival Shop';content=`<nav class="economy-nav">${['Gifts','Accessories','Ticket Counter','Exclusive Prizes'].map(t=>action('tab:'+t,t)).join('')}</nav><p>Cosmetics equip on your player card. 3D character accessories are not supported yet.</p><div class="menu-shop">${CATALOG.filter(i=>i.tab===tab).map(i=>`<article class="menu-item"><span class="menu-shop-icon" aria-label="${esc(i.name)} preview">${i.icon}</span><h3>${i.name}</h3><p>${i.cost} ${i.currency==='tokens'?'Prize Tokens':'Fun Coins'}</p>${action('preview:'+i.id,p.inventory.includes(i.id)&&!i.tickets?'Owned':'Preview & buy',p.inventory.includes(i.id)&&!i.tickets)}</article>`).join('')}</div>`;
  }else if(page==='inventory'){
   title='Inventory';content=`<p>Equip a cosmetic on your player card.</p>${action('equip:default','🎪 Island Explorer')}<div class="menu-shop">${p.inventory.map(id=>{const i=CATALOG.find(i=>i.id===id)||(id==='champion'?{id,name:'Island of Fun Champion',icon:'🏆'}:null);return i?`<article class="menu-item"><span class="menu-shop-icon">${i.icon}</span><h3>${i.name}</h3>${action('equip:'+id,p.avatar===i.icon?'Equipped':'Equip',p.avatar===i.icon)}</article>`:''}).join('')}</div>`;
  }else if(page==='quests'){
   title='Quest Board';content='<p>Free daily and weekly challenges. Progress is saved on this device.</p>'+store.questList().map(q=>`<article class="menu-item"><h3>${q.name} · ${q.period}</h3><progress max="${q.target}" value="${Math.min(q.target,q.value)}"></progress><p>${Math.min(q.target,q.value)}/${q.target} · ${rewards(q)}</p>${action('quest:'+q.id,q.claimed?'Claimed':'Claim reward',q.claimed||q.value<q.target)}</article>`).join('');
  }else if(page==='daily'){
   title='7-Day Login Rewards';content='<p>Collect each day to advance. Missing a day restarts the cycle.</p>'+DAILY.map((r,i)=>`<article class="menu-item"><b>Day ${i+1}${p.economy.login===i+1?' · latest collected':''}</b><p>${rewards(r)}</p></article>`).join('')+action('daily','Collect today',p.lastGift===store.day());
  }else if(page==='passport'){
   const total=Object.values(p.progress).reduce((n,g)=>n+g.cleared.length,0);title=`Carnival Passport · ${total}/70`;
   content='<p>Clear a level to earn its stamp. Each paid unlock is permanent.</p>'+Object.entries(GAMES).map(([g,name])=>`<article class="menu-item"><h3>${name}</h3><div class="passport-stamps">${COSTS.map((cost,i)=>`<span title="${p.progress[g].cleared.includes(i+1)?'Completed':p.progress[g].paid.includes(i+1)?'Unlocked':cost+' coins after previous clear'}">${p.progress[g].cleared.includes(i+1)?'★':'○'} ${i+1}</span>`).join('')}</div></article>`).join('');
  }else if(page==='achievements'){
   title='Achievements';content=[['first-stamp','First Stamp','Complete your first level.'],['ten-stamps','Carnival Collector','Collect 10 stamps.'],['all-games','Island Explorer','Complete a level in all seven games.'],['champion','Island of Fun Champion','Collect all 70 stamps and receive the Champion cosmetic.']].map(([id,name,desc])=>`<article class="menu-item"><h3>${p.economy.achievements.includes(id)?'🏅':'○'} ${name}</h3><p>${desc}</p><p>${p.economy.achievements.includes(id)?'Awarded automatically':'In progress'}</p></article>`).join('');
  }else if(page==='gifts'){
   title='Gift Inbox · Local Preview';content=`<p>Your Player ID: <code>${esc(p.id)}</code></p><p>${p.guest?'Create a local account to prepare gifts.':'Local registered profile.'} Online accounts and delivery are not connected.</p><label>Recipient Player ID<input maxlength="80" placeholder="Player ID" ${p.guest?'disabled':''}></label><label>Gift preview<select>${CATALOG.filter(i=>i.tab==='Gifts').map(i=>`<option>${i.icon} ${i.name} · ${i.cost} coins</option>`).join('')}</select></label><p>Up to 5 cosmetic gifts per day when server support is available. Coins and tickets cannot be transferred.</p>${action('send','Sending unavailable — server required',true)}<h3>Inbox</h3><p>No delivered gifts. Claiming will be available after server-verified delivery.</p>${action('claim-gift','Claim gift',true)}`;
  }
  panel(title,`<p class="economy-wallet">🪙 ${p.coins} Fun Coins · 🎟️ ${p.tickets} Retry Tickets · 🏅 ${p.tokens} Prize Tokens</p>${nav}${content}`);
 };
 document.addEventListener('click',e=>{
  const b=e.target.closest('[data-econ]');if(!b)return;const [type,...parts]=b.dataset.econ.split(':'),id=parts.join(':');
  try{
   if(type==='page')return show(id);
   if(type==='tab')return show('shop',id);
   if(type==='preview'){const i=CATALOG.find(i=>i.id===id);return panel('Confirm purchase',`<div class="menu-reward-icon">${i.icon}</div><h3>${i.name}</h3><p>Spend ${i.cost} ${i.currency==='tokens'?'Prize Tokens':'Fun Coins'}?</p>${action('buy:'+id,'Confirm purchase',store.profile[i.currency]<i.cost)} ${action('page:shop','Cancel')}`);}
   if(type==='buy')store.buy(id);
   if(type==='equip')store.equip(id);
   if(type==='quest')store.claimTask(id);
   if(type==='daily')store.claimDaily();
   if(['buy','quest','daily'].includes(type))window.GameAudio?.play('pickup');
   refresh();show(type==='buy'?'shop':current);
  }catch(error){const el=document.querySelector('#menu-panel-error');if(el)el.textContent=error.message;}
 });
 return show;
}
