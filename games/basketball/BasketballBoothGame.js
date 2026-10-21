import {ProfileStore} from '../../src/core/ProfileStore.js';

export class BasketballBoothGame {
  constructor(){this.dead=true}
  open(host,leave,onProgress,profiles=new ProfileStore()){
    this.host=host;this.leave=leave;this.onProgress=onProgress;this.profiles=profiles;this.dead=false;
    const profile=profiles.profile;this.profileId=profile.id;
    host.innerHTML='<section class="basketball-app"><iframe title="Basketball Shoot game" allow="autoplay"></iframe><span class="basketball-status" role="status" aria-live="polite"></span><button class="basketball-load-back" type="button" hidden>Return to Island</button></section>';
    this.status=host.querySelector('[role="status"]');this.frame=host.querySelector('iframe');
    host.querySelector('button').onclick=()=>this.exit();
    const params=new URLSearchParams({profile:profile.id,volume:String(profile.settings.master*profile.settings.effects/10000),unlocked:String(profile.basketball?.unlocked||1)});
    this.receive=event=>{
      if(this.dead||event.origin!==location.origin||event.source!==this.frame.contentWindow)return;
      if(event.data?.type==='basketball:exit')return this.exit();
      if(event.data?.type==='basketball:win'){
        try{
          if(this.profiles.profile.id!==this.profileId)throw Error('The active profile changed. Return to the island and reopen basketball.');
          const reward=this.profiles.recordBasketballWin(event.data.level,event.data.score);
          this.status.textContent=reward.coins?`Level ${event.data.level} saved · +${reward.coins} coins · +${reward.tickets} ticket · +${reward.xp} XP`:'Score and progress saved';
          this.onProgress?.();
        }catch(error){this.status.textContent=error.message;}
      }
    };
    addEventListener('message',this.receive);
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      if(!this.frame.contentDocument?.querySelector('#stage')){this.status.textContent='Basketball could not load. Return to the island and try again.';this.status.classList.add('basketball-error');host.querySelector('button').hidden=false;return;}
      this.frame.contentWindow.focus();
    });
    this.frame.src='/games/basketball/index.html?'+params;
  }
  exit(){
    if(this.dead)return;this.dead=true;
    removeEventListener('message',this.receive);
    // Removing the frame stops its animation loop and generated audio.
    this.frame.remove();this.host.replaceChildren();this.leave?.();
  }
}
