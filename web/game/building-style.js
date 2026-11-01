import {STOREY_HEIGHT} from './building-metrics.js';
// Visual openings share the original footprint and entrance; collision data is unchanged.
export function buildingStyle(h){const n=Math.abs(Number(h.id)||0),f=h.source.facade;return{plaster:f?.plaster??n%5===0,color:f?.wallColor??[0xa57965,0x916351,0xab7660,0x926d5a,0xc9bfaa,0x795c51][n%6],frame:f?.frameColor??[0xe1dbca,0xc9c9bd,0x617368,0x5f6a6e][n%4],shutter:[0x526357,0x6b7274,0x6b4d42][n%3],roof:f?0x80634d:n%4===0?0x9e7862:0x8f9ba2,chimney:n%3!==0}}
export function facadeEdges(h){
 const sign=h.poly.reduce((v,a,i)=>{const b=h.poly[(i+1)%h.poly.length];return v+a[0]*b[1]-b[0]*a[1]},0)>0?1:-1;
 return h.poly.map((a,i)=>{const b=h.poly[(i+1)%h.poly.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length,nx=uz*sign,nz=-ux*sign;return{index:i,a,b,length,ux,uz,nx,nz,point:(t,y,off=0)=>[a[0]+ux*t+nx*off,y,a[1]+uz*t+nz*off]}});
}
export function facadeOpenings(h){
 const result=[],height=h.source.h;
 for(const e of facadeEdges(h)){
  if(h.source.facade?.storefront&&e.index===h.source.facade.frontEdge){const w=e.length*.57,t=e.length*.35,y=1.65,hh=2.25;result.push({edge:e.index,t,y,w,h:hh,level:0,left:t-w/2,right:t+w/2,bottom:y-hh/2,top:y+hh/2,storefront:true});continue}
  if(h.source.facade?.garage&&e.index===h.source.facade.frontEdge){const put=(fraction,w,y,hh,level,garage=false)=>{const t=e.length*fraction;result.push({edge:e.index,t,y,w,h:hh,level,left:t-w/2,right:t+w/2,bottom:y-hh/2,top:y+hh/2,garage})};put(.16,1.6,1.25,1.3,0);put(.79,Math.min(2.6,e.length*.37),1.2,2.4,0,true);for(let level=1;level<Math.floor(height/STOREY_HEIGHT);level++)for(const t of[.14,.37,.6,.83])put(t,.8,level*STOREY_HEIGHT+1.7,1.65,level);continue}
  const count=Math.min(18,Math.floor((e.length-.9)/3.05));if(!count)continue;const gap=e.length/(count+1);
  for(let col=1;col<=count;col++)for(let level=0;level<Math.ceil(height/STOREY_HEIGHT);level++){
   const t=col*gap,y=level*STOREY_HEIGHT+1.7,w=Math.min(1.45,gap*.59),hh=1.65;
   if(y+hh/2>height-.38||e.index===h.door?.edge&&level===0&&Math.abs(t-h.door.t)<w/2+h.door.width/2+.35||!exposedOpening(h,e,t,w,y-hh/2))continue;
   result.push({edge:e.index,t,y,w,h:hh,level,left:t-w/2,right:t+w/2,bottom:y-hh/2,top:y+hh/2});
  }
 }
 return result;
}
export function exposedOpening(h,e,t,width,bottom){
 const inside=(x,z,p)=>{let hit=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>z)!==(p[j][1]>z)&&x<(p[j][0]-p[i][0])*(z-p[i][1])/(p[j][1]-p[i][1])+p[i][0])hit=!hit;return hit};
 for(const n of h.neighbors||[]){if(n.source.h<=bottom+.1)continue;let covered=0;for(const u of[t-width*.4,t,t+width*.4])if([.12,.45,.9].some(d=>{const p=e.point(u,0,d);return inside(p[0],p[2],n.poly)}))covered++;if(covered>=2)return false}return true;
}
export function facadePanels(h){
 const windows=facadeOpenings(h),result=[];
 for(const edge of facadeEdges(h)){
  const wallHeight=h.source.facade&&edge.index===h.source.facade.frontEdge&&h.source.facade.frontEave?h.source.facade.frontEave:h.source.h;const holes=windows.filter(w=>w.edge===edge.index);
  if(h.door?.edge===edge.index)holes.push({left:h.door.t-h.door.width/2,right:h.door.t+h.door.width/2,bottom:0,top:2.65});
  const xs=[...new Set([0,edge.length,...holes.flatMap(w=>[Math.max(0,w.left),Math.min(edge.length,w.right)])])].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++){const left=xs[i-1],right=xs[i],middle=(left+right)/2,ys=holes.filter(w=>w.left<middle&&w.right>middle).sort((a,b)=>a.bottom-b.bottom);let bottom=0;
   for(const hole of ys){if(hole.bottom>bottom+.001)result.push({edge,left,right,bottom,top:hole.bottom});bottom=Math.max(bottom,hole.top)}
   if(bottom<wallHeight-.001)result.push({edge,left,right,bottom,top:wallHeight});
  }
 }
 return result;
}
export function roofFrame(h){
 let edge=0;for(let i=1;i<h.poly.length;i++)if(distance(h.poly[i],h.poly[(i+1)%h.poly.length])>distance(h.poly[edge],h.poly[(edge+1)%h.poly.length]))edge=i;
 const row=h.door&&(h.source.facade||(h.neighbors||[]).some(n=>n.door&&Math.hypot(n.door.x-h.door.x,n.door.z-h.door.z)<14&&Math.abs(n.door.ux*h.door.ux+n.door.uz*h.door.uz)>.96));if(row)edge=h.door.edge;
 const a=h.poly[edge],b=h.poly[(edge+1)%h.poly.length],len=distance(a,b),ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,vx=-uz,vz=ux,ps=h.poly.map(p=>[(p[0]-h.x)*vx+(p[1]-h.z)*vz,(p[0]-h.x)*ux+(p[1]-h.z)*uz]),x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0])),z0=Math.min(...ps.map(p=>p[1])),z1=Math.max(...ps.map(p=>p[1])),area=Math.abs(h.poly.reduce((v,p,i)=>v+p[0]*h.poly[(i+1)%h.poly.length][1]-h.poly[(i+1)%h.poly.length][0]*p[1],0)/2),rise=Number(h.source.survey?.roofHeight)||Math.min(4.3,(x1-x0)*.375);
 return{x0,x1,z0,z1,xm:(x0+x1)/2,rise,pitched:h.source.survey?.roofShape!=='flat'&&area>20&&x1-x0<26,point:(x,y,z)=>[h.x+vx*x+ux*z,y,h.z+vz*x+uz*z],angle:Math.atan2(ux,uz)};
}
function distance(a,b){return Math.hypot(b[0]-a[0],b[1]-a[1])}
// Clip a pitched roof to its actual concave footprint, preserving rear setbacks.
export function roofSurfaces(h){
 const f=roofFrame(h);if(!f.pitched)return null;const a=f.point(0,0,0),b=f.point(1,0,0),vx=b[0]-a[0],vz=b[2]-a[2],local=p=>(p[0]-a[0])*vx+(p[1]-a[2])*vz;
 const mansard=h.source.facade?.roof==='mansard',inset=Math.min(1.3,(f.x1-f.x0)*.18),cuts=mansard?[f.x0,f.x0+inset,f.xm,f.x1-inset,f.x1]:[f.x0,f.xm,f.x1],ys=mansard?[h.source.facade.frontEave,h.source.h,h.source.h+f.rise,h.source.h,h.source.facade.frontEave]:[h.source.h,h.source.h+f.rise,h.source.h];
 const height=p=>{const x=local(p);for(let i=1;i<cuts.length;i++)if(x<=cuts[i]+1e-5)return ys[i-1]+(ys[i]-ys[i-1])*Math.max(0,Math.min(1,(x-cuts[i-1])/(cuts[i]-cuts[i-1])));return ys.at(-1)};
 function clip(poly,bound,sign){const result=[];for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],d=(local(p)-bound)*sign,e=(local(q)-bound)*sign;if(d>=-1e-7)result.push(p);if(d*e<0){const t=d/(d-e);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}return result}
 const polygons=[];for(let i=1;i<cuts.length;i++){const p=clip(clip(h.poly,cuts[i-1],1),cuts[i],-1);if(p.length>=3)polygons.push(p)}
 const edges=[];for(let i=0;i<h.poly.length;i++){const a=h.poly[i],b=h.poly[(i+1)%h.poly.length],x=local(a),d=local(b)-x,ts=[0,1,...cuts.slice(1,-1).filter(c=>(c-x)/d>0&&(c-x)/d<1).map(c=>(c-x)/d)].sort((a,b)=>a-b),at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];for(let j=1;j<ts.length;j++)edges.push({a:at(ts[j-1]),b:at(ts[j])})}
 const uv=p=>{const x=local([p[0],p[2]]);let d=0;for(let i=1;i<cuts.length;i++){const t=Math.max(0,Math.min(1,(x-cuts[i-1])/(cuts[i]-cuts[i-1])));d+=Math.hypot(cuts[i]-cuts[i-1],ys[i]-ys[i-1])*t;if(x<=cuts[i])break}return[((p[0]-a[0])*vz-(p[2]-a[2])*vx)/2.6,d/2.6]};return{polygons,edges,height,uv};
}
