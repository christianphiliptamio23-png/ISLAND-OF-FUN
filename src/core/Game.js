import {TropicalLighting} from '../world/TropicalLighting.js';
import {CharacterEmotes} from '../player/CharacterEmotes.js';
import {MobileControls} from './MobileControls.js';
import {GameStateManager} from './GameStateManager.js';
import {InputManager} from './InputManager.js';
import {SaveManager} from './SaveManager.js';
import {Island} from '../world/Island.js';
import {PlayerController} from '../player/PlayerController.js';
import {ThirdPersonCamera} from '../player/ThirdPersonCamera.js';
import {InteractionManager} from '../interaction/InteractionManager.js';
const T=window.THREE, $=s=>document.querySelector(s);
export class Game {
  constructor(){
    this.state=new GameStateManager();this.save=new SaveManager();window.GameAudio?.setSettings(()=>this.save.data.settings);this.input=new InputManager($('#island'));this.clock=new T.Clock();this.time=0;
    this.renderer=new T.WebGLRenderer({canvas:$('#island'),antialias:true,alpha:true});this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.9;this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.camera=new T.PerspectiveCamera(48,innerWidth/innerHeight,.1,350);this.camera.position.set(35,28,45);
    this.menuScene=new T.Scene();this.lights(this.menuScene);this.scene=new T.Scene();this.lights(this.scene);
    this.world=new Island(this.scene);this.lighting[1].addLanterns(this.world);this.player=new PlayerController(this.scene,this.world,this.camera,this.input);this.follow=new ThirdPersonCamera(this.camera,this.player,this.world,this.input);
    this.follow.setMode(this.save.data.settings.cameraMode);
    this.orbit=new T.OrbitControls(this.camera,this.renderer.domElement);this.orbit.enableDamping=true;this.orbit.enablePan=false;this.orbit.autoRotate=true;this.orbit.autoRotateSpeed=.7;this.orbit.minDistance=25;this.orbit.maxDistance=100;
    this.interactions=new InteractionManager(this.world.attractions,this.player,$('#interaction'),a=>this.preview(a));
    this.emotes=new CharacterEmotes(this);this.mobile=new MobileControls(this);this.bind();this.resize();this.refreshHUD();this.frame();
  }
  lights(scene){(this.lighting??=[]).push(new TropicalLighting(scene));}
  bind(){
    addEventListener('resize',()=>this.resize());addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='economy:changed')this.refreshHUD();});
    addEventListener('keydown',e=>{if(e.repeat)return;if(e.key==='Escape'){if(this.state.is('EXPLORATION'))this.pause();else if(this.state.is('PAUSED'))this.resume();}if(e.key.toLowerCase()==='e'&&this.state.is('EXPLORATION'))this.interactions.interact();if(e.key==='F3'){e.preventDefault();$('#debug').hidden=!$('#debug').hidden;}});
    $('#hud-settings').onclick=()=>{this.pause();this.settings();};
    $('#map-button').onclick=()=>{if(!this.state.is('EXPLORATION'))return;this.state.set('PAUSED');this.input.clearMotion();this.dialog('Island map','Find your next game on the island.',[['CLOSE MAP',()=>this.resume()]]);const img=document.createElement('img');img.src='./assets/images/Tropical%20Island%20of%20Fun%20Game%20Map.png';img.alt='Island of Fun map with attractions';img.className='dialog-map';$('#dialog-fields').append(img);};
    $('#camera-view').onclick=()=>{if(this.state.is('EXPLORATION'))this.toggleCamera();};
    this.refreshCameraButton();
    addEventListener('keydown',e=>{
      if(e.repeat||e.ctrlKey||e.altKey||e.metaKey||e.target?.isContentEditable||['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target?.tagName))return;
      if(e.key.toLowerCase()==='v'&&this.state.is('EXPLORATION')){e.preventDefault();this.toggleCamera();}
    });
  }
  refreshHUD(){const p=this.save.profiles.profile;this.save.data.coins=p.coins;this.save.data.tickets=p.tickets;this.save.data.tokens=p.tokens;if($('#tokens'))$('#tokens').textContent=p.tokens;$('#coins').textContent=this.save.data.coins;$('#tickets').textContent=this.save.data.tickets;}
  refreshCameraButton(){const first=this.follow.mode==='first',button=$('#camera-view');button.textContent=first?'First person':'Third person';button.setAttribute('aria-pressed',String(first));button.setAttribute('aria-label','Camera: '+(first?'first person. Switch to third person':'third person. Switch to first person'));}
  toggleCamera(){this.follow.setMode(this.follow.mode==='first'?'third':'first');this.save.data.settings.cameraMode=this.follow.mode;this.save.save();this.refreshCameraButton();this.follow.update(0);}
  play(){if(!this.state.is('MENU'))return;this.state.set('TRANSITION');this.orbit.enabled=false;this.input.keys.clear();this.input.clearMotion();this.transition={elapsed:0,start:this.camera.position.clone(),target:this.orbit.target.clone()};$('#fade').classList.add('on');}
  transitionFrame(dt){
    const tr=this.transition;tr.elapsed+=dt;
    if(tr.elapsed>=.6&&!tr.switched){
      if(!this.player.respawn()){
        tr.elapsed=.6;
        if(this.world.terrainError){$('#fade').classList.remove('on');this.state.set('PAUSED');this.dialog('Island could not load','Please reload to load the bridge before entering.',[['RETRY',()=>location.reload()],['MAIN MENU',()=>this.menu()]]);}
        return;
      }
      tr.switched=true;tr.elapsed=.6;this.activeScene=this.scene;
      tr.spawn=this.player.group.position.clone();
      this.camera.position.set(tr.spawn.x+12,tr.spawn.y+15,tr.spawn.z+20);
      tr.start.copy(this.camera.position);tr.target.copy(tr.spawn).add(new T.Vector3(0,2,0));
      $('#fade').classList.remove('on');
    }
    if(tr.switched){const t=T.MathUtils.clamp((tr.elapsed-.6)/2,0,1),e=t*t*(3-2*t);this.camera.position.lerpVectors(tr.start,tr.spawn.clone().add(new T.Vector3(0,4,7)),e);this.camera.lookAt(tr.target);this.player.animateCharacter(dt,this.time);this.player.group.visible=t>.3;if(t===1){this.state.set('EXPLORATION');$('#hud').hidden=false;$('#controls-hint').hidden=false;this.input.clearMotion();}}
  }
  pause(){this.state.set('PAUSED');this.input.keys.clear();this.dialog('Island paused','Take a breather.',[['RESUME',()=>this.resume()],['SETTINGS',()=>this.settings()],['CONTROLS',()=>this.dialog('Controls','WASD / arrows: walk · Shift: run · Space: jump · Drag: orbit · Wheel: zoom · E: explore attraction · Esc: pause',[['BACK',()=>this.pause()]])],['RETURN TO MAIN MENU',()=>this.menu()]]);}
  resume(){this.dismiss();this.state.set('EXPLORATION');this.input.clearMotion();}
  menu(){location.assign('/');}
  async preview(a){
    window.GameAudio?.play('enter');
    this.save.profiles.recordVisit(a.id);
    if(a.id==='target'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Shooting Range','',[]);
      const leave=()=>{this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {ShootingBoothGame}=await import('../../games/shooting-range/ShootingBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.shooting=new ShootingBoothGame();this.shooting.open($('#dialog-fields'),leave,this.save.profiles);}
      }catch(error){console.error('Unable to start shooting range',error);this.dialog('Shooting Range','The shooting range could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='maze'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Island Maze','',[]);
      const syncProgress=()=>{const p=this.save.profiles.profile;this.save.data.coins=p.coins;this.save.data.tickets=p.tickets;this.save.data.tokens=p.tokens;this.refreshHUD();};
      const leave=()=>{syncProgress();this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {MazeBoothGame}=await import('../../games/maze/MazeBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.maze=new MazeBoothGame();this.maze.open($('#dialog-fields'),leave,syncProgress,this.save.profiles);}
      }catch(error){console.error('Unable to start maze',error);this.dialog('Island Maze','The maze could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='basketball'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Basketball Shoot','',[]);
      const syncProgress=()=>{const p=this.save.profiles.profile;this.save.data.coins=p.coins;this.save.data.tickets=p.tickets;this.save.data.tokens=p.tokens;this.refreshHUD();};
      const leave=()=>{syncProgress();this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {BasketballBoothGame}=await import('../../games/basketball/BasketballBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.basketball=new BasketballBoothGame();this.basketball.open($('#dialog-fields'),leave,syncProgress,this.save.profiles);}
      }catch(error){console.error('Unable to start basketball',error);this.dialog('Basketball Shoot','Basketball could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='memory'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Memory Tiles','',[]);
      const leave=()=>{this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {MemoryTilesBoothGame}=await import('../../games/memory/MemoryTilesBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.memory=new MemoryTilesBoothGame();this.memory.open($('#dialog-fields'),leave);}
      }catch(error){console.error('Unable to start Memory Tiles',error);this.dialog('Memory Tiles','Memory Tiles could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='cans'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Can Knockdown','',[]);
      const leave=()=>{this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {CanKnockdownBoothGame}=await import('../../games/cans/CanKnockdownBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.cans=new CanKnockdownBoothGame();this.cans.open($('#dialog-fields'),leave);}
      }catch(error){console.error('Unable to start Can Knockdown',error);this.dialog('Can Knockdown','Can Knockdown could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='pickleball'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Pickleball','',[]);
      const leave=()=>{this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {PickleballBoothGame}=await import('../../games/pickleball/PickleballBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.pickleball=new PickleballBoothGame();this.pickleball.open($('#dialog-fields'),leave);}
      }catch(error){console.error('Unable to start Pickleball',error);this.dialog('Pickleball','Pickleball could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    if(a.id==='chess'){
      this.state.set('MINIGAME');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();$('#interaction').hidden=true;
      this.dialog('Chess','',[]);
      const leave=()=>{this.dismiss();this.state.set('EXPLORATION');this.input.keys.clear();this.input.drag=false;this.input.clearMotion();};
      try{
        const {ChessBoothGame}=await import('../../games/chess/ChessBoothGame.js');
        if(this.state.is('MINIGAME')&&!$('#dialog').hidden){this.chess=new ChessBoothGame();this.chess.open($('#dialog-fields'),leave);}
      }catch(error){console.error('Unable to start Chess',error);this.dialog('Chess','Chess could not start. Please return to the island and try again.',[['RETURN TO ISLAND',leave]]);}
      return;
    }
    this.state.set('MINIGAME');this.input.keys.clear();$('#interaction').hidden=true;
    const descriptions={target:'Blue and red shooting range with normal and golden targets.',cans:'Three-tier can stack and throwing counter.',basketball:'Backboard, hoop and ball rack.',memory:'Nine colored tiles on a raised platform.',pickleball:'Pickleball court ready for a quick rally.',maze:'Walk through the hedge paths and find the northern exit.',wheel:'Eight-segment prize wheel in the central plaza.'};
    this.dialog(a.name,descriptions[a.id]+' Attraction preview — mini-game rules are scheduled for the following build phases.',[['RETURN TO ISLAND',()=>{this.dismiss();this.state.set('EXPLORATION');}]]);
  }
  dialog(title,copy,buttons){const d=$('#dialog');d.hidden=false;$('#dialog-title').textContent=title;$('#dialog-copy').textContent=copy;$('#dialog-fields').replaceChildren();const actions=$('#dialog-actions');actions.replaceChildren();for(const [label,action]of buttons){const button=document.createElement('button');button.textContent=label;button.onclick=action;actions.append(button);}}
  dismiss(){$('#dialog').hidden=true;}
  profile(create){this.dialog(create?'Create your island profile':'Island profile','Profiles are saved on this device.',[['SAVE',()=>{const value=$('#name-input').value.trim();if(value)this.save.data.username=value.slice(0,24);this.save.save();this.refreshHUD();this.dismiss();}],['BACK',()=>this.dismiss()]]);const input=document.createElement('input');input.id='name-input';input.maxLength=24;input.value=this.save.data.username;input.setAttribute('aria-label','Explorer name');$('#dialog-fields').append(input);}
  settings(){this.dialog('Settings','Master volume and Sound effects control island and mini-game sounds.',[['SAVE',()=>{this.save.save();this.resize();if(this.state.is('PAUSED'))this.pause();else this.dismiss();}],['BACK',()=>{if(this.state.is('PAUSED'))this.pause();else this.dismiss();}]]);const fields=$('#dialog-fields');for(const [key,label]of [['master','Master volume'],['music','Music volume'],['effects','Sound effects'],['sensitivity','Mouse sensitivity']]){const row=document.createElement('label');row.textContent=label;const range=document.createElement('input');range.type='range';range.min=key==='sensitivity'?.3:0;range.max=key==='sensitivity'?2:100;range.step=key==='sensitivity'?.1:1;range.value=this.save.data.settings[key];range.oninput=()=>{this.save.data.settings[key]=Number(range.value);window.GameAudio?.refresh();};row.append(range);fields.append(row);}const select=document.createElement('select');select.setAttribute('aria-label','Graphics quality');for(const label of['LOW','MEDIUM','HIGH'])select.add(new Option(label,label));select.value=this.save.data.settings.graphics;select.onchange=()=>this.save.data.settings.graphics=select.value;fields.append(select);}
  resize(){const quality=this.save.data.settings.graphics;this.renderer.setPixelRatio(Math.min(devicePixelRatio,matchMedia('(any-pointer: coarse)').matches?1.25:2,quality==='LOW'?1:quality==='HIGH'?2:1.5));this.renderer.shadowMap.enabled=quality!=='LOW';this.renderer.setSize(innerWidth,innerHeight);this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();}
  updateMiniMap(){const p=this.player.group.position,img=$('#map-button img'),x=T.MathUtils.clamp((p.x+30)/60,.08,.92),y=T.MathUtils.clamp((p.z+30)/60,.08,.92);img.style.left=`calc(50% - ${x*200}%)`;img.style.top=`calc(50% - ${y*200}%)`;}
  frame(){requestAnimationFrame(()=>this.frame());const elapsed=this.clock.getDelta(),dt=Math.min(elapsed,.05);if(document.hidden)return;this.lighting.forEach(light=>light.update(Math.min(elapsed,.25)));this.mobile.update();if(!this.state.is('PAUSED')&&!this.state.is('MINIGAME')){this.time+=dt;this.world.update(this.time,dt);}if(this.state.is('MENU'))this.orbit.update();if(this.state.is('TRANSITION'))this.transitionFrame(dt);if(this.state.is('EXPLORATION')){this.player.update(dt,this.time);this.updateMiniMap();this.input.dx*=this.save.data.settings.sensitivity;this.input.dy*=this.save.data.settings.sensitivity;this.follow.update(dt);this.interactions.update();}window.IslandTime?.setExploring(this.state.is('EXPLORATION'));this.emotes.update(dt);if(!this.state.is('MINIGAME'))this.renderer.render(this.activeScene||this.menuScene,this.camera);if(!$('#debug').hidden)$('#debug').textContent='FPS '+Math.round(1/dt)+' | '+this.state.current+' | Player '+this.player.group.position.toArray().map(n=>n.toFixed(1)).join(', ')+' | Camera '+this.camera.position.toArray().map(n=>n.toFixed(1)).join(', ');}
}
export const game = new Game();
