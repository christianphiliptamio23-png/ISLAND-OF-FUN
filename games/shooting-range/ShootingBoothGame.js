import {ProfileStore} from '../../src/core/ProfileStore.js';

export class ShootingBoothGame {
  constructor(){this.dead=true}
  open(host,leave,profiles=new ProfileStore()){
    this.host=host;this.leave=leave;this.dead=false;
    host.innerHTML='<section class="shooting-app"><iframe title="Island of Fun Shooting Range" allow="autoplay"></iframe><span class="shooting-status" role="status" aria-live="polite"></span><button type="button" class="shooting-load-back" hidden>Return to Island</button></section>';
    this.frame=host.querySelector('iframe');
    const status=host.querySelector('[role="status"]'),back=host.querySelector('button');
    back.onclick=()=>this.exit();
    this.receive=event=>{
      if(this.dead||event.origin!==location.origin||event.source!==this.frame.contentWindow)return;
      if(event.data?.type==='shooting:exit')this.exit();
    };
    addEventListener('message',this.receive);
    const failed=()=>{if(this.dead)return;status.textContent='The shooting range could not load. Return to the island and try again.';status.classList.add('shooting-error');back.hidden=false;};
    this.frame.addEventListener('error',failed);
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      if(!this.frame.contentDocument?.querySelector('#c'))return failed();
      this.frame.contentWindow.focus();
    });
    const p=profiles.profile;
    const params=new URLSearchParams({profile:p.id,sound:p.settings.master*p.settings.effects>0?'1':'0'});
    this.frame.src='/games/shooting-range/index.html?'+params;
  }
  exit(){
    if(this.dead)return;this.dead=true;
    removeEventListener('message',this.receive);
    this.frame.remove();this.host.replaceChildren();this.leave?.();
  }
}
