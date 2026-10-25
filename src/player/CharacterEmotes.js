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
  document.body.append(this.ui);this.status=this.ui.querySelector('p');this.choices=this.ui.querySelector('.emote-choices');this.render();
  this.ui.addEventListener('click',e=>{const b=e.target.closest('[data-emote]');if(!b)return;if(b.dataset.emote==='page'){this.page=1-this.page;this.render();}else this.play(b.dataset.emote);});
 }
 render(){this.choices.innerHTML='<strong>Choose an emote</strong>'+Array.from({length:5},(_,n)=>'<button class="emote-slot" data-emote="'+n+'" aria-label="Play '+(n===0?'Flip':'Dance '+n)+'"><span class="emote-icon" aria-hidden="true">'+(n===0?'&#8635;':'&#9835;')+'</span><span>'+(n===0?'Flip':'Dance '+n)+'</span></button>').join('')+'<button class="emote-stop" data-emote="stop">Stop dancing</button>';}
 async load(index){
  if(!this.cache.has(index)){
   const path=DANCES[index],folder=path.slice(0,path.lastIndexOf('/')+1),base=path.slice(path.lastIndexOf('/')+1,-4);
   const manager=new T.LoadingManager();manager.setURLModifier(url=>/\.(png|jpg|jpeg)$/i.test(url)?folder+base+'.fbm/'+url.split(/[\\/]/).pop():url);
   const pending=new Promise((resolve,reject)=>new T.FBXLoader(manager).load(path,model=>{
    if(!model.animations.length){reject(Error('No animation in dance'));return;}
    // These FBX exports use Z as up; the island uses Y.
    model.rotation.x=-Math.PI/2;model.updateMatrixWorld(true);const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0){reject(Error('Invalid model bounds'));return;}
    const visual=new T.Group(),scale=1.85/size.y;visual.add(model);visual.scale.setScalar(scale);visual.position.set(-(box.min.x+box.max.x)*.5*scale,-box.min.y*scale,-(box.min.z+box.max.z)*.5*scale);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.frustumCulled=false;}});
    const mixer=new T.AnimationMixer(model),clip=model.animations[0];visual.visible=false;this.game.player.group.add(visual);resolve({visual,mixer,clip});
   },undefined,reject)).catch(error=>{this.cache.delete(index);throw error;});this.cache.set(index,pending);
  }return this.cache.get(index);
 }
 async play(kind){
  if(kind==='stop'){this.stop();return;}const index=Number(kind);
  if(!Number.isInteger(index)||!DANCES[index]||!this.game.state.is('EXPLORATION'))return;
  this.stop();const request=this.request;this.pending=true;this.status.textContent='Loading Dance '+(index+1)+'...';
  try{const dance=await this.load(index);if(request!==this.request||!this.game.state.is('EXPLORATION'))return;
   this.pending=false;this.kind=String(index);this.elapsed=0;this.duration=dance.clip.duration;this.visual=dance.visual;this.mixer=dance.mixer;
   this.game.follow.beginEmote();this.game.refreshCameraButton();
   const p=this.game.player;this.originalCharacterVisible=p.character?.visible;this.originalFallbackVisible=p.fallback.visible;if(p.character)p.character.visible=false;p.fallback.visible=false;
   this.mixer.stopAllAction();const action=this.mixer.clipAction(dance.clip).reset();action.setLoop(T.LoopOnce,1);action.clampWhenFinished=true;action.play();this.mixer.update(0);this.visual.visible=true;this.status.textContent='Dance '+(index+1)+' - move to stop.';this.ui.open=false;
  }catch(error){if(request===this.request){this.pending=false;this.status.textContent='Dance could not load. Please try again.';}console.warn('Dance load failed',error);}
 }
 stop(cancel=true){if(cancel)this.request=(this.request||0)+1;this.pending=false;if(this.kind!==null){const p=this.game.player;if(p.character)p.character.visible=this.originalCharacterVisible;p.fallback.visible=this.originalFallbackVisible;}this.kind=null;this.game.follow.endEmote?.();this.game.refreshCameraButton?.();this.mixer?.stopAllAction();if(this.visual)this.visual.visible=false;this.status.textContent='';}
 update(dt){
  const g=this.game,p=g.player;this.ui.hidden=!g.state.is('EXPLORATION');if(this.ui.hidden)this.ui.open=false;
  if(this.kind===null&&!this.pending)return;
  if(this.ui.hidden||Math.hypot(p.velocity.x,p.velocity.z)>.12||!p.grounded||(!this.pending&&g.follow.mode==='first')){this.stop();return;}
  if(this.kind===null)return;this.elapsed+=dt;if(this.elapsed>(this.duration||8)){this.stop();return;}this.mixer?.update(dt);
 }
}
