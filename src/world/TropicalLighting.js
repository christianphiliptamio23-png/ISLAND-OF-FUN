const T=window.THREE;
export const PHASE_LIGHT={morning:[0xffd3a1,.85,.8,0x91cee7],day:[0xfff5df,1,.85,0x69bdeb],afternoon:[0xffa45d,.8,.7,0xd59179],night:[0x9dbbff,.22,.38,0x0b173b]};
export class TropicalLighting{
 constructor(scene){
  this.scene=scene;scene.background=new T.Color(0x91cee7);this.ambient=new T.HemisphereLight(0xbecfea,0x345546,.8);scene.add(this.ambient);
  this.sun=new T.DirectionalLight(0xffd3a1,.85);this.sun.position.set(-20,35,25);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40});scene.add(this.sun);
  const orb=(color,x,y,z,size)=>{const m=new T.Mesh(new T.SphereGeometry(size,16,12),new T.MeshBasicMaterial({color,transparent:true,depthWrite:false,fog:false}));m.position.set(x,y,z);scene.add(m);return m;};
  this.sunOrb=orb(0xffeb99,-55,65,55,4);this.moon=orb(0xe4ecff,-45,12,-125,5);
  const positions=[];for(let i=0;i<240;i++){const a=i*2.39996,h=25+i%65;positions.push(Math.cos(a)*100,h,Math.sin(a)*100);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.stars=new T.Points(geo,new T.PointsMaterial({color:0xe4edff,size:.32,transparent:true,depthWrite:false,fog:false}));scene.add(this.stars);
  this.night=window.IslandTime?.phase==='night'?1:0;this.color=new T.Color();this.skyColor=new T.Color();this.lanterns=[];this.snapped=false;
 }
 addLanterns(world){this.world=world;
 const pixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);pixels[i]=255;pixels[i+1]=192;pixels[i+2]=83;pixels[i+3]=Math.round(Math.pow(Math.max(0,1-r),2)*255);}
 const glowTexture=new T.DataTexture(pixels,32,32,T.RGBAFormat);glowTexture.needsUpdate=true;
 for(const [x,z] of [[-2.2,26],[2.2,26],[-2.2,18],[2.2,18],[-8,5],[8,5]]){
  const group=new T.Group();group.position.set(x,0,z);const pole=new T.Mesh(new T.CylinderGeometry(.08,.12,2.8,6),new T.MeshStandardMaterial({color:0x644625}));pole.position.y=1.4;group.add(pole);
  const material=new T.MeshStandardMaterial({color:0xffde83,emissive:0xff921f,emissiveIntensity:0});const glass=new T.Mesh(new T.BoxGeometry(.4,.55,.4),material);glass.position.y=2.55;group.add(glass);
  for(const y of [2.25,2.85]){const cap=new T.Mesh(new T.BoxGeometry(.52,.08,.52),pole.material);cap.position.y=y;group.add(cap);}
  for(const x of [-.21,.21])for(const z of [-.21,.21]){const frame=new T.Mesh(new T.BoxGeometry(.035,.55,.035),pole.material);frame.position.set(x,2.55,z);group.add(frame);}
  const glow=new T.Sprite(new T.SpriteMaterial({map:glowTexture,color:0xffd891,transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false,opacity:0}));glow.position.y=2.55;glow.scale.set(2.4,2.4,1);group.add(glow);
  const light=new T.PointLight(0xffb552,0,9,2);light.position.y=2.55;group.add(light);this.scene.add(group);this.lanterns.push({group,material,light,glow});
 }}
 update(dt){
  const phase=window.IslandTime?.phase||'morning',p=PHASE_LIGHT[phase]||PHASE_LIGHT.morning,a=this.snapped?1-Math.exp(-Math.max(0,dt)/1.5):1;this.snapped=true;
  this.night+=(Number(phase==='night')-this.night)*a;this.sun.color.lerp(this.color.setHex(p[0]),a);this.sun.intensity+=(p[1]-this.sun.intensity)*a;this.ambient.intensity+=(p[2]-this.ambient.intensity)*a;this.scene.background.lerp(this.skyColor.setHex(p[3]),a);
  this.sunOrb.material.opacity=1-this.night;this.moon.material.opacity=this.night;this.stars.material.opacity=this.night;
  for(const lamp of this.lanterns){
   if(!lamp.placementChecked&&this.world.terrainModel){lamp.placementChecked=true;const hit=this.world.walkSurfaceAt?this.world.walkSurfaceAt(lamp.group.position.x,lamp.group.position.z,2,3):this.world.terrainHitAt(lamp.group.position.x,lamp.group.position.z);if(hit){lamp.group.position.y=hit.point.y;lamp.placed=true;}else lamp.group.visible=false;}
   lamp.material.emissiveIntensity=.15+this.night*1.5;lamp.light.intensity=this.night*1.8;lamp.glow.material.opacity=this.night*.9;
  }
 }
}
