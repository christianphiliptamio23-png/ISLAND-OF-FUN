const T=window.THREE;
export class ThirdPersonCamera {
  constructor(camera,player,world,input){this.camera=camera;this.player=player;this.world=world;this.input=input;this.yaw=0;this.input.viewYaw=0;this.pitch=.34;this.firstPitch=0;this.distance=7;this.mode='third';this.ray=new T.Raycaster();}
  setMode(mode){this.mode=mode==='first'?'first':'third';this.snap=true;this.input.clearMotion();}
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
    const offset=new T.Vector3(Math.sin(this.yaw)*Math.cos(this.pitch),Math.sin(this.pitch),Math.cos(this.yaw)*Math.cos(this.pitch));
    this.ray.set(target,offset);this.ray.far=this.distance;
    const hits=this.ray.intersectObjects(this.world.group.children,true).filter(h=>!h.object.isSprite);
    const distance=hits.length?Math.max(1,hits[0].distance-.4):this.distance;
    const desired=target.clone().addScaledVector(offset,distance);
    if(this.snap)this.camera.position.copy(desired);else this.camera.position.lerp(desired,1-Math.exp(-dt*18));
    this.snap=false;this.camera.lookAt(target);
  }
}
