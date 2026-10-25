export class MemoryTilesBoothGame {
  constructor(){this.dead=true}
  open(host,leave){
    this.host=host;this.leave=leave;this.dead=false;
    host.innerHTML='<section class="memory-app"><iframe title="Island of Fun Memory Tiles game" allow="autoplay"></iframe><span class="memory-status" role="status" aria-live="polite"></span><button class="memory-load-back" type="button" hidden>Return to Island</button></section>';
    this.status=host.querySelector('[role="status"]');this.frame=host.querySelector('iframe');
    host.querySelector('button').onclick=()=>this.exit();
    this.frame.addEventListener('load',()=>{
      if(this.dead)return;
      const game=this.frame.contentWindow?.MemoryTiles;
      if(!game){this.status.textContent='Memory Tiles could not load. Return to the island and try again.';this.status.classList.add('memory-error');host.querySelector('button').hidden=false;return;}
      game.onExit=()=>this.exit();
      this.frame.contentWindow.focus();
    });
    this.frame.src='/games/memory/index.html';
  }
  exit(){
    if(this.dead)return;this.dead=true;
    this.frame.remove();this.host.replaceChildren();this.leave?.();
  }
}
