(()=>{
 const KEY='island-of-fun-time-of-day-v1',STEP=300000,PHASES=['morning','day','afternoon','night'];
 const names={morning:'Morning',day:'Daytime',afternoon:'Afternoon',night:'Night'};
 let state={mode:'auto',epoch:Date.now()},current='',panel,select,label,tint,exploring=false;
 function read(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&['auto',...PHASES].includes(s.mode)&&Number.isFinite(s.epoch))state=s;}catch{}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{}}
 function phase(now=Date.now()){return state.mode==='auto'?PHASES[Math.floor(Math.max(0,now-state.epoch)/STEP)%4]:state.mode;}
 function update(){const next=phase();if(next!==current){current=next;document.documentElement.dataset.timeOfDay=next;window.dispatchEvent(new CustomEvent('island-time-change',{detail:{phase:next}}));}if(select)select.value=state.mode;if(label)label.textContent='Time: '+names[next];}
 function choose(mode){if(!['auto',...PHASES].includes(mode))return;if(mode==='auto')state.epoch=Date.now()-Math.max(0,PHASES.indexOf(current))*STEP;state.mode=mode;save();update();}
 function setExploring(value){exploring=!!value;if(panel){panel.hidden=!exploring;if(!exploring)panel.open=false;}if(tint)tint.hidden=!exploring;}
 read();save();window.IslandTime={get phase(){return phase();},get mode(){return state.mode;},choose,setExploring};
 function mount(){
  tint=document.createElement('div');tint.className='island-time-tint';tint.setAttribute('aria-hidden','true');document.body.append(tint);
  panel=document.createElement('details');panel.className='island-time-controls';
  label=document.createElement('summary');panel.append(label);
  const box=document.createElement('label');box.textContent='Choose time of day';select=document.createElement('select');select.setAttribute('aria-label','Time of day');
  for(const value of ['auto',...PHASES]){const option=document.createElement('option');option.value=value;option.textContent=value==='auto'?'Auto (every 5 minutes)':names[value];select.append(option);}select.addEventListener('change',()=>{choose(select.value);panel.open=false;});box.append(select);panel.append(box);document.body.append(panel);setExploring(exploring);update();
 }
 window.addEventListener('storage',e=>{if(e.key===KEY){read();update();}});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){read();update();}});
 const timer=setInterval(update,1000);window.addEventListener('pagehide',()=>clearInterval(timer));
 update();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
