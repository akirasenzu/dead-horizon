import * as T from './vendor/three.module.js';
// Small original meshes, merged by material to keep the world inexpensive to draw.
export class ModelBatch{
 constructor(){this.positions=[];this.colors=[]}
 add(geometry,color=0xffffff,position=[0,0,0],rotation=[0,0,0]){
  const g=geometry.index?geometry.toNonIndexed():geometry;if(g!==geometry)geometry.dispose();g.rotateX(rotation[0]);g.rotateY(rotation[1]);g.rotateZ(rotation[2]);g.translate(...position);const p=g.getAttribute('position'),c=new T.Color(color);
  for(let i=0;i<p.count;i++){this.positions.push(p.getX(i),p.getY(i),p.getZ(i));this.colors.push(c.r,c.g,c.b)}g.dispose();return this;
 }
 box(w,h,d,color,x=0,y=0,z=0,rx=0,ry=0,rz=0){return this.add(new T.BoxGeometry(w,h,d),color,[x,y,z],[rx,ry,rz])}
 tube(top,bottom,length,color,x=0,y=0,z=0,axis='y',segments=10){return this.add(new T.CylinderGeometry(top,bottom,length,segments),color,[x,y,z],axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0])}
 ring(radius,tube,color,x=0,y=0,z=0,axis='z'){return this.add(new T.TorusGeometry(radius,tube,4,12),color,[x,y,z],axis==='x'?[0,Math.PI/2,0]:axis==='y'?[Math.PI/2,0,0]:[0,0,0])}
 loft(rings,color,segments=10){
  const vertices=[],point=(j,i)=>{const[y,rx,rz,cx=0,cz=0]=rings[j],a=i/segments*Math.PI*2;return[cx+Math.sin(a)*rx,y,cz+Math.cos(a)*rz]};const tri=(a,b,c)=>vertices.push(...a,...b,...c);
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=point(j,i),b=point(j,i+1),c=point(j+1,i+1),d=point(j+1,i);tri(a,b,c);tri(a,c,d)}
  for(const[j,reverse]of[[0,true],[rings.length-1,false]])for(let i=0;i<segments;i++){const[y,,,x=0,z=0]=rings[j],a=point(j,i),b=point(j,i+1);if(reverse)tri([x,y,z],b,a);else tri([x,y,z],a,b)}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));return this.add(geometry,color);
 }
 profile(points,width,color,x=0){
  const vertices=[],tri=(a,b,c)=>vertices.push(...a,...b,...c),p=(i,side)=>[x+side*width/2,points[i][1],points[i][0]],indices=T.ShapeUtils.triangulateShape(points.map(([z,y])=>new T.Vector2(z,y)),[]);
  for(const[a,b,c]of indices){tri(p(a,-1),p(b,-1),p(c,-1));tri(p(c,1),p(b,1),p(a,1))}
  for(let i=0;i<points.length;i++){const j=(i+1)%points.length;tri(p(i,-1),p(i,1),p(j,1));tri(p(i,-1),p(j,1),p(j,-1))}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));return this.add(g,color);
 }
 mesh(material){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.positions,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.computeVertexNormals();g.computeBoundingSphere();const mesh=new T.Mesh(g,material);mesh.castShadow=true;mesh.receiveShadow=true;return mesh}
}
export const modelMaterials={cloth:new T.MeshStandardMaterial({vertexColors:true,roughness:.94,side:T.DoubleSide}),metal:new T.MeshStandardMaterial({vertexColors:true,roughness:.48,metalness:.5,side:T.DoubleSide}),polymer:new T.MeshStandardMaterial({vertexColors:true,roughness:.82,metalness:.03,side:T.DoubleSide})};
export function shade(color,amount){return new T.Color(color).multiplyScalar(amount).getHex()}
export function disposeModel(root){root?.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)o.geometry.dispose();if(o.material?.userData.owned)o.material.dispose()})}
