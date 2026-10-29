import * as T from './vendor/three.module.js';
// Original procedural interpretations. No commercial meshes, textures or physics data.
const rows=[
 ['bonphiac','BONPHIAC','Coupé américain','muscle',0x363a39,6.5,2.9,37,10,.94,.029,'Long capot, double calandre et prise d’air.'],
 ['c18','LE SEIGNEUR / C18','Fourgonnette','panel',0xd4cbb3,5.5,2.5,24,7,.85,.019,'Cabine compacte et caisse haute à deux portes.'],
 ['dada','DADA','Berline classique','sedan',0xbabd86,5.4,2.5,28,7.8,1,.021,'Carrosserie anguleuse, chromes et quatre phares ronds.'],
 ['club','CLUB / GOLF','Compacte','hatch',0x8d3837,4.7,2.5,30,9,1.18,.018,'Petit gabarit, hayon vertical et liseré rouge.'],
 ['gtr','GTR','Coupé japonais','sport',0xa1aab1,5.7,2.8,42,12,1.06,.027,'Aileron haut et quatre feux arrière circulaires.'],
 ['ifa','IFA','Camion de transport','truck',0x71805c,8.4,3.2,23,5.5,.58,.041,'Cabine avancée et plateau à ridelles en bois.'],
 ['musgoat','MUSGOAT','Muscle car','muscle',0x376359,6.2,2.85,38,10.5,.91,.03,'Fastback, capot long et doubles bandes claires.'],
 ['safari','SAFARI / POYOPA','Pick-up','pickup',0xad8151,6.1,2.7,29,8,.84,.025,'Benne ouverte, arceau et phares additionnels.'],
 ['triclops','TRICLOPS','Berline rétro','classic',0x72928a,6.5,2.9,32,7.5,.8,.026,'Ailes bombées et troisième phare central.'],
 ['bukhanka','BUKHANKA / UAZ','Fourgon tout-terrain','minibus',0x7a8061,5.6,2.8,25,7,.85,.029,'Nez court, pare-brise divisé et garde au sol haute.'],
 ['kart','KART','Kart à deux places','kart',0xc15336,3.5,2.5,30,12,1.4,.016,'Châssis tubulaire ouvert, moteur arrière et sièges baquets.'],
 ['p51','P-51','Fourgonnette revisitée','panel',0x9fae9f,5.8,2.6,26,7.7,.85,.02,'Caisse carrée, pavillon haut et optiques rectangulaires.'],
 ['kage','KAGE','Sportive turbo','sport',0x59678d,5.9,2.85,43,12.5,1.1,.028,'Bouclier large, capot ventilé et grand aileron.'],
 ['speedle','SPEEDLE','Compacte arrondie','round',0xdbb857,4.7,2.6,28,8,1.12,.019,'Pavillon bombé, ailes séparées et phares ronds.'],
 ['escada','ESCADA','Citadine utilitaire','hatch',0xc9c3aa,4.6,2.45,29,8.7,1.2,.018,'Hayon droit et échelle sur le toit.'],
 ['loft','LOFT','Compacte sportive','hatch',0x416a70,4.9,2.6,33,9.6,1.15,.02,'Élargisseurs, projecteurs de rallye et spoiler court.'],
 ['peak','PEAK','Pick-up rétro','pickup',0x9c6552,6.5,2.85,30,8.4,.8,.027,'Calandre massive, longue benne et double éclairage.'],
 ['tomahawk','TOMAHAWK','Grand coupé V8','muscle',0xc88d47,6.6,2.95,39,11,.88,.031,'Large capot, quatre phares et bandes noires.'],
 ['froggy','FROGGY','Petite française','round',0x8ea780,4.9,2.45,24,6.8,1.25,.016,'Habitacle étroit, toit en toile et ailes arrondies.'],
 ['kaiju','KAIJU G54','Coupé de performance','sport',0x879498,5.9,2.9,44,13,1.08,.029,'Capot long, ailes larges et feux arrière jumelés.'],
 ['rotor','ROTOR GT7','Coupé à profil bas','sport',0xa74d42,5.6,2.8,43,12,1.12,.026,'Nez effilé, optiques relevables et lunette panoramique.']
];
export const ROAD_VEHICLES=rows.map(([id,name,kind,shape,color,length,width,speed,accel,turn,burn,desc])=>({id,name,kind,shape,color,length,width,speed,accel,turn,burn,desc,hex:'#'+color.toString(16).padStart(6,'0'),source:'dbh',year:'RECRÉATION',group:['truck','panel','minibus','pickup'].includes(shape)?'utility':['sport','muscle'].includes(shape)?'sport':'classic'}));
const mats=new Map();function material(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.65,metalness:.2}));return mats.get(c)}
function workshop(){const root=new T.Group(),wheels=[];
 const mesh=(g,c,x,y,z)=>{const m=new T.Mesh(g,material(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m};
 const box=(w,h,d,c,x=0,y=0,z=0)=>mesh(new T.BoxGeometry(w,h,d),c,x,y,z);
 const ell=(w,h,d,c,x=0,y=0,z=0)=>{const m=mesh(new T.SphereGeometry(1,12,8),c,x,y,z);m.scale.set(w/2,h/2,d/2);return m};
 const bar=(a,b,r=.04,c=0x454d46)=>{const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);const m=mesh(new T.CylinderGeometry(r,r,v.length(),8),c,...p.clone().add(q).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m};
 function wheel(x,z,r=.55){const g=new T.Group();g.position.set(x,r,z);root.add(g);for(const [radius,width,c] of [[r,.38,0x202620],[r*.56,.41,0x9a9f97],[r*.2,.44,0x434a45]]){const m=new T.Mesh(new T.CylinderGeometry(radius,radius,width,16),material(c));m.rotation.z=Math.PI/2;g.add(m)}wheels.push(g);return g}
 // Extruded side profile allows sloped windscreens and different roof lines.
 function profile(points,width,c,x=0,y=0,z=0){const s=new T.Shape();points.forEach(([pz,py],i)=>i?s.lineTo(pz,py):s.moveTo(pz,py));s.closePath();const geo=new T.ExtrudeGeometry(s,{depth:width,bevelEnabled:false});geo.rotateY(-Math.PI/2);geo.translate(width/2,0,0);return mesh(geo,c,x,y,z)}
 return {root,wheels,box,ell,bar,wheel,profile};
}
export function buildRoadVehicle(s){const {root,wheels,box,ell,bar,wheel,profile}=workshop();const W=s.width,L=s.length,C=s.color,glass=0x45636b,steel=0x343e39,chrome=0xaaa99b,cream=0xd9d0af;
 const truck=s.shape==='truck',van=s.shape==='minibus',panel=s.shape==='panel',pickup=s.shape==='pickup',hatch=s.shape==='hatch',round=s.shape==='round',sport=s.shape==='sport',muscle=s.shape==='muscle',classic=s.shape==='classic',kart=s.shape==='kart';const r=truck?.76:kart?.35:van||pickup?.64:sport?.49:.54,y=truck?1.35:kart?.5:van?1.08:sport?.81:.93,axle=L*(truck?.33:.32);
 box(W-.3,.23,L-.4,steel,0,y-.37,0);for(const x of [-W/2,W/2])for(const z of [-axle,axle])wheel(x,z,r);
 if(kart){box(W-.2,.18,L-.2,C,0,.45,0);for(const x of [-W/2,W/2])bar([x,.62,-1.6],[x,.62,1.6],.09);for(const x of [-.62,.62]){const seat=box(.7,.85,.25,steel,x,.88,-.35);seat.rotation.x=-.17;box(.7,.15,.65,steel,x,.55,0)}box(1.8,.25,.45,C,0,.65,1.55);box(1.2,.5,.55,0x6b7169,0,.8,-1.25);for(let x=-.4;x<.5;x+=.2)box(.08,.2,.5,chrome,x,1.13,-1.25);bar([-.65,.6,.5],[-.65,1,.75],.04);const steering=new T.Mesh(new T.TorusGeometry(.22,.035,6,12),material(steel));steering.position.set(-.65,1,.75);root.add(steering);root.userData={wheels,spec:s,length:L};return root}
 box(W,.55,L,C,0,y,0);
 let roofY=y+1.4,cabZ=-.3,cabLength=L*.48,cabW=W*.86;
 if(truck){cabLength=2.25;cabZ=L/2-1.3;roofY=y+2.1;box(W,1.7,cabLength,C,0,y+1.1,cabZ);box(W-.35,.85,.06,glass,0,y+1.4,cabZ+cabLength/2+.04);box(.08,.9,.07,C,0,y+1.4,cabZ+cabLength/2+.08);box(W+.1,.17,2.4,C,0,roofY,cabZ);for(const x of [-W/2-.01,W/2+.01]){box(.06,.8,1.4,glass,x,y+1.42,cabZ);box(.08,.13,.4,chrome,x,y+.7,cabZ)}const bz=-1.1,bl=L-2.7;box(W,.18,bl,0x625d43,0,y+.25,bz);for(let k=0;k<3;k++){for(const x of [-W/2,W/2])box(.12,.2,bl,0x837351,x,y+.55+k*.3,bz);box(W,.2,.12,0x837351,0,y+.55+k*.3,-L/2)}for(const x of [-W/2,W/2])for(let z=-L/2;z<.9;z+=1.2)box(.12,1,.12,steel,x,y+.75,z);box(.15,2.5,.15,steel,-W/2+.2,y+1.5,1);}
 else if(pickup){cabZ=.8;cabLength=2.3;roofY=y+1.45;profile([[-.4,y+.3],[2,y+.3],[1.65,roofY],[0,roofY]],cabW,glass);box(cabW+.1,.13,1.65,C,0,roofY,.8);box(W,.18,L*.25,C,0,y+.38,L/2-.8);const bz=-L*.29,bl=L*.38;box(W-.25,.12,bl,0x6e7062,0,y+.35,bz);for(const x of [-W/2+.05,W/2-.05]){box(.16,.65,bl,C,x,y+.6,bz);bar([x*.8,y+.6,-.55],[x*.8,roofY+.15,-.55],.09)}bar([-W*.4,roofY+.15,-.55],[W*.4,roofY+.15,-.55],.09);box(W,.55,.14,C,0,y+.55,-L/2);for(const x of [-.6,.6])ell(.35,.35,.16,cream,x,roofY+.2,-.45);}
 else if(panel||van){cabLength=van?L*.89:L*.62;cabZ=van?0:-.5;roofY=y+(van?1.7:1.85);box(W*.95,roofY-y-.2,cabLength,C,0,(roofY+y+.2)/2,cabZ);box(W*.97,.15,cabLength,C,0,roofY,cabZ);const front=van?L/2-.1:L*.28;box(W*.83,.85,.07,glass,0,roofY-.6,front);if(van)box(.08,.9,.09,C,0,roofY-.6,front+.05);for(const x of [-W*.48,W*.48]){box(.07,.75,1.15,glass,x,roofY-.57,front-.65);box(.09,.1,cabLength-.3,chrome,x,y+.3,cabZ);if(van)for(let z=-L*.33;z<L*.2;z+=1.25)box(.07,.7,1,glass,x,roofY-.6,z)}box(W*.9,1.3,.09,C,0,y+.95,-L/2-.03);box(.05,1.3,.1,steel,0,y+.95,-L/2-.09);for(const x of [-.6,.6])box(.65,.5,.08,glass,x,roofY-.55,-L/2-.09);if(panel)box(W,.2,L*.26,C,0,y+.4,L*.36);}
 else if(round||classic){const froggy=s.id==='froggy';ell(W*.95,.95,L*.98,C,0,y+.1,0);const topLength=classic?L*.61:L*.63;ell(W*.78,1.8,topLength,glass,0,y+.85,-.15);ell(W*.81,.45,topLength*.82,froggy?0x676653:C,0,y+1.51,-.25);roofY=y+1.68;cabZ=-.15;cabLength=topLength;for(const x of [-W*.46,W*.46])for(const z of [-axle,axle])ell(.65,.75,1.6,C,x,y+.03,z);for(const x of [-W*.39,W*.39])bar([x,y+.4,-.2],[x*.9,roofY-.2,-.2],.06,C);for(const x of [-W*.3,W*.3])ell(.42,.42,.23,cream,x,y+.48,L/2-.12);if(classic){ell(.42,.42,.25,cream,0,y+.44,L/2+.04);for(const x of [-.9,.9])bar([x,y-.1,L/2],[x,y-.1,-L/2],.035,chrome)}}
 else{roofY=y+(hatch?1.45:sport?1.05:1.2);cabLength=hatch?L*.68:L*.49;cabZ=hatch?-.35:-.25;const z0=cabZ-cabLength/2,z1=cabZ+cabLength/2;profile([[z0,y+.28],[z1,y+.28],[z1-.55,roofY],[z0+.35,roofY]],cabW,glass);box(cabW+.08,.12,cabLength-.8,C,0,roofY,cabZ-.1);for(const x of [-cabW/2,cabW/2]){bar([x,y+.3,z1],[x*.94,roofY,z1-.55],.06,C);bar([x,y+.3,z0],[x*.94,roofY,z0+.35],.06,C);bar([x,y+.3,cabZ],[x,roofY,cabZ],.045,C)}profile([[L/2,y+.2],[z1,y+.25],[z1,y+.49],[L/2,y+.4]],W,C);if(!hatch)box(W,.2,L*.19,C,0,y+.38,-L*.39);if(muscle){for(const x of [-.34,.34])box(.18,.03,L*.27,s.id==='tomahawk'?steel:cream,x,y+.53,L*.32);box(.8,.2,.65,steel,0,y+.65,L*.3)}if(sport||s.id==='loft'){const spoilerY=y+.95;for(const x of [-W*.3,W*.3])box(.08,.5,.12,steel,x,spoilerY-.2,-L*.42);box(W+.15,.1,.5,C,0,spoilerY,-L*.42);box(W+.1,.12,.3,steel,0,y-.12,L/2)}if(s.id==='escada'){for(const x of [-.5,.5])bar([x,roofY+.12,-1.4],[x,roofY+.12,1.3],.04,chrome);for(let z=-1.4;z<1.4;z+=.35)bar([-.5,roofY+.12,z],[.5,roofY+.12,z],.03,chrome)}}
 // Doors, mirrors, bumpers and model-specific lamps.
 if(!truck)for(const x of [-W/2,W/2]){box(.09,.07,.3,chrome,x*1.012,y+.22,cabZ);box(.2,.22,.3,steel,x*1.1,y+.9,cabZ+.8);box(.07,.08,L*.65,chrome,x*1.005,y-.05,0);}
 box(W+.06,.18,.16,chrome,0,y-.22,L/2+.12);box(W+.06,.18,.16,chrome,0,y-.22,-L/2-.12);box(W*.5,.35,.08,steel,0,y+.03,L/2+.04);for(let i=-3;i<=3;i++)box(.04,.25,.1,chrome,i*.16,y+.04,L/2+.1);
 if(!round&&!classic){for(const x of [-W*.34,W*.34]){if(['dada','tomahawk','loft'].includes(s.id)){for(const dx of [-.16,.16])ell(.29,.29,.14,cream,x+dx,y+.1,L/2+.11)}else{const lamp=box(.52,.22,.12,cream,x,y+.1,L/2+.09);if(s.id==='rotor'){lamp.rotation.x=.35;lamp.position.y+=.25;box(.57,.08,.4,C,x,y+.36,L/2-.05)}}box(.2,.14,.1,0xcd883b,x,y-.15,L/2+.13)}}
 for(const x of [-W*.34,W*.34]){if(sport){for(const dx of [-.15,.15])ell(.24,.24,.1,0xa64032,x+dx,y+.08,-L/2-.07)}else box(.4,.24,.1,0xa64032,x,y+.1,-L/2-.08)}box(.5,.15,.04,cream,0,y-.18,-L/2-.22);
 if(s.id==='bukhanka'){const spare=ell(.9,.9,.28,0x222a22,.7,y+.9,-L/2-.23);bar([-W*.45,.65,L/2+.3],[-W*.45,y+.55,L/2+.3],.065);bar([W*.45,.65,L/2+.3],[W*.45,y+.55,L/2+.3],.065);bar([-W*.45,y+.55,L/2+.3],[W*.45,y+.55,L/2+.3],.065)}
 if(s.id==='kaiju'||s.id==='kage')for(const x of [-.55,.55])for(let z=.8;z<1.5;z+=.18)box(.35,.025,.05,steel,x,y+.54,z);
 for(let i=0;i<8;i++)box(.025,.035,.2+i%3*.1,0x7c6b4c,(i%2?1:-1)*(W/2+.015),y-.13,-L*.4+i*.33);
 root.userData={wheels,spec:s,length:L};return root;
}
export function buildTrailer(){const {root,wheels,box,bar,wheel}=workshop();box(2.7,.2,3.5,0x5d6655,0,.8,-2.2);for(const x of [-1.35,1.35]){box(.12,.85,3.6,0x8b8c6b,x,1.27,-2.2);bar([x,.7,-.5],[0,.65,1.1],.07);wheel(x,-2.3,.5)}box(2.7,.85,.1,0x8b8c6b,0,1.27,-4);box(2.7,.85,.1,0x8b8c6b,0,1.27,-.4);for(const x of [-1.05,1.05])box(.3,.18,.08,0xac4434,x,.95,-4.08);box(1,.6,1,0x8a7754,-.5,1.2,-2.7);box(.65,.75,.65,0x846342,.6,1.27,-1.8);root.userData={wheels};return root}
