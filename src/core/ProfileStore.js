const KEY='island-of-fun-profiles-v1', GUEST='island-of-fun-guest-id', LEGACY='island-of-fun-v2';
const SETTINGS={sensitivity:1,graphics:'MEDIUM',master:70,music:50,effects:70};
export const SHOP=[
  {id:'fox',name:'Fox avatar',icon:'🦊',currency:'coins',cost:75},
  {id:'panda',name:'Panda avatar',icon:'🐼',currency:'coins',cost:125},
  {id:'crown',name:'Royal avatar',icon:'👑',currency:'coins',cost:200},
  {id:'dolphin',name:'Dolphin avatar',icon:'🐬',currency:'tickets',cost:3},
  {id:'dragon',name:'Dragon avatar',icon:'🐉',currency:'gems',cost:5},
  {id:'coin-pack',name:'50 coins',icon:'🪙',currency:'tickets',cost:3,repeatable:true}
];
export const QUESTS=[
  {id:'explore',name:'First steps',description:'Enter the playable island.',target:1,value:p=>p.plays,coins:50,tickets:1},
  {id:'visit',name:'Booth explorer',description:'Explore three different booths with E.',target:3,value:p=>p.visits.length,coins:100,tickets:2},
  {id:'gift',name:'A little gift',description:'Collect your daily gift.',target:1,value:p=>p.giftCount,coins:50,tickets:1}
];
const parse=(storage,key,fallback)=>{try{return JSON.parse(storage.getItem(key))||fallback}catch{return fallback}};
export class ProfileStore {
  constructor(local=globalThis.localStorage,session=globalThis.sessionStorage,now=()=>new Date()){
    this.local=local;this.session=session;this.now=now;
    const db=this.read();
    if(!db.profiles[db.activeAccount]||db.profiles[db.activeAccount].guest){db.activeAccount=null;const id=this.session.getItem(GUEST);if(!db.profiles[id]?.guest){const p=this.makeGuest();if(!Object.keys(db.profiles).length){const old=parse(this.local,LEGACY,{});for(const k of ['coins','gems','tickets'])if(Number.isFinite(old[k])&&old[k]>=0)p[k]=old[k];p.settings={...SETTINGS,...old.settings};}db.profiles[p.id]=p;this.session.setItem(GUEST,p.id);}}
    this.write(db);
  }
  read(){const db=parse(this.local,KEY,{profiles:{},activeAccount:null});return db&&typeof db.profiles==='object'&&db.profiles?db:{profiles:{},activeAccount:null}}
  id(db){return db.activeAccount||this.session.getItem(GUEST)}
  get profile(){const db=this.read();return structuredClone(db.profiles[this.id(db)])}
  get accounts(){return Object.values(this.read().profiles).filter(p=>!p.guest).map(p=>structuredClone(p))}
  day(){const d=this.now();return [d.getFullYear(),d.getMonth()+1,d.getDate()].join('-')}
  makeGuest(){const first=['Sunny','Coral','Lucky','Mango','Coconut','Happy'],last=['Panda','Otter','Dolphin','Fox','Turtle','Koala'];const pick=a=>a[Math.floor(Math.random()*a.length)];return {id:globalThis.crypto.randomUUID(),name:pick(first)+pick(last)+(100+Math.floor(Math.random()*900)),guest:true,avatar:'🎪',coins:250,gems:0,tickets:0,xp:0,plays:0,visits:[],giftCount:0,lastGift:null,claims:[],inventory:[],friends:[],mailClaimed:false,settings:{...SETTINGS},dailyVisits:{day:this.day(),ids:[]},lastEvent:null,lastPlay:null}}
  write(db){this.local.setItem(KEY,JSON.stringify(db));const p=db.profiles[this.id(db)];if(p)this.local.setItem(LEGACY,JSON.stringify({username:p.name,coins:p.coins,gems:p.gems,tickets:p.tickets,settings:p.settings}));}
  change(fn){const db=this.read(),p=db.profiles[this.id(db)];if(!p)throw Error('Please refresh to load your profile.');const result=fn(p,db);this.write(db);return result}
  createAccount(name){name=String(name).trim();if(!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,23}$/.test(name))throw Error('Use 3–24 letters, numbers, spaces, underscores or hyphens.');const db=this.read();if(Object.values(db.profiles).some(p=>!p.guest&&p.name.toLowerCase()===name.toLowerCase()))throw Error('That account name already exists on this device.');const old=db.profiles[this.id(db)],p=old?.guest?structuredClone(old):this.makeGuest();if(old?.guest)delete db.profiles[old.id];p.id=globalThis.crypto.randomUUID();p.name=name;p.guest=false;db.profiles[p.id]=p;db.activeAccount=p.id;this.session.removeItem(GUEST);this.write(db);return p}
  selectAccount(id){const db=this.read();if(!db.profiles[id]||db.profiles[id].guest)throw Error('Account not found on this device.');db.activeAccount=id;this.write(db)}
  useGuest(){const db=this.read();db.activeAccount=null;let id=this.session.getItem(GUEST);if(!db.profiles[id]?.guest){const p=this.makeGuest();id=p.id;db.profiles[id]=p;this.session.setItem(GUEST,id)}this.write(db)}
  updateGame(data){this.change(p=>{for(const k of ['coins','gems','tickets'])if(Number.isFinite(data[k])&&data[k]>=0)p[k]=data[k];p.settings={...p.settings,...data.settings};})}
  settings(values){this.change(p=>{p.settings={...p.settings,...values};for(const k of ['master','music','effects'])p.settings[k]=Math.max(0,Math.min(100,+p.settings[k]||0));p.settings.sensitivity=Math.max(.3,Math.min(2,+p.settings.sensitivity||1));if(!['LOW','MEDIUM','HIGH'].includes(p.settings.graphics))p.settings.graphics='MEDIUM';})}
  recordPlay(){this.change(p=>{p.plays++;if(p.lastPlay!==this.day()){p.xp+=10;p.lastPlay=this.day()}})}
  recordVisit(id){this.change(p=>{if(!p.visits.includes(id)){p.visits.push(id);p.xp+=25}if(p.dailyVisits.day!==this.day())p.dailyVisits={day:this.day(),ids:[]};if(!p.dailyVisits.ids.includes(id))p.dailyVisits.ids.push(id);})}
  claimDaily(){this.change(p=>{if(p.lastGift===this.day())throw Error('You already collected today’s gift.');p.coins+=100;p.tickets+=2;p.gems++;p.xp+=20;p.lastGift=this.day();p.giftCount++;})}
  claimQuest(id){const q=QUESTS.find(q=>q.id===id);if(!q)throw Error('Quest not found.');this.change(p=>{if(p.claims.includes(id))throw Error('Reward already collected.');if(q.value(p)<q.target)throw Error('Complete the quest first.');p.coins+=q.coins;p.tickets+=q.tickets;p.xp+=20;p.claims.push(id);})}
  claimEvent(){this.change(p=>{if(p.lastEvent===this.day())throw Error('Event reward already collected today.');if(p.dailyVisits.day!==this.day()||p.dailyVisits.ids.length<3)throw Error('Visit three different booths today first.');p.coins+=150;p.tickets+=3;p.gems++;p.xp+=30;p.lastEvent=this.day();})}
  claimMail(){this.change(p=>{if(p.mailClaimed)throw Error('Welcome gift already collected.');p.mailClaimed=true;p.coins+=50;})}
  buy(id){const item=SHOP.find(x=>x.id===id);if(!item)throw Error('Item not found.');this.change(p=>{if(!item.repeatable&&p.inventory.includes(id))throw Error('You already own this avatar.');if(p[item.currency]<item.cost)throw Error('Not enough '+item.currency+'.');p[item.currency]-=item.cost;if(item.repeatable)p.coins+=50;else{p.inventory.push(id);p.avatar=item.icon;}})}
  equip(id){this.change(p=>{if(id==='default'){p.avatar='🎪';return}const item=SHOP.find(x=>x.id===id&&!x.repeatable);if(!item||!p.inventory.includes(id))throw Error('Avatar not owned.');p.avatar=item.icon;})}
  recordMazeWin(level,stars,time,moves){
    if(!Number.isInteger(level)||level<1||level>10||!Number.isInteger(stars)||stars<0||stars>3||!Number.isFinite(time)||time<0||!Number.isInteger(moves)||moves<1)throw Error('Invalid maze result.');
    return this.change(p=>{
      p.maze??={unlocked:1,cleared:[],bestStars:{},bestTimes:{},bestMoves:{}};
      const m=p.maze;if(level>m.unlocked)throw Error('Complete the earlier maze levels first.');
      const first=!m.cleared.includes(level),reward=first?{coins:50,tickets:1,xp:20}:{coins:0,tickets:0,xp:0};
      if(first)m.cleared.push(level);
      m.unlocked=Math.max(m.unlocked,Math.min(10,level+1));m.bestStars[level]=Math.max(m.bestStars[level]||0,stars);
      m.bestTimes[level]=Math.min(m.bestTimes[level]??Infinity,time);m.bestMoves[level]=Math.min(m.bestMoves[level]??Infinity,moves);
      p.coins+=reward.coins;p.tickets+=reward.tickets;p.xp+=reward.xp;return reward;
    });
  }
  recordBasketballWin(level,score){
    const targets=[2,2,3,3,3,3,3,3,4,4];
    if(!Number.isInteger(level)||level<1||level>10||!Number.isInteger(score)||score<targets[level-1]||score>20)throw Error('Invalid basketball result.');
    return this.change(p=>{
      p.basketball??={unlocked:1,cleared:[],bestScores:{}};
      const b=p.basketball;if(level>b.unlocked)throw Error('Complete the earlier basketball levels first.');
      const first=!b.cleared.includes(level),reward=first?{coins:50,tickets:1,xp:20}:{coins:0,tickets:0,xp:0};
      if(first)b.cleared.push(level);
      b.unlocked=Math.max(b.unlocked,Math.min(10,level+1));b.bestScores[level]=Math.max(b.bestScores[level]||0,score);
      p.coins+=reward.coins;p.tickets+=reward.tickets;p.xp+=reward.xp;return reward;
    });
  }
  friendCard(){return 'IOF:'+encodeURIComponent(JSON.stringify({name:this.profile.name,avatar:this.profile.avatar}))}
  addFriend(card){let friend;try{if(!card.startsWith('IOF:'))throw Error();friend=JSON.parse(decodeURIComponent(card.slice(4)));if(typeof friend.name!=='string'||!/^[A-Za-z0-9][A-Za-z0-9 _-]{2,23}$/.test(friend.name))throw Error();}catch{throw Error('Paste an Island of Fun player card.')}this.change(p=>{if(friend.name===p.name)throw Error('That is your own player card.');if(p.friends.some(f=>f.name===friend.name))throw Error('This friend is already on your list.');p.friends.push({name:friend.name,avatar:SHOP.some(x=>x.icon===friend.avatar)?friend.avatar:'🎪'});})}
}
