export class ChessBoothGame {
  constructor(){this.dead=true}
  open(host,leave){
    this.host=host;this.leave=leave;this.dead=false;
    host.innerHTML='<section class="chess-app"><iframe title="Island of Fun Chess game"></iframe><span class="chess-status" role="status" aria-live="polite"></span><button class="chess-load-back" type="button" hidden>Return to Island</button></section>';
    this.frame=host.querySelector('iframe');this.status=host.querySelector('[role="status"]');
    host.querySelector('button').onclick=()=>this.exit();
    this.receive=event=>{if(!this.dead&&event.origin===location.origin&&event.source===this.frame.contentWindow&&event.data?.type==='chess:exit')this.exit()};
    addEventListener('message',this.receive);
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      const game=this.frame.contentWindow?.ChessGame;
      if(!game){this.status.textContent='Chess could not load. Return to the island and try again.';this.status.classList.add('chess-error');host.querySelector('button').hidden=false;return;}
      game.onExit=()=>this.exit();this.frame.contentWindow.focus();
    });
    this.frame.src='/games/chess/index.html';
  }
  exit(){if(this.dead)return;this.dead=true;removeEventListener('message',this.receive);this.frame.remove();this.host.replaceChildren();this.leave?.();}
}
