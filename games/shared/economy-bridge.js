import {ProfileStore} from '../../src/core/ProfileStore.js';
import {GAMES,COSTS,REWARDS} from '../../src/core/Economy.js';
const game=location.pathname.split('/').filter(Boolean).at(-2);
const boot=document.querySelector('#economy-loading');
try{
 const store=new ProfileStore(),profileId=store.profile.id,compactWallet=true;
 let progress=store.profile.progress[game];
 let attempt=null,restore=null,canRestore=()=>false,completed=false,adapter=null;
 const dock=document.createElement('div');dock.className='economy-dock economy-compact';
 dock.innerHTML='<span class="economy-summary" aria-label="Wallet balance"></span><button class="economy-quick-retry" data-retry hidden>Use Retry Ticket</button>';
 document.body.append(dock);
 const retryButton=dock.querySelector('[data-retry]');
 function updateRetry(){try{retryButton.hidden=completed||!restore||!canRestore();}catch{retryButton.hidden=true;}}
 const retryTimer=setInterval(updateRetry,500);window.addEventListener('pagehide',()=>clearInterval(retryTimer));
 const modal=document.createElement('dialog');modal.className='economy-dialog';document.body.append(modal);
 const toast=compactWallet?document.createElement('p'):null;
 if(toast){toast.className='economy-toast';toast.setAttribute('role','status');document.body.append(toast);}
 const say=s=>{if(!toast){dock.querySelector('.economy-feedback').textContent=s;return;}toast.textContent=s;toast.classList.remove('show');void toast.offsetWidth;toast.classList.add('show');};
 const check=()=>{if(store.profile.id!==profileId)throw Error('Account changed. Return to the island and reopen this game.');};
 function sync(){const p=store.profile,a=p.economy.attempts[game];progress=p.progress[game];const summary=dock.querySelector('.economy-summary'),before=summary.textContent;summary.textContent=`🪙 ${p.coins} · 🎟️ ${p.tickets} · 🏅 ${p.tokens}`;if(compactWallet&&before&&before!==summary.textContent){summary.classList.remove('balance-bump');void summary.offsetWidth;summary.classList.add('balance-bump');}updateRetry();if(parent!==window)parent.postMessage({type:'economy:changed'},location.origin);}
 function message(title,copy,confirm){modal.replaceChildren();const h=document.createElement('h2');h.textContent=title;const p=document.createElement('p');p.textContent=copy;const cancel=document.createElement('button');cancel.textContent='Close';cancel.onclick=()=>modal.close();modal.append(h,p);if(confirm){const b=document.createElement('button');b.textContent='Confirm unlock';b.onclick=()=>{try{check();confirm();modal.close();sync();}catch(e){p.textContent=e.message;}};modal.append(b);}modal.append(cancel);if(!modal.open)modal.showModal();}
 function levels(){check();modal.innerHTML='<h2>'+GAMES[game]+' · Levels</h2><p>Level 1 is free. Complete the previous level before buying the next. Every win pays twice the unlock price, including free replays. Level 1 pays 30 coins.</p>';const p=store.profile,g=p.progress[game],grid=document.createElement('div');grid.className='economy-levels';for(let n=1;n<=10;n++){const b=document.createElement('button'),paid=g.paid.includes(n),clear=g.cleared.includes(n);b.textContent=`${clear?'★ ':''}Level ${n} · ${paid?'Play':COSTS[n-1]+' coins'}`;b.disabled=!paid&&!g.cleared.includes(n-1);b.onclick=()=>{modal.close();adapter?.start(n);};grid.append(b);}const close=document.createElement('button');close.textContent='Close';close.onclick=()=>modal.close();modal.append(grid,close);modal.showModal();}
 const api={
  isLocked:n=>!progress.paid.includes(n),
  canSelect:n=>Number.isInteger(n)&&n>=1&&n<=10&&(progress.paid.includes(n)||progress.cleared.includes(n-1)),
  label:n=>progress.cleared.includes(n)?'Cleared':progress.paid.includes(n)?'Unlocked':'Locked · '+COSTS[n-1]+' coins',
  register(a){adapter=a;sync();a.unlockNative?.();},
  enter(level,restart){try{check();const g=store.profile.progress[game];if(!g.paid.includes(level)){if(!g.cleared.includes(level-1)){message('Level locked','Complete level '+(level-1)+' first.');return false;}message('Unlock level '+level,`Pay ${COSTS[level-1]} Fun Coins once. Every win earns ${REWARDS[level-1]} coins.`,()=>{store.unlock(game,level);restart();});return false;}attempt=store.beginAttempt(game,level);restore=null;canRestore=()=>false;completed=false;say('Level '+level+' · Win reward '+REWARDS[level-1]+' coins.');sync();return true;}catch(e){message('Unable to start',e.message);return false;}},
  checkpoint(fn,available=()=>true){if(completed)return;restore=fn;canRestore=available;},
  clearCheckpoint(){restore=null;canRestore=()=>false;},
  complete(){if(completed||!attempt)return;try{check();const r=store.finishAttempt(game,attempt);completed=true;restore=null;say(r.coins?`+${r.coins} Fun Coins earned!`:'Level complete! Today’s reward already collected.');sync();}catch(e){say(e.message);}},
  metric(name,id){if(attempt){try{check();store.metric(game,attempt,name,id);}catch(e){say(e.message);}}},
  retry(){try{check();if(!restore||!canRestore())throw Error('No mistake or checkpoint available to restore yet.');const fn=restore;store.retry(game,attempt,fn);restore=null;canRestore=()=>false;say('Previous state restored. 1 Retry Ticket used.');sync();return true;}catch(e){say(e.message);return false;}},
  profile(){return store.profile;}
 };
 window.GameEconomy=api;dock.querySelector('[data-retry]').onclick=()=>api.retry();
 window.dispatchEvent(new Event('economy-ready'));sync();boot?.remove();
}catch(error){if(boot)boot.textContent='Saving could not load. Enable browser storage, then reload. '+error.message;}
