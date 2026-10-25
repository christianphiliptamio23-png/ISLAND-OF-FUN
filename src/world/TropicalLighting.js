const T=window.THREE;
export const PHASE_LIGHT={morning:[0xffd3a1,.85,.8,0x91cee7],day:[0xfff5df,1,.85,0x69bdeb],afternoon:[0xffa45d,.8,.7,0xd59179],night:[0x9dbbff,.22,.38,0x0b173b]};
export class TropicalLighting{
 constructor(scene){
  this.scene=scene;scene.background=new T.Color(0x91cee7);this.ambient=new T.HemisphereLight(0xbecfea,0x345546,.8);scene.add(this.ambient);
  this.sun=new T.DirectionalLight(0xffd3a1,.85);this.sun.position.set(-20,35,25);this.sun.castShadow=true;this.sun.shadow.mapSize.set(1024,1024);Object.assign(this.sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40});scene.add(this.sun);
  const orb=(color,x,y,z,size)=>{const m=new T.Mesh(new T.SphereGeometry(size,16,12),new T.MeshBasicMaterial({color,transparent:true,depthWrite:false,fog:false}));m.position.set(x,y,z);scene.add(m);return m;};
  this.sunOrb=orb(0xffeb99,-55,65,55,4);this.moon=orb(0xe4ecff,50,60,-70,3);
  const positions=[];for(let i=0;i<240;i++){const a=i*2.39996,h=25+i%65;positions.push(Math.cos(a)*100,h,Math.sin(a)*100);}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));this.stars=new T.Points(geo,new T.PointsMaterial({color:0xe4edff,size:.32,transparent:true,depthWrite:false,fog:false}));scene.add(this.stars);
  this.night=window.IslandTime?.phase==='night'?1:0;this.color=new T.Color();this.skyColor=new T.Color();this.lanterns=[];this.snapped=false;
 }
 addLanterns(world){this.world=world;for(const [x,z] of [[-3,21],[3,21],[-3,13],[3,13],[-8,5],[8,5]]){
  const group=new T.Group();group.position.set(x,0,z);const pole=new T.Mesh(new T.CylinderGeometry(.08,.12,2.8,6),new T.MeshStandardMaterial({color:0x644625}));pole.position.y=1.4;group.add(pole);
  const material=new T.MeshStandardMaterial({color:0xffde83,emissive:0xffa83f,emissiveIntensity:0});const glass=new T.Mesh(new T.BoxGeometry(.4,.55,.4),material);glass.position.y=2.55;group.add(glass);
  const light=new T.PointLight(0xffb552,0,7,2);light.position.y=2.55;group.add(light);this.scene.add(group);this.lanterns.push({group,material,light});
 }}
 update(dt){
  const phase=window.IslandTime?.phase||'morning',p=PHASE_LIGHT[phase]||PHASE_LIGHT.morning,a=this.snapped?1-Math.exp(-Math.max(0,dt)/1.5):1;this.snapped=true;
  this.night+=(Number(phase==='night')-this.night)*a;this.sun.color.lerp(this.color.setHex(p[0]),a);this.sun.intensity+=(p[1]-this.sun.intensity)*a;this.ambient.intensity+=(p[2]-this.ambient.intensity)*a;this.scene.background.lerp(this.skyColor.setHex(p[3]),a);
  this.sunOrb.material.opacity=1-this.night;this.moon.material.opacity=this.night;this.stars.material.opacity=this.night;
  for(const lamp of this.lanterns){if(!lamp.placed&&this.world.terrainModel){const hit=this.world.terrainHitAt(lamp.group.position.x,lamp.group.position.z);if(hit){lamp.group.position.y=hit.point.y;lamp.placed=true;}else lamp.group.visible=false;}lamp.material.emissiveIntensity=.1+this.night*2;lamp.light.intensity=this.night*1.1;}
 }
}
