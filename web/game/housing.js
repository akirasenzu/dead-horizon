import {FACADE_PROFILES} from './facade-profiles.js';
import {attachConstruction} from './construction.js';
import {buildingMetrics,STOREY_HEIGHT} from './building-metrics.js';
import {addLevels} from './levels.js';
// Shared deterministic layout: the browser and the authoritative server use
// exactly the same footprints, door openings, partitions and furniture.
export const CITY_SCALE=1.3,HOUSING_VERSION=1,FLOOR_HEIGHT=STOREY_HEIGHT;
export function prepareCityMap(raw){
 if(raw.gameScale===CITY_SCALE)return raw;
 const point=p=>p.map(v=>Math.round(v*CITY_SCALE*100)/100);
 return {...raw,gameScale:CITY_SCALE,spawn:point(raw.spawn),
  buildings:raw.buildings.map(b=>({...b,facade:FACADE_PROFILES[b.id]||b.facade,p:b.p.map(point),h:buildingMetrics(b).height})),
  roads:raw.roads.map(r=>({...r,p:r.p.map(point)})),rails:raw.rails.map(l=>l.map(point)),
  parks:raw.parks.map(p=>({...p,p:p.p.map(point)})),landmarks:raw.landmarks.map(p=>({...p,p:point(p.p)}))};
}
export function pointInside(x,z,p){let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])hit=!hit;return hit}
export function segmentDistance(x,z,a,b){const dx=b[0]-a[0],dz=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[1])*dz)/(dx*dx+dz*dz||1)));return Math.hypot(x-a[0]-dx*t,z-a[1]-dz*t)}
export function createHousing(data){
 const baked=data.housingLayouts?new Map(data.housingLayouts.map(v=>{if(!Array.isArray(v))return[v.id,v];const[id,x,z,ux,uz,nx,nz,edge,t,width,furniture,partitions]=v;return[id,{door:{x,z,ux,uz,nx,nz,edge,t,width},furniture:furniture.map(([u,v,w,d,kind])=>({u,v,w,d,kind,point:[x+ux*u+nx*v,z+uz*u+nz*v]})),partitions:partitions.map(([ax,az,bx,bz])=>({a:[ax,az],b:[bx,bz]}))}]})):null;
 const CELL=60,grid=new Map(),roadGrid=new Map(),houses=[],byId=new Map();let doors={};
 const index=(grid,item,x0,z0,x1,z1)=>{for(let x=Math.floor(x0/CELL);x<=Math.floor(x1/CELL);x++)for(let z=Math.floor(z0/CELL);z<=Math.floor(z1/CELL);z++){const k=x+':'+z;if(!grid.has(k))grid.set(k,[]);grid.get(k).push(item)}};
 const near=(grid,x,z,r)=>{const set=new Set();for(let i=Math.floor((x-r)/CELL);i<=Math.floor((x+r)/CELL);i++)for(let j=Math.floor((z-r)/CELL);j<=Math.floor((z+r)/CELL);j++)for(const v of grid.get(i+':'+j)||[])set.add(v);return [...set]};
 for(const b of data.buildings){const xs=b.p.map(p=>p[0]),zs=b.p.map(p=>p[1]);const h={id:b.id,source:b,poly:b.p,x:(Math.min(...xs)+Math.max(...xs))/2,z:(Math.min(...zs)+Math.max(...zs))/2,w:(Math.max(...xs)-Math.min(...xs))/2,d:(Math.max(...zs)-Math.min(...zs))/2,height:b.h+4,segments:[],furniture:[],partitions:[],enterable:false};houses.push(h);byId.set(b.id,h);index(grid,h,h.x-h.w,h.z-h.d,h.x+h.w,h.z+h.d)}
 if(!baked)for(const road of data.roads){if(['path','track','cycleway','steps'].includes(road.k))continue;for(let i=1;i<road.p.length;i++){const a=road.p[i-1],b=road.p[i];index(roadGrid,{a,b},Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1]))}}
 const occupied=(x,z,except)=>near(grid,x,z,1).some(h=>h!==except&&pointInside(x,z,h.poly));
 for(const h of houses){
  const p=h.poly,area=Math.abs(p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2),sign=p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)>0?1:-1;
  const allowed=['yes','house','detached','residential','apartments','retail','commercial','hotel'].includes(h.source.k)&&area>=38&&area<=900&&h.w>2.4&&h.d>2.4;
  let best=baked?.get(h.id)?.door||null;
  if(allowed&&!baked)for(let i=0;i<p.length;i++){
   if(h.source.facade&&i!==h.source.facade.frontEdge)continue;const a=p[i],b=p[(i+1)%p.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]);if(len<3.8)continue;
   const ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,nx=-uz*sign,nz=ux*sign;
   for(const fraction of h.source.facade?[h.source.facade.doorFraction]:[.5,.3,.7]){const t=len*fraction;const margin=h.source.facade?1:1.4;if(t<margin||len-t<margin)continue;const x=a[0]+ux*t,z=a[1]+uz*t;
    if([.7,1.8,3.1].some(d=>!pointInside(x+nx*d,z+nz*d,p)))continue;
    if([.6,1.8,3].some(d=>occupied(x-nx*d,z-nz*d,h)))continue;
    const neighbors=near(grid,x,z,4);
    if([-1,-.5,0,.5,1,2,3].some(v=>{const q=[x+nx*v,z+nz*v];return neighbors.some(other=>other.poly.some((a,j)=>!(other===h&&j===i)&&segmentDistance(...q,a,other.poly[(j+1)%other.poly.length])<.72))}))continue;
    const roads=near(roadGrid,x,z,90);if(!roads.length)continue;const score=Math.min(...roads.map(r=>segmentDistance(x,z,r.a,r.b)));if(score>65)continue;
    if(!best||score<best.score)best={x,z,ux,uz,nx,nz,edge:i,t,len,width:h.source.facade?.doorWidth||1.9,score};
   }
  }
  if(best){h.door=best;h.enterable=true;h.point=(u,v)=>[best.x+best.ux*u+best.nx*v,best.z+best.uz*u+best.nz*v];h.local=(x,z)=>[(x-best.x)*best.ux+(z-best.z)*best.uz,(x-best.x)*best.nx+(z-best.z)*best.nz];
   if(baked){h.furniture=baked.get(h.id).furniture;h.partitions=baked.get(h.id).partitions}else{
   const fits=(u,v,w,d)=>[[-w/2,-d/2],[w/2,-d/2],[-w/2,d/2],[w/2,d/2]].every(([a,b])=>{const q=h.point(u+a,v+b);return pointInside(...q,p)&&p.every((a,i)=>segmentDistance(...q,a,p[(i+1)%p.length])>.3)});
   // Keep a generous 2 m circulation route from the entrance through the rooms.
   for(const [u,v,w,d,kind]of[[-2.3,2.8,1.6,.8,'sofa'],[2.5,2.8,1.3,.7,'kitchen'],[-2.4,6.9,1.6,2.1,'bed'],[2.4,7.3,1.3,.8,'cabinet'],[-2.7,10.7,1.1,.7,'cabinet'],[2.7,11,1.6,2.1,'bed']])if(fits(u,v,w+1,d+1))h.furniture.push({u,v,w,d,kind,point:h.point(u,v)});
   // Clip the cross wall to the actual footprint, preserving irregular houses.
   for(let u=-Math.min(18,h.w+h.d);u<Math.min(18,h.w+h.d);u+=.3){if(Math.abs(u)<1.15)continue;const a=h.point(u,5.2),b=h.point(u+.3,5.2);if(pointInside(...a,p)&&pointInside(...b,p)&&p.every((q,i)=>segmentDistance(...a,q,p[(i+1)%p.length])>.15)){const last=h.partitions.at(-1);if(last&&Math.hypot(last.b[0]-a[0],last.b[1]-a[1])<.01)last.b=b;else h.partitions.push({a,b})}}
   }
  }
  for(let i=0;i<p.length;i++){const a=p[i],b=p[(i+1)%p.length];if(best&&i===best.edge){const left=[best.x-best.ux*best.width/2,best.z-best.uz*best.width/2],right=[best.x+best.ux*best.width/2,best.z+best.uz*best.width/2];h.segments.push({a,b:left},{a:right,b})}else h.segments.push({a,b})}
 }
 let model;
 for(const h of houses)h.neighbors=near(grid,h.x,h.z,Math.hypot(h.w,h.d)+2).filter(n=>n!==h);
 const isOpen=h=>!!doors[h.id];
 function setDoors(value){doors=value||{}}
 function insideHouse(x,z){return near(grid,x,z,0).find(h=>h.enterable&&pointInside(x,z,h.poly))||null}
 function nearestDoor(x,z,r=3){return near(grid,x,z,r).filter(h=>h.enterable&&Math.hypot(h.door.x-x,h.door.z-z)<r).sort((a,b)=>Math.hypot(a.door.x-x,a.door.z-z)-Math.hypot(b.door.x-x,b.door.z-z))[0]||null}
 function blocked(x,z,r=.55,{vehicle=false}={}){
  if(Math.abs(x)>7200||Math.abs(z)>7200)return true;
  for(const h of near(grid,x,z,r+1)){
   if(!h.enterable||vehicle){if(pointInside(x,z,h.poly)||h.poly.some((a,i)=>segmentDistance(x,z,a,h.poly[(i+1)%h.poly.length])<r))return true;continue}
   if(h.segments.some(s=>segmentDistance(x,z,s.a,s.b)<r+.12))return true;
   const door=h.door;if(!isOpen(h)&&segmentDistance(x,z,[door.x-door.ux*door.width/2,door.z-door.uz*door.width/2],[door.x+door.ux*door.width/2,door.z+door.uz*door.width/2])<r+.1)return true;
   if((model?.partitionsFor?.(h,0)||h.partitions).some(s=>segmentDistance(x,z,s.a,s.b)<r+.08))return true;
   const [u,v]=h.local(x,z);if(h.furniture.some(f=>Math.abs(u-f.u)<f.w/2+r&&Math.abs(v-f.v)<f.d/2+r))return true;
  }return false;
 }
 function toggleDoor(h,actors=[]){if(!h?.enterable)return false;if(isOpen(h)&&actors.some(a=>segmentDistance(a.x,a.z,[h.door.x-h.door.ux,h.door.z-h.door.uz],[h.door.x+h.door.ux,h.door.z+h.door.uz])<.85))return false;doors[h.id]=!isOpen(h);return true}
 function lootPoints(){return houses.filter(h=>h.enterable&&Math.hypot(h.x,h.z)<2000).sort((a,b)=>a.id-b.id).filter((_,i)=>i%3===0).slice(0,180).map((h,i)=>{const p=h.point(0,3);return{x:p[0],z:p[1],type:['food','ammo','part','fuel'][i%4],house:h.id}}).filter(l=>!blocked(l.x,l.z,.55))}
 model=addLevels({houses,byId,near:(x,z,r=30)=>near(grid,x,z,r),blocked,insideHouse,nearestDoor,toggleDoor,isOpen,setDoors,getDoors:()=>doors,lootPoints,count:houses.filter(h=>h.enterable).length},pointInside,segmentDistance);return attachConstruction(model);
}
