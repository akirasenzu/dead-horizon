import * as T from './vendor/three.module.js';
const brickColors=[0x985c43,0xad6f50,0x87503d,0xb48061,0xb4a08a,0x795245];
function texture(kind){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');let seed=73;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 x.fillStyle=kind==='brick'?'#827b6e':kind==='roof'?'#30393c':'#83705a';x.fillRect(0,0,256,256);
 if(kind==='brick')for(let row=0;row<16;row++)for(let col=-1;col<9;col++){const v=160+random()*70;x.fillStyle=`rgb(${v},${v*.84},${v*.72})`;x.fillRect(col*32+(row%2)*16+1,row*16+1,30,14);x.fillStyle='#ffffff12';x.fillRect(col*32+(row%2)*16+1,row*16+1,30,2)}
 else if(kind==='roof')for(let r=0;r<16;r++)for(let j=-1;j<9;j++){const v=65+random()*35;x.fillStyle=`rgb(${v*.85},${v*.96},${v})`;x.fillRect(j*32+(r%2)*16+1,r*16+1,30,14)}
 else for(let r=0;r<16;r++){x.fillStyle=`hsl(32 24% ${39+random()*14}%)`;x.fillRect(0,r*16+1,256,14);for(let j=0;j<24;j++){x.strokeStyle='#35261820';x.beginPath();const yy=r*16+random()*14;x.moveTo(0,yy);x.lineTo(256,yy+random()*2);x.stroke()}}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}
