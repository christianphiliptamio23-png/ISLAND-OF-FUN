export class CanKnockdownBoothGame {
  constructor(){this.dead=true}
  open(host,leave){
    this.host=host;this.leave=leave;this.dead=false;
    host.innerHTML='<section class="cans-app"><iframe title="Island of Fun Can Knockdown game" allow="autoplay"></iframe><span class="cans-status" role="status" aria-live="polite"></span><button class="cans-load-back" type="button" hidden>Return to Island</button></section>';
    this.status=host.querySelector('[role="status"]');this.frame=host.querySelector('iframe');
    host.querySelector('button').onclick=()=>this.exit();
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      if(!this.frame.contentDocument?.querySelector('#c')){this.status.textContent='Can Knockdown could not load. Return to the island and try again.';this.status.classList.add('cans-error');host.querySelector('button').hidden=false;return;}
      this.frame.contentWindow.onExit=()=>this.exit();
      this.frame.contentWindow.focus();
    });
    this.frame.src='/games/cans/index.html';
  }
  exit(){
    if(this.dead)return;this.dead=true;
    this.frame.remove();this.host.replaceChildren();this.leave?.();
  }
}
