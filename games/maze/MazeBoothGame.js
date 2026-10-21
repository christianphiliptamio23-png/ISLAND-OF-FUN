import {ProfileStore} from '../../src/core/ProfileStore.js';

export class MazeBoothGame {
  constructor(){this.dead=true}
  open(host,leave,onProgress,profiles=new ProfileStore()){
    this.host=host;this.leave=leave;this.onProgress=onProgress;this.profiles=profiles;this.dead=false;
    const p=profiles.profile;this.profileId=p.id;
    host.innerHTML='<section class="maze-app"><iframe title="Island of Fun Maze game"></iframe><span class="maze-status" role="status" aria-live="polite"></span><button class="maze-load-back" type="button" hidden>Return to Island</button></section>';
    this.frame=host.querySelector('iframe');this.status=host.querySelector('[role="status"]');host.querySelector('button').onclick=()=>this.exit();
    const stars=Object.fromEntries(Object.entries(p.maze?.bestStars||{}).map(([level,value])=>[Number(level)-1,value]));
    const params=new URLSearchParams({profile:p.id,unlocked:String(p.maze?.unlocked||1),stars:JSON.stringify(stars)});
    this.receive=event=>{
      if(this.dead||event.origin!==location.origin||event.source!==this.frame.contentWindow)return;
      if(event.data?.type==='maze:exit')return this.exit();
      if(event.data?.type==='maze:win'){
        try{
          if(this.profiles.profile.id!==this.profileId)throw Error('The active profile changed. Reopen the maze to continue.');
          const {level,stars,time,moves}=event.data;
          const reward=this.profiles.recordMazeWin(level,stars,time,moves);
          this.status.textContent=reward.coins?`Level ${level} saved. +${reward.coins} coins, +${reward.tickets} ticket, +${reward.xp} XP.`:'Maze progress saved';
          this.onProgress?.();
        }catch(error){this.status.textContent=error.message;}
      }
    };
    addEventListener('message',this.receive);
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      if(!this.frame.contentDocument?.querySelector('#cv')){this.status.textContent='The maze could not load. Return to the island and try again.';this.status.classList.add('maze-error');host.querySelector('button').hidden=false;return;}
      this.frame.contentWindow.focus();
    });
    this.frame.src='/games/maze/index.html?'+params;
  }
  exit(){if(this.dead)return;this.dead=true;removeEventListener('message',this.receive);this.frame.remove();this.host.replaceChildren();this.leave?.();}
}
