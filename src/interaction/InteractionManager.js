export class InteractionManager {
  constructor(attractions,player,prompt,onInteract){this.attractions=attractions;this.player=player;this.prompt=prompt;this.onInteract=onInteract;this.near=null;}
  update(){this.near=null;let best=Infinity;for(const a of this.attractions){const distance=a.position.distanceTo(this.player.group.position);if(distance<a.interactionRadius&&distance<best){this.near=a;best=distance;}}this.prompt.hidden=!this.near||globalThis.matchMedia?.('(any-pointer: coarse)').matches;if(this.near)this.prompt.textContent='[E] EXPLORE '+this.near.name;}
  interact(){if(this.near)this.onInteract(this.near);}
}
