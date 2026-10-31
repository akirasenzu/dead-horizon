// Shared survival rules. All inventory mutations are performed by the world service.
export const SURVIVAL_VERSION=1;
export const PROFESSIONS=[
 {id:'unemployed',name:'Sans profession',cost:0,description:'6 points pour personnaliser tes qualités et défauts.'},
 {id:'mechanic',name:'Mécanicien',cost:4,description:'Répare davantage et peut démarrer une voiture avec un tournevis.'},
 {id:'nurse',name:'Infirmier',cost:3,description:'Les pansements soignent davantage et arrêtent mieux les saignements.'},
 {id:'scout',name:'Éclaireur',cost:3,description:'Marche plus vite et récupère son souffle plus rapidement.'},
 {id:'worker',name:'Manutentionnaire',cost:2,description:'Peut porter 3 kg supplémentaires.'}
];
export const TRAITS=[
 {id:'strong',name:'Robuste',cost:4,description:'+4 kg de portage, coups de mêlée plus puissants.',opposite:'frail'},
 {id:'fit',name:'Endurant',cost:3,description:'Course moins fatigante et récupération accélérée.'},
 {id:'lightEater',name:'Petit appétit',cost:2,description:'La faim progresse 30 % moins vite.',opposite:'hungry'},
 {id:'frail',name:'Frêle',cost:-3,description:'−3 kg de portage et mêlée moins puissante.',opposite:'strong'},
 {id:'thirsty',name:'Grande soif',cost:-2,description:'Boire devient nécessaire 50 % plus souvent.'},
 {id:'hungry',name:'Gros appétit',cost:-2,description:'La faim progresse 40 % plus vite.',opposite:'lightEater'},
 {id:'clumsy',name:'Bruyant',cost:-2,description:'Les infectés te repèrent de plus loin.'}
];
export function characterBuild(raw={}){
 const profession=PROFESSIONS.find(p=>p.id===raw.profession)||PROFESSIONS[0];
 if(!Array.isArray(raw.traits)&&raw.traits!==undefined)throw Error('Traits invalides.');
 const traits=[...new Set(raw.traits||[])];
 if(traits.some(id=>!TRAITS.some(t=>t.id===id)))throw Error('Trait inconnu.');
 if(traits.some(id=>traits.includes(TRAITS.find(t=>t.id===id).opposite)))throw Error('Ces traits sont incompatibles.');
 const points=6-profession.cost-traits.reduce((n,id)=>n+TRAITS.find(t=>t.id===id).cost,0);
 if(points<0)throw Error('Il ne reste pas assez de points pour ces traits.');
 return {profession:profession.id,traits,points};
}
export function createSurvivalRules({catalog,clothes,ammunition,mods,compatibleMods}){
 const definitions=new Map();const add=d=>definitions.set(d.id,d);
 for(const d of [
  {id:'rags',name:'Bande de tissu',kind:'medical',weight:.08,heal:4,bleed:4},
  {id:'bandage',name:'Pansement stérile',kind:'medical',weight:.1,heal:12,bleed:10},
  {id:'beans',name:'Haricots en conserve',kind:'food',weight:.4,food:38,water:4},
  {id:'crackers',name:'Biscuits secs',kind:'food',weight:.2,food:24,water:-5},
  {id:'apple',name:'Pomme',kind:'food',weight:.18,food:15,water:8,perishable:true},
  {id:'water',name:'Bouteille d’eau · 50 cl',kind:'water',weight:.55,water:48},
  {id:'emptyBottle',name:'Bouteille vide',kind:'tool',weight:.05},
  {id:'backpack',name:'Sac à dos',kind:'backpack',weight:.7,capacity:10},
  {id:'fuel',name:'Bidon d’essence · 5 L',kind:'tool',weight:4.2},
  {id:'part',name:'Pièce mécanique',kind:'tool',weight:1.5},
  {id:'buildingMaterials',name:'Matériaux de construction récupérés',kind:'tool',weight:.8},
  {id:'toolkit',name:'Caisse à outils',kind:'tool',weight:2},
  {id:'screwdriver',name:'Tournevis',kind:'tool',weight:.3},
  {id:'crowbar',name:'Pied-de-biche',kind:'tool',weight:1.7}
 ])add(d);
 for(const w of catalog.weapons.filter(w=>w.id!=='fists'))add({id:'weapon:'+w.id,name:w.name,kind:'weapon',ref:w.id,weight:w.melee?1.4:['pistol','revolver'].includes(w.shape)?.9:3.8});
 for(const a of catalog.armors.filter(a=>a.id!=='civil'))add({id:'armor:'+a.id,name:a.name,kind:'armor',ref:a.id,weight:a.heavy?8:3.5});
 for(const c of clothes)add({id:'clothes:'+c.id,name:c.name,kind:'clothes',ref:c.id,weight:.6});
 for(const a of ammunition)add({id:'ammo:'+a.key,name:a.name||a.caliber+' · '+a.profile,kind:'ammo',ref:a.key,weight:.018});
 for(const [slot,list]of Object.entries(mods))for(const m of list.filter(m=>m.id!=='none'))add({id:'mod:'+slot+':'+m.id,name:m.name,kind:'mod',slot,ref:m.id,weight:.2});
 const def=item=>definitions.get(typeof item==='string'?item:item?.def);
 const has=(p,id)=>p.bag.some(i=>i.def===id&&i.qty>0);
 const capacity=p=>12+(p.traits.includes('strong')?4:0)-(p.traits.includes('frail')?3:0)+(p.profession==='worker'?3:0)+(p.equipment.backpack?10:0);
 const weight=p=>p.bag.reduce((n,i)=>n+(def(i)?.weight||0)*i.qty,0);
 function item(id,qty=1,extra={}){if(!def(id))throw Error('Objet inconnu.');return{uid:crypto.randomUUID(),def:id,qty,...extra,...(def(id).kind==='weapon'?{loaded:0,mods:{},...extra}:{}),...(def(id).perishable?{expires:Date.now()+3600000,...extra}:{})}}
 function stock(p){return Object.fromEntries(p.bag.filter(i=>def(i)?.kind==='ammo').map(i=>[def(i).ref,p.bag.filter(j=>j.def===i.def).reduce((n,j)=>n+j.qty,0)]))}
 function remove(p,i,n=1){i.qty-=n;if(i.qty<=0){p.bag=p.bag.filter(j=>j.uid!==i.uid);for(const key of Object.keys(p.equipment))if(p.equipment[key]===i.uid)p.equipment[key]=null}}
 function addItem(p,i){const d=def(i);if(!d)throw Error('Objet inconnu.');if(weight(p)+d.weight*i.qty>capacity(p)*1.5)throw Error('Trop lourd : dépose des objets ou trouve un sac.');if(['ammo','food','water','medical','tool'].includes(d.kind)&&!d.perishable){const existing=p.bag.find(j=>j.def===i.def&&!j.vehicle);if(existing){existing.qty+=i.qty;return existing}}p.bag.push(i);return i}
 const equipped=(p,slot)=>p.bag.find(i=>i.uid===p.equipment[slot]);
 function sync(p){
  p.floor=Math.max(0,Math.floor(p.floor||0));p.xp||={melee:0,firearms:0};p.wounds||=[];p.bag||=[];p.equipment||={};p.traits||=[];p.profession||='unemployed';
  const main=equipped(p,'primary'),secondary=equipped(p,'secondary'),armor=equipped(p,'armor'),outfit=equipped(p,'clothes');
  p.config={weapon:def(main)?.ref||'fists',secondary:def(secondary)?.ref||'fists',armor:def(armor)?.ref||'civil',clothing:def(outfit)?.ref||'civil',ammo:'standard',...(equipped(p,p.slot?'secondary':'primary')?.mods||{})};
  p.ammo=[main?.loaded||0,secondary?.loaded||0];p.stock=stock(p);p.jammed=!!equipped(p,p.slot?'secondary':'primary')?.jammed;p.armorHP=armor?.condition||0;
  p.capacity=capacity(p);p.weight=weight(p);p.mobility=p.weight>p.capacity?Math.max(.35,1-(p.weight/p.capacity-1)*1.3):1;
 }
 function starter(p,build={}){Object.assign(p,characterBuild(build));p.survivalVersion=SURVIVAL_VERSION;p.bag=[item('rags',2),item('clothes:civil')];p.equipment={primary:null,secondary:null,armor:null,clothes:p.bag[1].uid,backpack:null};p.slot=0;p.floor=0;p.houseId=null;p.jammed=false;p.wounds=[];p.xp={melee:0,firearms:0};p.hp=100;p.hunger=85;p.thirst=85;p.stamina=100;p.bleeding=0;p.fatigue=0;p.kills=0;p.cool=0;p.reload=0;p.seated=false;p.vehicleId=null;p.input={x:0,z:0,yaw:0,fire:false};p.seq=0;sync(p)}
 function consumeAmmo(p,key,n){let left=n;for(const i of [...p.bag])if(i.def==='ammo:'+key){const take=Math.min(left,i.qty);remove(p,i,take);left-=take;if(!left)break}return n-left}
 function use(p,i,now){const d=def(i);if(!d)throw Error('Objet introuvable.');if(d.kind==='food'){if(i.expires&&now>i.expires)throw Error('Cet aliment est avarié.');p.hunger=Math.min(100,p.hunger+d.food);p.thirst=Math.max(0,Math.min(100,p.thirst+(d.water||0)));remove(p,i)}else if(d.kind==='water'){p.thirst=Math.min(100,p.thirst+d.water);remove(p,i);addItem(p,item('emptyBottle'))}else if(d.kind==='medical'){p.hp=Math.min(100,p.hp+d.heal*(p.profession==='nurse'?1.5:1));p.bleeding=Math.max(0,p.bleeding-d.bleed);for(const wound of p.wounds||[])wound.bandaged=true;remove(p,i)}else throw Error('Cet objet ne peut pas être consommé.');sync(p)}
 function equip(p,i,slot){const d=def(i);if(d.kind==='weapon'){slot=slot==='secondary'?'secondary':'primary';for(const s of ['primary','secondary'])if(p.equipment[s]===i.uid)p.equipment[s]=null;p.equipment[slot]=i.uid;p.slot=slot==='secondary'?1:0;p.reload=0;p.clearingJam=false}else if(['armor','clothes','backpack'].includes(d.kind))p.equipment[d.kind]=i.uid;else throw Error('Cet objet ne peut pas être équipé.');sync(p)}
 function attach(p,i){const d=def(i),w=equipped(p,p.slot?'secondary':'primary'),base=catalog.weapons.find(b=>b.id===def(w)?.ref);if(d.kind!=='mod'||!base||base.melee||base.id==='fists'||!compatibleMods(base,d.slot).some(m=>m.id===d.ref))throw Error('Accessoire incompatible avec l’arme en main.');const old=w.mods[d.slot];remove(p,i);if(old&&old!=='none')addItem(p,item('mod:'+d.slot+':'+old));w.mods[d.slot]=d.ref;p.reload=0;sync(p)}
 function describe(i,p){const d=def(i);return{...i,name:d.name,kind:d.kind,weight:d.weight,slot:d.slot,equipped:Object.entries(p?.equipment||{}).find(([,uid])=>uid===i.uid)?.[0]||null,spoiled:!!i.expires&&Date.now()>i.expires}}
 function randomBag(seed,kind='home'){
  let n=Array.from(String(seed)).reduce((a,c)=>Math.imul(a^c.charCodeAt(0),16777619)>>>0,2166136261);const random=()=>((n=(Math.imul(n,1664525)+1013904223)>>>0)/4294967296);
  const choose=list=>list[Math.floor(random()*list.length)],items=[];
  const basics=kind==='car'?['rags','screwdriver','part','crackers','water']:kind==='work'?['buildingMaterials','buildingMaterials','toolkit','part','fuel','crowbar','screwdriver','jack','lugWrench','rags','weapon:axe']:['beans','crackers','apple','water','bandage','rags','backpack','emptyBottle','weapon:bat','weapon:knife'];
  for(let j=0;j<2+Math.floor(random()*3);j++)items.push(item(choose(basics),1));
  if(random()<(kind==='work'?.52:kind==='car'?.18:0)){const type=choose(['engine','radiator','battery','wheel']),tyre=choose(['road','race','rally','offroad']),fit=choose(['car','car','utility','heavy']);if(def('vpart:'+type+(type==='wheel'?':'+tyre:'')))items.push(item('vpart:'+type+(type==='wheel'?':'+tyre:''),1,{condition:35+Math.floor(random()*61),fit,...(type==='battery'?{charge:35+Math.floor(random()*61)}:{})}))}
  if(random()<.32)items.push(item('clothes:'+choose(clothes).id));
  if(random()<(kind==='work'?.48:.16)){const w=choose(catalog.weapons.filter(w=>w.id!=='fists'));items.push(item('weapon:'+w.id,1,{condition:40+Math.floor(random()*61)}));const ammo=ammunition.filter(a=>a.caliber===w.caliberId);if(ammo.length)items.push(item('ammo:'+choose(ammo).key,6+Math.floor(random()*25)))}
  if(random()<.12)items.push(item('armor:'+choose(catalog.armors.filter(a=>a.id!=='civil')).id,1,{condition:40+Math.floor(random()*40)}));
  if(random()<.2)items.push(item(choose([...definitions.keys()].filter(id=>id.startsWith('mod:')))));
  return items;
 }
 return{definitions,def,item,has,capacity,weight,stock,remove,addItem,equipped,sync,starter,consumeAmmo,use,equip,attach,describe,randomBag};
}
