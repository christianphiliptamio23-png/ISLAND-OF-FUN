export class MobileControls {
  constructor(game){
    this.game=game;
    this.root=document.createElement('div');this.root.id='mobile-controls';this.root.hidden=true;
    this.root.innerHTML='<div id="move-stick" role="group" aria-label="Drag to walk"><span class="stick-knob"></span><i class="stick-label" aria-hidden="true">MOVE</i></div><div class="touch-actions"><button data-touch="run" aria-label="Toggle run" aria-pressed="false"><span class="control-glyph run-glyph" aria-hidden="true"></span><span>RUN</span></button><button data-touch="jump" aria-label="Jump"><span class="control-glyph jump-glyph" aria-hidden="true"></span><span>JUMP</span></button><button data-touch="explore" aria-label="Explore nearby attraction"><span class="control-glyph explore-glyph" aria-hidden="true"></span><span>EXPLORE</span></button></div>';
    document.body.append(this.root);
    this.stick=this.root.querySelector('#move-stick');this.knob=this.stick.firstElementChild;
    this.active=null;this.enabled=false;this.run=false;
    const move=e=>{
      const r=this.stick.getBoundingClientRect(),radius=r.width/2;
      let x=(e.clientX-r.left-radius)/radius,y=(e.clientY-r.top-radius)/radius;
      const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
      game.input.touchMove={x,y};this.knob.style.transform=`translate(${x*radius*.55}px,${y*radius*.55}px)`;
    };
    this.stick.addEventListener('pointerdown',e=>{if(!this.enabled||this.active!==null)return;e.preventDefault();this.active=e.pointerId;this.stick.setPointerCapture(e.pointerId);move(e);});
    this.stick.addEventListener('pointermove',e=>{if(e.pointerId===this.active)move(e);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])this.stick.addEventListener(type,e=>{if(e.pointerId===this.active)this.release();});
    this.root.querySelector('[data-touch="jump"]').onclick=()=>{if(this.enabled)game.input.jump=true;};
    this.runButton=this.root.querySelector('[data-touch="run"]');
    this.runButton.onclick=()=>{if(!this.enabled)return;this.run=!this.run;game.input.touchRun=this.run;this.runButton.setAttribute('aria-pressed',String(this.run));};
    this.root.querySelector('[data-touch="explore"]').onclick=()=>{if(this.enabled)game.interactions.interact();};
    addEventListener('blur',()=>this.reset());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.reset();});
    game.input.touchMove={x:0,y:0};
  }
  release(){const pointer=this.active;this.active=null;if(pointer!==null&&this.stick.hasPointerCapture?.(pointer))this.stick.releasePointerCapture(pointer);this.game.input.touchMove={x:0,y:0};this.knob.style.transform='';}
  reset(){this.release();this.run=false;this.game.input.touchRun=false;this.runButton.setAttribute('aria-pressed','false');this.game.input.clearMotion();}
  update(){
    const enabled=this.game.state.is('EXPLORATION');
    if(enabled!==this.enabled){this.enabled=enabled;this.root.hidden=!enabled;this.reset();}
    if(enabled){const button=this.root.querySelector('[data-touch="explore"]');button.disabled=!this.game.interactions.near;button.setAttribute('aria-label',this.game.interactions.near?'Explore '+this.game.interactions.near.name:'Explore nearby attraction');}
  }
}
