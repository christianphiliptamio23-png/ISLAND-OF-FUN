/* Local synthesized effects and a common volume bus for every game. */
(()=>{
  let context,settingsReader,enabled=()=>true,unlocked=false;
  const buses=new Map(),last=new Map();
  function settings(){try{if(settingsReader)return settingsReader();const db=JSON.parse(localStorage.getItem('island-of-fun-profiles-v1')||'{}');return db.profiles?.[db.activeAccount||sessionStorage.getItem('island-of-fun-guest-id')]?.settings||{};}catch{return {};}}
  function volume(){const s=settings();return document.hidden||!enabled()?0:Math.max(0,Math.min(100,s.master??70))*Math.max(0,Math.min(100,s.effects??70))/10000;}
  function output(ac){let bus=buses.get(ac);if(!bus){bus=ac.createGain();bus.connect(ac.destination);buses.set(ac,bus);}bus.gain.setValueAtTime(volume(),ac.currentTime);return bus;}
  function refresh(){for(const ac of buses.keys())output(ac);}
  const sounds={click:[[650,.055,.08]],step:[[130,.055,.12,-65]],jump:[[240,.18,.12,320]],land:[[100,.12,.16,-65]],enter:[[440,.09,.1],[660,.16,.1,0,.09]],pickup:[[880,.09,.1],[1320,.18,.1,0,.08]],win:[[523,.13,.12],[659,.13,.12,0,.12],[784,.13,.12,0,.24],[1047,.3,.12,0,.36]],error:[[180,.13,.1,-70]]};
  function play(name){if(!unlocked||volume()<=0)return;const now=performance.now();if(now-(last.get(name)??-Infinity)<(name==='step'?85:45))return;last.set(name,now);try{context??=new(window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume().catch(()=>{});const bus=output(context);for(const [f,d,v,slide=0,delay=0]of sounds[name]||sounds.click){const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+delay;o.type=name==='step'||name==='land'?'triangle':'sine';o.frequency.setValueAtTime(f,t);o.frequency.linearRampToValueAtTime(Math.max(30,f+slide),t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(bus);o.onended=()=>{o.disconnect();g.disconnect();};o.start(t);o.stop(t+d+.02);}}catch{}}
  function unlock(){unlocked=true;for(const ac of buses.keys())if(ac.state==='suspended')ac.resume().catch(()=>{});}
  document.addEventListener('pointerdown',unlock,true);
  document.addEventListener('keydown',unlock,true);
  document.addEventListener('click',e=>{const b=e.target.closest?.('button');if(b&&!b.disabled&& !b.closest('#actions,#joy,.dpad'))play('click');});
  document.addEventListener('visibilitychange',()=>{refresh();if(document.hidden)for(const ac of buses.keys())ac.suspend?.().catch(()=>{});});
  window.addEventListener('storage',refresh);
  window.addEventListener('pagehide',()=>{for(const ac of buses.keys())ac.close?.().catch(()=>{});buses.clear();});
  window.GameAudio={play,output,refresh,volume,setSettings(fn){settingsReader=fn;refresh();},setEnabled(fn){enabled=fn;refresh();}};
})();
