import {segmentDistance,pointInside} from './housing.js';
export const PANEL_LENGTH=2,BUILD_GRID=.5;
export function panelEnds(h,p){return p.axis==='v'?[h.point(p.u,p.v-1),h.point(p.u,p.v+1)]:[h.point(p.u-1,p.v),h.point(p.u+1,p.v)]}
export function panelSolids(h,p){const[a,b]=panelEnds(h,p);if(p.kind!=='door'||!p.open)return[{a,b}];const at=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];return[{a,b:at(.15)},{a:at(.85),b}]}
export function attachConstruction(housing){
 let state={panels:[],removed:[]},version='';const original=housing.blocked;
 housing.setConstruction=value=>{const next=value||{panels:[],removed:[]};const signature=JSON.stringify(next);if(signature===version)return;version=signature;state=next};
 housing.construction=()=>state;
 housing.partitionsFor=(h,floor=0)=>h.partitions.filter((s,i)=>!state.removed.includes(`${h.id}:${floor}:${i}`));
 housing.blocked=(x,z,r=.55,options={})=>original(x,z,r,options)||state.panels.some(p=>p.floor===(options.floor||0)&&panelSolids(housing.byId.get(p.house),p).some(s=>segmentDistance(x,z,s.a,s.b)<r+.1));
 return housing;
}
export function validPanel(h,p){return panelEnds(h,p).every(q=>pointInside(...q,h.poly)&&h.poly.every((a,i)=>segmentDistance(...q,a,h.poly[(i+1)%h.poly.length])>.25))}
