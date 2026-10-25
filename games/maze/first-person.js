/* Grid-boundary raycaster: uses the same passage bits as the maze rules. */
(()=>{
 const TAU=Math.PI*2;
 function cast(s,x,y,angle){
  const dx=Math.cos(angle),dy=Math.sin(angle);let cx=Math.floor(x),cy=Math.floor(y);
  const sx=dx>=0?1:-1,sy=dy>=0?1:-1,deltaX=1/Math.max(1e-9,Math.abs(dx)),deltaY=1/Math.max(1e-9,Math.abs(dy));
  let tx=(dx>=0?cx+1-x:x-cx)*deltaX,ty=(dy>=0?cy+1-y:y-cy)*deltaY;
  for(let i=0;i<s.n*4+8;i++){
   const vertical=tx<ty,dist=vertical?tx:ty,bit=vertical?(sx>0?2:8):(sy>0?4:1);
   if(cx<0||cy<0||cx>=s.n||cy>=s.n||!(s.g[cy*s.n+cx]&bit))return {dist,vertical,u:vertical?y+dy*dist:x+dx*dist};
   if(vertical){cx+=sx;tx+=deltaX;}else{cy+=sy;ty+=deltaY;}
  }
  return {dist:s.n*2,vertical:false,u:0};
 }
 function render(ctx,s,w,h,now){
  // A wider 90-degree view gives nearby walls breathing room.
  const angle=s.viewAngle||0,x=s.px+.5,y=s.py+.5,fov=Math.PI/2,plane=w/(2*Math.tan(fov/2)),horizon=h*.46;
  const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,s.dark?'#142e43':'#67cbea');sky.addColorStop(1,s.dark?'#527a70':'#d1f0cf');ctx.fillStyle=sky;ctx.fillRect(0,0,w,horizon);
  const floor=ctx.createLinearGradient(0,horizon,0,h);floor.addColorStop(0,'#737149');floor.addColorStop(1,'#d3b77d');ctx.fillStyle=floor;ctx.fillRect(0,horizon,w,h);
  const stripe=3,depth=[];
  for(let col=0;col<w;col+=stripe){
   const offset=Math.atan((col-w/2)/plane),hit=cast(s,x,y,angle+offset),d=Math.max(.06,hit.dist*Math.cos(offset)),wall=plane*.88/d,top=horizon-wall*.52;
   depth[Math.floor(col/stripe)]=d;
   const shade=Math.max(.16,1/(1+d*(s.dark?.42:.14)))*(hit.vertical?.86:1),leaf=Math.floor(hit.u*12)%2===0?1:.9;
   ctx.fillStyle=`rgb(${Math.round(44*shade*leaf)},${Math.round(125*shade*leaf)},${Math.round(66*shade*leaf)})`;ctx.fillRect(col,top,stripe+1,wall);
   ctx.fillStyle=`rgba(151,202,83,${shade*.7})`;ctx.fillRect(col,top,stripe+1,Math.max(2,wall*.045));
   ctx.fillStyle=`rgba(12,38,25,${shade*.4})`;ctx.fillRect(col,top+wall*.78,stripe+1,wall*.22);
  }
  const things=[...s.stars.filter(a=>!a.got).map(a=>({...a,label:'★',color:'#ffe16c'})),...s.en.map(a=>({x:a.px,y:a.py,label:'●',color:'#ff7065'})),{x:s.n-1,y:s.n-1,label:'EXIT',color:'#b5ffb3'}];
  things.sort((a,b)=>Math.hypot(b.x+.5-x,b.y+.5-y)-Math.hypot(a.x+.5-x,a.y+.5-y));
  for(const item of things){
   const dx=item.x+.5-x,dy=item.y+.5-y,forward=dx*Math.cos(angle)+dy*Math.sin(angle),side=-dx*Math.sin(angle)+dy*Math.cos(angle);
   if(forward<.12)continue;const screen=w/2+side/forward*plane,size=Math.min(h,plane*.42/forward),top=horizon-size*.4;
   ctx.save();ctx.beginPath();for(let col=Math.max(0,Math.floor((screen-size)/stripe)*stripe);col<Math.min(w,screen+size);col+=stripe)if(forward<(depth[Math.floor(col/stripe)]||0)+.02)ctx.rect(col,0,stripe,h);ctx.clip();
   ctx.shadowColor=item.color;ctx.shadowBlur=12;ctx.fillStyle=item.color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${item.label==='EXIT'?size*.36:size}px Trebuchet MS`;ctx.fillText(item.label,screen,top+Math.sin(now/400)*3);ctx.shadowBlur=0;
   if(item.label==='●'){ctx.fillStyle='#472b39';ctx.font=`900 ${size*.4}px sans-serif`;ctx.fillText('× ×',screen,top);}
   ctx.restore();
  }
  ctx.fillStyle='#ffffff90';ctx.fillRect(w/2-5,h/2,10,2);ctx.fillRect(w/2,h/2-4,2,10);
  const dirs=['E','S','W','N'],dir=dirs[((Math.round(angle/(Math.PI/2))%4)+4)%4];ctx.textAlign='center';ctx.font='bold 18px Trebuchet MS';ctx.fillStyle='#103b30d9';ctx.fillRect(w/2-35,12,70,32);ctx.fillStyle='#fff2c3';ctx.fillText(dir,w/2,34);
  if(s.hit>0){ctx.fillStyle=`rgba(240,55,40,${s.hit*.5})`;ctx.fillRect(0,0,w,h);}
 }
 window.MazeView={cast,render};
})();
