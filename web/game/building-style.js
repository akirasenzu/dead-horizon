import {STOREY_HEIGHT} from './building-metrics.js';
// Visual openings share the original footprint and entrance; collision data is unchanged.
export function buildingStyle(h){const n=Math.abs(Number(h.id)||0);return{plaster:n%5===0,color:[0xa57965,0x916351,0xab7660,0x926d5a,0xc9bfaa,0x795c51][n%6],frame:[0xe1dbca,0xc9c9bd,0x617368,0x5f6a6e][n%4],shutter:[0x526357,0x6b7274,0x6b4d42][n%3],roof:n%4===0?0x9e7862:0x8f9ba2,chimney:n%3!==0}}
export function facadeEdges(h){
 const sign=h.poly.reduce((v,a,i)=>{const b=h.poly[(i+1)%h.poly.length];return v+a[0]*b[1]-b[0]*a[1]},0)>0?1:-1;
 return h.poly.map((a,i)=>{const b=h.poly[(i+1)%h.poly.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/length,uz=(b[1]-a[1])/length,nx=uz*sign,nz=-ux*sign;return{index:i,a,b,length,ux,uz,nx,nz,point:(t,y,off=0)=>[a[0]+ux*t+nx*off,y,a[1]+uz*t+nz*off]}});
}
export function facadeOpenings(h){
 const result=[],height=h.source.h;
 for(const e of facadeEdges(h)){
  const count=Math.min(18,Math.floor((e.length-.9)/3.05));if(!count)continue;const gap=e.length/(count+1);
  for(let col=1;col<=count;col++)for(let level=0;level<Math.ceil(height/STOREY_HEIGHT);level++){
   const t=col*gap,y=level*STOREY_HEIGHT+1.7,w=Math.min(1.45,gap*.59),hh=1.65;
   if(y+hh/2>height-.38||e.index===h.door?.edge&&level===0&&Math.abs(t-h.door.t)<w/2+h.door.width/2+.35)continue;
   result.push({edge:e.index,t,y,w,h:hh,level,left:t-w/2,right:t+w/2,bottom:y-hh/2,top:y+hh/2});
  }
 }
 return result;
}
export function facadePanels(h){
 const windows=facadeOpenings(h),result=[];
 for(const edge of facadeEdges(h)){
  const holes=windows.filter(w=>w.edge===edge.index);
  if(h.door?.edge===edge.index)holes.push({left:h.door.t-h.door.width/2,right:h.door.t+h.door.width/2,bottom:0,top:2.65});
  const xs=[...new Set([0,edge.length,...holes.flatMap(w=>[Math.max(0,w.left),Math.min(edge.length,w.right)])])].sort((a,b)=>a-b);
  for(let i=1;i<xs.length;i++){const left=xs[i-1],right=xs[i],middle=(left+right)/2,ys=holes.filter(w=>w.left<middle&&w.right>middle).sort((a,b)=>a.bottom-b.bottom);let bottom=0;
   for(const hole of ys){if(hole.bottom>bottom+.001)result.push({edge,left,right,bottom,top:hole.bottom});bottom=Math.max(bottom,hole.top)}
   if(bottom<h.source.h-.001)result.push({edge,left,right,bottom,top:h.source.h});
  }
 }
 return result;
}
export function roofFrame(h){let edge=0;for(let i=1;i<h.poly.length;i++)if(distance(h.poly[i],h.poly[(i+1)%h.poly.length])>distance(h.poly[edge],h.poly[(edge+1)%h.poly.length]))edge=i;const a=h.poly[edge],b=h.poly[(edge+1)%h.poly.length],len=distance(a,b),ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,vx=-uz,vz=ux,ps=h.poly.map(p=>[(p[0]-h.x)*vx+(p[1]-h.z)*vz,(p[0]-h.x)*ux+(p[1]-h.z)*uz]),x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0])),z0=Math.min(...ps.map(p=>p[1])),z1=Math.max(...ps.map(p=>p[1])),area=Math.abs(h.poly.reduce((v,p,i)=>v+p[0]*h.poly[(i+1)%h.poly.length][1]-h.poly[(i+1)%h.poly.length][0]*p[1],0)/2),rise=Number(h.source.survey?.roofHeight)||Math.min(4.3,(x1-x0)*.375);return{x0,x1,z0,z1,xm:(x0+x1)/2,rise,pitched:h.source.survey?.roofShape!=='flat'&&area>20&&x1-x0<26,point:(x,y,z)=>[h.x+vx*x+ux*z,y,h.z+vz*x+uz*z],angle:Math.atan2(ux,uz)}}
function distance(a,b){return Math.hypot(b[0]-a[0],b[1]-a[1])}
// Clip a pitched roof to its actual concave footprint, preserving rear setbacks.
export function roofSurfaces(h){
 const f=roofFrame(h);if(!f.pitched)return null;
 const a=f.point(0,0,0),b=f.point(1,0,0),vx=b[0]-a[0],vz=b[2]-a[2];
 const local=p=>(p[0]-a[0])*vx+(p[1]-a[2])*vz;
 const height=p=>h.source.h+f.rise*Math.max(0,1-Math.abs(local(p)-f.xm)/((f.x1-f.x0)/2));
 function clip(sign){const result=[];for(let i=0;i<h.poly.length;i++){const p=h.poly[i],q=h.poly[(i+1)%h.poly.length],d=(local(p)-f.xm)*sign,e=(local(q)-f.xm)*sign;if(d>=-1e-7)result.push(p);if(d*e<0){const t=d/(d-e);result.push([p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t])}}return result}
 const edges=[];for(let i=0;i<h.poly.length;i++){const a=h.poly[i],b=h.poly[(i+1)%h.poly.length],d=local(a)-f.xm,e=local(b)-f.xm;if(d*e<0){const t=d/(d-e),m=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];edges.push({a,b:m},{a:m,b})}else edges.push({a,b})}
 return{polygons:[clip(1),clip(-1)].filter(p=>p.length>=3),edges,height};
}
