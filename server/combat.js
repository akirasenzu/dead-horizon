import{floorOf,sameLevel}from'../web/game/levels.js';
import{createZombieAI}from'./zombie-ai.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createCombatService({housing,blocked,clearLine,gear,rules,announce}){
 function xp(p,kind,n){p.xp||={melee:0,firearms:0};p.xp[kind]=Math.min(250,(p.xp[kind]||0)+n)}
 function damage(z,p,amount,world,now){const before=z.hp;z.hp-=amount;z.stunnedUntil=now+250;if(before>0&&z.hp<=0){z.deadAt=now;z.state='dead';p.kills++;xp(p,gear(p).weapon.melee||gear(p).weapon.id==='fists'?'melee':'firearms',2)}z.memory={x:p.x,z:p.z,floor:floorOf(p),houseId:p.houseId||housing.insideHouse(p.x,p.z)?.id||null,until:now+10000,target:p.id}}
 function hurt(p,amount,z,now){const a=gear(p).armor,reduction=p.armorHP>0?a.reduction:0,absorbed=amount*reduction;p.hp=Math.max(0,p.hp-amount+absorbed);p.armorHP=Math.max(0,p.armorHP-absorbed*.8);const armor=rules.equipped(p,'armor');if(armor)armor.condition=p.armorHP;p.hurtUntil=now+280;p.damagedAt=now;
  if(reduction<.5&&(z.id+z.swings)%3===0){p.bleeding=Math.min(5,p.bleeding+.8);p.wounds||=[];p.wounds.push({id:crypto.randomUUID(),zone:['Bras gauche','Bras droit','Jambe gauche','Jambe droite','Torse'][z.id%5],type:'Griffure',bandaged:false,at:now});p.wounds=p.wounds.slice(-10)}
 }
 const ai=createZombieAI({housing,blocked,clearLine,gear,hurt});
 const allowed=(p,now)=>p.hp>0&&!p.seated&&!(p.climbUntil>now)&&p.cool<=0&&!p.reload;
 function melee(world,p,now){
  if(!allowed(p,now))return;p.lastAttack=now;p.lastAttackKind='melee';const w=gear(p).weapon;p.angle=Number.isFinite(p.input?.yaw)?p.input.yaw:p.angle;p.cool=w.melee?w.interval:.7;
  const stamina=p.stamina;p.stamina=Math.max(0,p.stamina-(w.melee?11:7));const level=Math.floor((p.xp?.melee||0)/25),strength=p.traits.includes('strong')?1.4:p.traits.includes('frail')?.6:1;
  const targets=world.zombies.filter(z=>z.hp>0&&sameLevel(p,z)&&distance(z,p)<(w.melee?2.8:2.1)&&Math.cos(Math.atan2(z.x-p.x,z.z-p.z)-p.angle)>.35&&clearLine(p,z)).sort((a,b)=>distance(a,p)-distance(b,p)).slice(0,w.id==='bat'||w.id==='axe'?2:1);
  for(const z of targets){damage(z,p,(w.melee?w.damage:.85)*strength*(stamina<10?.45:1)*(1+level*.035),world,now);const a=Math.atan2(z.x-p.x,z.z-p.z),nx=z.x+Math.sin(a)*.6,nz=z.z+Math.cos(a)*.6;if(!blocked(nx,nz,.38,{floor:floorOf(z),houseId:z.houseId})){z.x=nx;z.z=nz}xp(p,'melee',1)}
  const item=rules.equipped(p,p.slot?'secondary':'primary');if(w.melee&&item)item.condition=Math.max(0,(item.condition??100)-.15);ai.noise(world,p,w.melee?9:5,now);
 }
 function reload(p){
  if(p.hp<=0||p.seated||p.reload)return;if(p.jammed){p.clearingJam=true;p.clearingJamUid=rules.equipped(p,p.slot?'secondary':'primary')?.uid;p.reload=1.5;return}const w=gear(p).weapon;if(p.ammo[p.slot]<w.mag&&(p.stock[w.ammoKey]||0)>0)p.reload=w.reload;
 }
 function finishReload(p){
  if(p.clearingJam){const i=p.bag.find(i=>i.uid===p.clearingJamUid);if(i)i.jammed=false;p.jammed=false;p.clearingJam=false;p.jamWarned=false;rules.sync(p);return}
  const w=gear(p).weapon,n=Math.max(0,Math.min(w.mag-p.ammo[p.slot],p.stock[w.ammoKey]||0));p.ammo[p.slot]+=rules.consumeAmmo(p,w.ammoKey,n);const i=rules.equipped(p,p.slot?'secondary':'primary');if(i)i.loaded=p.ammo[p.slot];rules.sync(p);
 }
 function fire(world,p,now){
  if(!allowed(p,now))return;const w=gear(p).weapon;if(w.id==='fists'||w.melee){melee(world,p,now);return}
  if(p.jammed){if(!p.jamWarned){announce(p,'Arme enrayée : appuie sur R pour la dégager.');p.jamWarned=true}return}
  if(p.ammo[p.slot]<=0){reload(p);return}
  p.lastAttack=now;p.lastAttackKind='gun';const item=rules.equipped(p,p.slot?'secondary':'primary');item.loaded=--p.ammo[p.slot];p.cool=w.interval;item.condition=Math.max(0,(item.condition??100)-.06);
  if(item.condition<20&&Math.random()<.035){item.jammed=true;p.jammed=true;}
  const level=Math.floor((p.xp?.firearms||0)/25),moving=!!(p.input?.x||p.input?.z),spread=Math.max(.008,(p.input?.aim?.022:.065)+(moving?.045:0)+(100-p.stamina)*.0005-level*.002);
  const angle=(Number.isFinite(p.input?.yaw)?p.input.yaw:p.angle)+(Math.random()-.5)*spread;p.angle=angle;const ux=Math.sin(angle),uz=Math.cos(angle);
  let range=w.range;for(let t=.7;t<range;t+=.65)if(blocked(p.x+ux*t,p.z+uz*t,.04,{floor:floorOf(p),houseId:p.houseId})){range=t;break}
  const targets=world.zombies.filter(z=>{const dx=z.x-p.x,dz=z.z-p.z,t=dx*ux+dz*uz;return z.hp>0&&sameLevel(p,z)&&t>0&&t<range&&Math.abs(dx*uz-dz*ux)<.46+(w.pellets?t*.12:Math.min(.3,t*.012))&&clearLine(p,z)}).sort((a,b)=>distance(a,p)-distance(b,p));
  const hits=targets.slice(0,w.pellets?w.pellets:w.pierce||1);for(const z of hits){damage(z,p,w.damage,world,now);xp(p,'firearms',1)}
  const end=hits.at(-1)||{x:p.x+ux*range,z:p.z+uz*range};world.shots.push({id:crypto.randomUUID(),x:p.x,z:p.z,tx:end.x,tz:end.z,y:floorOf(p)*3.4+1.45,at:now,player:p.id});world.shots=world.shots.slice(-24);ai.noise(world,p,w.noise,now);
 }
 return{fire,reload,finishReload,melee,ai,hurt};
}
