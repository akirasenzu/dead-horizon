import{floorOf,sameLevel}from'../web/game/levels.js';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
// A small, bounded search is used only when a direct route is blocked.
export function findPath(start,goal,blocked,{cell=1.05,maxNodes=220}={}){
 const key=(x,z)=>x+':'+z,heuristic=(x,z)=>Math.hypot(start.x+x*cell-goal.x,start.z+z*cell-goal.z)/cell;
 const open=[{x:0,z:0,g:0,f:heuristic(0,0),parent:null}],scores=new Map([[key(0,0),0]]);let best=open[0],visited=0;
 while(open.length&&visited++<maxNodes){
  let i=0;for(let j=1;j<open.length;j++)if(open[j].f<open[i].f)i=j;const node=open.splice(i,1)[0];
  if(heuristic(node.x,node.z)<heuristic(best.x,best.z))best=node;
  if(heuristic(node.x,node.z)<1){best=node;break}
  for(const[dx,dz]of[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=node.x+dx,z=node.z+dz,px=start.x+x*cell,pz=start.z+z*cell;
   if(blocked(px,pz)||dx&&dz&&(blocked(start.x+(node.x+dx)*cell,start.z+node.z*cell)||blocked(start.x+node.x*cell,start.z+(node.z+dz)*cell)))continue;
   const g=node.g+Math.hypot(dx,dz),k=key(x,z);if((scores.get(k)??Infinity)<=g)continue;scores.set(k,g);open.push({x,z,g,f:g+heuristic(x,z),parent:node});
  }
 }
 const path=[];for(let n=best;n?.parent;n=n.parent)path.push({x:start.x+n.x*cell,z:start.z+n.z*cell});return path.reverse().slice(0,36);
}
export function createZombieAI({housing,blocked,clearLine,gear,hurt}){
 let navigationBudget=4;
 function noise(world,source,radius,now){for(const z of world.zombies)if(z.hp>0&&distance(z,source)<radius){z.memory={x:source.x,z:source.z,floor:floorOf(source),houseId:source.houseId||housing.insideHouse(source.x,source.z)?.id||null,until:now+9000,target:source.id};z.alert=now+9000;z.perceiveAt=0}}
 function perceive(world,z,players,now){
  if(z.perceiveAt>now)return;z.perceiveAt=now+350;
  let closest=null;
  for(const p of players){
   if(p.hp<=0||p.seated)continue;const d=distance(z,p);if(d>45)continue;
   const moving=now-p.inputAt<550&&(p.input?.x||p.input?.z),u=p.input||{},visibility=gear(p).clothing.visibility*(u.crouch?.45:1)*(p.traits.includes('clumsy')?1.35:1);
   const angle=Math.atan2(p.x-z.x,p.z-z.z),facing=d<4||Math.cos(angle-z.angle)>-.15;
   const visible=sameLevel(z,p)&&d<25*visibility&&facing&&clearLine(z,p);
   const heard=moving&&d<(u.sprint?18:u.crouch?2.5:7)*(p.traits.includes('clumsy')?1.35:1)&&Math.abs(floorOf(z)-floorOf(p))<=1;
   if((visible||heard)&&(!closest||d<closest.d))closest={p,d,visible};
  }
  if(closest){const p=closest.p;z.memory={x:p.x,z:p.z,floor:floorOf(p),houseId:p.houseId||housing.insideHouse(p.x,p.z)?.id||null,until:now+(closest.visible?8500:6000),target:p.id};z.state=closest.visible?'chase':'investigate'}
  else if(z.memory?.until<=now){z.memory=null;z.path=[];z.state='wander'}
 }
 function goalFor(z,memory,now){
  if(floorOf(z)>0&&(memory.houseId!==z.houseId||floorOf(z)>floorOf(memory))){const h=housing.byId.get(z.houseId);if(!h?.stairs)return null;const p={x:h.stairs.top[0],z:h.stairs.top[1]};if(distance(z,p)<1.5&&housing.climb(z,-1,now)){z.path=[];return null}return p}
  if(floorOf(z)<floorOf(memory)){
   const h=housing.byId.get(memory.houseId);if(!h?.stairs)return null;
   if(housing.insideHouse(z.x,z.z)?.id!==h.id)return{x:h.door.x,z:h.door.z};
   const p={x:h.stairs.bottom[0],z:h.stairs.bottom[1]};if(distance(z,p)<1.5&&housing.climb(z,1,now)){z.path=[];return null}return p;
  }
  return memory;
 }
 function step(world,z,players,dt,now){
  z.floor??=0;z.state||='wander';z.angle||=0;
  if(z.hp<=0){if(now-z.deadAt>180000&&!players.some(p=>distance(p,z)<80)){z.hp=2;z.deadAt=0;z.memory=null;z.state='wander'}return}
  if(!players.some(p=>p.hp>0&&distance(p,z)<160)||z.stunnedUntil>now||z.climbUntil>now)return;
  perceive(world,z,players,now);
  const target=z.memory&&players.find(p=>p.id===z.memory.target&&p.hp>0&&!p.seated&&sameLevel(p,z));
  if(target&&distance(target,z)<1.3&&clearLine(z,target)){
   z.state='attack';z.angle=Math.atan2(target.x-z.x,target.z-z.z);
   if(!(z.attackAt>now)){z.attackAt=now+1150;z.swings=(z.swings||0)+1;hurt(target,7+z.id%5,z,now)}return;
  }
  let goal=z.memory?.until>now?goalFor(z,z.memory,now):null;
  if(!goal){if(z.memory?.until>now)return;const a=(z.id*2.399)+Math.floor(now/15000)*.35;goal={x:z.x+Math.sin(a)*3,z:z.z+Math.cos(a)*3};z.state='wander'}
  if(z.memory){const door=floorOf(z)===0&&housing.nearestDoor(z.x,z.z,1.55);if(door&&!housing.isOpen(door)){
   z.state='bashing';z.angle=Math.atan2(door.door.x-z.x,door.door.z-z.z);
   if(!(z.bashAt>now)){z.bashAt=now+950;world.doorHealth||={};world.doorHealth[door.id]=Math.max(0,(world.doorHealth[door.id]??75)-15);if(!world.doorHealth[door.id]){world.doors[door.id]=true;housing.setDoors(world.doors);z.path=[];z.nextPath=0}}return;
  }}
  const options={floor:floorOf(z),houseId:z.houseId},isBlocked=(x,z)=>blocked(x,z,.38,options),d=distance(z,goal);
  if(d<.7){if(z.memory){z.memory.until=Math.min(z.memory.until,now+1500);z.state='investigate'}return}
  let aim=goal;
  const direct=clearLine(z,{...goal,floor:floorOf(z),houseId:z.houseId});
  if(!direct){
   if(!(z.nextPath>now)&&navigationBudget>0){navigationBudget--;z.path=findPath(z,goal,isBlocked);z.nextPath=now+1300+z.id%7*130}
   while(z.path?.length&&distance(z,z.path[0])<.45)z.path.shift();if(z.path?.length)aim=z.path[0];
  }else z.path=[];
  const angle=Math.atan2(aim.x-z.x,aim.z-z.z),speed=(z.memory?1.05+z.id%5*.12:.28),dx=Math.sin(angle)*dt*speed,dz=Math.cos(angle)*dt*speed;z.angle=angle;
  if(!isBlocked(z.x+dx,z.z))z.x+=dx;if(!isBlocked(z.x,z.z+dz))z.z+=dz;
 }
 return{step,noise,beginStep(){navigationBudget=4}};
}
