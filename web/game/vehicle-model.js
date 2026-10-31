import * as T from './vendor/three.module.js';
import {ModelBatch,shade} from './model-kit.js';
const black=0x242926,trim=0x3e4541,chrome=0xabb0a9,rust=0x795440;
const supported=new Set(['sedan','hatch','muscle','sport','supercar','round','classic','pickup','suv','jeep','van','minibus','panel','wagon','limo','hearse','police','convertible']);
export function vehicleShape(s){return s.shape||({ranger:'suv',hauler:'pickup',nomad:'van',interceptor:'police'}[s.id])||'sedan'}
export function supportsDetailedVehicle(s){return supported.has(vehicleShape(s))}
const materials={paint:new T.MeshPhysicalMaterial({vertexColors:true,roughness:.43,metalness:.27,clearcoat:.48,clearcoatRoughness:.3,side:T.DoubleSide}),metal:new T.MeshStandardMaterial({vertexColors:true,roughness:.36,metalness:.72,side:T.DoubleSide}),rubber:new T.MeshStandardMaterial({vertexColors:true,roughness:.94}),interior:new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide}),glass:new T.MeshPhysicalMaterial({vertexColors:true,roughness:.13,metalness:.14,transparent:true,opacity:.36,clearcoat:1,side:T.DoubleSide,depthWrite:false})};
const skyBytes=new Uint8Array(128*64*4);for(let y=0;y<64;y++)for(let x=0;x<128;x++){const t=y/63,cloud=Math.max(0,Math.sin(x*.16)+Math.cos(y*.44+x*.1)-.8)*25,band=t<.48?1-t*.7:.47;const i=(y*128+x)*4;skyBytes[i]=Math.min(255,140*band+cloud);skyBytes[i+1]=Math.min(255,169*band+cloud);skyBytes[i+2]=Math.min(255,185*band+cloud);skyBytes[i+3]=255}const sky=new T.DataTexture(skyBytes,128,64,T.RGBAFormat);sky.mapping=T.EquirectangularReflectionMapping;sky.colorSpace=T.SRGBColorSpace;sky.needsUpdate=true;for(const key of['paint','metal','glass']){materials[key].envMap=sky;materials[key].envMapIntensity=key==='glass'?.8:.65}
materials.glass.forceSinglePass=true;
function quad(batch,a,b,c,d,color){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([...a,...b,...c,...a,...c,...d],3));batch.add(g,color)}
function bar(batch,a,b,r,color,segments=8){const p=new T.Vector3(...a),v=new T.Vector3(...b).sub(p),g=new T.CylinderGeometry(r,r,v.length(),segments);g.applyQuaternion(new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),v.clone().normalize()));g.translate(...p.addScaledVector(v,.5).toArray());batch.add(g,color)}
function loft(batch,sections,color){ // [z, half width, bottom, shoulder, crown]
 const points=s=>{const[z,w,b,t,c]=s;return[[-w*.89,b,z],[-w,t-.09,z],[-w*.86,c-.025,z],[-w*.5,c+.015,z],[0,c+.035,z],[w*.5,c+.015,z],[w*.86,c-.025,z],[w,t-.09,z],[w*.89,b,z]]};
 for(let i=1;i<sections.length;i++){const a=points(sections[i-1]),b=points(sections[i]);for(let j=1;j<a.length;j++)quad(batch,a[j-1],b[j-1],b[j],a[j],j===1||j===8?shade(color,.89):color)}
 for(const index of[0,sections.length-1]){const p=points(sections[index]);for(let i=1;i<p.length-1;i++)quad(batch,p[0],p[i],p[i+1],p[i+1],color)}
}
function soften(mesh){const g=mesh.geometry,p=g.attributes.position,n=g.attributes.normal,groups=new Map();for(let i=0;i<p.count;i++){const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(i)}const before=n.array.slice();for(const ids of groups.values())for(const i of ids){const v=new T.Vector3(before[i*3],before[i*3+1],before[i*3+2]),sum=new T.Vector3();for(const j of ids){const other=new T.Vector3(before[j*3],before[j*3+1],before[j*3+2]);if(v.dot(other)>.62)sum.add(other)}sum.normalize();n.setXYZ(i,sum.x,sum.y,sum.z)}n.needsUpdate=true}
export function detailedWheel(radius=.55,width=.4,offroad=false,tyre='road'){
 const g=new T.Group(),rubber=new ModelBatch(),metal=new ModelBatch();
 const points=[new T.Vector2(radius*.52,-width*.5),new T.Vector2(radius*.8,-width*.54),new T.Vector2(radius*.96,-width*.37),new T.Vector2(radius,-width*.21),new T.Vector2(radius,width*.21),new T.Vector2(radius*.96,width*.37),new T.Vector2(radius*.8,width*.54),new T.Vector2(radius*.52,width*.5)];const tire=new T.LatheGeometry(points,28);tire.rotateZ(Math.PI/2);rubber.add(tire,black);
 for(let i=0;i<(tyre==='race'?0:32);i++){const a=i*Math.PI/16;for(const side of[-1,1])rubber.box(width*.45,tyre==='offroad'?.035:tyre==='rally'?.022:.01,tyre==='offroad'?.13:tyre==='rally'?.07:.025,0x353a35,side*width*.24,Math.cos(a)*(radius+.004),Math.sin(a)*(radius+.004),a,0,side*(tyre==='rally'?.48:tyre==='offroad'?.3:.08))}if(tyre==='race')for(const side of[-1,1])rubber.ring(radius-.003,.007,0x111a15,side*width*.23,0,0,'x');
 metal.tube(radius*.51,radius*.51,width*.78,0x59615c,0,0,0,'x',20);
 for(const side of[-1,1]){metal.ring(radius*.52,.027,chrome,side*width*.49,0,0,'x');metal.tube(radius*.17,radius*.17,.035,chrome,side*width*.51,0,0,'x',12);for(let i=0;i<5;i++){const a=i*Math.PI*2/5;bar(metal,[side*width*.5,Math.cos(a)*radius*.18,Math.sin(a)*radius*.18],[side*width*.49,Math.cos(a+.1)*radius*.48,Math.sin(a+.1)*radius*.48],.035,0x9ca39d);metal.tube(.018,.018,.04,0xd2d2be,side*width*.53,Math.cos(a)*radius*.11,Math.sin(a)*radius*.11,'x',6)}}
 const t=rubber.mesh(materials.rubber),m=metal.mesh(materials.metal);soften(t);soften(m);g.add(t,m);g.userData.radius=radius;g.userData.detailed=true;return g;
}
export function buildDetailedVehicle(s){
 const root=new T.Group(),paint=new ModelBatch(),metal=new ModelBatch(),rubber=new ModelBatch(),interior=new ModelBatch(),glass=new ModelBatch(),wheels=[],shape=vehicleShape(s),seed=[...s.id].reduce((v,c)=>v+c.charCodeAt(0),0),C=s.color;
 const W=s.width||2.8,L=s.length||({ranger:5.6,hauler:6.5,nomad:6.1,interceptor:6.2}[s.id])||5.6,half=W/2;
 const sport=['sport','supercar','convertible'].includes(shape),muscle=shape==='muscle',rounded=['round','classic'].includes(shape),pickup=shape==='pickup',suv=['suv','jeep'].includes(shape),van=['van','minibus','panel'].includes(shape),long=['wagon','hearse','limo'].includes(shape),hatch=shape==='hatch',open=['convertible','jeep'].includes(shape),offroad=pickup||suv;
 const r=van||offroad?.64:sport?.49:.55,belt=van?1.48:offroad?1.5:sport?1.16:1.34,lower=van||offroad?.71:.55,axle=L*.32,roof=van?3.13:suv?2.7:pickup?2.65:sport?1.99:muscle?2.1:rounded?2.42:2.39;
 const frontBase=van?L*.38:pickup?L*.27:sport?L*.16:muscle?L*.115:L*.22,rearBase=van?-L*.45:pickup?-L*.065:hatch||long||suv?-L*.4:muscle?-L*.3:-L*.28,frontTop=frontBase-(van?.19:sport?.68:muscle?.56:.53),rearTop=rearBase+(rounded?.5:.36),roofW=half*(van?.88:sport?.73:.8);
 interior.box(W*.82,.14,L*.85,black,0,lower-.08,0);for(const z of[-axle,axle])bar(metal,[-half,.55,z],[half,.55,z],.06,trim);
 // Curved shoulders and real arch cut-outs instead of a rectangular body through the wheels.
 const bodySections=[[-L*.5,half*.86,belt-.13,belt-.06,belt+.015],[-L*.44,half*.98,belt-.15,belt+.02,belt+.06],[rearBase,half,belt-.16,belt+.02,belt+.07],[frontBase,half,belt-.16,belt+.02,belt+.07],[L*.43,half*.96,belt-.16,belt-.01,belt+.035],[L*.5,half*.85,belt-.18,belt-.08,belt-.025]];loft(paint,bodySections.filter(p=>p[0]<=rearBase),C);loft(paint,bodySections.filter(p=>p[0]>=frontBase),C);
 for(const side of[-1,1]){
  const outline=[[-L/2,lower],[-axle-r*1.1,lower]];
  for(const z of[-axle,axle]){if(z>0)outline.push([z-r*1.1,lower]);for(let i=0;i<=12;i++){const a=Math.PI-i*Math.PI/12;outline.push([z+Math.cos(a)*r*1.1,r+Math.sin(a)*r*1.12])}outline.push([z+r*1.1,lower])}
  outline.push([L/2,lower],[L/2,belt-.06],[L*.43,belt+.01],[-L*.43,belt+.01],[-L/2,belt-.06]);paint.profile(outline,.055,C,side*(half-.055));
  for(const z of[-axle,axle])for(let i=0;i<15;i++){const a=Math.PI*i/15,b=Math.PI*(i+1)/15;bar(rubber,[side*(half-.005),r+Math.sin(a)*r*1.1,z+Math.cos(a)*r*1.1],[side*(half-.005),r+Math.sin(b)*r*1.1,z+Math.cos(b)*r*1.1],offroad?.045:.018,trim)}
  paint.box(.08,.14,frontBase-rearBase,C,side*(half-.055),belt+.065,(frontBase+rearBase)/2);const x=side*(half+.07);for(const z of[-axle,axle]){const wheel=detailedWheel(r,offroad?.46:.39,offroad);wheel.position.set(x,r,z);root.add(wheel);wheels.push(wheel)}
  bar(metal,[side*(half-.02),lower+.12,-axle+r*1.2],[side*(half-.02),lower+.12,axle-r*1.2],.025,chrome);
 }
 // The cab is empty: individual glass panes, pillars, curved roof and visible upholstery.
 const pane=(a,b,c,d)=>quad(glass,a,b,c,d,0x78969b);
 if(!open){loft(paint,[[rearTop-.09,roofW*1.13,roof-.07,roof-.02,roof],[rearTop+.14,roofW*1.1,roof-.08,roof+.025,roof+.08],[(rearTop+frontTop)/2,roofW*1.1,roof-.08,roof+.035,roof+.1],[frontTop-.12,roofW*1.1,roof-.07,roof+.01,roof+.06],[frontTop+.03,roofW*1.13,roof-.06,roof-.02,roof]],C)}
 pane([-half*.88,belt+.13,frontBase],[half*.88,belt+.13,frontBase],[roofW,roof-.12,frontTop],[-roofW,roof-.12,frontTop]);
 if(!open)pane([half*.87,belt+.13,rearBase],[-half*.87,belt+.13,rearBase],[-roofW,roof-.12,rearTop],[roofW,roof-.12,rearTop]);
 for(const side of[-1,1]){
  const baseX=side*half*.91,topX=side*roofW;bar(paint,[baseX,belt+.04,frontBase],[topX,roof-.05,frontTop],van?.075:.055,C);if(!open)bar(paint,[baseX,belt+.04,rearBase],[topX,roof-.05,rearTop],.085,C);
  const twoDoor=pickup||sport||muscle||rounded||hatch,divider=pickup?(rearBase+frontBase)*.5:twoDoor?rearBase+(frontBase-rearBase)*.27:frontBase-(frontBase-rearBase)*.48,divTop=divider-.09;
  const windows=pickup?[[rearBase+.08,frontBase-.12,rearTop+.08,frontTop-.09]]:[[rearBase+.08,divider-.06,rearTop+.08,divTop-.06],[divider+.06,frontBase-.1,divTop+.06,frontTop-.09]];
  if(!open)for(const [a,b,c,d]of windows){pane([baseX,belt+.14,a],[baseX,belt+.14,b],[topX,roof-.15,d],[topX,roof-.15,c]);bar(rubber,[baseX,belt+.11,a],[baseX,belt+.11,b],.023,black);bar(rubber,[topX,roof-.13,c],[topX,roof-.13,d],.025,black)}
  if(!open&&!pickup)bar(paint,[baseX,belt+.05,divider],[topX,roof-.08,divTop],.055,shade(C,.87));
  for(const z of[twoDoor?rearBase+.12:divider,rearBase+.1]){bar(rubber,[side*(half-.019),lower+.18,z],[side*(half-.019),belt+.02,z],.009,0x303a34)}
  bar(rubber,[side*(half-.019),lower+.17,rearBase+.1],[side*(half-.019),lower+.17,frontBase-.16],.009,0x303a34);
  for(const z of[twoDoor?rearBase+.25:divider+.2,...(!twoDoor?[rearBase+.3]:[])]){metal.box(.045,.045,.23,chrome,side*(half+.014),belt-.13,z);rubber.box(.052,.07,.3,black,side*(half+.006),belt-.14,z)}
  const mirrorZ=frontBase-.25;bar(metal,[baseX,belt+.34,mirrorZ],[side*(half+.18),belt+.36,mirrorZ],.027,trim);paint.box(.22,.17,.3,C,side*(half+.22),belt+.4,mirrorZ);metal.box(.014,.11,.22,0xa4bec0,side*(half+.337),belt+.41,mirrorZ-.025);
 }
 for(const z of[-L*.5+.04,L*.5-.04])paint.box(W*.86,belt-lower-.08,.1,C,0,(belt+lower)/2-.05,z);
 // Bonnet/trunk joins, wipers, separate lamps, recessed grille, plates and exhaust.
 for(const z of[frontBase+.1,rearBase-.1])bar(rubber,[-half*.86,belt+.082,z],[half*.86,belt+.082,z],.008,0x2f3932);
 for(const side of[-1,1]){bar(rubber,[side*half*.8,belt+.072,frontBase+.12],[side*half*.79,belt+.03,L*.45],.007,0x28352e);bar(metal,[side*half*.57,belt+.16,frontBase+.01],[side*half*.13,belt+.2,frontBase-.06],.012,black)}
 const front=L*.5+.015,rear=-L*.5-.02;for(const z of[front+.055,rear-.055]){metal.box(W*.92,.13,.15,rounded||muscle?chrome:trim,0,lower+.12,z);rubber.box(W*.82,.045,.17,black,0,lower+.15,z+.01)}
 if(muscle){for(const side of[-1,1]){interior.box(W*.2,.24,.08,black,side*W*.13,belt-.22,front+.015);for(let j=0;j<5;j++)metal.box(.015,.18,.028,chrome,side*W*.13+(j-2)*.065,belt-.22,front+.061)}}else{interior.box(W*.43,.24,.08,black,0,belt-.22,front+.015);for(let j=-5;j<=5;j++)metal.box(.025,.19,.028,chrome,j*W*.035,belt-.22,front+.061)}
 const roundLamps=rounded||muscle||s.id==='dada';for(const side of[-1,1]){
  if(roundLamps)for(const dx of muscle||s.id==='dada'?[-.17,.17]:[0]){const x=side*half*.69+dx;metal.tube(.165,.165,.075,chrome,x,belt-.2,front+.015,'z',20);interior.tube(.133,.133,.008,0xe2dfbc,x,belt-.2,front+.058,'z',20);metal.ring(.1,.007,0xf0e6c7,x,belt-.2,front+.066)}
  else{metal.box(W*.22,.24,.06,chrome,side*half*.66,belt-.19,front+.02);interior.box(W*.2,.2,.065,0xd6dcc9,side*half*.66,belt-.19,front+.052);for(let j=0;j<5;j++)metal.box(.009,.19,.006,0xa3afa6,side*half*.66+(j-2)*.09,belt-.19,front+.088)}
  interior.box(.18,.11,.06,0xc88b3c,side*half*.83,belt-.4,front+.045);if(sport)for(const dx of[-.15,.15]){metal.tube(.13,.13,.035,chrome,side*half*.7+dx,belt-.23,rear-.07,'z',16);interior.tube(.108,.108,.04,0x962b28,side*half*.7+dx,belt-.23,rear-.092,'z',16)}else interior.box(W*.18,.2,.06,0x872e27,side*half*.72,belt-.23,rear-.055);interior.box(W*.065,.16,.07,0xc88b3c,side*half*.88,belt-.23,rear-.059);metal.box(W*.16,.018,.075,chrome,side*half*.72,belt-.12,rear-.055);
 }
 for(const z of[front+.12,rear-.13]){metal.box(.54,.15,.025,0xd0d0bd,0,lower+.11,z);for(let j=0;j<6;j++)interior.box(.024,.055,.006,0x47534b,-.18+j*.065,lower+.11,z+Math.sign(z)*.017)}metal.tube(.046,.046,.24,0x666d65,-half*.6,lower-.09,-L*.5,'z',12);
 const seatZ=pickup?(rearBase+frontBase)/2-.05:frontBase-.75,seatColor=seed%3===0?0x786c58:0x414944;
 interior.box(W*.87,.07,Math.max(1,frontBase-rearBase),0x343b34,0,lower+.16,(frontBase+rearBase)/2);
 for(const x of[-W*.23,W*.23]){interior.box(W*.31,.22,.75,seatColor,x,lower+.47,seatZ);interior.loft([[lower+.51,W*.145,.12,x,seatZ-.31],[lower+1.13,W*.16,.105,x,seatZ-.42],[lower+1.31,W*.11,.09,x,seatZ-.44]],seatColor,10);interior.loft([[lower+1.31,W*.08,.08,x,seatZ-.44],[lower+1.51,W*.09,.085,x,seatZ-.44],[lower+1.56,W*.065,.06,x,seatZ-.44]],shade(seatColor,.85),10);for(const dx of[-.16,.16])bar(interior,[x+dx,lower+.6,seatZ-.2],[x+dx,lower+1.18,seatZ-.25],.012,shade(seatColor,1.3))}
 if(!pickup&&!van)interior.box(W*.72,.65,.53,seatColor,0,lower+.65,rearBase+.43);
 interior.box(W*.82,.21,.43,0x303b37,0,belt+.02,frontBase-.21);interior.box(W*.34,.16,.12,0x1c2725,W*.2,belt+.27,frontBase-.34);for(let i=0;i<3;i++){interior.tube(.06,.06,.013,0x9ca397,W*.2-.13+i*.13,belt+.29,frontBase-.41,'z',12);interior.tube(.049,.049,.014,0x172723,W*.2-.13+i*.13,belt+.29,frontBase-.42,'z',12);for(let tick=0;tick<9;tick++){const a=(tick/8*1.5+.25)*Math.PI,x=W*.2-.13+i*.13;bar(metal,[x+Math.sin(a)*.04,belt+.29+Math.cos(a)*.04,frontBase-.435],[x+Math.sin(a)*.047,belt+.29+Math.cos(a)*.047,frontBase-.435],.002,0xc9c8ad,4)}bar(interior,[W*.2-.13+i*.13,belt+.29,frontBase-.439],[W*.2-.13+i*.13-.025,belt+.29-.015,frontBase-.439],.0025,0xc59b65,4)}
 interior.box(.24,.28,.45,0x3b443c,0,lower+.45,seatZ+.25);bar(metal,[0,lower+.59,seatZ+.3],[0,lower+.91,seatZ+.2],.018,trim);interior.tube(.045,.045,.07,black,0,lower+.94,seatZ+.2,'y');
 const steer=[W*.23,belt+.22,frontBase-.52];metal.ring(.17,.019,black,...steer);for(const a of[0,2.1,4.2])bar(metal,steer,[steer[0]+Math.sin(a)*.155,steer[1]+Math.cos(a)*.155,steer[2]],.016,trim);bar(interior,steer,[W*.23,belt-.08,frontBase-.25],.04,trim);
 if(pickup){const z0=-L*.47,z1=rearBase-.13;interior.box(W*.84,.12,z1-z0,0x555a4c,0,belt-.14,(z0+z1)/2);for(const side of[-1,1])paint.box(.13,.48,z1-z0,C,side*(half-.1),belt+.1,(z0+z1)/2);paint.box(W*.92,.49,.13,C,0,belt+.1,z0);for(let x=-W*.36;x<W*.4;x+=.18)metal.box(.025,.02,z1-z0-.15,0x757b6e,x,belt-.06,(z0+z1)/2);bar(metal,[-half*.78,belt+.24,rearBase-.16],[-half*.78,roof+.05,rearBase-.16],.065,chrome);bar(metal,[half*.78,belt+.24,rearBase-.16],[half*.78,roof+.05,rearBase-.16],.065,chrome);bar(metal,[-half*.78,roof+.05,rearBase-.16],[half*.78,roof+.05,rearBase-.16],.065,chrome)}
 if(van||suv||long){for(const side of[-1,1]){if(van&&shape!=='minibus')paint.box(.085,1.15,(frontBase-rearBase)*.5,C,side*half*.91,belt+.69,rearBase+(frontBase-rearBase)*.27);bar(metal,[side*roofW*.78,roof+.14,rearTop+.15],[side*roofW*.78,roof+.14,frontTop-.12],.033,trim)}for(const z of[rearTop+.25,frontTop-.2])bar(metal,[-roofW*.8,roof+.14,z],[roofW*.8,roof+.14,z],.035,trim);for(const side of[-1,1])bar(rubber,[side*half*.8,belt+.15,rear-.03],[side*roofW*.86,roof-.13,rearTop-.05],.009,black)}
 if(sport&&!open){for(const side of[-1,1])paint.box(.07,.29,.12,shade(C,.8),side*half*.7,belt+.23,-L*.43);loft(paint,[[-L*.47,half*.93,belt+.35,belt+.38,belt+.4],[-L*.4,half*.9,belt+.35,belt+.38,belt+.4]],C)}
 if(muscle){for(const x of[-.29,.29])paint.box(.18,.008,L*.23,seed%2?0xbcb8a0:0x272d2a,x,belt+.091,L*.3);loft(interior,[[L*.17,.29,belt+.08,belt+.13,belt+.16],[L*.31,.33,belt+.08,belt+.17,belt+.2]],trim)}
 if(shape==='police'){metal.box(W*.62,.1,.32,trim,0,roof+.13,0);for(const x of[-.55,.55])interior.box(.58,.18,.28,x<0?0x426d93:0xa13f35,x,roof+.27,0)}
 if(suv&&seed%2===0){const spare=detailedWheel(r,.36,true);spare.rotation.y=Math.PI/2;spare.position.set(.45,belt+.56,rear-.27);root.add(spare)}
 if(rounded){for(const side of[-1,1])for(const z of[-axle,axle]){const f=new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI*.6);f.scale(.38,.31,.84);f.translate(side*(half-.03),r+.29,z);paint.add(f,C)}if(shape==='classic'){metal.tube(.17,.17,.08,chrome,0,belt-.14,front+.07,'z',20);interior.tube(.14,.14,.09,0xe4dabd,0,belt-.14,front+.12,'z',20)}}
 // Sparse deterministic rust, sill dirt and chipped paint follow the body surface.
 for(let i=0;i<20;i++){const side=i%2?1:-1,z=-L*.43+((seed*.13+i*.713)%1)*L*.86;paint.profile([[z-.05,lower+.18],[z+.13,lower+.21],[z+.18,lower+.3],[z+.06,lower+.34]],.009,i%3?shade(C,.55):rust,side*(half-.019))}
 for(const [batch,name]of[[paint,'paint'],[metal,'metal'],[rubber,'rubber'],[interior,'interior'],[glass,'glass']])if(batch.positions.length){const m=batch.mesh(materials[name]);m.name='vehicle-'+name;if(name==='paint'||name==='metal')soften(m);if(name==='glass')m.castShadow=false;root.add(m)}
 root.userData={wheels,spec:s,length:L,width:W,modelVersion:3,family:shape,glass:true,cabin:{seatZ:seatZ-.15,eye:belt+.55,steering:steer}};return root;
}
export function enhanceLegacyVehicle(root,s){ // Keep specialist silhouettes while reducing their draw calls.
 const wheels=root.userData.wheels||[],fixed=new ModelBatch();root.updateMatrixWorld(true);
 const meshes=[];root.traverse(o=>{if(o.isMesh&&!wheels.some(w=>{let p=o;while(p){if(p===w)return true;p=p.parent}return false}))meshes.push(o)});
 for(const mesh of meshes){const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);fixed.add(g,mesh.material.color?.getHex()||s.color);mesh.parent.remove(mesh);mesh.geometry.dispose()}
 const body=fixed.mesh(materials.paint);root.add(body);for(const wheel of wheels){const radius=wheel.children.find(c=>c.geometry?.parameters.radiusTop)?.geometry.parameters.radiusTop||.6;for(const c of[...wheel.children]){wheel.remove(c);c.geometry?.dispose()}const model=detailedWheel(radius,.4,['tractor','armored','truck','recovery'].includes(s.shape));wheel.add(...[...model.children]);wheel.userData.detailed=true;wheel.userData.radius=radius}
 root.userData.modelVersion=3;root.userData.family=s.shape;return root;
}
