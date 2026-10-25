const T=window.THREE;
export class ThirdPersonCamera {
  constructor(camera,player,world,input){this.camera=camera;this.player=player;this.world=world;this.input=input;this.yaw=0;this.input.viewYaw=0;this.pitch=.34;this.firstPitch=0;this.distance=7;this.mode='third';this.ray=new T.Raycaster();}
  setMode(mode){this.mode=mode==='first'?'first':'third';this.snap=true;this.input.clearMotion();}
  beginEmote(){
    if(!this.emoteView)this.emoteView={mode:this.mode,yaw:this.yaw,pitch:this.pitch,distance:this.distance};
    this.setMode('third');this.yaw=this.player.group.rotation.y;this.pitch=.12;this.distance=6.5;
  }
  endEmote(){
    if(!this.emoteView)return;const saved=this.emoteView;this.emoteView=null;
    Object.assign(this,saved);this.snap=true;this.input.clearMotion();
  }
  update(dt){
    this.yaw-=this.input.dx*.004;this.input.viewYaw=this.yaw;
    const first=this.mode==='first';this.player.group.visible=!first;
    if(first){
      this.firstPitch=T.MathUtils.clamp(this.firstPitch+this.input.dy*.003,-1.3,1.3);
      this.input.clearMotion();
      // Follow eye height without adding procedural head-bob.
      const eye=this.player.group.position.clone().add(new T.Vector3(0,1.6,0));
      const direction=new T.Vector3(-Math.sin(this.yaw)*Math.cos(this.firstPitch),-Math.sin(this.firstPitch),-Math.cos(this.yaw)*Math.cos(this.firstPitch));
      this.camera.position.copy(eye);this.camera.lookAt(eye.clone().add(direction));this.snap=false;return;
    }
    this.pitch=T.MathUtils.clamp(this.pitch+this.input.dy*.003,.12,1.1);
    this.distance=T.MathUtils.clamp(this.distance+this.input.zoom,4,12);this.input.clearMotion();
    const target=this.player.group.position.clone().add(new T.Vector3(0,1.3,0));
    if(!this.focus||this.snap)this.focus=target.clone();
    else this.focus.lerp(target,1-Math.exp(-dt*14));
    const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));
    this.ray.set(this.focus,offset);this.ray.far=this.distance;
    // The terrain GLB includes foliage. Its branches must not pull the
    // follow camera into the player; only solid attraction models obstruct it.
    const solids=this.world.group.children.filter(o=>o!==this.world.terrainModel&&o!==this.world.water);
    const hits=this.ray.intersectObjects(solids,true).filter(h=>!h.object.isSprite&&h.distance>.6);
    const safeDistance=hits.length?Math.max(1.5,hits[0].distance-.4):this.distance;
    if(this.snap||this.currentDistance===undefined)this.currentDistance=safeDistance;
    else if(safeDistance<this.currentDistance)this.currentDistance=safeDistance;
    else this.currentDistance+=Math.min(1,1-Math.exp(-dt*4))*(safeDistance-this.currentDistance);
    const desired=this.focus.clone().addScaledVector(offset,this.currentDistance);
    // Focus and collision distance are already smoothed. A second position lag
    // can leave the camera inside scenery while the player walks past it.
    this.camera.position.copy(desired);
    this.snap=false;this.camera.lookAt(this.focus);
  }
}
