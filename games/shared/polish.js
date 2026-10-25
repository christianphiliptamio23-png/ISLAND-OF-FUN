/* Small, event-driven effects: no downloads, audio, or idle animation loop. */
(()=>{
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const palettes={chess:['#ffe3a0','#0c885b'],memory:['#ff83b7','#72e6ef'],basketball:['#ffae52','#fff0ac'],maze:['#b9ee72','#d4acff'],'shooting-range':['#ffdc60','#7ce4ff'],cans:['#ff795e','#ffe680'],pickleball:['#d9ff68','#6eddf1']};
  const game=location.pathname.split('/').filter(Boolean).at(-2),colors=palettes[game]||palettes.memory;
  let streak=0,wins=0,best=0,timer,layer,badge;
  function setup(){
    if(layer)return;
    layer=document.createElement('div');layer.className='mini-fx-layer';layer.setAttribute('aria-hidden','true');
    badge=document.createElement('div');badge.className='mini-fx-badge';badge.hidden=true;badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');
    document.body.append(layer,badge);
  }
  function burst(x,y,count=24){
    if(reduced.matches||document.hidden)return;
    setup();
    for(let i=0;i<count&&layer.childElementCount<48;i++){
      const dot=document.createElement('i');dot.className='mini-fx-particle';
      dot.style.cssText=`left:${x}px;top:${y}px;background:${colors[i%colors.length]};`;
      layer.append(dot);
      const angle=Math.random()*Math.PI*2,distance=45+Math.random()*150;
      const animation=dot.animate([{transform:'translate(0,0) rotate(0deg)',opacity:1},{transform:`translate(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance+90}px) rotate(${Math.random()*540}deg)`,opacity:0}],{duration:700+Math.random()*500,easing:'cubic-bezier(.1,.5,.3,1)'});
      animation.onfinish=()=>dot.remove();
    }
  }
  function result(won){
    setup();clearTimeout(timer);
    if(won){wins++;streak++;best=Math.max(best,streak);burst(innerWidth*.3,innerHeight*.35);burst(innerWidth*.7,innerHeight*.35);}
    else streak=0;
    badge.textContent=won?`${streak>1?streak+' wins in a row!':'Nicely played!'} · Session wins ${wins} · Best streak ${best}`:'New attempt, fresh start. You’ve got this!';
    badge.hidden=false;timer=setTimeout(()=>badge.hidden=true,3500);
  }
  window.MiniFX={result,burst,get stats(){return {wins,streak,best};}};
  document.addEventListener('click',e=>{
    const button=e.target.closest?.('button');
    if(!button||button.disabled||reduced.matches||!button.animate)return;
    // Brightness feedback leaves each game's positioning and transforms intact.
    button.animate([{filter:'brightness(1.35)'},{filter:'brightness(1)'}],{duration:220});
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){layer?.replaceChildren();if(badge)badge.hidden=true;clearTimeout(timer);}});
})();
