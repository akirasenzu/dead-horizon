import {STOREY_HEIGHT} from './building-metrics.js';
// Floor identity is authoritative; clients never submit an elevation.
export const LEVEL_HEIGHT=STOREY_HEIGHT;
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export const floorOf=actor=>Math.max(0,Math.floor(Number(actor?.floor)||0));
export const sameLevel=(a,b)=>floorOf(a)===floorOf(b)&&(floorOf(a)===0||a.houseId===b.houseId);
export function addLevels(housing,pointInside,segmentDistance){
 const originalBlocked=housing.blocked;
 for(const h of housing.houses){
  h.floorCount=1;h.stairs=null;
  if(!h.enterable||h.source.h<STOREY_HEIGHT*2-.1)continue;
  const fits=(u,v,w,d)=>[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].every(([x,z])=>{const p=h.point(u+x,v+z);return pointInside(...p,h.poly)&&h.poly.every((a,i)=>segmentDistance(...p,a,h.poly[(i+1)%h.poly.length])>.2)});
  outer:for(const length of[4,3.4,2.8])for(const u of[-1.8,1.8,-1.45,1.45,-2.7,2.7]){
   const start=1.25,end=start+length;
   if(!fits(u,(start+end+.4)/2,1.5,length+2.2))continue;
   h.stairs={u,start,end,width:1.35,bottom:h.point(u,start-.45),top:h.point(u,end+.7)};
   h.floorCount=Math.min(4,Math.max(2,h.source.survey?.levels||Math.floor((h.source.h+.1)/LEVEL_HEIGHT)));
   // Reserve the staircase and its two landings rather than overlapping furniture.
   const previousFurniture=h.furniture,previousPartitions=h.partitions;
   const rect={left:u-1.15,right:u+1.15,front:start-1.3,back:end+1.5};
   h.furniture=h.furniture.filter(f=>f.u+f.w/2<rect.left||f.u-f.w/2>rect.right||f.v+f.d/2<rect.front||f.v-f.d/2>rect.back);
   h.partitions=h.partitions.flatMap(s=>clipOutside(s,h,rect));
   if(originalBlocked(...h.stairs.bottom,.55)||originalBlocked(...h.stairs.top,.55)){h.furniture=previousFurniture;h.partitions=previousPartitions;h.stairs=null;h.floorCount=1;continue}
   break outer;
  }
 }
 function clipOutside(s,h,r){
  const a=h.local(...s.a),b=h.local(...s.b),d=[b[0]-a[0],b[1]-a[1]];let lo=0,hi=1;
  for(const[axis,min,max]of[[0,r.left,r.right],[1,r.front,r.back]]){
   if(Math.abs(d[axis])<1e-8){if(a[axis]<min||a[axis]>max)return[s];continue}
   const t0=(min-a[axis])/d[axis],t1=(max-a[axis])/d[axis];lo=Math.max(lo,Math.min(t0,t1));hi=Math.min(hi,Math.max(t0,t1));
  }
  if(lo>=hi||hi<0||lo>1)return[s];const at=t=>h.point(a[0]+d[0]*t,a[1]+d[1]*t),out=[];
  if(lo>.02)out.push({a:s.a,b:at(lo)});if(hi<.98)out.push({a:at(hi),b:s.b});return out;
 }
 function levelHouse(actor){return floorOf(actor)>0?housing.byId.get(actor.houseId):housing.insideHouse(actor.x,actor.z)}
 function validLevel(actor){const h=levelHouse(actor);return floorOf(actor)===0||!!h&&floorOf(actor)<h.floorCount&&pointInside(actor.x,actor.z,h.poly)}
 function furniture(h,level){return level?h.furniture.map(f=>({...f,kind:f.kind==='kitchen'?'washbasin':f.kind==='sofa'?'desk':f.kind})):h.furniture}
 function blocked(x,z,r=.55,options={}){
  const level=floorOf(options),h=level?housing.byId.get(options.houseId):housing.insideHouse(x,z);
  if(level){
   if(!h?.enterable||level>=h.floorCount||!pointInside(x,z,h.poly)||h.poly.some((a,i)=>segmentDistance(x,z,a,h.poly[(i+1)%h.poly.length])<r+.12))return true;
   if((housing.partitionsFor?.(h,level)||h.partitions).some(s=>segmentDistance(x,z,s.a,s.b)<r+.08))return true;
   const[u,v]=h.local(x,z);if(furniture(h,level).some(f=>Math.abs(u-f.u)<f.w/2+r&&Math.abs(v-f.v)<f.d/2+r))return true;
  }else if(originalBlocked(x,z,r,options))return true;
  // The stair run is solid. Use the appropriate landing to change floor.
  if(h?.stairs){const s=h.stairs,[u,v]=h.local(x,z);if(Math.abs(u-s.u)<s.width/2+r&&v>s.start+.15-r&&v<s.end-.05+r)return true}
  return false;
 }
 function nearestStairs(actor,r=1.8){const h=levelHouse(actor);if(!h?.stairs)return null;const s=h.stairs,bottom={x:s.bottom[0],z:s.bottom[1]},top={x:s.top[0],z:s.top[1]};const up=distance(actor,bottom),down=distance(actor,top);if(Math.min(up,down)>r)return null;return{h,up,down,canUp:floorOf(actor)<h.floorCount-1,canDown:floorOf(actor)>0}}
 function climb(actor,direction,now=Date.now()){
  const found=nearestStairs(actor);if(!found||actor.seated||actor.hp<=0||actor.climbUntil>now)return false;
  const{h,up,down}=found;direction=direction||((up<down&&found.canUp)?1:found.canDown?-1:1);
  if(direction>0&&(!found.canUp||up>1.8)||direction<0&&(!found.canDown||down>1.8))return false;
  const level=floorOf(actor)+direction,point=direction>0?h.stairs.top:h.stairs.bottom;
  if(blocked(point[0],point[1],.5,{floor:level,houseId:h.id}))return false;
  actor.floor=level;actor.houseId=level?h.id:null;actor.x=point[0];actor.z=point[1];actor.climbUntil=now+650;actor.search=null;return true;
 }
 return Object.assign(housing,{blocked,levelHouse,validLevel,nearestStairs,climb,floorFurniture:furniture,upperCount:housing.houses.filter(h=>h.floorCount>1).length});
}
