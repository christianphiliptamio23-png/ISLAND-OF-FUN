const T=window.THREE;
export class PlayerController {
  constructor(scene,island,camera,input) {
    this.island=island;this.camera=camera;this.input=input;this.velocity=new T.Vector3();this.vertical=0;this.grounded=true;
    this.group=new T.Group();scene.add(this.group);this.group.position.set(0,.2,26);this.group.rotation.y=Math.PI;this.group.visible=false;
    this.fallback=new T.Group();this.group.add(this.fallback);
    const make=(g,color,x,y,z)=>{const m=new T.Mesh(g,new T.MeshStandardMaterial({color,roughness:.8}));m.position.set(x,y,z);m.castShadow=true;this.fallback.add(m);return m;};
    make(new T.CylinderGeometry(.28,.35,.7,10),0x4c9fd2,0,.95,0);make(new T.SphereGeometry(.3,14,10),0xffc99f,0,1.53,0);
    make(new T.SphereGeometry(.32,12,8,0,Math.PI*2,0,Math.PI/2),0x57392d,0,1.58,0);
    this.limbs=[];for(const x of[-.4,.4])this.limbs.push(make(new T.CylinderGeometry(.09,.1,.6,8),0xffc99f,x,.98,0));for(const x of[-.16,.16]){this.limbs.push(make(new T.CylinderGeometry(.11,.12,.55,8),0x334f81,x,.35,0));make(new T.BoxGeometry(.25,.15,.38),0xf7ead0,x,.12,.08);}
    const shadow=new T.Mesh(new T.CircleGeometry(.45,16),new T.MeshBasicMaterial({color:0x163d35,transparent:true,opacity:.3,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;this.group.add(shadow);
    this.loadCharacter();
  }
  loadCharacter() {
    const attach=(model,animations=[],name='Kid character')=>{
      model.updateMatrixWorld(true);
      const box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3());
      if(!Number.isFinite(size.y)||size.y<=0){console.error('Kid character has invalid bounds');return;}
      const scale=1.85/size.y;
      const visual=new T.Group();visual.name=name;visual.add(model);
      visual.scale.setScalar(scale);
      visual.position.set(-(box.min.x+box.max.x)*.5*scale,-box.min.y*scale,-(box.min.z+box.max.z)*.5*scale);visual.userData.restY=visual.position.y;
      model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      this.character=visual;this.group.add(visual);visual.visible=false;
      this.characterModel=model;
      this.animationActions={};
      if(animations.length){
        this.mixer=new T.AnimationMixer(model);
        for(const clip of animations){
          const name=clip.name.toLowerCase();
          const kind=/jump/.test(name)?'jump':/run|sprint/.test(name)?'run':/walk/.test(name)?'walk':/idle|stand/.test(name)?'idle':null;
          if(kind&&!this.animationActions[kind])this.animationActions[kind]=this.mixer.clipAction(clip);
        }
        // Mixamo FBX exports commonly name the take "mixamo.com". It is the
        // supplied walking take, so use the first clip when no semantic name exists.
        if(!this.animationActions.walk)this.animationActions.walk=this.mixer.clipAction(animations[0]);
      }
      // Evaluate a real rig pose before revealing the mesh, including while
      // the entrance transition is running. This GLB only supplies a walk clip.
      this.animateCharacter(0,0);
      visual.visible=!!this.currentAction;this.fallback.visible=!visual.visible;
    };
    new T.GLTFLoader().load('./assets/models/kid+character+3d+model.glb',gltf=>attach(gltf.scene,gltf.animations,'Animated kid character'),undefined,error=>console.error('Animated kid GLB could not load.',error));
  }
  respawn(x=0,z=26) {
    const hit=this.island.terrainHitAt(x,z);
    if(!hit)return false; // Never spawn at a guessed height before terrain loads.
    this.group.position.set(x,hit.point.y+.03,z);
    this.group.rotation.y=Math.PI;this.velocity.set(0,0,0);
    this.vertical=0;this.grounded=true;this.walkHeight=this.group.position.y;this.movingBackward=false;
    this.input.jump=false;this.input.keys.clear();this.input.clearMotion();
    this.animateCharacter(0,0);
    return true;
  }
  animateCharacter(dt,time) {
    const speed=Math.hypot(this.velocity.x,this.velocity.z);
    if(this.mixer){
      const kind=!this.grounded?'jump':speed>3.6?'run':speed>.1?'walk':'idle';
      const next=this.animationActions[kind]||this.animationActions.walk||this.animationActions.idle;
      const resting=kind==='idle'&&!this.animationActions.idle;
      if(next&&next!==this.currentAction){
        const previous=this.currentAction;
        if(previous)previous.fadeOut(.15);
        next.reset().setEffectiveWeight(1).play();
        if(previous&&!resting)next.fadeIn(.15);
        this.currentAction=next;
      }
      if(next){
        if(resting){
          // Freeze a relaxed frame of the supplied take, not the bind/T pose.
          next.stopFading().setEffectiveWeight(1);
          next.time=next.getClip().duration*.125;
        }
        // Keep the walk cycle in step with the player's real movement speed.
        next.paused=resting;
        const base=kind==='run'&&this.animationActions.run?6:3.8;
        next.timeScale=resting?1:T.MathUtils.clamp(speed/base,.55,1.7);
      }
      this.mixer.update(dt);
    }
    if(this.character){
      // Let the rigged GLB control all visible body motion. Do not layer the
      // earlier procedural bob/sway on top of its authored walk animation.
      this.character.position.y=this.character.userData.restY;
      this.character.rotation.z=0;
      if(this.characterModel){
        this.characterModel.rotation.x=0;
        this.characterModel.rotation.y=0;
        this.characterModel.scale.set(1,1,1);
        // Some animation frames move the rig's root below its visual feet.
        // Lift only those frames so the character never sinks through terrain.
        this.character.updateMatrixWorld(true);
        this.characterBounds??=new T.Box3();this.characterBounds.setFromObject(this.characterModel);
        const floorY=this.group.position.y+.025;
        if(this.characterBounds.min.y<floorY)this.character.position.y+=floorY-this.characterBounds.min.y;
      }
    }
    this.limbs.forEach((limb,i)=>limb.rotation.x=Math.sin(time*11+(i%2)*Math.PI)*Math.min(.55,speed*.13));
  }
  update(dt,time) {
    // Use the camera's control heading, not its lagging physical position.
    // Strafing and backing up must not steer the camera around the player.
    const keys=this.input.keys,yaw=this.input.viewYaw||0;
    const f=new T.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),right=new T.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const dir=new T.Vector3();if(keys.has('w')||keys.has('arrowup'))dir.add(f);if(keys.has('s')||keys.has('arrowdown'))dir.sub(f);if(keys.has('a')||keys.has('arrowleft'))dir.sub(right);if(keys.has('d')||keys.has('arrowright'))dir.add(right);
    const touch=this.input.touchMove;if(touch){dir.addScaledVector(f,-touch.y);dir.addScaledVector(right,touch.x);}if(dir.lengthSq()>1)dir.normalize();const moving=dir.lengthSq()>.01;this.movingBackward=dir.dot(f)<-.1;const speed=(keys.has('shift')||this.input.touchRun)?4.5:2.8;this.velocity.lerp(dir.multiplyScalar(speed),1-Math.exp(-dt*(moving?10:16)));
    const pos=this.group.position,footY=this.grounded?pos.y:(this.walkHeight??pos.y),nx=pos.x+this.velocity.x*dt,nz=pos.z+this.velocity.z*dt;if(!this.island.blocked(nx,pos.z,footY))pos.x=nx;else this.velocity.x=0;if(!this.island.blocked(pos.x,nz,footY))pos.z=nz;else this.velocity.z=0;
    if(this.input.jump&&this.grounded){window.GameAudio?.play('jump');this.vertical=6;this.grounded=false;}this.input.jump=false;this.vertical-=16*dt;pos.y+=this.vertical*dt;const groundY=this.island.groundHeightAt(pos.x,pos.z,footY,.35);if(pos.y<=groundY){if(!this.grounded)window.GameAudio?.play('land');pos.y=groundY;this.vertical=0;this.grounded=true;this.walkHeight=groundY;}
    if(this.grounded&&moving&&Math.hypot(this.velocity.x,this.velocity.z)>.25){this.soundStep=(this.soundStep||0)+dt;if(this.soundStep>(speed>3?.28:.42)){window.GameAudio?.play('step');this.soundStep=0;}}else this.soundStep=0;
    if(moving&&Math.hypot(this.velocity.x,this.velocity.z)>.25){const angle=Math.atan2(this.velocity.x,this.velocity.z);this.group.rotation.y+=Math.atan2(Math.sin(angle-this.group.rotation.y),Math.cos(angle-this.group.rotation.y))*(1-Math.exp(-dt*12));}
    this.animateCharacter(dt,time);
  }
}
