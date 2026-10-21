export class InputManager {
  constructor(canvas) {
    this.keys=new Set();this.jump=false;this.dx=0;this.dy=0;this.zoom=0;this.drag=false;
    addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;this.keys.add(e.key.toLowerCase());if(e.code==='Space'){this.jump=true;e.preventDefault();}if(e.key.startsWith('Arrow'))e.preventDefault();});
    addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));addEventListener('blur',()=>{this.keys.clear();this.drag=false;});
    canvas.addEventListener('pointerdown',e=>{this.drag=true;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointerup',()=>this.drag=false);
    canvas.addEventListener('pointermove',e=>{if(this.drag){this.dx+=e.movementX;this.dy+=e.movementY;}});canvas.addEventListener('wheel',e=>{this.zoom+=e.deltaY*.01;e.preventDefault();},{passive:false});
  }
  clearMotion(){this.dx=this.dy=this.zoom=0;this.jump=false;}
}
