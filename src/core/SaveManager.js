import {ProfileStore} from './ProfileStore.js';

export class SaveManager {
  constructor(){this.profiles=new ProfileStore();const p=this.profiles.profile;this.data={username:p.name,coins:p.coins,gems:p.gems,tickets:p.tickets,settings:{...p.settings}};}
  save(){this.profiles.updateGame(this.data);}
}
