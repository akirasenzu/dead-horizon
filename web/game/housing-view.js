import {createConstructionView} from './construction-view.js';
import {STOREY_HEIGHT} from './building-metrics.js';
import * as T from './vendor/three.module.js';
import {buildingStyle,facadeEdges,facadeOpenings,facadePanels,roofFrame,roofSurfaces} from './building-style.js';
import {ModelBatch} from './model-kit.js';
import {buildNearFacade} from './facade-model.js';

function texture(kind){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');let seed=73;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 x.fillStyle=kind==='brick'?'#807e72':kind==='roof'?'#373f40':kind==='plaster'?'#ded8c9':'#83705a';x.fillRect(0,0,512,512);
 if(kind==='brick')for(let row=0;row<32;row++)for(let col=-1;col<17;col++){const v=177+random()*62,px=col*32+(row%2)*16;x.fillStyle=`rgb(${v},${v*.92},${v*.84})`;x.fillRect(px+1,row*16+1,30,14);x.fillStyle='#ffffff18';x.fillRect(px+1,row*16+1,30,1);x.fillStyle='#514c442c';x.fillRect(px+1,row*16+14,30,1)}
 else if(kind==='roof')for(let r=0;r<32;r++)for(let j=-1;j<17;j++){const v=84+random()*49;x.fillStyle=`rgb(${v*.92},${v},${v*1.03})`;x.fillRect(j*32+(r%2)*16+1,r*16+1,30,14);x.fillStyle='#ffffff18';x.fillRect(j*32+(r%2)*16+1,r*16+1,30,1)}
 else if(kind==='floor')for(let r=0;r<24;r++){x.fillStyle=`hsl(32 24% ${39+random()*14}%)`;x.fillRect(0,r*22+1,512,20);for(let j=0;j<12;j++){x.strokeStyle='#35261820';x.beginPath();const yy=r*22+random()*20;x.moveTo(0,yy);x.lineTo(512,yy+random()*2);x.stroke()}}
 for(let i=0;i<22000;i++){const px=random()*512,py=random()*512;x.fillStyle=random()>.5?'#fff2':'#171d1819';x.fillRect(px,py,1+random()*2,1)}
 if(kind==='plaster')for(let i=0;i<24;i++){const px=random()*512,py=random()*512;x.strokeStyle='#555f4d15';x.beginPath();x.moveTo(px,py);for(let j=0;j<5;j++)x.lineTo(px+(random()-.5)*18,py+j*8);x.stroke()}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}

