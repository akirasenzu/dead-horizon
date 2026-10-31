import * as T from './vendor/three.module.js';
import {ModelBatch,shade} from './model-kit.js';
import {buildingStyle,facadeEdges,facadeOpenings,roofFrame} from './building-style.js';
// Detailed exterior geometry is created with nearby interiors and released with them.
export function buildNearFacade(h,material){
 const b=new ModelBatch(),style=buildingStyle(h),edges=facadeEdges(h),height=h.source.h;
 function box(e,t,y,off,w,ht,d,color){const p=e.point(t,y,off);b.box(w,ht,d,color,...p,0,Math.atan2(-e.uz,e.ux),0)}
 for(const w of facadeOpenings(h)){
  const e=edges[w.edge],c=style.frame;
  for(const side of[-1,1])box(e,w.t+side*(w.w/2+.065),w.y,.07,.13,w.h+.19,.19,c);
  box(e,w.t,w.top+.07,.07,w.w+.26,.14,.2,c);box(e,w.t,w.bottom-.09,.14,w.w+.37,.17,.36,0xb4b0a2);
  box(e,w.t,w.y,.075,.055,w.h,.1,c);box(e,w.t,w.y+.28,.075,w.w,.045,.1,c);
  // Curtains and blinds sit inside the opening; there is no opaque wall behind the glass.
  if((h.id+w.edge+w.level)%3!==0){for(const side of[-1,1]){box(e,w.t+side*w.w*.36,w.y,-.085,w.w*.22,w.h*.94,.018,(h.id+w.level)%2?0xc9bda8:0xa6ada3);for(let i=0;i<3;i++)box(e,w.t+side*w.w*.36+(i-1)*.055,w.y,-.065,.012,w.h*.94,.012,0x8f9789)}}
  else{const blind=w.h*.27;box(e,w.t,w.top-blind/2,-.07,w.w,blind,.035,0xaaa69a);for(let j=0;j<5;j++)box(e,w.t,w.top-.04-j*.072,-.04,w.w,.014,.02,0x777e72)}
  if(h.id%7===0&&w.level===0)for(const side of[-1,1]){const center=w.t+side*(w.w*.79+.14);box(e,center,w.y,.035,w.w*.45,w.h+.1,.075,style.shutter);for(let j=0;j<8;j++)box(e,center,w.bottom+.12+j*.19,.082,w.w*.4,.025,.018,shade(style.shutter,.7))}
 }
 for(const e of edges){if(e.length<1)continue;box(e,e.length/2,height-.03,.2,e.length+.12,.12,.19,0x737d78);box(e,e.length/2,height-.23,.045,e.length,.16,.18,0xc1b9a5);
  if(e.index%2===0){const t=Math.min(.32,e.length/3),p=e.point(t,height/2,.16);b.tube(.052,.052,height-.18,0x707a74,...p,'y',8);for(const y of[.38,height*.46,height-.55])box(e,t,y,.13,.17,.05,.16,0x505f58);box(e,t,.18,.23,.11,.28,.28,0x606b64)}
 }
 const f=roofFrame(h),ridge=h.source.h+(f.pitched?f.rise:0),r=(x,y,z)=>f.point(x,y,z),roofAngle=f.angle;
 if(f.pitched){const a=new T.Vector3(...r(f.xm,ridge+.04,f.z0-.23)),end=new T.Vector3(...r(f.xm,ridge+.04,f.z1+.23)),v=end.sub(a),geo=new T.CylinderGeometry(.1,.1,v.length(),10);geo.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));geo.translate(...a.addScaledVector(v,.5).toArray());b.add(geo,0x737b78)}

 if(style.chimney){const x=f.x0+(f.x1-f.x0)*.22,z=f.z0+(f.z1-f.z0)*.32,base=h.source.h+(f.pitched?f.rise*.48:0),p=r(x,base+.8,z);b.box(.65,1.85,.8,shade(style.color,.83),...p,0,roofAngle,0);b.box(.85,.12,1.01,0xb1b0a0,...r(x,base+1.76,z),0,roofAngle,0);for(const dx of[-.18,.18]){b.tube(.095,.11,.25,0x775443,...r(x+dx,base+1.95,z),'y',10);b.tube(.073,.073,.012,0x252f2b,...r(x+dx,base+2.08,z),'y',10)}b.box(.89,.05,1.1,0x68736c,...r(x,base-.05,z),0,roofAngle,0)}
 if(h.id%4===0){const p=r(f.xm,ridge+.8,f.z0+.6);b.tube(.016,.016,1.8,0x748077,...p,'y',6);for(const y of[ridge+.5,ridge+1.1])b.box(.85,.02,.025,0x6f7772,...r(f.xm,y,f.z0+.6),0,roofAngle,0)}
 const d=h.door,e=edges[d.edge];box(e,d.t,2.82,.17,d.width+.45,.15,.4,0xbeb7a6);box(e,d.t, .045,.2,d.width+.3,.09,.45,0xaaa79c);
 box(e,d.t-d.width*.75,1.32,.12,.36,.47,.14,0x4e5c53);box(e,d.t-d.width*.75,1.41,.205,.28,.035,.018,0x1f2b27);
 const mesh=b.mesh(material);mesh.name='near-facade';mesh.geometry.setAttribute('houseId',new T.Float32BufferAttribute(new Float32Array(mesh.geometry.attributes.position.count).fill(h.renderId),1));return mesh;
}
