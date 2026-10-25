const T=window.THREE;
const DANCES=[
  "./assets/emotes/dance1/tripo_convert_dbc9ed52-adb3-45dc-9c21-59ecb4a4dfa8.fbx",
  "./assets/emotes/dance2/tripo_convert_cdd1d16c-8396-4fc4-ae40-79174e77af42.fbx",
  "./assets/emotes/dance3/tripo_convert_80c42027-ca6f-4802-87c4-05be4c96dee7.fbx",
  "./assets/emotes/dance4/tripo_convert_679b1f32-5037-482d-8d5c-95d18360ab7c.fbx",
  "./assets/emotes/dance5/tripo_convert_f753ff3d-15eb-4e0a-98db-cdc93c0cfbf0.fbx"
];
export class CharacterEmotes{
 constructor(game){
  this.game=game;this.kind=null;this.elapsed=0;this.cache=new Map();this.page=0;
  this.ui=document.createElement('details');this.ui.className='island-emotes';this.ui.hidden=true;
  this.ui.innerHTML='<summary aria-label="Open dance emotes">EMOTE</summary><div class="emote-choices"></div><p role="status"></p>';
  document.body.append(this.ui);this.status=this.ui.querySelector('p');this.status.className='emote-load-status';document.body.append(this.status);this.choices=this.ui.querySelector('.emote-choices');this.render();this.ui.addEventListener('toggle',()=>{if(this.ui.open){this.render();this.load(0).catch(()=>{});}});
  this.ui.addEventListener('click',e=>{const b=e.target.closest('[data-emote]');if(!b)return;if(b.dataset.emote.startsWith('buy:')){try{this.game.save.profiles.buy('emote-'+b.dataset.emote.slice(4));this.game.refreshHUD();this.render();this.status.textContent='Emote unlocked!';}catch(error){this.status.textContent=error.message;}}else this.play(b.dataset.emote);});
 }
 render(){const p=this.game.save.profiles.profile;this.choices.innerHTML='<strong>Emote Shop &middot; '+p.coins+' coins</strong>'+Array.from({length:5},(_,n)=>{const owned=n===0||p.inventory.includes('emote-'+n),price=[0,50,100,150,200][n];return '<button class="emote-slot" data-emote="'+(owned?n:'buy:'+n)+'" '+(!owned&&p.coins<price?'disabled':'')+'><span class="emote-icon" aria-hidden="true">&#9835;</span><span>'+(n===0?'Flip (free)':'Emote '+n)+'<small>'+ (owned?'Play':'Locked - '+price+' coins')+'</small></span></button>';}).join('')+'<button class="emote-stop" data-emote="stop">Stop dancing</button>';}
 progress(message){if(this.pending&&this.status)this.status.textContent=message;}
 async loadModel(){
  if(!this.modelPromise){
   T.Cache.enabled=true;
   const manager=new T.LoadingManager();manager.setURLModifier(url=>/\.(png|jpg|jpeg)$/i.test(url)?'./assets/emotes/textures/'+url.split(/[\\/]/).pop().replace(/^dance[1-5]_/, ''):url);
   this.modelPromise=new Promise((resolve,reject)=>new T.FBXLoader(manager).load(DANCES[0],model=>{
    model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0){reject(Error('Invalid model bounds'));return;}
    const visual=new T.Group(),scale=1.85/size.y;visual.add(model);visual.scale.setScalar(scale);visual.position.set(-(box.min.x+box.max.x)*.5*scale,-box.min.y*scale,-(box.min.z+box.max.z)*.5*scale);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    const mixer=new T.AnimationMixer(model);visual.visible=false;this.game.player.group.add(visual);resolve({visual,mixer});
   },event=>this.progress(event.total?'Loading character '+Math.round(event.loaded/event.total*100)+'%...':'Loading character...'),reject)).catch(error=>{this.modelPromise=null;throw error;});
  }return this.modelPromise;
 }
 decodeClip(buffer){
  const view=new DataView(buffer),length=view.getUint32(4,true);if(new TextDecoder().decode(new Uint8Array(buffer,0,4))!=='IOFA')throw Error('Invalid emote clip');
  const header=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,8,length)));let offset=8+length;
  const array=count=>{const out=new Float32Array(buffer.slice(offset,offset+count*4));offset+=count*4;return out;};
  const types={vector:T.VectorKeyframeTrack,quaternion:T.QuaternionKeyframeTrack,number:T.NumberKeyframeTrack};
  const tracks=header.tracks.map(t=>new types[t.type](t.name,array(t.count),array(t.count*t.stride)));
  return new T.AnimationClip(header.name,header.duration,tracks);
 }
 async load(index){
  if(!this.cache.has(index)){
   const clip=new Promise((resolve,reject)=>new T.FileLoader().setResponseType('arraybuffer').load('./assets/emotes/clips/dance'+(index+1)+'.anim',buffer=>{try{resolve(this.decodeClip(buffer));}catch(e){reject(e);}},undefined,reject));
   this.cache.set(index,Promise.all([this.loadModel(),clip]).then(([model,clip])=>({...model,clip})).catch(error=>{this.cache.delete(index);throw error;}));
  }return this.cache.get(index);
 }
 async play(kind){
  if(kind==='stop'){this.stop();return;}const index=Number(kind);
  if(!Number.isInteger(index)||!DANCES[index]||!this.game.state.is('EXPLORATION'))return;
  if(index>0&&!this.game.save?.profiles.profile.inventory.includes('emote-'+index)){this.status.textContent='Unlock this emote in the Emote Shop first.';return;}
  this.stop();const request=this.request;this.pending=true;this.ui.open=false;this.status.textContent='Loading emote '+(index===0?'Flip':index)+' - first load may take a moment...';
  try{const dance=await this.load(index);if(request!==this.request||!this.game.state.is('EXPLORATION'))return;
   this.pending=false;this.kind=String(index);this.elapsed=0;this.duration=dance.clip.duration;this.visual=dance.visual;this.mixer=dance.mixer;
   this.game.follow.beginEmote();this.game.refreshCameraButton();
   const p=this.game.player;this.originalCharacterVisible=p.character?.visible;this.originalFallbackVisible=p.fallback.visible;if(p.character)p.character.visible=false;p.fallback.visible=false;
   this.mixer.stopAllAction();const action=this.mixer.clipAction(dance.clip).reset();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();this.mixer.update(0);this.visual.visible=true;this.status.textContent='Dance '+(index+1)+' - move to stop.';this.ui.open=false;
  }catch(error){if(request===this.request){this.pending=false;this.status.textContent='Dance could not load. Please try again.';}console.warn('Dance load failed',error);}
 }
 stop(cancel=true){if(cancel)this.request=(this.request||0)+1;this.pending=false;if(this.kind!==null){const p=this.game.player;if(p.character)p.character.visible=this.originalCharacterVisible;p.fallback.visible=this.originalFallbackVisible;}this.kind=null;this.game.follow.endEmote?.();this.game.refreshCameraButton?.();this.mixer?.stopAllAction();if(this.visual)this.visual.visible=false;this.status.textContent='';}
 update(dt){
  const g=this.game,p=g.player;this.ui.hidden=!g.state.is('EXPLORATION');this.status.hidden=this.ui.hidden;if(this.ui.hidden)this.ui.open=false;
  if(this.kind===null&&!this.pending)return;
  if(this.ui.hidden||Math.hypot(p.velocity.x,p.velocity.z)>.12||!p.grounded||(!this.pending&&g.follow.mode==='first')){this.stop();return;}
  if(this.kind===null)return;this.elapsed+=dt;if(this.elapsed>(this.duration||8)){this.stop();return;}this.mixer?.update(dt);
 }
}
