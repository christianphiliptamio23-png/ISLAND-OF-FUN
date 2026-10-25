export class InputManager {
  constructor(canvas) {
    this.keys=new Set();this.jump=false;this.dx=0;this.dy=0;this.zoom=0;this.drag=false;
    addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;this.keys.add(e.key.toLowerCase());if(e.code==='Space'){this.jump=true;e.preventDefault();}if(e.key.startsWith('Arrow'))e.preventDefault();});
    addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{this.keys.clear();this.drag=false;});
    let pointer=null,lastX=0,lastY=0;
    canvas.addEventListener('pointerdown',e=>{if(pointer!==null)return;pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;this.drag=true;canvas.setPointerCapture(e.pointerId);});
    const release=e=>{if(e.pointerId===pointer){pointer=null;this.drag=false;}};
    for(const type of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(type,release);
    addEventListener('blur',()=>{pointer=null;});
    canvas.addEventListener('pointermove',e=>{if(this.drag&&e.pointerId===pointer){this.dx+=e.clientX-lastX;this.dy+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;}});canvas.addEventListener('wheel',e=>{this.zoom+=e.deltaY*.01;e.preventDefault();},{passive:false});
  }
  clearMotion(){this.dx=this.dy=this.zoom=0;this.jump=false;}
}