const buffer=()=>({p:[],c:[],uv:[],id:[]});
function tri(out,a,b,c,color,id=0,uv=[[0,0],[1,0],[1,1]]){const col=new T.Color(color);for(const [i,p]of[a,b,c].entries()){out.p.push(...p);out.c.push(col.r,col.g,col.b);out.uv.push(...uv[i]);out.id.push(id)}}
function quad(out,a,b,c,d,color,id=0,scale=1){const w=Math.hypot(b[0]-a[0],b[2]-a[2])/scale,h=Math.hypot(c[0]-b[0],c[1]-b[1],c[2]-b[2])/scale;tri(out,a,b,c,color,id,[[0,0],[w,0],[w,h]]);tri(out,a,c,d,color,id,[[0,0],[w,h],[0,h]])}
function polygon(out,p,y,color,id=0){for(const indices of T.ShapeUtils.triangulateShape(p.map(v=>new T.Vector2(...v)),[])){const q=indices.map(i=>[p[i][0],y,p[i][1]]);tri(out,...q,color,id,q.map(p=>[p[0]/3,p[2]/3]))}}
function makeMesh(out,material){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out.p,3));g.setAttribute('color',new T.Float32BufferAttribute(out.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(out.uv,2));g.setAttribute('houseId',new T.Float32BufferAttribute(out.id,1));g.computeVertexNormals();g.computeBoundingSphere();const m=new T.Mesh(g,material);m.receiveShadow=true;return m}
export function createHousingView(scene,housing){
 const root=new T.Group();scene.add(root);const activeId={value:-1},cutHeight={value:1000},brickTexture=texture('brick'),roofTexture=texture('roof'),floorTexture=texture('floor'),plasterTexture=texture('plaster');
 function material(map=null){const m=new T.MeshStandardMaterial({map,vertexColors:true,roughness:.91,side:T.DoubleSide});m.onBeforeCompile=s=>{s.uniforms.activeHouse=activeId;s.uniforms.cutHeight=cutHeight;s.vertexShader='attribute float houseId; varying float vHouse; varying float vHouseY;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHouse=houseId;vHouseY=position.y;');s.fragmentShader='uniform float activeHouse;uniform float cutHeight;varying float vHouse;varying float vHouseY;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(abs(vHouse-activeHouse)<0.1 && vHouseY>cutHeight)discard;')};return m}
 const wallMat=material(brickTexture),plasterMat=material(plasterTexture),roofMat=material(roofTexture),plainMat=material(),floorMat=material(floorTexture),glassMat=material();wallMat.bumpMap=brickTexture;wallMat.bumpScale=.025;roofMat.bumpMap=roofTexture;roofMat.bumpScale=.018;glassMat.transparent=true;glassMat.opacity=.43;glassMat.roughness=.22;glassMat.metalness=.12;glassMat.depthWrite=false;glassMat.forceSinglePass=true;const sectors=new Map(),sectorMeshes=[];
 function outFor(h,kind){const key=Math.floor(h.x/160)+':'+Math.floor(h.z/160)+':'+kind;if(!sectors.has(key))sectors.set(key,{out:buffer(),kind});return sectors.get(key).out}
 let renderId=0;
 for(const h of housing.houses){if(!h.enterable)continue;h.renderId=++renderId;const id=h.renderId,height=h.source.h,style=buildingStyle(h),color=style.color,walls=outFor(h,style.plaster?'plaster':'wall'),roof=outFor(h,'roof'),detail=outFor(h,'detail'),glass=outFor(h,'glass');
  const edges=facadeEdges(h),wall=(a,b,y0,y1,col=color)=>quad(walls,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],col,id,3);
  for(const p of facadePanels(h)){const a=p.edge.point(p.left,0),b=p.edge.point(p.right,0);wall([a[0],a[2]],[b[0],b[2]],p.bottom,p.top)}
  for(const e of edges){const edgeHeight=h.source.facade&&e.index===h.source.facade.frontEdge&&h.source.facade.frontEave?h.source.facade.frontEave:height;const point=(t,y,off=.035)=>e.point(t,y,off);quad(detail,point(0,0),point(e.length,0),point(e.length,.32),point(0,.32),0x777a70,id);quad(detail,point(0,edgeHeight-.22),point(e.length,edgeHeight-.22),point(e.length,edgeHeight),point(0,edgeHeight),0xb5af9f,id);if(!style.plaster)for(let y=STOREY_HEIGHT;y<edgeHeight-.8;y+=STOREY_HEIGHT)quad(detail,point(0,y-.045),point(e.length,y-.045),point(e.length,y+.045),point(0,y+.045),0xa89f8e,id)}
  for(const w of facadeOpenings(h)){const e=edges[w.edge],p=(t,y,off=.038)=>e.point(t,y,off),c=style.frame;if(w.garage){quad(detail,p(w.left,w.bottom),p(w.right,w.bottom),p(w.right,w.top),p(w.left,w.top),0xd5d2b8,id);continue}
   for(const side of[-1,1]){const t=w.t+side*(w.w/2+.055);quad(detail,p(t-.055,w.bottom-.1),p(t+.055,w.bottom-.1),p(t+.055,w.top+.1),p(t-.055,w.top+.1),c,id)}
   for(const y of[w.bottom-.055,w.top+.055])quad(detail,p(w.left-.1,y-.055),p(w.right+.1,y-.055),p(w.right+.1,y+.055),p(w.left-.1,y+.055),c,id);
   quad(glass,p(w.left,w.bottom,-.012),p(w.right,w.bottom,-.012),p(w.right,w.top,-.012),p(w.left,w.top,-.012),0x789293,id);
   if(!w.storefront)quad(detail,p(w.t-.026,w.bottom,.02),p(w.t+.026,w.bottom,.02),p(w.t+.026,w.top,.02),p(w.t-.026,w.top,.02),c,id);
  }
  const d=h.door,face=(u,y,v)=>{const p=h.point(u,v);return[p[0],y,p[1]]};for(const u of[-d.width/2-.1,d.width/2+.1])quad(detail,face(u-.08,0,-.03),face(u+.08,0,-.03),face(u+.08,2.7,-.03),face(u-.08,2.7,-.03),h.source.facade?style.frame:0xc7bba0,id);
  const surface=roofSurfaces(h);if(surface){for(const poly of surface.polygons)for(const indices of T.ShapeUtils.triangulateShape(poly.map(p=>new T.Vector2(...p)),[])){const q=indices.map(i=>[poly[i][0],surface.height(poly[i]),poly[i][1]]);tri(roof,...q,style.roof,id,q.map(surface.uv))}for(const e of surface.edges){const a=e.a,b=e.b,top=Math.min(surface.height(a),surface.height(b));if(top>height+.001)wall(a,b,height,top);const ya=surface.height(a),yb=surface.height(b);if(Math.abs(ya-yb)>.001)tri(walls,[a[0],Math.min(ya,yb),a[1]],[b[0],Math.min(ya,yb),b[1]],ya>yb?[a[0],ya,a[1]]:[b[0],yb,b[1]],color,id)}}else polygon(roof,h.poly,height,0x8b9497,id);
 }

 for(const {out,kind}of sectors.values()){const m=makeMesh(out,kind==='wall'?wallMat:kind==='plaster'?plasterMat:kind==='roof'?roofMat:kind==='glass'?glassMat:plainMat);root.add(m);sectorMeshes.push(m)}sectors.clear();
 const workView=createConstructionView(scene,housing);let removedSignature='';
 const blackDoorMaterial=new T.MeshStandardMaterial({color:0x242622,roughness:.65});const loaded=new Map(),doorMaterial=new T.MeshStandardMaterial({color:0x345048,roughness:.75}),handleMaterial=new T.MeshStandardMaterial({color:0xc8b07a,metalness:.5,roughness:.4});
 const boxGeometry=new T.BoxGeometry(1,1,1);
 function interior(h){
  const g=new T.Group(),out=buffer(),floors=buffer(),ceilings=[],groups=[],id=h.renderId;root.add(g);g.add(buildNearFacade(h,plainMat));
  const floorPolygon=(out,y,color,hole=false)=>{
   if(!hole||!h.stairs){polygon(out,h.poly,y,color,id);return}
   const st=h.stairs,opening=[h.point(st.u-.73,st.start-.05),h.point(st.u+.73,st.start-.05),h.point(st.u+.73,st.end+.1),h.point(st.u-.73,st.end+.1)],points=[...h.poly,...opening];
   for(const indices of T.ShapeUtils.triangulateShape(h.poly.map(p=>new T.Vector2(...p)),[opening.map(p=>new T.Vector2(...p))])){const q=indices.map(i=>[points[i][0],y,points[i][1]]);tri(out,...q,color,id,q.map(p=>[p[0]/3,p[2]/3]))}
  };
  for(let level=0;level<h.floorCount;level++){
   const base=level*STOREY_HEIGHT,ceil=buffer();floorPolygon(floors,base+.055,level?0xb9a98e:0xc1ad91,level>0);floorPolygon(ceil,base+(STOREY_HEIGHT-.02),0xdbd4c2,level<h.floorCount-1);const ceiling=makeMesh(ceil,plainMat);g.add(ceiling);ceilings.push(ceiling);
   const put=(u,y,v,w,ht,d,color)=>{
    y+=base;const a=h.point(u-w/2,v-d/2),b=h.point(u+w/2,v-d/2),c=h.point(u+w/2,v+d/2),e=h.point(u-w/2,v+d/2);
    quad(out,[a[0],y,a[1]],[b[0],y,b[1]],[b[0],y+ht,b[1]],[a[0],y+ht,a[1]],color,id);quad(out,[b[0],y,b[1]],[c[0],y,c[1]],[c[0],y+ht,c[1]],[b[0],y+ht,b[1]],color,id);quad(out,[c[0],y,c[1]],[e[0],y,e[1]],[e[0],y+ht,e[1]],[c[0],y+ht,c[1]],color,id);quad(out,[e[0],y,e[1]],[a[0],y,a[1]],[a[0],y+ht,a[1]],[e[0],y+ht,e[1]],color,id);quad(out,[a[0],y+ht,a[1]],[b[0],y+ht,b[1]],[c[0],y+ht,c[1]],[e[0],y+ht,e[1]],color,id);
   };
   for(const panel of facadePanels(h)){const y0=Math.max(base+.12,panel.bottom),y1=Math.min(base+(STOREY_HEIGHT-.05),panel.top);if(y1<=y0)continue;const a=panel.edge.point(panel.left,y0,-.045),b=panel.edge.point(panel.right,y0,-.045),c=panel.edge.point(panel.right,y1,-.045),d=panel.edge.point(panel.left,y1,-.045);quad(out,a,b,c,d,level?0xb8c1b1:0xd0c3ab,id)}

   for(const seg of housing.partitionsFor(h,level))quad(out,[seg.a[0],base,seg.a[1]],[seg.b[0],base,seg.b[1]],[seg.b[0],base+(STOREY_HEIGHT-.05),seg.b[1]],[seg.a[0],base+(STOREY_HEIGHT-.05),seg.a[1]],level?0xb4bfc0:0xb7b5a4,id);
   for(const f of housing.floorFurniture(h,level)){
    if(f.kind==='bed'){put(f.u,.12,f.v,f.w,.35,f.d,0x66533d);put(f.u,.47,f.v,f.w,.2,f.d,0xd6cebb);put(f.u,.68,f.v+.3,f.w,.05,f.d*.65,0x6a8278);put(f.u,.69,f.v-f.d*.32,f.w*.7,.15,.45,0xe0d7c3)}
    else if(f.kind==='sofa'){put(f.u,.05,f.v,f.w,.42,f.d,0x526e65);put(f.u,.45,f.v+.28,f.w,.55,.2,0x435b51);for(const side of[-1,1])put(f.u+side*(f.w/2-.1),.42,f.v,.2,.28,f.d,0x4e665b)}
    else if(f.kind==='kitchen'||f.kind==='washbasin'){put(f.u,.05,f.v,f.w,.85,f.d,0x7e8a82);put(f.u,.9,f.v,f.w,.08,f.d,0xc3beb0);put(f.u,.99,f.v,.55,.02,.45,f.kind==='washbasin'?0xdbded7:0x383d3d)}
    else if(f.kind==='desk'){put(f.u,.72,f.v,f.w,.1,f.d,0x987e5a);for(const side of[-1,1])put(f.u+side*(f.w/2-.12),.05,f.v,.1,.67,f.d*.75,0x5b665d)}
    else{put(f.u,.05,f.v,f.w,1.7,f.d,0x7b6046);put(f.u,1.4,f.v-f.d/2-.02,f.w*.8,.04,.04,0xc0b18c)}
   }
   if(h.stairs&&level<h.floorCount-1){const st=h.stairs;for(let i=0;i<17;i++){const v=st.start+(i+.5)*(st.end-st.start)/17,ht=(i+1)*STOREY_HEIGHT/17;put(st.u,.06,v,st.width,ht-.06,(st.end-st.start)/17+.015,i%2?0x897255:0x998164)}for(const side of[-1,1])for(let i=0;i<5;i++){const t=i/4;put(st.u+side*(st.width/2+.04),t*STOREY_HEIGHT,st.start+t*(st.end-st.start),.065,.95,.065,0x494e45)}
    const a=h.point(st.u-st.width/2-.04,st.start),b=h.point(st.u-st.width/2-.04,st.end);quad(out,[a[0],base+.9,a[1]],[b[0],base+STOREY_HEIGHT+.9,b[1]],[b[0],base+STOREY_HEIGHT+.97,b[1]],[a[0],base+.97,a[1]],0x50594a,id);
    put(st.u,.07,st.start-.55,st.width*.7,.025,.2,0xc5a16a);
   }
  }
  g.add(makeMesh(floors,floorMat),makeMesh(out,plainMat));
  const d=h.door,pivot=new T.Group();pivot.position.set(d.x-d.ux*d.width/2,0,d.z-d.uz*d.width/2);pivot.rotation.y=Math.atan2(-d.uz,d.ux);g.add(pivot);const leafBatch=new ModelBatch(),handleBatch=new ModelBatch();leafBatch.box(d.width,2.58,.1,0xffffff,d.width/2,1.29,0);for(const y of[.58,1.58])leafBatch.box(d.width*.7,.7,.04,0xffffff,d.width/2,y,-.07);handleBatch.box(.32,.065,.03,0xffffff,d.width/2,1.13,-.08);handleBatch.box(.15,.06,.18,0xffffff,d.width-.18,1.1,0);pivot.add(leafBatch.mesh(h.source.facade?blackDoorMaterial:doorMaterial),handleBatch.mesh(handleMaterial));g.updateMatrixWorld(true);return{h,g,pivot,ceilings,baseAngle:pivot.rotation.y,stamp:0};
 }
 let last=-Infinity,current=null,doorHealth={};
 function update(position,third,now,actor={}){
  current=housing.insideHouse(position.x,position.z);const level=actor.floor||0;activeId.value=third&&current?current.renderId:-1;cutHeight.value=third?level*STOREY_HEIGHT+(STOREY_HEIGHT-.3):1000;
  if(now-last>200){last=now;const wanted=housing.near(position.x,position.z,45).filter(h=>h.enterable&&Math.hypot(h.x-position.x,h.z-position.z)<45+Math.max(h.w,h.d)).sort((a,b)=>a.id===current?.id?-1:b.id===current?.id?1:Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z));let budget=3;
   for(const h of wanted){if(!loaded.has(h.id)&&budget-->0)loaded.set(h.id,interior(h));if(loaded.has(h.id))loaded.get(h.id).stamp=now}
   for(const[id,v]of loaded)if(now-v.stamp>1500&&id!==current?.id){root.remove(v.g);v.g.traverse(o=>{if(o.geometry&&o.geometry!==boxGeometry)o.geometry.dispose()});loaded.delete(id)}
   for(const m of sectorMeshes){const bound=m.geometry.boundingSphere;m.visible=Math.hypot(bound.center.x-position.x,bound.center.z-position.z)<(window.DEAD_HORIZON_CONFIG?.viewDistance||700)+bound.radius}
  }
  for(const v of loaded.values()){v.pivot.visible=doorHealth[v.h.id]!==0;v.pivot.rotation.y=v.baseAngle+(housing.isOpen(v.h)?-Math.PI*.52:0);v.ceilings.forEach((ceiling,i)=>ceiling.visible=!(third&&current?.id===v.h.id&&i>=level))}root.updateMatrixWorld(true);
 }
 return{update,setConstruction(state){housing.setConstruction(state);workView.update(state);const next=JSON.stringify(state?.removed||[]);if(next!==removedSignature){removedSignature=next;for(const v of loaded.values()){root.remove(v.g);v.g.traverse(o=>{if(o.geometry&&o.geometry!==boxGeometry)o.geometry.dispose()})}loaded.clear();last=-Infinity}},setDoorHealth(value){doorHealth=value||{}},reset(){housing.setDoors({})},current:()=>current,stats:()=>({loaded:loaded.size,sectors:sectorMeshes.length})};

}
function pointSign(p){return p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)>0?1:-1}
function hyp(a,b){return Math.hypot(b[0]-a[0],b[1]-a[1])}

function shadeRoof(color){return new T.Color(color).multiplyScalar(.85).getHex()}

export const createSurfaceTexture=texture;
