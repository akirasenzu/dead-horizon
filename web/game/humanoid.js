import * as T from './vendor/three.module.js';
import{ModelBatch,modelMaterials,shade}from'./model-kit.js';
import{normalizeAppearance,bodyScale,SKIN_COLORS,HAIR_COLORS,OUTFIT_COLORS}from'./appearance.js';
const zombieSets=[[0x607052,0x606963,0x454c4d],[0x929678,0x75544e,0x454c58],[0x7a8471,0x4b6270,0x3c414a],[0x9b977d,0x8a7c63,0x5a5b4c],[0x6f806d,0x596548,0x353e3c],[0x878b72,0x393f4a,0x515768],[0x9a8a77,0x6f6159,0x414843],[0x768571,0x777960,0x4a4640]];
const slots=['torso','head','upperL','foreL','upperR','foreR','thighL','shinL','thighR','shinR'];
const zombieGeometry=new Map();
function geometryFor(appearance,outfit,armor,zombie,variant,backpack){
 const a=normalizeAppearance(appearance),skin=zombie?zombieSets[variant%8][0]:SKIN_COLORS[a.skin],top=zombie?zombieSets[variant%8][1]:outfit.top,pants=zombie?zombieSets[variant%8][2]:outfit.pants,hair=HAIR_COLORS[a.hair],b=Object.fromEntries(slots.map(k=>[k,new ModelBatch()]));
 const dark=shade(top,.7),seam=shade(top,1.15),denim=shade(pants,.72),blood=0x63332b,boot=0x33352f;
 // Shoulder, waist and hip widths are independently shaped rather than cuboids.
 b.torso.loft([[.88,.16,.115],[.99,.185,.13],[1.12,.17,.12],[1.32,.225,.135],[1.43,.24,.12],[1.48,.175,.09]],top,10);
 b.torso.loft([[.78,.16,.105],[.96,.185,.13],[1,.17,.125]],pants,10);
 b.torso.loft([[1.45,.07,.07],[1.56,.065,.065]],skin,8);
 b.torso.ring(.068,.018,dark,0,1.48,0,'y');b.torso.box(.035,.07,.012,0x9a926e,0,1.01,.133);
 b.torso.box(.35,.025,.245,0x45463c,0,.97,0);b.torso.box(.04,.036,.015,0x9e9b89,0,.97,.134);
 // Shirt seams, hem and chest pocket are baked into the same draw call.
 for(const side of[-1,1]){b.torso.box(.012,.32,.012,seam,side*.18,1.22,.113);b.torso.box(.055,.15,.025,denim,side*.155,.87,.04)}
 if(['work','denim','hunter','rain','winter','nomad','leather','olive','scout','cargo','fire','medic'].includes(outfit.id)){
  b.torso.box(.015,.42,.025,dark,0,1.22,.143);for(const side of[-1,1]){b.torso.box(.105,.11,.025,shade(top,.83),side*.12,1.29,.145);b.torso.box(.11,.017,.03,seam,side*.12,1.35,.151)}
 }else b.torso.box(.095,.095,.018,shade(top,.9),-.115,1.28,.142);
 if(['winter','rain','nomad'].includes(outfit.id))b.torso.loft([[.72,.205,.145],[.99,.19,.135]],top,10);
 if(outfit.id==='medic'){b.torso.box(.1,.025,.018,0xd8d3bb,.1,1.31,.165);b.torso.box(.025,.1,.019,0xd8d3bb,.1,1.31,.166)}
 if(outfit.id==='fire')for(const y of[1.03,1.32])b.torso.box(.4,.035,.03,0xbab58a,0,y,.15);
 // A faceted cranium, jaw, ears, brow, nose, mouth and recessed eyes.
 b.head.loft([[-.16,.065,.065],[-.12,.1,.085],[-.01,.128,.107],[.11,.12,.105],[.17,.075,.065]],skin,12);
 for(const side of[-1,1]){b.head.loft([[-.035,.018,.02,side*.131,0],[.035,.022,.028,side*.131,0]],shade(skin,.92),6);b.head.box(.048,.024,.012,zombie?0x514c3f:shade(skin,.7),side*.048,.025,.103);b.head.box(.027,.012,.013,zombie?0xb9b59a:0xd7d7c4,side*.048,.024,.111);b.head.box(.012,.013,.014,zombie&&variant%3===0?0x423d31:0x444439,side*.048,.024,.117);b.head.box(.052,.012,.013,shade(hair,.8),side*.047,.052,.11)}
 b.head.profile([[.095,.03],[.145,-.025],[.127,-.05],[.105,-.028]],.036,shade(skin,.95));b.head.box(.065,.012,.01,zombie?0x553d32:0x9a705b,0,-.088,.094);
 if(a.hairstyle!=='shaved'){
  b.head.loft([[.065,.126,.109],[.13,.119,.107],[.188,.07,.06]],hair,12);b.head.box(.19,.042,.06,hair,0,.087,.078);
  if(a.hairstyle==='long'){b.head.loft([[-.17,.133,.088,0,-.045],[.08,.135,.095,0,-.03]],hair,10);b.head.box(.065,.19,.095,hair,-.115,-.015,-.01);b.head.box(.065,.19,.095,hair,.115,-.015,-.01)}
  if(a.hairstyle==='ponytail')b.head.loft([[-.18,.026,.03,0,-.155],[.02,.05,.045,0,-.14],[.075,.045,.04,0,-.12]],hair,8);
 }
 if(a.beard!=='none')b.head.loft([[-.17,a.beard==='full'?.077:.065,.077,0,.015],[-.105,.106,.1,0,.009],[-.065,.105,.097]],hair,10);
 if(zombie){
  b.head.box(.074,.043,.01,blood,.082,-.065,.092);b.head.box(.035,.017,.013,0xc5baa0,.067,-.065,.099);
  b.torso.profile([[.139,1.17],[.153,1.09],[.16,1.2],[.143,1.27],[.147,1.19]],.135,blood,.045);
  b.torso.box(.055,.13,.012,shade(skin,.8),-.115,1.34,.145);for(let j=0;j<4;j++)b.torso.box(.025,.12-j*.016,.014,shade(top,.58),-.1+j*.025,1.08-j*.035,.147);
 }
 for(const [side,upper,fore,thigh,shin]of[[-1,'upperR','foreR','thighR','shinR'],[1,'upperL','foreL','thighL','shinL']]){
  const longSleeve=!['civil','sport'].includes(outfit.id)||zombie&&variant%2===0;
  b[upper].loft([[0,.073,.074],[-.11,.08,.075],[-.19,.068,.068]],top,8);
  b[upper].loft([[-.19,.062,.06],[-.305,.055,.055]],longSleeve?top:skin,8);
  b[upper].box(.015,.12,.015,shade(longSleeve?top:skin,.85),side*.055,-.22,.027);
  b[fore].loft([[.015,.055,.055],[-.13,.054,.05],[-.285,.038,.039]],longSleeve?top:skin,8);
  b[fore].loft([[-.27,.04,.04],[-.32,.044,.026,0,.016],[-.365,.034,.023,0,.025]],skin,8);
  b[fore].box(.024,.05,.031,shade(skin,.9),side*.04,-.31,.024);
  if(longSleeve)b[fore].loft([[-.21,.046,.044],[-.255,.042,.042]],dark,8);
  b[thigh].loft([[.02,.092,.102],[-.13,.088,.098],[-.37,.065,.071],[-.415,.064,.067]],pants,8);
  b[thigh].box(.017,.23,.012,shade(pants,1.18),side*.072,-.17,.055);
  b[thigh].box(.08,.13,.023,denim,side*.073,-.09,-.065);
  b[shin].loft([[.015,.064,.067],[-.09,.068,.07],[-.3,.044,.047],[-.37,.044,.049]],pants,8);
  b[shin].loft([[-.39,.061,.089,0,.036],[-.31,.06,.095,0,.04],[-.27,.044,.052]],boot,8);
  b[shin].box(.11,.025,.18,0x292d28,0,-.395,.038);for(let j=0;j<3;j++)b[shin].box(.055,.008,.012,0x777966,0,-.29-j*.015,.095);
  if(zombie){b[fore].box(.055,.12,.012,blood,0,-.1,.055);b[thigh].box(.09,.09,.012,skin,0,-.29,.072);b[shin].box(.035,.18,.013,blood,side*.02,-.18,.067)}
 }
 if(backpack){b.torso.loft([[1.01,.17,.095,0,-.21],[1.35,.18,.105,0,-.21],[1.41,.13,.07,0,-.2]],0x5e6852,10);for(const x of[-.15,.15])b.torso.box(.035,.34,.025,0x414b3f,x,1.23,.145);b.torso.box(.24,.15,.05,0x69745c,0,1.12,-.32)}
 if(armor?.reduction){
  b.torso.loft([[1.04,.19,.15],[1.33,.235,.16],[1.4,.19,.135]],armor.color,10);
  for(const x of[-.145,0,.145]){b.torso.box(.1,.13,.06,shade(armor.color,.83),x,1.15,.177);b.torso.box(.103,.018,.065,shade(armor.color,1.13),x,1.22,.18)}for(const x of[-.15,.15])b.torso.box(.04,.12,.025,shade(armor.color,.7),x,1.42,0);
 }
 if(armor?.helmet){b.head.loft([[.02,.151,.128],[.12,.15,.13],[.205,.09,.08]],armor.color,12);b.head.box(.29,.025,.11,shade(armor.color,.9),0,.035,.11);if(armor.visor)b.head.box(.235,.105,.012,0x536b6c,0,-.015,.143)}
 if(armor?.heavy)for(const key of['thighL','thighR'])b[key].loft([[-.28,.075,.082],[-.4,.07,.08]],armor.color,8);
 return Object.fromEntries(slots.map(key=>[key,b[key].mesh(modelMaterials.cloth).geometry]));
}
export function createHumanoid({zombie=false,variant=0,appearance={},outfit=null,armor=null,backpack=false}={}){
 const g=new T.Group(),rig={meshes:{},zombie,variant,phase:variant*.91,appearance:normalizeAppearance(appearance)},p={g,rig,modelVersion:2};
 rig.core=new T.Group();g.add(rig.core);rig.head=new T.Group();rig.head.position.y=1.72;rig.core.add(rig.head);
 for(const [key,x]of[['L',.268],['R',-.268]]){const upper=new T.Group();upper.position.set(x,1.435,0);rig.core.add(upper);const fore=new T.Group();fore.position.y=-.305;upper.add(fore);rig['upper'+key]=upper;rig['fore'+key]=fore;const thigh=new T.Group();thigh.position.set(key==='L'?.105:-.105,.81,0);g.add(thigh);const shin=new T.Group();shin.position.y=-.415;thigh.add(shin);rig['thigh'+key]=thigh;rig['shin'+key]=shin}
 p.legs=[rig.thighL,rig.thighR];p.hair={visible:true};p.lookSignature='';
 if(zombie){rig.appearance=normalizeAppearance({skin:variant%6,hair:variant%6,hairstyle:variant%4===0?'shaved':variant%3===0?'long':'short',beard:variant%5===0?'stubble':'none'});g.scale.set(1+(variant%3-1)*.04,.96+(variant%5)*.018,1)}
 rebuildHumanoid(p,{outfit:outfit||{id:'civil',...OUTFIT_COLORS[0]},armor,backpack});return p;
}
export function rebuildHumanoid(p,{outfit=p.rig.outfit,armor=p.rig.armor,backpack=p.rig.backpack}={}){
 const r=p.rig;r.outfit=outfit;r.armor=armor;r.backpack=!!backpack;const key=r.zombie?r.variant%8+':'+JSON.stringify(r.appearance):'';let geometries=key&&zombieGeometry.get(key);
 if(!geometries){geometries=geometryFor(r.appearance,outfit,armor,r.zombie,r.variant,backpack);if(key){for(const g of Object.values(geometries))g.userData.shared=true;zombieGeometry.set(key,geometries)}}
 for(const slot of slots){const parent=slot==='torso'?r.core:slot==='head'?r.head:r[slot],old=r.meshes[slot];if(old){parent.remove(old);if(!old.geometry.userData.shared)old.geometry.dispose()}const mesh=new T.Mesh(geometries[slot],modelMaterials.cloth);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);r.meshes[slot]=mesh}p.body=r.meshes.torso;p.head=r.meshes.head;
}
export function setHumanoidAppearance(p,raw){const a=normalizeAppearance(raw),signature=JSON.stringify(a);if(p.lookSignature===signature)return;p.lookSignature=signature;p.appearance=a;p.rig.appearance=a;const scale=bodyScale(a);p.g.scale.set(scale.x,scale.y,scale.x);rebuildHumanoid(p)}
const down=new T.Vector3(0,-1,0);
function reach(r,side,target){
 const upper=r['upper'+side],fore=r['fore'+side],s=upper.position.clone(),d=target.clone().sub(s),length=Math.min(.64,Math.max(.08,d.length()));d.normalize();const pole=new T.Vector3(side==='L'?.45:-.45,-.65,-.2);pole.addScaledVector(d,-pole.dot(d)).normalize();const l1=.305,l2=.345,cos=Math.max(-1,Math.min(1,(length*length+l1*l1-l2*l2)/(2*length*l1))),elbow=s.clone().addScaledVector(d,cos*l1).addScaledVector(pole,Math.sqrt(1-cos*cos)*l1),qa=new T.Quaternion().setFromUnitVectors(down,elbow.clone().sub(s).normalize()),qb=new T.Quaternion().setFromUnitVectors(down,target.clone().sub(elbow).normalize());upper.quaternion.copy(qa);fore.quaternion.copy(qa.invert().multiply(qb));
}
export function animateHumanoid(p,{dt=.016,time=0,speed=0,aim=false,reload=0,attackAge=10,dead=false,state='wander',groundY=null}={}){
 const r=p.rig;if(!r)return;const walk=Math.min(1.5,Math.max(0,speed)),zombie=r.zombie;r.phase+=dt*(zombie?4.2:7)*Math.max(.15,walk);const phase=r.phase,swing=Math.sin(phase),stride=walk*(zombie?.28:.5);
 if(dead){r.core.rotation.set(0,0,0);r.core.position.y=0;r.head.rotation.set(0,0,0);p.g.rotation.x=Math.PI/2;p.g.rotation.z=0;for(const side of['L','R']){r['upper'+side].rotation.set(.15,0,side==='L'?-.18:.18);r['fore'+side].rotation.set(-.18,0,0);r['thigh'+side].rotation.x=side==='L'?.07:-.09;r['shin'+side].rotation.x=.1}const key=p.g.rotation.y+':'+p.g.scale.toArray().join(',')+':'+p.lookSignature;if(!r.wasDead||r.corpseKey!==key){p.g.updateWorldMatrix(true,true);const box=new T.Box3().setFromObject(p.g);r.corpseLift=p.g.position.y-box.min.y+.025;r.corpseKey=key}if(Number.isFinite(groundY))p.g.position.y=groundY+r.corpseLift;r.wasDead=true;return}
 r.wasDead=false;p.g.rotation.x=0;p.g.rotation.z=0;r.core.rotation.set(zombie?.12:0,Math.sin(phase)*walk*.025,Math.sin(phase)*walk*.025);r.core.position.y=(Math.cos(phase*2)*.012*walk)+Math.sin(time*1.7)*.003;
 r.head.rotation.set(zombie?-.08:.015,zombie?Math.sin(time*.5+r.variant)*.09:Math.sin(time*.4)*.025,zombie?(r.variant%3-1)*.07:0);
 for(const [side,sign]of[['L',1],['R',-1]]){r['thigh'+side].rotation.set(swing*stride*sign,0,0);r['shin'+side].rotation.set(Math.max(0,-swing*sign)*walk*.6,0,0);r['upper'+side].rotation.set(-swing*stride*sign*.7-(zombie?.48:0),0,sign*-.045);r['fore'+side].rotation.set(zombie?-.22:-.09,0,0)}
 if(zombie){if(state==='attack'){for(const side of['L','R'])r['upper'+side].rotation.x=-1.05-Math.sin(time*8)*.22;r.core.rotation.x=.22}return}
 const w=p.weapon,held=w&&w.id!=='fists';if(held&&p.gunModel){p.gunModel.updateMatrix();const grip=p.gunModel.userData.grip||new T.Vector3(0,-.12,.03),support=p.gunModel.userData.support||new T.Vector3(0,-.08,.3);const right=grip.clone().applyMatrix4(p.gunModel.matrix),left=support.clone().applyMatrix4(p.gunModel.matrix);if(reload>0)left.y-=Math.sin((1-reload/Math.max(1,w.reload))*Math.PI)*.18;reach(r,'R',right);if(!w.melee||w.id==='axe'||w.id==='bat')reach(r,'L',left)}
 if(!held&&attackAge<.55){const pulse=Math.sin(attackAge/.55*Math.PI);r.upperR.rotation.x=-.3-pulse*1.2;r.foreR.rotation.x=-.2-pulse*.2}
}
