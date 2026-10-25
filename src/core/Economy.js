export const GAMES={chess:'Chess',basketball:'Basketball Shoot','shooting-range':'Target Shooting',cans:'Can Knockdown',memory:'Memory Tiles',maze:'Maze',pickleball:'Pickleball'};
export const COSTS=[0,30,50,75,100,140,180,225,275,350];
export const REWARDS=COSTS.map((cost,i)=>i===0?30:cost*2);
export const CATALOG=[
 ...[['flowers','Flowers','🌷',30],['balloons','Balloons','🎈',60],['teddy','Teddy bear','🧸',150],['gift-box','Gift box','🎁',300]].map(([id,name,icon,cost])=>({id,name,icon,cost,tab:'Gifts',currency:'coins'})),
 ...[['hat','Sun hat','👒',100],['glasses','Star glasses','🕶️',200],['backpack','Explorer backpack','🎒',400],['crown','Royal crown','👑',1000],['fox','Fox avatar','🦊',100],['panda','Panda avatar','🐼',150]].map(([id,name,icon,cost])=>({id,name,icon,cost,tab:'Accessories',currency:'coins'})),
 {id:'ticket-1',name:'1 Retry Ticket',icon:'🎟️',cost:100,tickets:1,tab:'Ticket Counter',currency:'coins'},
 {id:'ticket-3',name:'3 Retry Tickets',icon:'🎟️',cost:270,tickets:3,tab:'Ticket Counter',currency:'coins'},
 ...[['dragon','Dragon','🐉',5],['dolphin','Golden dolphin','🐬',8],['champion-cape','Starlight cape','🌟',15]].map(([id,name,icon,cost])=>({id,name,icon,cost,tab:'Exclusive Prizes',currency:'tokens'}))
];
export const DAILY=[{coins:40},{coins:50,tickets:1},{coins:60},{coins:75,tickets:1},{coins:90},{coins:110,tickets:2},{coins:150,tokens:2}];
export const TASKS=[
 {id:'play',name:'Carnival visitor',period:'daily',metric:'plays',target:3,coins:30},
 {id:'basket',name:'Basket scorer',period:'daily',metric:'baskets',target:3,coins:30,tickets:1},
 {id:'target',name:'On target',period:'daily',metric:'targets',target:5,coins:30},
 {id:'match',name:'Match winner',period:'daily',metric:'matches',target:1,coins:40},
 {id:'clear',name:'Level explorer',period:'daily',metric:'clears',target:2,coins:50,tickets:1},
 {id:'weekly',name:'Carnival tour',period:'weekly',metric:'games',target:5,coins:200,tokens:2},
 {id:'challenge',name:'Weekly challenger',period:'weekly',metric:'clears',target:15,coins:250,tickets:3,tokens:2}
];
const integer=v=>Number.isSafeInteger(v)&&v>=0;
const valid=(game,level)=>{if(!GAMES[game]||!Number.isInteger(level)||level<1||level>10)throw Error('Invalid game or level.');};
const add=(p,r)=>{for(const k of ['coins','tickets','tokens'])p[k]+=(r[k]||0);};
export function normalize(p){
 for(const k of ['coins','tickets'])if(!integer(p[k]))p[k]=0;
 p.tokens=integer(p.tokens)?p.tokens:integer(p.gems)?p.gems:0;delete p.gems;
 p.inventory=Array.isArray(p.inventory)?p.inventory:[];
 p.progress??={};p.economy??={};
 const e=p.economy;
 e.claims=Array.isArray(e.claims)?e.claims:[];
 e.achievements=Array.isArray(e.achievements)?e.achievements:[];
 e.daily??={};e.weekly??={};e.attempts??={};
 if(!integer(e.login))e.login=0;
 for(const game of Object.keys(GAMES)){
  const g=p.progress[game]??={};
  g.paid=Array.isArray(g.paid)?g.paid.filter(n=>Number.isInteger(n)&&n>=1&&n<=10):[];
  g.cleared=Array.isArray(g.cleared)?g.cleared.filter(n=>Number.isInteger(n)&&n>=1&&n<=10):[];
  g.paid=[...new Set([1,...g.paid,...g.cleared])];
  g.cleared=[...new Set(g.cleared)];
  g.replay=g.replay&&typeof g.replay==='object'?g.replay:{};
 }
 return p;
}
function periods(store,p){const day=store.day(),d=store.now(),monday=new Date(d.getFullYear(),d.getMonth(),d.getDate()-((d.getDay()+6)%7)),week=[monday.getFullYear(),monday.getMonth()+1,monday.getDate()].join('-');
 for(const [period,id] of [['daily',day],['weekly',week]])if(p.economy[period].id!==id)p.economy[period]={id,plays:0,baskets:0,targets:0,matches:0,clears:0,games:[]};
}
function count(store,p,metric,n=1,game){periods(store,p);for(const period of ['daily','weekly']){const q=p.economy[period];q[metric]=(q[metric]||0)+n;if(game&&metric==='clears'&&!q.games.includes(game))q.games.push(game);}}
export function installEconomy(ProfileStore){
 Object.assign(ProfileStore.prototype,{
  migrateProgress(){this.change((p,db)=>{
   if(p.economy.migrated)return;
   const read=k=>{try{return JSON.parse(this.local.getItem(k))||{}}catch{return {}}};
   const globalOwner=db.legacyProgressOwner??=p.id;
   const legacy={basketball:read('islandOfFun.basketball.'+p.id),maze:read('iof_maze.'+p.id),'shooting-range':read('islandShootingRange:'+p.id)};
   if(globalOwner===p.id)Object.assign(legacy,{memory:read('islandOfFun.memoryTiles.v3'),cans:read('islandCanKnockdown'),pickleball:read('islandOfFun.pickleball')});
   for(const game of Object.keys(GAMES)){
    const old=legacy[game]||{},original=p[game]||{},g=p.progress[game];
    const unlocked=Math.min(10,Math.max(1,Number(old.u||old.unlocked)||1,Number(original.unlocked)||1));
    const cleared=new Set(original.cleared||[]);
    for(let i=1;i<unlocked;i++)cleared.add(i);
    if(game==='memory')for(const n of Object.keys(old.best||{}))cleared.add(Number(n));
    for(const [n,v] of Object.entries(old.st||old.s||{}))if(typeof v==='number'&&v>0)cleared.add(Number(n)+1);
    if(game==='shooting-range')for(const n of old.d||[])cleared.add(n+1);
    g.cleared=[...cleared].filter(n=>Number.isInteger(n)&&n>=1&&n<=10);
    g.paid=[...new Set([...g.paid,...Array.from({length:unlocked},(_,i)=>i+1),...g.cleared])];
   }
   p.economy.migrated=true;this.awardBadges(p);
  });},
  awardBadges(p){const stamps=Object.values(p.progress).reduce((n,g)=>n+g.cleared.length,0);const badges=[['first-stamp',stamps>=1,'🌱',1],['ten-stamps',stamps>=10,'🏅',2],['all-games',Object.values(p.progress).every(g=>g.cleared.length),'🌈',3],['champion',stamps===70,'🏆',10]];
   for(const [id,ok,icon,tokens] of badges)if(ok&&!p.economy.achievements.includes(id)){p.economy.achievements.push(id);p.tokens+=tokens;if(id==='champion'&&!p.inventory.includes('champion'))p.inventory.push('champion');}
  },
  unlock(game,level){valid(game,level);return this.change(p=>{const g=p.progress[game];if(g.paid.includes(level))return false;if(!g.cleared.includes(level-1))throw Error('Complete the previous level first.');if(p.coins<COSTS[level-1])throw Error('Not enough Fun Coins. Replay an unlocked level or collect a free quest/login reward.');p.coins-=COSTS[level-1];g.paid.push(level);return true;});},
  beginAttempt(game,level){valid(game,level);return this.change(p=>{if(!p.progress[game].paid.includes(level))throw Error('Unlock this level first.');const id=globalThis.crypto.randomUUID();p.economy.attempts[game]={id,level,retries:0,done:false,metrics:{}};count(this,p,'plays',1,game);return id;});},
  finishAttempt(game,id){return this.change(p=>{const a=p.economy.attempts[game];if(!a||a.id!==id)throw Error('This attempt is no longer active.');if(a.done)return {coins:0,duplicate:true};const g=p.progress[game],level=a.level;const coins=REWARDS[level-1];
   if(!g.cleared.includes(level))g.cleared.push(level);
   a.done=true;p.coins+=coins;p.xp+=20;count(this,p,'clears',1,game);if(['chess','pickleball'].includes(game))count(this,p,'matches',1,game);this.awardBadges(p);return {coins};});},
  metric(game,id,name,eventId){if(!['baskets','targets'].includes(name))throw Error('Invalid metric.');this.change(p=>{const a=p.economy.attempts[game];if(!a||a.id!==id||a.done)return;const key=name+':'+eventId;if(a.metrics[key])return;a.metrics[key]=true;count(this,p,name,1,game);});},
  retry(game,id,restore){return this.change(p=>{const a=p.economy.attempts[game];if(!a||a.id!==id||a.done)throw Error('No active attempt to restore.');if(a.retries>=3)throw Error('Three retries already used this attempt.');if(p.tickets<1)throw Error('You need a Retry Ticket.');if(restore()!==true)throw Error('No valid state to restore. No ticket spent.');p.tickets--;a.retries++;return a.retries;});},
  claimDaily(){return this.change(p=>{if(p.lastGift===this.day())throw Error('Already collected today.');const yesterday=new Date(this.now());yesterday.setDate(yesterday.getDate()-1);const prev=[yesterday.getFullYear(),yesterday.getMonth()+1,yesterday.getDate()].join('-');p.economy.login=p.lastGift===prev?(p.economy.login%7)+1:1;const reward=DAILY[p.economy.login-1];add(p,reward);p.lastGift=this.day();p.giftCount++;return reward;});},
  questList(){const p=this.profile;periods(this,p);return TASKS.map(q=>{const period=p.economy[q.period],value=q.metric==='games'?period.games.length:period[q.metric]||0,key=q.id+':'+period.id;return {...q,value,key,claimed:p.economy.claims.includes(key)};});},
  claimTask(id){const q=this.questList().find(q=>q.id===id);if(!q)throw Error('Quest not found.');this.change(p=>{if(q.claimed||p.economy.claims.includes(q.key))throw Error('Reward already collected.');if(q.value<q.target)throw Error('Complete the quest first.');add(p,q);p.economy.claims.push(q.key);});},
  buy(id){const item=CATALOG.find(x=>x.id===id);if(!item)throw Error('Item not found.');this.change(p=>{if(!item.tickets&&p.inventory.includes(id))throw Error('Already owned.');if(p[item.currency]<item.cost)throw Error('Not enough '+item.currency+'.');p[item.currency]-=item.cost;if(item.tickets)p.tickets+=item.tickets;else p.inventory.push(id);});},
  equip(id){this.change(p=>{if(id==='default'){p.avatar='🎪';return;}if(!p.inventory.includes(id))throw Error('Item not owned.');const item=CATALOG.find(i=>i.id===id);if(id==='champion'){p.avatar='🏆';return;}if(!item)throw Error('This legacy item cannot be equipped.');p.avatar=item.icon;p.equipped=id;});},
  sendGift(){throw Error('Sending gifts is disabled until a multiplayer server is connected. No currency has been spent.');},
  recordBasketballWin(level,score){if(!Number.isInteger(level)||level<1||level>10||!Number.isInteger(score)||score<[2,2,3,3,3,3,3,3,4,4][level-1]||score>20)throw Error('Invalid basketball result.');return this.change(p=>{if(!p.progress.basketball.paid.includes(level))throw Error('Unlock the earlier basketball levels first.');p.basketball??={unlocked:1,cleared:[],bestScores:{}};p.basketball.bestScores[level]=Math.max(p.basketball.bestScores[level]||0,score);p.basketball.unlocked=Math.max(...p.progress.basketball.paid);p.basketball.cleared=[...p.progress.basketball.cleared];return {coins:0,tickets:0,xp:0};});},
  recordMazeWin(level,stars,time,moves){if(!Number.isInteger(level)||level<1||level>10||!Number.isInteger(stars)||stars<0||stars>3||!Number.isFinite(time)||time<0||!Number.isInteger(moves)||moves<1)throw Error('Invalid maze result.');return this.change(p=>{if(!p.progress.maze.paid.includes(level))throw Error('Unlock the earlier maze levels first.');p.maze??={unlocked:1,cleared:[],bestStars:{},bestTimes:{},bestMoves:{}};const m=p.maze;m.bestStars[level]=Math.max(m.bestStars[level]||0,stars);m.bestTimes[level]=Math.min(m.bestTimes[level]??Infinity,time);m.bestMoves[level]=Math.min(m.bestMoves[level]??Infinity,moves);m.unlocked=Math.max(...p.progress.maze.paid);m.cleared=[...p.progress.maze.cleared];return {coins:0,tickets:0,xp:0};});}
 });
}

