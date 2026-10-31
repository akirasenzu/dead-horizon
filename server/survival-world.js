import {createVehicleMechanics} from './vehicle-mechanics.js';
import {floorOf,sameLevel} from '../web/game/levels.js';
import {createSurvivalRules,SURVIVAL_VERSION,characterBuild} from '../web/game/survival.js';
export function createSurvivalWorld({catalog,clothes,ammunition,mods,compatibleMods,housing,roads,free,clearLine}){
 const rules=createSurvivalRules({catalog,clothes,ammunition,mods,compatibleMods}),containers=new Map(),grid=new Map();
 const mechanics=createVehicleMechanics({catalog,rules,announce,drop,clearLine});
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function register(c){containers.set(c.id,c);const key=Math.floor(c.x/20)+':'+Math.floor(c.z/20);if(!grid.has(key))grid.set(key,[]);grid.get(key).push(c)}
 // Every accessible home has persistent storage; contents are generated only on first search.
 for(const h of housing.houses.filter(h=>h.enterable)){
  const points=[h.point(0,-1.6),...h.furniture.slice(0,1).map(f=>h.point(f.u,f.v+f.d/2+.8))];
  points.forEach((point,j)=>{const p=free(point[0],point[1],.35);if(housing.insideHouse(p.x,p.z)?.id!==h.id&&j)return;register({id:'house:'+h.id+':'+j,...p,name:j?'Placard':'Réserves de la maison',kind:j?'work':'home',house:h.id,houseId:h.id,floor:0})});
 }
 for(const h of housing.houses.filter(h=>h.floorCount>1))for(let floor=1;floor<h.floorCount;floor++){
  let point=h.stairs.top;for(const f of housing.floorFurniture(h,floor)){const q=h.point(f.u,f.v+f.d/2+.8);if(!housing.blocked(q[0],q[1],.45,{floor,houseId:h.id})){point=q;break}}
  register({id:'house:'+h.id+':floor:'+floor,x:point[0],z:point[1],floor,house:h.id,houseId:h.id,name:'Rangements · étage '+floor,kind:floor%2?'home':'work'});
 }
 function nearby(world,p,r=4){const out=[];for(let x=Math.floor((p.x-r)/20);x<=Math.floor((p.x+r)/20);x++)for(let z=Math.floor((p.z-r)/20);z<=Math.floor((p.z+r)/20);z++)out.push(...(grid.get(x+':'+z)||[]));out.push(...world.vehicles.map(v=>({id:'car:'+v.id,x:v.x,z:v.z,name:'Boîte à gants · '+catalog.vehicles.find(s=>s.id===v.spec).name,kind:'car',vehicle:v.id})),...Object.values(world.piles||{}));return out.filter(c=>sameLevel(c,p)&&distance(c,p)<=r&&clearLine(c,p)).sort((a,b)=>distance(a,p)-distance(b,p))}
 function migrate(world){
  if(world.survivalVersion===SURVIVAL_VERSION){mechanics.migrate(world);return;}
  world.survivalVersion=SURVIVAL_VERSION;world.containers={};world.piles={};world.loot=[];
  world.vehicles=Array.from({length:catalog.vehicles.length},(_,i)=>{const point=roads[(i*73+29)%roads.length],p=free(point.x+3,point.z,2);return{id:'v'+i,...p,spec:catalog.vehicles[(i*31+8)%catalog.vehicles.length].id,angle:i*2.4,speed:0,fuel:i%4?5+i%22:0,condition:25+i%65,parts:i%5,driver:null,locked:i%3===0}});
  world.car=world.vehicles[0];
  for(const p of world.players){const hp=p.hp,hunger=p.hunger;rules.starter(p,p);p.hp=hp;p.hunger=hunger}
  for(const c of Object.values(world.characters||{})){const p=c.state,hp=p.hp,hunger=p.hunger;rules.starter(p,p);p.hp=hp;p.hunger=hunger}
 mechanics.migrate(world);
 }
 function state(world,c){let saved=world.containers[c.id];if(!saved){const items=c.kind==='pile'?c.items:rules.randomBag(c.id,c.kind);if(c.vehicle){const v=world.vehicles.find(v=>v.id===c.vehicle);if(!v.locked)items.push({uid:crypto.randomUUID(),def:'vehicleKey',qty:1,vehicle:v.id})}saved=world.containers[c.id]={items,searched:[]}}return saved}
 rules.definitions.set('vehicleKey',{id:'vehicleKey',name:'Clé de voiture',kind:'key',weight:.02});
 function announce(p,message,open=false){p.notice={id:crypto.randomUUID(),message,open}}
 function view(world,p){const stairs=housing.nearestStairs(p);const vehicle=(p.floor||0)===0&&world.vehicles.filter(v=>distance(v,p)<5&&clearLine(v,p)).sort((a,b)=>a.id===p.vehicleId?-1:b.id===p.vehicleId?1:distance(a,p)-distance(b,p))[0];return{looseParts:mechanics.loose(world,p),mechanics:vehicle?mechanics.view(world,p,vehicle,Date.now()):null,stairs:stairs?{up:stairs.canUp&&stairs.up<1.8,down:stairs.canDown&&stairs.down<1.8,floors:stairs.h.floorCount}:null,bag:p.bag.map(i=>rules.describe(i,p)),stock:rules.stock(p),weight:rules.weight(p),capacity:rules.capacity(p),equipment:p.equipment,containers:nearby(world,p).slice(0,8).map(c=>{const s=world.containers[c.id],searched=s?.searched.includes(p.id);return{id:c.id,name:c.name,kind:c.kind,x:c.x,z:c.z,searched:!!searched,searching:p.search?.id===c.id?Math.max(0,(p.search.ends-Date.now())/1000):null,items:searched?s.items.map(i=>rules.describe(i)):undefined}})}}
 function getContainer(world,p,id){const c=nearby(world,p).find(c=>c.id===id);if(!c)throw Error('Approche-toi du rangement, avec un passage dégagé.');return c}
 function drop(world,p,items,name='Objets au sol'){const c={id:'pile:'+crypto.randomUUID(),x:p.x,z:p.z,floor:floorOf(p),houseId:p.houseId||null,kind:'pile',name,items};world.piles[c.id]=c;world.containers[c.id]={items,searched:[p.id]}}
 function command(world,p,cmd,now){
  if(!cmd||typeof cmd!=='object')return false;
  try{
   if(p.hp<=0)throw Error('Ce personnage est mort.');
   const own=()=>{const i=p.bag.find(i=>i.uid===cmd.uid);if(!i)throw Error('Cet objet n’est plus dans ton inventaire.');return i};
   if(mechanics.command(world,p,cmd,now)){}
   else if(cmd.type==='search'){const c=getContainer(world,p,cmd.container);if(c.vehicle&&world.vehicles.find(v=>v.id===c.vehicle).locked&&!rules.has(p,'crowbar'))throw Error('Véhicule verrouillé : il faut un pied-de-biche.');if(c.vehicle)world.vehicles.find(v=>v.id===c.vehicle).locked=false;if(!state(world,c).searched.includes(p.id)){p.search={id:c.id,ends:now+1800};announce(p,'Fouille en cours…',true)}}
   else if(cmd.type==='take'){
    const c=getContainer(world,p,cmd.container),s=state(world,c);if(!s.searched.includes(p.id))throw Error('Fouille ce rangement avant de prendre un objet.');
    const i=s.items.find(i=>i.uid===cmd.uid);if(!i)throw Error('Un autre survivant a déjà pris cet objet.');const qty=Math.max(1,Math.min(i.qty,Math.floor(Number(cmd.qty)||1)));
    rules.addItem(p,{...structuredClone(i),uid:qty===i.qty?i.uid:crypto.randomUUID(),qty});i.qty-=qty;s.items=s.items.filter(i=>i.qty>0);announce(p,'Objet rangé dans ton inventaire.');
   }else if(cmd.type==='drop'){const i=own(),qty=Math.max(1,Math.min(i.qty,Math.floor(Number(cmd.qty)||1)));drop(world,p,[{...structuredClone(i),uid:crypto.randomUUID(),qty}]);rules.remove(p,i,qty);p.reload=0;}
   else if(cmd.type==='use')rules.use(p,own(),now);
   else if(cmd.type==='equip')rules.equip(p,own(),cmd.slot);
   else if(cmd.type==='unequip'){const i=own();for(const k of Object.keys(p.equipment))if(p.equipment[k]===i.uid)p.equipment[k]=null;p.reload=0;}
   else if(cmd.type==='attach')rules.attach(p,own());
   else if(cmd.type==='refill'){const i=own();if(i.def!=='emptyBottle')throw Error('Il faut une bouteille vide.');if(!nearby(world,p).some(c=>c.house))throw Error('Approche-toi des réserves d’une maison.');const c=nearby(world,p).find(c=>c.house),s=state(world,c);s.water??=3;if(!s.water)throw Error('Cette réserve domestique est épuisée.');rules.remove(p,i);rules.addItem(p,rules.item('water'));s.water--;announce(p,'Bouteille remplie · '+s.water+' remplissage(s) restant(s).');}
   else if(['enter','refuel','repair'].includes(cmd.type)){
    const v=world.vehicles.find(v=>v.id===cmd.vehicle);if(!v||floorOf(p)>0||distance(v,p)>5)throw Error('Approche-toi du véhicule.');
    if(cmd.type==='enter'){if(v.service)throw Error('Une intervention est en cours.');if(p.seated)throw Error('Tu es déjà dans un véhicule.');if(v.locked)throw Error('Le véhicule est verrouillé.');if(world.players.filter(q=>q.hp>0&&q.seated&&q.vehicleId===v.id).length>=4)throw Error('Ce véhicule est plein.');const key=p.bag.some(i=>i.def==='vehicleKey'&&i.vehicle===v.id);if(!v.driver&&!key&&!(p.profession==='mechanic'&&rules.has(p,'screwdriver')))throw Error('Trouve la clé ou utilise un tournevis avec le métier mécanicien.');p.seated=true;p.floor=0;p.houseId=null;p.vehicleId=v.id;if(!v.driver)v.driver=p.id;try{if(v.driver===p.id&&!v.engineRunning)mechanics.ignition(world,p,v);announce(p,'E : sortir · I : véhicule et mécanique.')}catch(error){announce(p,'À bord · '+error.message)}}
    if(cmd.type==='refuel'){const i=p.bag.find(i=>i.def==='fuel');if(!i)throw Error('Il faut un bidon d’essence.');if(v.fuel>=100)throw Error('Le réservoir est plein.');rules.remove(p,i);v.fuel=Math.min(100,v.fuel+30);}
    if(cmd.type==='repair'){const i=p.bag.find(i=>i.def==='part');if(!i||!rules.has(p,'toolkit'))throw Error('Il faut une pièce mécanique et une caisse à outils.');if(v.condition>=100)throw Error('Le véhicule est déjà réparé.');rules.remove(p,i);v.condition=Math.min(100,v.condition+(p.profession==='mechanic'?35:20));v.parts=v.condition>=40?3:0;}
   }else if(cmd.type==='rest'){p.resting=!p.resting;announce(p,p.resting?'Repos : reste immobile et surveille les alentours.':'Tu reprends ta route.');}
   else return true;
   rules.sync(p);
  }catch(e){announce(p,e.message)}return true;
 }
 function interact(world,p,now){
  if(p.seated){const v=world.vehicles.find(v=>v.id===p.vehicleId);p.seated=false;p.floor=0;p.houseId=null;p.vehicleId=null;if(v){Object.assign(p,free(v.x+3.8,v.z));if(v.driver===p.id){v.driver=null;v.speed=0;v.engineRunning=false}}return true}
  const c=nearby(world,p)[0];if(c){announce(p,'Choisis un rangement à fouiller.',true);return true}
  const v=floorOf(p)===0&&world.vehicles.find(v=>distance(v,p)<5);if(v){announce(p,'Inspecte le véhicule dans l’inventaire.',true);return true}return false;
 }
 function tick(world,p,dt,now){
  if(p.hp<=0){if(!p.bodyDropped){drop(world,p,p.bag,'Dépouille de '+p.name);p.bag=[];p.equipment={};p.bodyDropped=true}return}
  if(p.search){if(!nearby(world,p).some(c=>c.id===p.search.id)){p.search=null;announce(p,'Fouille interrompue : tu t’es éloigné.')}else if(now>=p.search.ends){const s=state(world,containers.get(p.search.id)||nearby(world,p).find(c=>c.id===p.search.id));if(!s.searched.includes(p.id))s.searched.push(p.id);p.search=null;announce(p,'Fouille terminée.',true)}}
  const moving=now-p.inputAt<500&&(p.input.x||p.input.z),sprinting=moving&&p.input.sprint&&!p.input.crouch&&!p.seated&&p.stamina>5;
  p.hunger=Math.max(0,p.hunger-dt*.035*(p.traits.includes('lightEater')?.7:p.traits.includes('hungry')?1.4:1));
  p.thirst=Math.max(0,p.thirst-dt*.055*(p.traits.includes('thirsty')?1.5:1)*(sprinting?1.6:1));
  p.stamina=Math.max(0,Math.min(100,p.stamina+dt*(sprinting?-(p.traits.includes('fit')?5:8):(moving?1.5:8)*(p.traits.includes('fit')?1.3:1)*(p.profession==='scout'?1.2:1))));
  p.fatigue=Math.max(0,Math.min(100,p.fatigue+dt*(p.resting&&!moving?-1:.009)));
  if(!p.hunger||!p.thirst)p.hp=Math.max(0,p.hp-dt*(!p.thirst?.6:.3));
  if(p.bleeding)p.hp=Math.max(0,p.hp-dt*p.bleeding*.015);
  if(moving)p.resting=false;
  p.moveSpeed=(p.input?.crouch?.55:1)*(p.hurtUntil>now?.6:1)*(p.profession==='scout'?1.1:1)*p.mobility*(sprinting?1.6:1)*(p.stamina<10?.65:1)*(p.fatigue>80?.7:1);
 }
 return{rules,mechanics,migrate,view,nearby,command,interact,tick,announce,characterBuild,drop,containers};
}