const buffer=()=>({p:[],c:[],uv:[],id:[]});
function tri(out,a,b,c,color,id=0,uv=[[0,0],[1,0],[1,1]]){const col=new T.Color(color);for(const [i,p]of[a,b,c].entries()){out.p.push(...p);out.c.push(col.r,col.g,col.b);out.uv.push(...uv[i]);out.id.push(id)}}
function quad(out,a,b,c,d,color,id=0,scale=1){const w=Math.hypot(b[0]-a[0],b[2]-a[2])/scale,h=Math.hypot(c[0]-b[0],c[1]-b[1],c[2]-b[2])/scale;tri(out,a,b,c,color,id,[[0,0],[w,0],[w,h]]);tri(out,a,c,d,color,id,[[0,0],[w,h],[0,h]])}
function polygon(out,p,y,color,id=0){for(const indices of T.ShapeUtils.triangulateShape(p.map(v=>new T.Vector2(...v)),[])){const q=indices.map(i=>[p[i][0],y,p[i][1]]);tri(out,...q,color,id,q.map(p=>[p[0]/3,p[2]/3]))}}
function makeMesh(out,material){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(out.p,3));g.setAttribute('color',new T.Float32BufferAttribute(out.c,3));g.setAttribute('uv',new T.Float32BufferAttribute(out.uv,2));g.setAttribute('houseId',new T.Float32BufferAttribute(out.id,1));g.computeVertexNormals();g.computeBoundingSphere();const m=new T.Mesh(g,material);m.receiveShadow=true;return m}
export function createHousingView(scene,housing){
 const root=new T.Group();scene.add(root);const activeId={value:-1},cutHeight={value:1000},brickTexture=texture('brick'),roofTexture=texture('roof'),floorTexture=texture('floor');
 function material(map=null){const m=new T.MeshStandardMaterial({map,vertexColors:true,roughness:.91,side:T.DoubleSide});m.onBeforeCompile=s=>{s.uniforms.activeHouse=activeId;s.uniforms.cutHeight=cutHeight;s.vertexShader='attribute float houseId; varying float vHouse; varying float vHouseY;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvHouse=houseId;vHouseY=position.y;');s.fragmentShader='uniform float activeHouse;uniform float cutHeight;varying float vHouse;varying float vHouseY;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(abs(vHouse-activeHouse)<0.1 && vHouseY>cutHeight)discard;')};return m}
 const wallMat=material(brickTexture),roofMat=material(roofTexture),plainMat=material(),floorMat=material(floorTexture),glassMat=material();const sectors=new Map(),sectorMeshes=[];
 function outFor(h,kind){const key=Math.floor(h.x/160)+':'+Math.floor(h.z/160)+':'+kind;if(!sectors.has(key))sectors.set(key,{out:buffer(),kind});return sectors.get(key).out}
 let renderId=0;
 for(const h of housing.houses){if(!h.enterable)continue;h.renderId=++renderId;const id=h.renderId,height=h.source.h,color=brickColors[h.id%brickColors.length],walls=outFor(h,'wall'),roof=outFor(h,'roof'),detail=outFor(h,'detail');
  const wall=(a,b,y0,y1,col=color)=>quad(walls,[a[0],y0,a[1]],[b[0],y0,b[1]],[b[0],y1,b[1]],[a[0],y1,a[1]],col,id,4);
  for(const s of h.segments)wall(s.a,s.b,0,height);
  for(const seg of h.segments)wall(seg.a,seg.b,0,.38,0x67675d);
  const d=h.door,l=[d.x-d.ux*d.width/2,d.z-d.uz*d.width/2],r=[d.x+d.ux*d.width/2,d.z+d.uz*d.width/2];wall(l,r,2.65,height);
  const face=(u,y,v)=>{const p=h.point(u,v);return[p[0],y,p[1]]};
  // Stone lintel, jambs, threshold and a glazed transom identify the entrance.
  quad(detail,face(-1.08,2.65,-.13),face(1.08,2.65,-.13),face(1.08,2.9,-.13),face(-1.08,2.9,-.13),0xc7bba0,id);
  for(const u of[-1.03,1.03])quad(detail,face(u-.08,0,-.12),face(u+.08,0,-.12),face(u+.08,2.65,-.12),face(u-.08,2.65,-.12),0xc7bba0,id);
  for(let i=0;i<h.poly.length;i++){const a=h.poly[i],b=h.poly[(i+1)%h.poly.length],len=Math.hypot(b[0]-a[0],b[1]-a[1]),ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len;const sign=pointSign(h.poly),nx=uz*sign,nz=-ux*sign;
   const p=(t,y,off=.06)=>[a[0]+ux*t+nx*off,y,a[1]+uz*t+nz*off];
   for(let t=1.7;t<len-1.2;t+=3.1)for(let y=1.8;y<height-1;y+=3.4){if(i===d.edge&&y<3&&Math.abs(t-d.t)<1.8)continue;const w=Math.min(.65,len/5),hh=.8;
    quad(detail,p(t-w-.1,y-hh-.1),p(t+w+.1,y-hh-.1),p(t+w+.1,y+hh+.1),p(t-w-.1,y+hh+.1),0xc9bea9,id);
    quad(detail,p(t-w,y-hh,.075),p(t+w,y-hh,.075),p(t+w,y+hh,.075),p(t-w,y+hh,.075),0x304449,id);
    quad(detail,p(t-.035,y-hh,.09),p(t+.035,y-hh,.09),p(t+.035,y+hh,.09),p(t-.035,y+hh,.09),0xd2c7af,id);
    quad(detail,p(t-w-.15,y-hh-.12,.12),p(t+w+.15,y-hh-.12,.12),p(t+w+.15,y-hh,.12),p(t-w-.15,y-hh,.12),0xb7b0a1,id);
   }
   wall(a,b,height-.22,height,0x9d9584);
  }
  // Retain the footprint. Rectangular town houses receive pitched slate roofs.
  let edge=0;for(let i=1;i<h.poly.length;i++)if(hyp(h.poly[i],h.poly[(i+1)%h.poly.length])>hyp(h.poly[edge],h.poly[(edge+1)%h.poly.length]))edge=i;
  const a=h.poly[edge],b=h.poly[(edge+1)%h.poly.length],len=hyp(a,b),ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,vx=-uz,vz=ux,ps=h.poly.map(p=>[(p[0]-h.x)*vx+(p[1]-h.z)*vz,(p[0]-h.x)*ux+(p[1]-h.z)*uz]),x0=Math.min(...ps.map(p=>p[0])),x1=Math.max(...ps.map(p=>p[0])),z0=Math.min(...ps.map(p=>p[1])),z1=Math.max(...ps.map(p=>p[1]));
  const rectArea=(x1-x0)*(z1-z0),area=Math.abs(h.poly.reduce((v,p,i)=>v+p[0]*h.poly[(i+1)%h.poly.length][1]-h.poly[(i+1)%h.poly.length][0]*p[1],0)/2);
  if(area/rectArea>.9&&x1-x0<26){const p=(x,y,z)=>[h.x+vx*x+ux*z,y,h.z+vz*x+uz*z],xm=(x0+x1)/2,rise=Math.min(4.3,(x1-x0)*.45);quad(roof,p(x0-.2,height,z0-.2),p(x0-.2,height,z1+.2),p(xm,height+rise,z1+.2),p(xm,height+rise,z0-.2),0xb4bbc0,id,3);quad(roof,p(x1+.2,height,z1+.2),p(x1+.2,height,z0-.2),p(xm,height+rise,z0-.2),p(xm,height+rise,z1+.2),0x8c959c,id,3);for(const z of[z0,z1])tri(walls,p(x0,height,z),p(x1,height,z),p(xm,height+rise,z),color,id)}else polygon(roof,h.poly,height,0x8b9497,id);
 }
 for(const {out,kind}of sectors.values()){const m=makeMesh(out,kind==='wall'?wallMat:kind==='roof'?roofMat:plainMat);root.add(m);sectorMeshes.push(m)}sectors.clear();
 const loaded=new Map(),doorMaterial=new T.MeshStandardMaterial({color:0x345048,roughness:.75}),handleMaterial=new T.MeshStandardMaterial({color:0xc8b07a,metalness:.5,roughness:.4});
 const boxGeometry=new T.BoxGeometry(1,1,1);
 function interior(h){
  const g=new T.Group(),out=buffer(),floors=buffer(),ceilings=[],groups=[],id=h.renderId;root.add(g);
  const floorPolygon=(out,y,color,hole=false)=>{
   if(!hole||!h.stairs){polygon(out,h.poly,y,color,id);return}
   const st=h.stairs,opening=[h.point(st.u-.73,st.start-.05),h.point(st.u+.73,st.start-.05),h.point(st.u+.73,st.end+.1),h.point(st.u-.73,st.end+.1)],points=[...h.poly,...opening];
   for(const indices of T.ShapeUtils.triangulateShape(h.poly.map(p=>new T.Vector2(...p)),[opening.map(p=>new T.Vector2(...p))])){const q=indices.map(i=>[points[i][0],y,points[i][1]]);tri(out,...q,color,id,q.map(p=>[p[0]/3,p[2]/3]))}
  };
  for(let level=0;level<h.floorCount;level++){
   const base=level*3.4,ceil=buffer();floorPolygon(floors,base+.055,level?0xb9a98e:0xc1ad91,level>0);floorPolygon(ceil,base+3.38,0xdbd4c2,level<h.floorCount-1);const ceiling=makeMesh(ceil,plainMat);g.add(ceiling);ceilings.push(ceiling);
   const put=(u,y,v,w,ht,d,color)=>{
    y+=base;const a=h.point(u-w/2,v-d/2),b=h.point(u+w/2,v-d/2),c=h.point(u+w/2,v+d/2),e=h.point(u-w/2,v+d/2);
    quad(out,[a[0],y,a[1]],[b[0],y,b[1]],[b[0],y+ht,b[1]],[a[0],y+ht,a[1]],color,id);quad(out,[b[0],y,b[1]],[c[0],y,c[1]],[c[0],y+ht,c[1]],[b[0],y+ht,b[1]],color,id);quad(out,[c[0],y,c[1]],[e[0],y,e[1]],[e[0],y+ht,e[1]],[c[0],y+ht,c[1]],color,id);quad(out,[e[0],y,e[1]],[a[0],y,a[1]],[a[0],y+ht,a[1]],[e[0],y+ht,e[1]],color,id);quad(out,[a[0],y+ht,a[1]],[b[0],y+ht,b[1]],[c[0],y+ht,c[1]],[e[0],y+ht,e[1]],color,id);
   };
   const segments=level?h.poly.map((a,i)=>({a,b:h.poly[(i+1)%h.poly.length]})):h.segments;
   for(const seg of segments){const dx=seg.b[0]-seg.a[0],dz=seg.b[1]-seg.a[1],len=Math.hypot(dx,dz),sg=pointSign(h.poly),nx=-dz/len*.035*sg,nz=dx/len*.035*sg;quad(out,[seg.a[0]+nx,base+.12,seg.a[1]+nz],[seg.b[0]+nx,base+.12,seg.b[1]+nz],[seg.b[0]+nx,base+3.35,seg.b[1]+nz],[seg.a[0]+nx,base+3.35,seg.a[1]+nz],level?0xb8c1b1:0xd0c3ab,id)}
   for(const seg of h.partitions)quad(out,[seg.a[0],base,seg.a[1]],[seg.b[0],base,seg.b[1]],[seg.b[0],base+3.35,seg.b[1]],[seg.a[0],base+3.35,seg.a[1]],level?0xb4bfc0:0xb7b5a4,id);
   for(const f of housing.floorFurniture(h,level)){
    if(f.kind==='bed'){put(f.u,.12,f.v,f.w,.35,f.d,0x66533d);put(f.u,.47,f.v,f.w,.2,f.d,0xd6cebb);put(f.u,.68,f.v+.3,f.w,.05,f.d*.65,0x6a8278);put(f.u,.69,f.v-f.d*.32,f.w*.7,.15,.45,0xe0d7c3)}
    else if(f.kind==='sofa'){put(f.u,.05,f.v,f.w,.42,f.d,0x526e65);put(f.u,.45,f.v+.28,f.w,.55,.2,0x435b51);for(const side of[-1,1])put(f.u+side*(f.w/2-.1),.42,f.v,.2,.28,f.d,0x4e665b)}
    else if(f.kind==='kitchen'||f.kind==='washbasin'){put(f.u,.05,f.v,f.w,.85,f.d,0x7e8a82);put(f.u,.9,f.v,f.w,.08,f.d,0xc3beb0);put(f.u,.99,f.v,.55,.02,.45,f.kind==='washbasin'?0xdbded7:0x383d3d)}
    else if(f.kind==='desk'){put(f.u,.72,f.v,f.w,.1,f.d,0x987e5a);for(const side of[-1,1])put(f.u+side*(f.w/2-.12),.05,f.v,.1,.67,f.d*.75,0x5b665d)}
    else{put(f.u,.05,f.v,f.w,1.7,f.d,0x7b6046);put(f.u,1.4,f.v-f.d/2-.02,f.w*.8,.04,.04,0xc0b18c)}
   }
   if(h.stairs&&level<h.floorCount-1){const st=h.stairs;for(let i=0;i<17;i++){const v=st.start+(i+.5)*(st.end-st.start)/17,ht=(i+1)*3.4/17;put(st.u,.06,v,st.width,ht-.06,(st.end-st.start)/17+.015,i%2?0x897255:0x998164)}for(const side of[-1,1])for(let i=0;i<5;i++){const t=i/4;put(st.u+side*(st.width/2+.04),t*3.4,st.start+t*(st.end-st.start),.065,.95,.065,0x494e45)}
    const a=h.point(st.u-st.width/2-.04,st.start),b=h.point(st.u-st.width/2-.04,st.end);quad(out,[a[0],base+.9,a[1]],[b[0],base+4.3,b[1]],[b[0],base+4.37,b[1]],[a[0],base+.97,a[1]],0x50594a,id);
    put(st.u,.07,st.start-.55,st.width*.7,.025,.2,0xc5a16a);
   }
  }
  g.add(makeMesh(floors,floorMat),makeMesh(out,plainMat));
  const d=h.door,pivot=new T.Group();pivot.position.set(d.x-d.ux*d.width/2,0,d.z-d.uz*d.width/2);pivot.rotation.y=Math.atan2(-d.uz,d.ux);g.add(pivot);const leaf=new T.Mesh(boxGeometry,doorMaterial);leaf.scale.set(d.width,2.58,.1);leaf.position.set(d.width/2,1.29,0);pivot.add(leaf);const handle=new T.Mesh(boxGeometry,handleMaterial);handle.scale.set(.15,.06,.18);handle.position.set(d.width-.18,1.1,0);pivot.add(handle);g.updateMatrixWorld(true);return{h,g,pivot,ceilings,baseAngle:pivot.rotation.y,stamp:0};
 }
 let last=-Infinity,current=null,doorHealth={};
 function update(position,third,now,actor={}){
  current=housing.insideHouse(position.x,position.z);const level=actor.floor||0;activeId.value=third&&current?current.renderId:-1;cutHeight.value=third?level*3.4+3.1:1000;
  if(now-last>200){last=now;const wanted=housing.near(position.x,position.z,45).filter(h=>h.enterable&&Math.hypot(h.x-position.x,h.z-position.z)<45+Math.max(h.w,h.d)).sort((a,b)=>a.id===current?.id?-1:b.id===current?.id?1:Math.hypot(a.x-position.x,a.z-position.z)-Math.hypot(b.x-position.x,b.z-position.z));let budget=3;
   for(const h of wanted){if(!loaded.has(h.id)&&budget-->0)loaded.set(h.id,interior(h));if(loaded.has(h.id))loaded.get(h.id).stamp=now}
   for(const[id,v]of loaded)if(now-v.stamp>1500&&id!==current?.id){root.remove(v.g);v.g.traverse(o=>{if(o.geometry&&o.geometry!==boxGeometry)o.geometry.dispose()});loaded.delete(id)}
   for(const m of sectorMeshes){const bound=m.geometry.boundingSphere;m.visible=Math.hypot(bound.center.x-position.x,bound.center.z-position.z)<(window.DEAD_HORIZON_CONFIG?.viewDistance||700)+bound.radius}
  }
  for(const v of loaded.values()){v.pivot.visible=doorHealth[v.h.id]!==0;v.pivot.rotation.y=v.baseAngle+(housing.isOpen(v.h)?-Math.PI*.52:0);v.ceilings.forEach((ceiling,i)=>ceiling.visible=!(third&&current?.id===v.h.id&&i>=level))}root.updateMatrixWorld(true);
 }
 return{update,setDoorHealth(value){doorHealth=value||{}},reset(){housing.setDoors({})},current:()=>current,stats:()=>({loaded:loaded.size,sectors:sectorMeshes.length})};

}
function pointSign(p){return p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)>0?1:-1}
function hyp(a,b){return Math.hypot(b[0]-a[0],b[1]-a[1])}
