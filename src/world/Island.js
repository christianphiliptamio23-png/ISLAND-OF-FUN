const T = window.THREE;
const materials = new Map();
function material(color) {
  if (!materials.has(color)) materials.set(color, new T.MeshStandardMaterial({color, roughness: .8}));
  return materials.get(color);
}
export function mesh(parent, geometry, color, x=0,y=0,z=0) {
  const object = new T.Mesh(geometry, material(color));
  object.position.set(x,y,z); object.castShadow=true; object.receiveShadow=true; parent.add(object); return object;
}
export function sign(parent, text, x,y,z, width=7) {
  const canvas=document.createElement('canvas'); canvas.width=1024;canvas.height=180;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#6c4025';ctx.fillRect(0,0,1024,180);ctx.strokeStyle='#ffce63';ctx.lineWidth=16;ctx.strokeRect(8,8,1008,164);
  ctx.fillStyle='#fff2c3';ctx.font='bold 68px Arial';ctx.textAlign='center';ctx.fillText(text,512,112);
  const object=new T.Mesh(new T.PlaneGeometry(width,width*.176),new T.MeshBasicMaterial({map:new T.CanvasTexture(canvas),side:T.DoubleSide}));object.position.set(x,y,z);parent.add(object);return object;
}
export class CarnivalBooth {
  constructor(parent, {title,x,z,primaryColor=0xe26572,width=6,height=4,rotation=0}) {
    this.group=new T.Group();this.group.position.set(x,0,z);this.group.rotation.y=rotation;parent.add(this.group);
    mesh(this.group,new T.BoxGeometry(width,2,3),primaryColor,0,1,-1);
    mesh(this.group,new T.BoxGeometry(width+.4,.25,1.5),0x995a32,0,2,1);
    for(const sx of [-width/2,width/2])mesh(this.group,new T.CylinderGeometry(.14,.18,height,8),0x74492f,sx,height/2,1.4);
    for(let i=0;i<8;i++) {const roof=mesh(this.group,new T.BoxGeometry(width/8,.2,4.5),i%2?0xffefc1:primaryColor,-width/2+width/16+i*width/8,height,-.2);roof.rotation.x=.12;}
    sign(this.group,title,0,height+.9,1.8,width+.6);
    for(let i=0;i<9;i++){const bulb=mesh(this.group,new T.SphereGeometry(.09,6,5),0xffdd77,-width/2+i*width/8,height-.3,2);bulb.material=new T.MeshStandardMaterial({color:0xffdf81,emissive:0xffb64b,emissiveIntensity:1.2});}
  }
}
export class Island {
  constructor(scene) {
    this.group=new T.Group();scene.add(this.group);this.colliders=[];this.attractions=[];this.sway=[];
    this.groundRay=new T.Raycaster();this.buildTerrain();this.loadTerrainModel();this.buildSky(scene);
  }
  outline(scale=1) {
    const shape=new T.Shape();for(let i=0;i<=80;i++){const a=i/80*Math.PI*2,r=29+1.5*Math.sin(a*3)+1.3*Math.cos(a*5);const x=Math.cos(a)*r*scale,z=Math.sin(a)*r*scale;i?shape.lineTo(x,z):shape.moveTo(x,z);}return shape;
  }
  layer(color,scale,depth,y) {
    const geometry=new T.ExtrudeGeometry(this.outline(scale),{depth,bevelEnabled:false,curveSegments:8});geometry.rotateX(Math.PI/2);
    return mesh(this.terrainFallback,geometry,color,0,y,0);
  }
  buildTerrain() {
    // The authored GLB is the playable land. Keep only the surrounding water here.
    this.oceanTextures=this.createOceanTextures();
    this.water=mesh(this.group,new T.PlaneGeometry(240,240,36,36),0x2f5fb0,0,-1.2,0);
    this.water.name='Animated sunset ocean';this.water.rotation.x=-Math.PI/2;this.water.castShadow=false;
    this.water.material=new T.MeshStandardMaterial({
      color:0xffffff,map:this.oceanTextures.color,
      bumpMap:this.oceanTextures.ripple,bumpScale:.18,
      roughness:.3,metalness:.12,
      emissive:0x123775,emissiveIntensity:.4
    });
    this.waveBase=this.water.geometry.attributes.position.array.slice();this.waterNormalElapsed=0;
  }
  createOceanTextures() {
    // Seamlessly tiled wave artwork, generated locally rather than downloaded.
    const size=512,colorCanvas=document.createElement('canvas'),rippleCanvas=document.createElement('canvas');
    for(const canvas of [colorCanvas,rippleCanvas]){canvas.width=size;canvas.height=size;}
    const color=colorCanvas.getContext('2d'),height=rippleCanvas.getContext('2d');
    color.fillStyle='#2f5fb0';color.fillRect(0,0,size,size);
    height.fillStyle='#808080';height.fillRect(0,0,size,size);
    const wave=(x,row)=>row*size/24+Math.sin(x/size*Math.PI*4+row*1.7)*5+Math.sin(x/size*Math.PI*8+row*.9)*2;
    for(let row=0;row<24;row++){
      for(const offset of [-size,0,size]){
        for(const [ctx,shade,width,dy] of [
          [color,'rgba(7,18,53,.32)',8,3],
          [color,'rgba(69,125,211,.6)',3,0],
          [height,'rgba(20,20,20,.55)',7,3],
          [height,'rgba(235,235,235,.65)',3,0]
        ]){
          ctx.strokeStyle=shade;ctx.lineWidth=width;ctx.beginPath();
          for(let x=0;x<=size;x+=4){const y=wave(x,row)+offset+dy;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}
          ctx.stroke();
        }
        // Short blue-gold glints break up the ripple bands without white glare.
        for(let part=0;part<3;part++){
          const start=(row*131+part*163)%size,length=18+(row*17+part*13)%42;
          color.lineWidth=1.5;color.strokeStyle=part===0?'rgba(255,173,112,.2)':'rgba(107,205,243,.38)';
          for(const shift of [-size,0]){
            color.beginPath();for(let dx=0;dx<=length;dx+=2){const x=start+dx+shift,y=wave(x,row)+offset-2;if(dx===0)color.moveTo(x,y);else color.lineTo(x,y);}color.stroke();
          }
        }
      }
    }
    const colorTexture=new T.CanvasTexture(colorCanvas),rippleTexture=new T.CanvasTexture(rippleCanvas);
    for(const texture of [colorTexture,rippleTexture]){texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.generateMipmaps=true;texture.minFilter=T.LinearMipmapLinearFilter;texture.magFilter=T.LinearFilter;}
    colorTexture.encoding=T.sRGBEncoding;colorTexture.repeat.set(12,12);rippleTexture.repeat.set(16,16);
    return {color:colorTexture,ripple:rippleTexture};
  }
  loadTerrainModel() {
    new T.GLTFLoader().load('./assets/models/island+terrain+3d+model%20(1).glb',g=>{
      const model=g.scene,box=new T.Box3().setFromObject(model),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());
      const scale=58/Math.max(size.x,size.z,1);
      model.name='Playable island terrain';model.scale.setScalar(scale);
      model.position.set(-center.x*scale,-box.min.y*scale+.02,-center.z*scale);
      model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      this.group.add(model);this.terrainModel=model;model.updateMatrixWorld(true);
      this.loadMazeGarden();this.loadCanKnockdown();
      this.loadBooth({url:'memory%20tiles%20booth%203d%20model.glb',id:'memory',name:'MEMORY TILES',x:6,z:-19,scale:8.82});
      this.loadBooth({url:'target%20shooting%20booth%203d%20model.glb',id:'target',name:'TARGET SHOOTING',x:9,z:-6,scale:8.82});
      this.loadBooth({url:'wooden%20chess%20table%203d%20model.glb',id:'chess',name:'CHESS VS AI',x:-9,z:7,scale:8.82,rotation:20});
      this.loadBooth({url:'pickleball%203d.glb',id:'pickleball',name:'PICKLEBALL',x:.5,z:8,scale:7.5,collidable:false});
      this.loadBooth({url:'basketball%20shoot%203d%20model.glb',id:'basketball',name:'BASKETBALL SHOOT',x:10,z:9,scale:8.82,rotation:-20});
    },undefined,error=>{this.terrainError=error;console.warn('Unable to load playable island terrain model.',error);});
  }
  buildCameos() {
    // A small stylised crowd keeps the island lively without adding another
    // heavyweight character download for every visitor.
    const routes=[
      [[-4,19],[4,19],[8,13],[7,5],[2,0],[-4,4],[-7,11]],
      [[-17,-13],[-10,-17],[-3,-13],[1,-6],[-4,0],[-12,-4]],
      [[8,-19],[15,-15],[18,-8],[13,-2],[7,-5],[5,-12]],
      [[-15,12],[-8,16],[0,14],[8,17],[14,11],[9,5],[1,7]],
      [[-12,6],[-5,8],[1,5],[5,10],[2,16],[-6,15],[-10,11]]
    ];
    // High-saturation tropical palette: the crowd stays visible against the
    // green terrain even from the wider third-person camera.
    const shirts=[0xff3d71,0x00bdf2,0xffbd14,0x32d68a,0xa855f7,0xff6b35,0x00c7b7];
    const skins=[0xffd0aa,0xe9ad7e,0xa96848,0x7c4938];
    for(let i=0;i<20;i++){
      const route=routes[i%routes.length], start=route[i%route.length];
      const guest=new T.Group();guest.name=`Island visitor ${i+1}`;
      guest.position.set(start[0],this.groundHeightAt(start[0],start[1],.2),start[1]);
      const scale=.76+(i%5)*.045;guest.scale.setScalar(scale);this.group.add(guest);
      const skin=skins[i%skins.length],shirt=shirts[i%shirts.length],pants=[0x174ea6,0x243b75,0x087f5b][i%3];
      const part=(geometry,color,x,y,z)=>mesh(guest,geometry,color,x,y,z);
      const shadow=part(new T.CircleGeometry(.43,12),0x173f36,0,.025,0);shadow.rotation.x=-Math.PI/2;shadow.material=new T.MeshBasicMaterial({color:0x173f36,transparent:true,opacity:.23,depthWrite:false});
      part(new T.CylinderGeometry(.27,.32,.68,8),shirt,0,.85,0);
      part(new T.SphereGeometry(.29,12,9),skin,0,1.48,0);
      part(new T.SphereGeometry(.31,10,7,0,Math.PI*2,0,Math.PI*.48),i%2?0x593d32:0x292b3e,0,1.6,0);
      const arms=[part(new T.CylinderGeometry(.075,.09,.55,7),skin,-.34,.92,0),part(new T.CylinderGeometry(.075,.09,.55,7),skin,.34,.92,0)];
      const legs=[part(new T.CylinderGeometry(.105,.12,.55,7),pants,-.14,.3,0),part(new T.CylinderGeometry(.105,.12,.55,7),pants,.14,.3,0)];
      for(const x of[-.14,.14])part(new T.BoxGeometry(.22,.12,.34),0xf4e7d0,x,.06,.08);
      // Give each visitor a recognisable little outfit. These are deliberately
      // simple mesh accessories so the busy scene remains inexpensive to draw.
      const accent=[0xfff04d,0xff4fa3,0x6ef2ff,0xb9f349][i%4];
      if(i%4===0){ // striped tee
        for(const y of[.69,.88,1.07])part(new T.BoxGeometry(.57,.055,.025),accent,0,y,.315);
      } else if(i%4===1){ // jacket lapels
        const left=part(new T.BoxGeometry(.12,.35,.035),accent,-.12,.95,.315),right=part(new T.BoxGeometry(.12,.35,.035),accent,.12,.95,.315);left.rotation.z=-.25;right.rotation.z=.25;
      } else if(i%4===2){ // festival lanyard and badge
        const cord=part(new T.TorusGeometry(.14,.018,5,10,Math.PI),0xffdf70,0,1.2,.31);cord.rotation.z=Math.PI;part(new T.BoxGeometry(.13,.16,.03),0xf6f0d6,0,.92,.33);
      } else { // simple floral badge
        for(let petal=0;petal<5;petal++)part(new T.SphereGeometry(.035,6,5),accent,.16+Math.sin(petal*1.256)*.06,1.02,.325+Math.cos(petal*1.256)*.01);
      }
      if(i%5===0){ // sun hat
        part(new T.CylinderGeometry(.31,.31,.12,12),0xe9bf67,0,1.82,0);part(new T.CylinderGeometry(.52,.52,.035,16),0xf3ce7b,0,1.76,0);
      } else if(i%5===1){ // baseball cap
        part(new T.SphereGeometry(.31,10,7,0,Math.PI*2,0,Math.PI*.48),accent,0,1.76,-.025);part(new T.BoxGeometry(.25,.035,.18),accent,0,1.72,.24);
      } else if(i%5===2){ // backpack
        part(new T.BoxGeometry(.42,.48,.16),accent,0,.92,-.25);for(const x of[-.18,.18]){const strap=part(new T.TorusGeometry(.17,.022,5,8,Math.PI),accent,x,.96,.03);strap.rotation.y=Math.PI;}
      } else if(i%5===3){ // cross-body carnival bag
        const strap=part(new T.BoxGeometry(.035,.75,.035),accent,0,.94,.325);strap.rotation.z=.42;part(new T.BoxGeometry(.24,.22,.09),accent,.25,.59,.26);
      } else { // a balloon held by a few guests
        const string=part(new T.CylinderGeometry(.012,.012,.85,5),0xf7e7cf,.47,1.33,0);string.rotation.z=-.18;const balloon=part(new T.SphereGeometry(.22,10,8),accent,.6,1.78,0);balloon.scale.y=1.18;
      }
      // Visitors still receive scene lighting but do not each render an expensive shadow map.
      guest.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;}});
      this.cameos.push({group:guest,route,point:(i+1)%route.length,speed:.55+(i%6)*.08,phase:i*.73,arms,legs});
    }
  }
  updateCameos(time,dt) {
    for(const cameo of this.cameos){
      const target=cameo.route[cameo.point],p=cameo.group.position;
      const dx=target[0]-p.x,dz=target[1]-p.z,dist=Math.hypot(dx,dz);
      if(dist<.18){cameo.point=(cameo.point+1)%cameo.route.length;continue;}
      const step=Math.min(dist,cameo.speed*dt);p.x+=dx/dist*step;p.z+=dz/dist*step;
      const y=this.groundHeightAt(p.x,p.z,p.y);p.y=y;
      const angle=Math.atan2(dx,dz);cameo.group.rotation.y+=Math.atan2(Math.sin(angle-cameo.group.rotation.y),Math.cos(angle-cameo.group.rotation.y))*Math.min(1,dt*7);
      const stride=Math.sin(time*10+cameo.phase)*.58;
      cameo.legs[0].rotation.x=stride;cameo.legs[1].rotation.x=-stride;
      cameo.arms[0].rotation.x=-stride*.75;cameo.arms[1].rotation.x=stride*.75;
    }
  }
  loadMazeGarden() {
    new T.GLTFLoader().load('./assets/models/maze+garden+3d+model.glb',g=>{
      const model=g.scene,box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),scale=13;
      const x=-8.5,y=2,z=-20,rotation=0;model.name='Maze garden';model.scale.setScalar(scale);model.rotation.y=T.MathUtils.degToRad(rotation);
      model.position.set(x-center.x*scale,this.groundHeightAt(x,z,.2)-box.min.y*scale,z-center.z*scale);
      model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      model.updateMatrix();model.matrixAutoUpdate=false;
      this.group.add(model);this.mazeGarden=model;
      this.obstacle(x,z,10,10);
      this.attractions.push({id:'maze',name:'HEDGE MAZE',position:new T.Vector3(x,this.groundHeightAt(x,z+6,.2),z+6),interactionRadius:4});
    },undefined,error=>console.warn('Unable to load maze garden model.',error));
  }
  loadCanKnockdown() {
    new T.GLTFLoader().load('./assets/models/can%20knockdown%20game%203d%20model.glb',g=>{
      const model=g.scene,box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3()),scale=9;
      const x=-8,y=2,z=-6,rotation=0;model.name='Can Knockdown booth';model.scale.setScalar(scale);model.rotation.y=T.MathUtils.degToRad(rotation);
      model.position.set(x-center.x*scale,this.groundHeightAt(x,z,.2)-box.min.y*scale,z-center.z*scale);
      model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      model.updateMatrix();model.matrixAutoUpdate=false;
      this.group.add(model);this.canKnockdown=model;
      const front=this.boothObstacle(model);
      this.attractions.push({id:'cans',name:'CAN KNOCKDOWN',position:front,interactionRadius:4});
    },undefined,error=>console.warn('Unable to load Can Knockdown model.',error));
  }
  loadBooth({url,id,name,x,z,scale,rotation=0,collidable=true}) {
    new T.GLTFLoader().load(`./assets/models/${url}`,g=>{
      const model=g.scene,box=new T.Box3().setFromObject(model),center=box.getCenter(new T.Vector3());
      model.name=name;model.scale.setScalar(scale);model.rotation.y=T.MathUtils.degToRad(rotation);
      model.position.set(x-center.x*scale,this.groundHeightAt(x,z,.2)-box.min.y*scale,z-center.z*scale);
      model.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
      model.updateMatrix();model.matrixAutoUpdate=false;
      this.group.add(model);
      const front=this.boothObstacle(model,collidable);
      this.attractions.push({id,name,position:front,interactionRadius:4});
    },undefined,error=>console.warn(`Unable to load ${name} model.`,error));
  }
  terrainHitAt(x,z) {
    if(!this.terrainModel)return null;
    this.groundRay.set(new T.Vector3(x,60,z),new T.Vector3(0,-1,0));this.groundRay.far=120;
    return this.groundRay.intersectObject(this.terrainModel,true)[0]||null;
  }
  walkSurfaceAt(x,z,footY,maxRise=.35) {
    if(!this.terrainModel)return null;
    this.groundRay.set(new T.Vector3(x,60,z),new T.Vector3(0,-1,0));this.groundRay.far=120;
    // The terrain GLB also contains trees and plants. Ignore their upper faces
    // instead of snapping the player's feet onto the first (highest) hit.
    let nearest=null;
    for(const hit of this.groundRay.intersectObject(this.terrainModel,true)){
      if(hit.point.y>footY+maxRise||(hit.face&&hit.face.normal.y<=.55))continue;
      if(!nearest||Math.abs(hit.point.y-footY)<Math.abs(nearest.point.y-footY))nearest=hit;
    }
    // The authored entrance bridge is visibly broken here, with no upward
    // facing triangles across its centre. Keep a narrow, smooth crossing so
    // walking out of the spawn area does not stop at the missing planks.
    if(!nearest&&Math.abs(x)<1.35&&z>=22.2&&z<=23.45&&footY>1&&footY<2.8){
      const y=1.73+(23.5-z)*.376;
      if(y<=footY+maxRise)nearest={point:new T.Vector3(x,y,z)};
    }
    return nearest;
  }
  groundHeightAt(x,z,fallback=.2,maxRise=Infinity) {
    const hit=Number.isFinite(maxRise)?this.walkSurfaceAt(x,z,fallback,maxRise):this.terrainHitAt(x,z);
    return hit?hit.point.y+.03:fallback;
  }
  obstacle(x,z,w,d){this.colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});}
  boothObstacle(model,collidable=true){
    model.updateMatrixWorld(true);
    const bounds=new T.Box3().setFromObject(model);
    if(collidable)this.colliders.push({minX:bounds.min.x,maxX:bounds.max.x,minZ:bounds.min.z,maxZ:bounds.max.z});
    // Keep the explore prompt outside the booth's collision footprint.
    const x=(bounds.min.x+bounds.max.x)/2,z=bounds.max.z+.85;
    return new T.Vector3(x,this.groundHeightAt(x,z,.2),z);
  }
  buildEntrance() {
    for(let i=0;i<15;i++)mesh(this.group,new T.BoxGeometry(4,.18,.74),0x9b643e,0,.12,25+i*.8);
    for(let z=25;z<37;z+=3)for(const x of[-2.2,2.2])mesh(this.group,new T.CylinderGeometry(.14,.2,2,7),0x70472d,x,0,z);
    for(const x of[-3,3]){mesh(this.group,new T.CylinderGeometry(.28,.35,6,8),0x70452a,x,3,24);this.obstacle(x,24,.8,.8);this.lantern(x,4.5,24.5);}
    sign(this.group,'ISLAND OF FUN',0,5.9,24,9);
    for(const x of[-3.5,3.5]){this.palm(x,25,1);this.flower(x,24.5);}
    for(let i=0;i<7;i++)mesh(this.group,new T.ConeGeometry(.32,.65,3),[0xf47998,0xffd665,0x65bfd6][i%3],-3+i,6.9,24);
  }
  buildAttractions() {
    const configs=[['target','TARGET SHOOTING',16,-4,0x4885b8],['cans','CAN KNOCKDOWN',-16,-4,0xdd6768],['basketball','BASKETBALL SHOOT',16,15,0xd8954e],['memory','MEMORY TILES',16,-18,0x8f75b9],['chess','CHESS VS AI',-16,15,0x6a9c88],['maze','HEDGE MAZE',-16,-18,0x4d925d]];
    for(const [id,name,x,z,color] of configs){
      if(['target','cans','basketball','chess'].includes(id)){new CarnivalBooth(this.group,{title:name,x,z,primaryColor:color});this.obstacle(x,z-1,6,3);}
      else sign(this.group,name,x,4.8,z,7);
      this.attractions.push({id,name,position:new T.Vector3(x,0,z+4),interactionRadius:3.2});
      if(id==='target')for(let i=0;i<3;i++){const disk=mesh(this.group,new T.CylinderGeometry(.55,.55,.14,24),i===2?0xffda58:0xef7180,x-1.8+i*1.8,3,z-.5);disk.rotation.x=Math.PI/2;mesh(this.group,new T.SphereGeometry(.2,12,8),0xfff0d5,x-1.8+i*1.8,3,z-.35);}
      if(id==='cans')for(let row=0;row<3;row++)for(let col=0;col<3-row;col++)mesh(this.group,new T.CylinderGeometry(.23,.23,.55,12),row%2?0xe26c70:0xf2e6cf,x+(col-(2-row)/2)*.55,2.5+row*.55,z);
      if(id==='basketball'){mesh(this.group,new T.BoxGeometry(2,1.3,.15),0xf3e9d4,x,3.5,z+.4);const hoop=mesh(this.group,new T.TorusGeometry(.45,.06,8,20),0xe67a47,x,3.05,z+1);hoop.rotation.x=Math.PI/2;for(let i=0;i<3;i++)mesh(this.group,new T.SphereGeometry(.25,12,10),0xce7b39,x-1+i,2.2,z+1);}
      if(id==='memory'){mesh(this.group,new T.BoxGeometry(5,.3,5),0x595573,x,.2,z);this.memoryTiles=[];for(let row=0;row<3;row++)for(let col=0;col<3;col++){const tile=mesh(this.group,new T.BoxGeometry(1.35,.16,1.35),[0x598eca,0xd8738f,0xe3c85b,0x6bb67c,0x9271c4,0xd68c53][(row*3+col)%6],x+(col-1)*1.55,.46,z+(row-1)*1.55);this.memoryTiles.push(tile);}}
      if(id==='chess')for(let row=0;row<8;row++)for(let col=0;col<8;col++)mesh(this.group,new T.BoxGeometry(.28,.07,.28),(row+col)%2?0x573e32:0xeee2be,x+(col-3.5)*.28,2.2,z+(row-3.5)*.28);
      if(id==='maze'){const walls=[[0,-3,7,.65],[-3.5,0,.65,6],[3.5,-1,.65,4],[0,0,3,.65],[-1,2,.65,3],[2,3,3,.65]];for(const [dx,dz,w,d] of walls){mesh(this.group,new T.BoxGeometry(w,1.8,d),0x31764e,x+dx,.9,z+dz);this.obstacle(x+dx,z+dz,w,d);}}
      if(id==='wheel'){this.wheel=new T.Group();this.wheel.position.set(x,2.9,z);this.group.add(this.wheel);for(let i=0;i<8;i++){const wedge=mesh(this.wheel,new T.CircleGeometry(1.8,12,i*Math.PI/4,Math.PI/4),[0xdf7390,0xe4bd63,0x6ca980,0x559ec1][i%4]);wedge.material.side=T.DoubleSide;}mesh(this.group,new T.CylinderGeometry(.15,.25,3,8),0x72482b,x,1.5,z);const rim=mesh(this.wheel,new T.TorusGeometry(1.85,.1,8,48),0xf7d981);const pointer=mesh(this.group,new T.ConeGeometry(.2,.45,3),0xffe497,x,5,z+.15);pointer.rotation.z=Math.PI;this.obstacle(x,z,1,1);}
    }
  }
  palm(x,z,scale=1) {
    const group=new T.Group();group.position.set(x,0,z);group.scale.setScalar(scale);this.group.add(group);
    mesh(group,new T.CylinderGeometry(.15,.32,4.5,7),0x986343,0,2.25,0);
    for(let i=0;i<7;i++){const leaf=mesh(group,new T.SphereGeometry(1,8,5),0x3d9860,Math.sin(i*.9)*1.1,4.6,Math.cos(i*.9)*1.1);leaf.scale.set(.5,.15,2);leaf.rotation.y=i*.9;leaf.rotation.z=.2;}
    this.obstacle(x,z,.7,.7);this.sway.push(group);
  }
  flower(x,z) {for(let i=0;i<5;i++)mesh(this.group,new T.SphereGeometry(.2,6,5),0xe887aa,x+Math.sin(i*1.256)*.23,.25,z+Math.cos(i*1.256)*.23);}
  lantern(x,y,z) {const bulb=mesh(this.group,new T.SphereGeometry(.18,8,6),0xffd99b,x,y,z);bulb.material=new T.MeshStandardMaterial({color:0xffd99b,emissive:0xffb957,emissiveIntensity:1.1});}
  buildDecorations() {
    for(let i=0;i<28;i++){const a=i/28*Math.PI*2;const x=Math.cos(a)*25,z=Math.sin(a)*25;if(z>23&&Math.abs(x)<5)continue;this.palm(x,z,.75+(i%4)*.1);this.flower(x+1,z);mesh(this.group,new T.DodecahedronGeometry(.4,0),0x8a8592,x-1,.2,z+1);}
    for(let z=-22;z<23;z+=6)for(const x of[-3,3]){mesh(this.group,new T.CylinderGeometry(.06,.09,2.3,6),0x755039,x,1.15,z);this.lantern(x,2.4,z);}
    for(const x of[-6.5,6.5]){mesh(this.group,new T.BoxGeometry(2,.2,.7),0x985f3d,x,.8,2);mesh(this.group,new T.BoxGeometry(2,.6,.15),0x985f3d,x,1.25,1.7);this.obstacle(x,2,2,.8);}
    const ferris=new T.Group();ferris.position.set(22,7,-11);this.group.add(ferris);this.ferris=ferris;
    mesh(ferris,new T.TorusGeometry(4,.13,6,40),0xf2d18e);
    for(let i=0;i<10;i++){const a=i*Math.PI/5;const spoke=mesh(ferris,new T.BoxGeometry(.07,8,.07),0xe6c189);spoke.rotation.z=a;mesh(ferris,new T.BoxGeometry(.8,.8,.8),i%2?0xd37c9c:0x6ba8c7,Math.sin(a)*4,Math.cos(a)*4,0);}
  }
  buildSky(scene) {
    const geometry=new T.SphereGeometry(160,24,16);const mat=new T.ShaderMaterial({side:T.BackSide,uniforms:{},vertexShader:'varying vec3 v; void main(){v=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 v;void main(){float h=normalize(v).y;vec3 col=mix(vec3(.72,.35,.39),vec3(.055,.09,.25),smoothstep(-.05,.6,h));gl_FragColor=vec4(col,1.);}'});scene.add(new T.Mesh(geometry,mat));
    const stars=[];for(let i=0;i<180;i++){const a=i*2.4,h=35+(i%37)*2;stars.push(Math.cos(a)*90,h,Math.sin(a)*90);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(stars,3));scene.add(new T.Points(g,new T.PointsMaterial({size:.25,color:0xf6dcdd})));
    const moon=mesh(scene,new T.SphereGeometry(3,16,12),0xffe5ad,-50,60,-75);moon.material=new T.MeshBasicMaterial({color:0xffe5ad});const cover=mesh(scene,new T.SphereGeometry(2.8,16,12),0x111a40,-48.7,60.5,-73.5);cover.material=new T.MeshBasicMaterial({color:0x111a40});
    this.clouds=[];for(let i=0;i<7;i++){const cloud=new T.Group();for(let j=0;j<4;j++){const puff=mesh(cloud,new T.SphereGeometry(2.5,8,6),0xb39cae,j*2,0,0);puff.scale.set(1,.4,.65);}cloud.position.set(-60+i*18,27+i%3*3,-45);scene.add(cloud);this.clouds.push(cloud);}
  }
  // Explore all land freely, with collisions around solid attractions.
  walkable(x,z,footY) {return this.terrainModel?!!(Number.isFinite(footY)?this.walkSurfaceAt(x,z,footY):this.terrainHitAt(x,z)):true;}
  blocked(x,z,footY) {return !this.walkable(x,z,footY)||this.colliders.some(b=>x>b.minX-.38&&x<b.maxX+.38&&z>b.minZ-.38&&z<b.maxZ+.38);}
  update(time,dt) {
    const p=this.water.geometry.attributes.position;
    for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(this.waveBase[i*3]*.22+time)*.09+Math.cos(this.waveBase[i*3+1]*.18+time*.7)*.07);
    p.needsUpdate=true;this.waterNormalElapsed+=dt;
    // Recalculate water lighting a few times per second instead of every frame.
    if(this.waterNormalElapsed>=.12){this.water.geometry.computeVertexNormals();this.waterNormalElapsed=0;}
    this.oceanTextures.color.offset.set(time*.006,time*.0025);
    this.oceanTextures.ripple.offset.set(-time*.009,time*.004);
    this.clouds.forEach(c=>{c.position.x+=dt*.2;if(c.position.x>80)c.position.x=-80;});
  }
}
