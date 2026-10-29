import * as T from './vendor/three.module.js';
import {buildRoadVehicle,buildTrailer} from './road-vehicles.js';
// Reference inventory: KI5 public Workshop pages 1–4, consulted 2026-10-29.
// Original procedural approximations of vehicle families, not imported KI5 assets.
const inventory=`
67 Chevrolet Impala;sedan;6.4
92 Volkswagen Golf Mk2;hatch;4.8
83 GMC G-Series;van;6.2
62 Daimler Ferret;armored;4.5
87 Toyota Corolla AE92;sport;5.1
91 Lexus LS400;sedan;6.2
70 Chevrolet Chevelle;muscle;6.2
69 Ford Mustang;muscle;6.1
73 Nissan Skyline GT-R;sport;5.3
76 Chrysler New Yorker;sedan;7
78 Lamborghini Countach;supercar;5.7
Cobb Motor Company M540;armored;7.8
79 Chevrolet Camaro;muscle;6.1
84 Chevrolet Corvette;supercar;5.6
96 Saturn S-Series;sedan;5.4
70 Ford Escort;hatch;4.9
Lock-Mart Industries M577;armored;9.2
96 Mitsubishi Lancer EVO IV;sport;5.6
95 Subaru Impreza WRX STI;sport;5.5
70 Plymouth Road Runner;muscle;6.4
69 Dodge Charger;muscle;6.6
85 Chevrolet Step-Van;stepvan;7
84 Oldsmobile 98 Regency;sedan;6.5
84 Buick Electra;sedan;6.5
84 Cadillac DeVille;sedan;6.7
89 Land Rover Defender 130;suv;6.5
65 Pontiac Banshee;supercar;5.2
91 Ford Ranger;pickup;5.8
91 Nissan 240SX;sport;5.5
73 Ford Falcon;muscle;6.1
04 Volkswagen Touran;wagon;5.9
66 Pontiac LeMans GTO;muscle;6.3
88 Toyota Hilux;pickup;6
86 Chevrolet CUCV M1008;pickup;6.6
85 Oldsmobile Delta 88;sedan;6.5
85 Buick LeSabre;sedan;6.4
85 Pontiac Parisienne;sedan;6.6
85 Chevrolet Caprice;sedan;6.4
84 Jeep XJ Cherokee;suv;5.5
82 Porsche 911;round;4.9
91 Ford LTD Crown Victoria;sedan;6.5
77 Pontiac Firebird;muscle;6.2
85 Club Car Golf Cart;golfcart;3.8
82 Pontiac Firebird;sport;6
98 Nissan Stagea 260RS;wagon;6.2
89 Volvo 200;sedan;5.9
92 Jeep YJ Wrangler;jeep;4.9
68 Pontiac Firebird;muscle;6.1
81 DeLorean DMC-12;supercar;5.6
80 MAN KAT1;truck;9
87 Buick Regal;muscle;6.1
75 Pontiac Grand Prix;muscle;6.7
87 Chevrolet Suburban;suv;6.8
84 Cadillac Gage LAV-300;armored;8
49 Ford 8N Tractor;tractor;3.8
76 Chevrolet K10;pickup;6.2
93 Chevrolet Suburban;suv;7
90 BMW E30;sedan;5.3
87 Ford B700 School Bus;bus;11
93 Ford Taurus;sedan;5.8
93 Ford F150;pickup;6.4
87 Toyota MR2;sport;4.9
63 Volkswagen Type 2;van;5.6
89 Dodge Caravan;wagon;5.9
67 Shelby GT500;muscle;6.2
91 Geo Metro;hatch;4.4
63 Volkswagen 1300 Beetle;round;4.8
93 Ford Mustang SSP;police;5.8
69 Chevrolet Camaro;muscle;6
99 Ford Crown Victoria PI;police;6.4
93 Ford CF8000 Elgin;sweeper;7.4
92 Ford Crown Victoria;police;6.2
90 Ford F350 Ambulance;ambulance;7.6
90 Pierce Arrow Pumper;firetruck;9
69 Mini Mk2;hatch;3.9
89 Isuzu Trooper;suv;5.8
93 Lincoln Town Car;sedan;6.7
90 Zanella 50; scooter;2.8
28 Brough Superior SS100;motorcycle;3.1
70 Plymouth Barracuda;muscle;6.1
49 Dodge Power Wagon;pickup;6.8
97 ADI Bushmaster;armored;8.3
89 Ford Bronco;suv;5.8
88 Chevrolet S10;pickup;5.9
82 Jeep J10;pickup;6.3
13 Yamaha Vino 125;scooter;2.9
70 Dodge Challenger;muscle;6.2
86 Ford Econoline E150;van;6.3
92 Nissan Skyline GT-R R32;sport;5.7
Halo M12-C Hog;buggy;6.5
08 Mercury Sable;sedan;6.1
80 Kawasaki KZ1000 Police;motorcycle;3.2
83 AM General M923;truck;9.2
84 Mercedes-Benz W460;suv;5.7
78 AM General M35A2;truck;8.8
74 AM General M151A2 MUTT;jeep;4.8
59 Cadillac Miller-Meteor;hearse;7.8
Halo M12 Warthog;buggy;6.6
92 AM General M998;suv;6.4
82 Oshkosh M911;semi;8.8
86 Oshkosh P19A;firetruck;8.2
88 Volkswagen Jetta Mk2;sedan;5.2
88 Volkswagen Golf Mk2;hatch;4.8
87 Toyota Land Cruiser FJ60;suv;6.2
67 Cadillac Gage Commando;armored;6.3
85 Mercedes-Benz W123;sedan;5.9
89 Land Rover Defender 90;suv;5.1
89 Land Rover Defender 110;suv;6
90 Lada Niva;suv;4.8
91 Range Rover Classic;suv;6
84 BWM R80 Classic;motorcycle;3.2
84 BWM R80 Custom;motorcycle;3.3
86 Xarley Sportstep 1200;motorcycle;3.5
88 Suvzuki Quadruiner;quad;3.7
`;
const variants=`
70 Chevrolet El Camino;pickup;6.4
93 Chevrolet Silverado;pickup;6.8
85 Chevrolet Impala;sedan;6.4
91 Ford Country Squire;wagon;7
93 Lincoln Limousine;limo;9.5
89 Volvo 245 Wagon;wagon;6.2
90 BMW E30 Touring;wagon;5.5
90 BMW E30 M3;sport;5.3
90 BMW E30 Cabriolet;convertible;5.3
87 Ford F700 Cargo;truck;9
87 Ford F700 Box;boxtruck;9
87 Ford F700 Tanker;tanker;9
90 Pierce Arrow Ladder;ladder;10
86 CUCV M1009;suv;6.3
86 CUCV M1010 Ambulance;ambulance;7.2
86 CUCV M1028;pickup;6.8
78 AM General M49A2C;tanker;9
78 AM General M50A3;tanker;9.1
78 AM General M62 Recovery;recovery;9.2
93 Ford F250;pickup;6.8
93 Ford F350 Dually;pickup;7.1
59 Miller-Meteor Ambulance;ambulance;7.8
59 Meteor Expedition;hearse;8
67 Shelby Eleanor;muscle;6.3
69 Charger Daytona;muscle;7
70 Road Runner Superbird;muscle;6.9
82 Porsche 911 Targa;convertible;4.9
63 Beetle Dune Buggy;buggy;4.7
89 Defender 110 Pickup;pickup;6
89 Defender 130 Crew Cab;pickup;6.5
76 Chevrolet K20 Long Bed;pickup;7
93 Taurus Wagon;wagon;6.1
87 Suburban Expedition;suv;7
89 Caravan Nomad;wagon;6.3
83 GMC Expedition;van;6.4
`;
const presets={bus:['Autobus scolaire',3.1,22,5.5,.5,.04,'utility'],sedan:['Berline',2.8,32,8.5,.94,.023,'classic'],hatch:['Compacte',2.5,30,9,1.18,.018,'classic'],muscle:['Muscle car',2.9,39,11,.9,.031,'sport'],sport:['Sportive',2.8,42,12,1.1,.027,'sport'],supercar:['Coupé bas',2.9,45,13,1.1,.029,'sport'],round:['Classique arrondie',2.55,32,8.5,1,.021,'classic'],pickup:['Pick-up',2.85,29,8,.8,.028,'utility'],suv:['4×4',2.85,28,8,.88,.028,'utility'],jeep:['4×4 ouvert',2.6,27,8.5,1,.026,'utility'],van:['Fourgon',2.9,25,7,.75,.03,'utility'],wagon:['Break / monospace',2.8,29,8,.9,.025,'utility'],limo:['Limousine',2.9,29,7,.62,.03,'classic'],hearse:['Grand break rétro',2.9,27,7,.65,.03,'classic'],truck:['Camion',3.2,23,5.8,.58,.042,'utility'],semi:['Tracteur routier',3.3,25,6.5,.55,.045,'utility'],firetruck:['Camion incendie',3.3,25,6,.6,.043,'emergency'],ladder:['Échelle incendie',3.3,23,5.8,.52,.045,'emergency'],ambulance:['Ambulance',3,28,8,.68,.034,'emergency'],police:['Interception',2.85,38,10.5,1,.027,'emergency'],sweeper:['Balayeuse',3.1,19,5,.62,.034,'utility'],stepvan:['Fourgon livraison',3,24,6.8,.7,.032,'utility'],armored:['Blindé',3.3,26,6,.65,.043,'military'],tractor:['Tracteur agricole',2.6,12,4,1.05,.016,'utility'],motorcycle:['Moto',.9,36,11,1.3,.014,'bike'],scooter:['Scooter',.8,18,6,1.4,.01,'bike'],quad:['Quad',1.7,25,9,1.25,.019,'bike'],golfcart:['Voiturette',2,15,5,1.25,.009,'classic'],buggy:['Buggy',3,32,10,1.05,.027,'military'],convertible:['Cabriolet',2.7,36,10,1.1,.024,'sport'],boxtruck:['Camion caisse',3.2,22,5.6,.55,.042,'utility'],tanker:['Camion citerne',3.2,22,5.5,.55,.044,'military'],recovery:['Dépanneuse lourde',3.2,21,5.5,.55,.043,'military']};
const palette=[0x747e62,0x9c654c,0xb4b49a,0x4e6567,0x8d924e,0x814b40,0xa69c7b,0x48535b,0x806d52,0xc2b397];
export const KI5_VEHICLES=(inventory+variants).trim().split('\n').filter(Boolean).map((row,i)=>{let [name,shape,length]=row.split(';');shape=shape.trim();const [kind,width,speed,accel,turn,burn,group]=presets[shape];const color=group==='military'?0x667255:group==='emergency'?(shape==='police'?0x404c52:shape==='ambulance'?0xd3ceb4:0xa84835):palette[i%palette.length];return {id:'ki5-'+i,name,shape,length:Number(length),width,speed,accel,turn,burn,group:/AM General|CUCV|MAN KAT|Oshkosh|Hog|Warthog|M540|M577|Bushmaster|Gage|Ferret/.test(name)?'military':group,kind,source:'ki5',color,hex:'#'+color.toString(16).padStart(6,'0'),year:'RECRÉATION',desc:kind+' revisité : proportions et détails simplifiés, réglages propres au prototype.',variant:i>=114}});
const materialCache=new Map();function paint(c){if(!materialCache.has(c))materialCache.set(c,new T.MeshStandardMaterial({color:c,roughness:.76,metalness:.2}));return materialCache.get(c)}
function tools(root){function mesh(g,c,x=0,y=0,z=0){const m=new T.Mesh(g,paint(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;root.add(m);return m}function box(w,h,d,c,x=0,y=0,z=0){return mesh(new T.BoxGeometry(w,h,d),c,x,y,z)}function bar(a,b,r=.05,c=0x40483d){const p=new T.Vector3(...a),q=new T.Vector3(...b),v=q.clone().sub(p);const m=mesh(new T.CylinderGeometry(r,r,v.length(),8),c,...p.clone().add(q).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m}function wheel(x,z,r=.6){const g=new T.Group();g.position.set(x,r,z);root.add(g);for(const [rr,ww,c] of [[r,.35,0x222a23],[r*.55,.38,0x969a8b]]){const m=new T.Mesh(new T.CylinderGeometry(rr,rr,ww,16),paint(c));m.rotation.z=Math.PI/2;g.add(m)}return g}return {mesh,box,bar,wheel}}
export function buildKI5Vehicle(s){const roadShapes=['sedan','hatch','muscle','sport','round','pickup','supercar','police','convertible'];let root;
 if(roadShapes.includes(s.shape)){root=buildRoadVehicle({...s,shape:['supercar','convertible'].includes(s.shape)?'sport':s.shape==='police'?'sedan':s.shape});if(s.shape==='convertible'){// Open roof: retain lower cabin and replace the upper roof with a roll bar.
 const roof=root.children.find(o=>o.geometry?.type==='BoxGeometry'&&o.geometry.parameters.height===.12);if(roof)roof.visible=false;
 }}else root=buildSpecial(s);
 const {box,bar}=tools(root),W=s.width,L=s.length,C=s.color;const decals=new T.Group();root.add(decals);const n=Number(s.id.split('-')[1]);
 if(['suv','jeep','van','wagon','pickup','hearse'].includes(s.shape)){const roof=s.shape==='suv'?2.8:s.shape==='van'?3.05:s.shape==='hearse'?2.6:2.5;for(const x of [-W*.33,W*.33]){bar([x,roof,-L*.24],[x,roof,L*.23],.055);bar([x,roof+.25,-L*.24],[x,roof+.25,L*.23],.04)}for(let z=-L*.24;z<L*.23;z+=.5)box(W*.7,.06,.06,0x636b57,0,roof,z);box(.85,.45,.9,0x8b7957,-.3,roof+.25,-.45);box(.4,.55,.5,0x7c7d4e,.6,roof+.3,-.2)}
 if(s.shape==='police'||['ambulance','firetruck','ladder'].includes(s.shape)){const y=s.shape==='police'?2.4:s.shape==='ambulance'?3.8:3.1;box(W*.7,.12,.35,0x303b35,0,y,0);box(.65,.23,.3,0xa63f34,-.6,y+.16,0);box(.65,.23,.3,0x4b739b,.6,y+.16,0)}
 if(s.shape==='ambulance'){for(const x of [-W/2-.02,W/2+.02]){box(.04,.7,.19,0xa54939,x,2.6,-1);box(.04,.2,.7,0xa54939,x,2.6,-1)}}
 if(s.shape==='muscle'&&n%3===0)for(const x of [-.35,.35])box(.2,.025,L*.24,0xd2c4a3,x,1.5,L*.31);
 if(s.name.includes('Daytona')||s.name.includes('Superbird')){for(const x of [-1,1])box(.12,1,.2,C,x,1.65,-L*.4);box(W,.14,.55,C,0,2.15,-L*.4)}
 if(s.name.includes('GMC')){for(const x of [-W/2-.02,W/2+.02])box(.035,.2,L*.8,0xa44136,x,1.3,0)}
 if(s.shape==='sport'||s.shape==='supercar'){const yy=1.5;for(const x of [-W*.35,W*.35])box(.5,.02,.2,0x303b37,x,yy,L*.3)}
 root.userData.spec=s;root.userData.length=L;return root;
}
function buildSpecial(s){const root=new T.Group(),{mesh,box,bar,wheel}=tools(root),W=s.width,L=s.length,C=s.color,glass=0x46616b,steel=0x374139,chrome=0xa2a496;let wheels=[];
 const bike=['motorcycle','scooter'].includes(s.shape),quad=s.shape==='quad',tractor=s.shape==='tractor',golf=s.shape==='golfcart';
 if(bike||quad){if(bike){wheels=[wheel(0,-L*.32,.48),wheel(0,L*.32,.48)]}else for(const x of [-.7,.7])for(const z of [-1,1])wheels.push(wheel(x,z,.48));bar([0,.6,-L*.3],[0,.9,L*.25],.12);box(bike?.45:1.1,.35,L*.45,C,0,.95,0);box(bike?.4:.8,.16,L*.38,steel,0,1.2,-.3);mesh(new T.SphereGeometry(.32,10,7),C,0,1.12,.3);for(const x of [-.17,.17])bar([x,.5,L*.32],[x,1.4,L*.22],.045,chrome);bar([-.48,1.45,L*.22],[.48,1.45,L*.22],.045,chrome);box(.3,.25,.08,0xe5d5a7,0,1.2,L*.3);box(.28,.15,.08,0x9e4035,0,1.05,-L*.4);if(s.shape==='scooter')box(.6,.7,.2,C,0,.9,.65);box(.12,.12,L*.5,chrome,.3,.62,-.3);root.userData={wheels,length:L,spec:s};return root}
 if(tractor){for(const x of [-W*.43,W*.43]){wheels.push(wheel(x,-L*.28,.9));wheels.push(wheel(x*.7,L*.33,.5))}box(.8,.6,L*.65,0x9a4839,0,1.05,.1);box(.85,.65,L*.4,0xb1b7a1,0,1.38,L*.2);box(.7,.16,.6,steel,0,1.55,-.7);box(.7,.65,.13,steel,0,1.8,-1);bar([.3,1.7,.8],[.3,2.35,.8],.07,steel);for(const x of [-W*.4,W*.4])box(.55,.12,1.7,C,x,1.87,-1);bar([-.6,.8,-L/2],[.6,.8,-L/2],.09);root.userData={wheels,length:L,spec:s};return root}
 if(golf){for(const x of [-.85,.85])for(const z of [-1.1,1.1])wheels.push(wheel(x,z,.42));box(W,.25,L,C,0,.65,0);box(W*.8,.5,.35,0xb3b09b,0,1.1,-.3);box(W*.8,.14,.8,0xb3b09b,0,.85,0);for(const x of [-.8,.8])for(const z of [-.8,1.1])bar([x,1,z],[x,2.1,z],.035);box(W,.12,2.5,C,0,2.1,.1);root.userData={wheels,length:L,spec:s};return root}
 const armored=s.shape==='armored',open=s.shape==='jeep'||s.shape==='buggy',bus=s.shape==='bus',heavy=['truck','semi','firetruck','ladder','sweeper','boxtruck','tanker','recovery'].includes(s.shape);const r=heavy||armored?.72:.62,base=heavy?1.3:1.05;
 for(const x of [-W/2,W/2])for(const z of [-L*.32,L*.32])wheels.push(wheel(x,z,r));if(heavy||s.name.includes('LAV'))for(const x of [-W/2,W/2])wheels.push(wheel(x,-L*.12,r));
 box(W,.5,L,C,0,base,0);box(W-.3,.2,L-.2,steel,0,.65,0);
 if(armored){box(W*.88,1.25,L*.81,C,0,1.85,-.2);box(W*.7,.5,L*.61,C,0,2.7,-.35);for(const x of [-W*.27,W*.27])box(.55,.22,.08,glass,x,2.28,L*.4+.01);box(1.25,.4,1.3,C,0,3.05,-.4);bar([0,3.1,-.1],[0,3.1,L*.4],.075);for(const x of [-W*.45,W*.45])for(let z=-L*.3;z<L*.2;z+=1)box(.06,.24,.5,glass,x,2.1,z);}
 else if(bus){box(W,.25,L*.15,C,0,1.6,L*.42);box(W,1.9,L*.8,0xc8a146,0,2.35,-L*.06);box(W+.06,.16,L*.82,0xc8a146,0,3.38,-L*.06);for(const x of [-W/2-.02,W/2+.02]){for(let z=-L*.4;z<L*.28;z+=.85)box(.07,.72,.65,glass,x,2.7,z);box(.06,.08,L*.8,steel,x,1.7,-.3);box(.06,.08,L*.8,steel,x,1.9,-.3)}box(W*.9,.85,.08,glass,0,2.7,L*.35);}
 else if(heavy){const front=L*.3;box(W,1.5,2.25,C,0,2,front);box(W*.85,.75,.08,glass,0,2.4,front+1.16);box(W,.15,2.3,C,0,2.83,front);for(const x of [-W/2-.02,W/2+.02])box(.06,.75,1.5,glass,x,2.4,front);const bL=L*.6,bZ=-L*.17;
 if(s.shape==='tanker'){const tank=mesh(new T.CylinderGeometry(W*.43,W*.43,bL,14),chrome,0,2.25,bZ);tank.rotation.x=Math.PI/2;for(const z of [bZ-bL*.28,bZ+bL*.28])box(W*.93,.12,.15,steel,0,2.3,z)}
 else if(s.shape==='semi'){box(1.1,.12,1.4,steel,0,1.5,-L*.25);for(const x of [-W*.4,W*.4])bar([x,1.2,front-.8],[x,3.9,front-.8],.08,chrome);}
 else if(s.shape==='ladder'){box(W,.8,bL,C,0,1.8,bZ);for(const x of [-W*.33,W*.33])bar([x,2.7,-L*.46],[x,2.7,L*.4],.08,chrome);for(let z=-L*.46;z<L*.4;z+=.38)bar([-W*.33,2.7,z],[W*.33,2.7,z],.05,chrome);}
 else if(s.shape==='recovery'){box(W,.3,bL,steel,0,1.7,bZ);for(const x of [-W*.3,W*.3])bar([x,1.8,-L*.42],[0,3,0],.09,C);bar([0,3,0],[0,2.7,-L*.6],.08,C);}
 else if(['firetruck','boxtruck','sweeper'].includes(s.shape)){box(W,1.65,bL,s.shape==='boxtruck'?0xb3b49f:C,0,2.22,bZ);for(const x of [-W/2-.02,W/2+.02])for(let z=-L*.4;z<0;z+=.9)box(.06,1,.7,chrome,x,2.2,z);if(s.shape==='sweeper')for(const x of [-W*.52,W*.52])mesh(new T.CylinderGeometry(.7,.8,.2,14),0x373c32,x,.2,.4)}
 else {box(W,.12,bL,0x706b4e,0,1.6,bZ);for(const x of [-W/2,W/2]){box(.12,.9,bL,C,x,2.1,bZ);for(let z=-L*.45;z<.7;z+=1)box(.13,1,.13,steel,x,2.1,z)}box(W,.9,.12,C,0,2.1,-L/2)}}
 else{const ambulance=s.shape==='ambulance',step=s.shape==='stepvan',wagon=s.shape==='wagon'||s.shape==='limo'||s.shape==='hearse',suv=s.shape==='suv';const roof=ambulance?3.65:step?3.3:open?2.45:2.65,cabLen=ambulance?L*.66:step?L*.94:L*.69,cabZ=ambulance?-L*.14:step?0:-.35;
 if(!open){box(W*.92,roof-base-.2,cabLen,glass,0,(roof+base+.2)/2,cabZ);box(W*.95,.15,cabLen,C,0,roof,cabZ);for(const x of [-W*.46,W*.46]){for(let z=cabZ-cabLen/2;z<cabZ+cabLen/2+.1;z+=cabLen/3)box(.1,roof-base-.2,.12,C,x,(roof+base+.2)/2,z);box(.08,.2,cabLen,C,x,base+.4,cabZ)}if(ambulance||step){for(const x of [-W*.46,W*.46])box(.07,1.65,cabLen*.75,ambulance?0xd6d1b9:C,x,2.45,cabZ-.4);box(W*.9,1.8,.1,C,0,2.35,cabZ-cabLen/2-.03)}}else{for(const x of [-W*.4,W*.4]){bar([x,1.3,1],[x,2.35,.8],.07);bar([x,2.35,.8],[x,2.35,-1.3],.07);box(.7,.9,.25,steel,x*.5,1.6,-.4)}box(W*.8,.75,.08,glass,0,1.9,1);bar([-W*.4,2.35,-1.3],[W*.4,2.35,-1.3],.07)}
 if(!step)box(W,.23,L*.22,C,0,base+.38,L*.38);if(wagon)for(const x of [-W/2-.02,W/2+.02])box(.04,.25,L*.7,0x8b7652,x,1.3,0);}
 for(const x of [-W*.34,W*.34]){box(.48,.28,.09,0xe0d0a4,x,base+.14,L/2+.06);box(.35,.23,.1,0x9e3f33,x,base+.14,-L/2-.07)}box(W*.4,.3,.07,steel,0,base+.1,L/2+.08);box(W+.1,.2,.18,chrome,0,base-.17,L/2+.1);box(W+.1,.2,.18,chrome,0,base-.17,-L/2-.1);root.userData={wheels,length:L,spec:s};return root;
}
export const KI5_TRAILERS=[
 ['utility-s','Petite utilitaire',.7,'open'],['utility-m','Utilitaire moyenne',1,'open'],['utility-l','Grande utilitaire',1.3,'open'],['cargo-s','Petite cargo fermée',.7,'cargo'],['cargo-m','Cargo moyenne',1,'cargo'],['cargo-l','Grande cargo',1.3,'cargo'],['livestock','Bétaillère',1.3,'livestock'],['m101a3','Militaire M101A3',1,'military'],['m101a2','Militaire M101A2',.95,'military'],['m105','Militaire cargo lourde',1.4,'military'],['semi-flat','Semi plateau',2,'flat'],['semi-tank','Semi citerne',2,'tank'],['camper-s','Caravane compacte',1,'camper'],['camper-l','Grande caravane',1.5,'camper'],['ski','Porte-jet-ski Waveruiner',1.1,'jetski']
].map(([id,name,scale,type])=>({id,name,scale,type}));
export function buildKI5Trailer(s){const root=buildTrailer();root.scale.set(s.scale,1,s.scale);const {box,mesh}=tools(root);const W=2.5,center=-2.2;if(['cargo','camper','livestock'].includes(s.type)){box(W,1.7,3.4,s.type==='camper'?0xc1b89e:0x92987f,0,2,center);box(W+.12,.13,3.5,0xc6c2ad,0,2.9,center);for(const x of [-1.26,1.26]){if(s.type==='livestock')for(let z=-3.4;z<-.7;z+=.45)box(.03,.6,.18,0x3a473e,x,2.1,z);else box(.04,.55,.9,0x425c62,x,2.2,center)}box(.6,1.4,.05,0x9f9c84,0,1.8,-3.95)}if(s.type==='tank'){const m=mesh(new T.CylinderGeometry(1.15,1.15,3.6,16),0xa2a697,0,2,center);m.rotation.x=Math.PI/2}if(s.type==='jetski'){box(1.25,.35,2.9,0xd2c5a6,0,1.8,center);const nose=mesh(new T.SphereGeometry(1,10,7),0x9d4b3e,0,1.97,center);nose.scale.set(.66,.35,1.65);box(.4,.18,1.1,0x2c3934,0,2.32,center-.2);box(.75,.1,.12,0x34433a,0,2.45,center+.5)}return root}
