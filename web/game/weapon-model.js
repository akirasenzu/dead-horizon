import * as T from './vendor/three.module.js';
import{ModelBatch,modelMaterials,shade,disposeModel}from'./model-kit.js';
const steel=0x444b4b,edge=0x737b77,black=0x282f2f,polymer=0x3d4540,wood=0x806044,brass=0xaa9050;
export function weaponFamily(w){const n=w.name.toLowerCase().replace(/[^a-z0-9]/g,'');if(w.melee||w.id==='fists')return w.shape;if(w.shape==='revolver')return'revolver';if(w.shape==='pistol')return/1911|tt33|hipower/.test(n)?'classic-pistol':/pocket|p22|p32|ppk|pm$/.test(n)?'compact-pistol':'service-pistol';if(/p90/.test(n))return'p90';if(/mp5/.test(n))return'mp5';if(/vector/.test(n))return'vector';if(/mp7/.test(n))return'mp7';if(/m82/.test(n))return'anti-materiel';if(/m14|mini14|fal|g3/.test(n))return'battle-rifle';if(/uzi|mac10/.test(n))return'compact-smg';if(/thompson|mp40|sterling/.test(n))return'classic-smg';if(/ak|rpk|sks|svd|saiga/.test(n))return'ak';if(/doublebarrel|coach/.test(n))return'double-shotgun';if(w.shape==='shotgun')return/pump|870|500|590/.test(n)?'pump-shotgun':'tactical-shotgun';if(w.shape==='bullpup')return /aug/.test(n)?'aug':'bullpup';if(w.shape==='lmg')return'belt-fed';if(w.shape==='marksman'&&!/mk12|m14|m82/.test(n))return'bolt-rifle';if(w.shape==='smg')return'modern-smg';return'ar-rifle'}
export function buildWeaponModel(w){
 const root=new T.Group(),magazine=new T.Group(),slide=new T.Group();root.name=w.name;root.add(magazine,slide);
 const bodies={metal:new ModelBatch(),polymer:new ModelBatch(),wood:new ModelBatch()},mag=new ModelBatch(),action=new ModelBatch(),family=weaponFamily(w),name=w.name.toLowerCase(),small=['service-pistol','classic-pistol','compact-pistol','revolver'].includes(family),mods=w.mods||{};
 let barrelEnd=.79,bodyTop=.085,grip=new T.Vector3(0,-.12,.025),support=new T.Vector3(-.035,-.08,.3),magGrip=new T.Vector3(0,-.2,.12),hasMag=true;
 const m=bodies.metal,p=bodies.polymer,t=bodies.wood;
 const barrel=(z,length,r=.021)=>{m.tube(r,r,length,steel,0,.025,z,'z');m.ring(r,.006,edge,0,.025,z+length/2+.004);m.tube(r*.55,r*.55,.003,0x101c1b,0,.025,z+length/2+.009,'z')};
 const stock=(z=-.2,long=.27,classic=false)=>{const b=classic?t:p;b.profile([[z-long,.055],[z+.04,.06],[z+.05,-.025],[z-.06,-.065],[z-long+.015,-.14]],.067,classic?wood:polymer);b.box(.075,.18,.022,black,0,-.045,z-long);if(!classic){m.tube(.016,.016,long,edge,0,.025,z-long/2,'z');b.box(.025,.04,.1,shade(polymer,1.2),0,.08,z-long*.5)}};
 const pistolGrip=(z=.01,color=polymer)=>p.profile([[z-.055,-.035],[z+.035,-.045],[z+.015,-.22],[z-.065,-.215],[z-.077,-.19]],.064,color);
 const trigger=(z=.02)=>{m.box(.02,.045,.016,steel,0,-.055,z+.055);m.box(.065,.012,.105,black,0,-.092,z+.025);m.box(.065,.065,.012,black,0,-.06,z+.077)};
 const rail=(start,end,y=.104)=>{m.box(.055,.014,end-start,black,0,y,(start+end)/2);for(let z=start;z<end;z+=.035)m.box(.08,.012,.013,edge,0,y+.011,z)};
 const iron=(rear,front,y=.12)=>{m.box(.067,.025,.019,black,0,y,rear);m.box(.014,.055,.021,black,0,y+.014,front);if(y>.1){m.box(.022,y-.025,.023,steel,0,(y+.025)/2,front);m.tube(.027,.027,.025,black,0,.025,front,'z',8)}for(const x of[-.024,.024])m.box(.01,.028,.015,edge,x,y+.021,rear)};
 const vents=(start,end,y,width)=>{for(let z=start;z<end;z+=.047)for(const x of[-width,width])p.box(.003,.023,.03,0x182523,x,y,z)};
 const straightMag=(z=.14,curved=false,length=.19,color=0x545b52)=>{const extended=mods.magazine==='extended'?1.35:1,L=length*extended;
  if(mods.magazine==='drum'){mag.tube(.091,.091,.105,black,0,-.15,z,'x',16);mag.ring(.071,.007,edge,.055,-.15,z,'x');mag.box(.055,.07,.065,color,0,-.06,z)}
  else{mag.profile(curved?[[z-.045,-.035],[z+.035,-.045],[z+.075,-L*.65],[z+.115,-L],[z+.035,-L-.02],[z-.005,-L*.67]]:[[z-.04,-.04],[z+.036,-.04],[z+.022,-L],[z-.046,-L]],.054,color);for(let j=1;j<5;j++)for(const side of[-1,1])mag.box(.006,L*.66,.007,shade(color,.68),side*.029,-L*.53,z-.03+j*.013)}magGrip.set(0,-L*.7,z)};
 if(family==='fists'){hasMag=false;barrelEnd=0;support.set(-.08,-.1,.05)}
 else if(w.melee){hasMag=false;grip.set(0,-.04,.02);support.set(0,0,.18);bodyTop=.04;
  if(w.id==='bat'){t.add(new T.CylinderGeometry(.025,.048,.84,10),0x947750,[0,0,.36],[Math.PI/2,0,0]);t.tube(.035,.035,.025,wood,0,0,-.075,'z');for(let i=0;i<7;i++)p.ring(.025,.003,0x4d5045,0,0,-.025+i*.014);barrelEnd=.8}
  else if(w.id==='axe'){t.box(.035,.035,.72,wood,0,0,.3);m.profile([[.51,-.03],[.64,-.15],[.78,-.125],[.77,.15],[.65,.16],[.54,.04]],.055,steel);m.profile([[.75,-.125],[.79,-.13],[.79,.16],[.75,.15]],.058,0xa4aaa0);barrelEnd=.8}
  else{p.box(.035,.048,.16,0x5a4835,0,0,.025);m.profile([[.09,-.022],[.25,-.02],[.35,.02],[.24,.043],[.09,.028]],.011,0xa1aaa2);m.box(.07,.012,.018,steel,0,0,.105);for(const z of[-.02,.065])m.tube(.006,.006,.037,edge,0,0,z,'x',8);barrelEnd=.35}
 }
 else if(small){
  const classic=family==='classic-pistol',compact=family==='compact-pistol',revolver=family==='revolver',length=compact?.17:classic?.235:/g19/.test(name)?.19:/g21|usp/.test(name)?.23:.215;barrelEnd=length+.018;bodyTop=.065;grip.set(.018,-.135,.015);support.set(-.045,-.12,.055);pistolGrip(.015,classic?0x6b4c34:polymer);trigger(.035);p.box(.072,.055,length,polymer,0,-.01,length*.43);
  if(revolver){hasMag=false;const long=/29|python/.test(name)?.2:.12;barrelEnd=.105+long;barrel(.11+long/2,long,.022);m.box(.045,.02,long,edge,0,.06,.11+long/2);m.tube(.05,.05,.075,steel,0,.005,.085,'z',12);m.ring(.043,.005,edge,0,.005,.127);for(let i=0;i<6;i++){const a=i*Math.PI/3;m.tube(.008,.008,.004,0x17201e,Math.sin(a)*.028,.005+Math.cos(a)*.028,.13,'z',8)}m.box(.018,.045,.025,edge,0,.058,-.025);iron(-.035,barrelEnd-.025,.08)}
  else{action.box(.071,.064,length,classic?0x7c8580:0x515957,0,.035,length*.43);action.box(.027,.005,.045,0x26332f,-.037,.038,length*.54);for(let j=0;j<6;j++)for(const side of[-1,1])action.box(.002,.045,.003,0x2a3633,side*.037,.035,-.012+j*.008);barrel(length*.7,length*.62,.015);action.box(.025,.014,.016,black,0,.075,length-.035);action.box(.065,.012,.018,black,0,.075,-.018);mag.box(.054,.125,.052,0x434b43,0,-.14,.008);mag.box(.065,.013,.07,black,0,-.206,.005);magGrip.set(0,-.16,.01)}
  if(!revolver&&!/^g[0-9]/.test(name)){m.box(.025,.025,.018,edge,0,.07,-.03);p.profile([[-.065,-.04],[-.01,-.03],[.006,-.11],[-.045,-.14]],.067,shade(polymer,.85))}if(classic)for(const side of[-1,1]){t.profile([[-.038,-.069],[.023,-.077],[.002,-.195],[-.052,-.188]],.007,wood,side*.036);for(const y of[-.095,-.17])m.tube(.004,.004,.004,edge,side*.041,y,-.015,'x',6)}
 }
 else if(family==='p90'){
  barrelEnd=.52;p.profile([[-.23,.09],[.38,.09],[.43,-.005],[.25,-.06],[.2,-.15],[.08,-.18],[.01,-.04],[-.11,-.08],[-.15,-.17],[-.23,-.17]],.115,0x5a6755);p.box(.115,.035,.4,0x7e8267,0,.115,.03);mag.box(.095,.025,.35,0x6c7059,0,.14,-.015);barrel(.42,.2);rail(.01,.19,.19);iron(-.04,.26,.195);grip.set(0,-.12,.02);support.set(-.015,-.08,.25);bodyTop=.17;magGrip.set(0,.15,-.03);
 }
 else if(family==='compact-smg'){
  barrelEnd=.41;m.box(.095,.11,.27,steel,0,.025,.095);pistolGrip(.12);trigger(.035);barrel(.29,.23);straightMag(.12,false,.28);m.box(.04,.018,.11,edge,0,.099,.04);for(const x of[-.055,.055])m.tube(.009,.009,.28,steel,x,-.035,-.18,'z');m.box(.12,.12,.015,black,0,-.07,-.32);iron(0,.21,.11);support.set(-.03,-.045,.21);bodyTop=.1;
 }
 else if(['mp5','vector','mp7','classic-smg'].includes(family)){
  const classic=family==='classic-smg',thompson=/thompson/.test(name);barrelEnd=classic?.72:family==='mp7'?.44:family==='vector'?.4:.58;
  if(family==='vector'){p.profile([[-.16,.08],[.22,.08],[.24,-.08],[.09,-.25],[-.08,-.23],[-.12,-.055]],.105,0x565c4e);pistolGrip(-.07);straightMag(.035,false,.27);p.box(.09,.07,.12,black,0,-.02,.25)}
  else if(family==='mp7'){p.profile([[-.13,.075],[.25,.075],[.28,-.035],[.12,-.07],[.06,-.22],[-.03,-.2],[-.05,-.055],[-.13,-.055]],.087,polymer);straightMag(.035,false,.22);p.profile([[.23,-.025],[.27,-.03],[.26,-.16],[.23,-.16]],.038,black)}
  else{m.tube(.039,.039,.32,steel,0,.025,.025,'z');m.box(.08,.045,.31,steel,0,-.025,.04);pistolGrip(-.04,classic?0x5d5142:polymer);straightMag(.12,!classic,.23);const fore=classic?t:p;fore.profile([[.2,.045],[.37,.035],[.36,-.055],[.22,-.07]],.077,classic?wood:black);if(thompson){t.profile([[.25,-.04],[.3,-.05],[.31,-.18],[.26,-.17]],.045,wood)}}
  stock(-.14,classic?.25:.2,thompson);trigger(-.01);barrel((.28+barrelEnd)/2,barrelEnd-.28);rail(-.1,.24,.105);iron(-.12,barrelEnd-.04,.12);support.set(-.02,-.06,family==='vector'?.23:.29);bodyTop=.12;
 }
 else if(family==='battle-rifle'||family==='bolt-rifle'||family==='anti-materiel'){
  const bolt=family==='bolt-rifle',heavy=family==='anti-materiel',wooden=/m14|mini14/.test(name),color=wooden?wood:bolt?0x687459:polymer,body=wooden?t:p;barrelEnd=heavy?1.19:bolt?1.08:.98;
  body.profile([[-.46,.045],[-.2,.045],[-.12,.015],[.14,.02],[.52,.02],[.54,-.055],[.12,-.09],[-.015,-.11],[-.08,-.17],[-.17,-.1],[-.45,-.16]],.085,color);body.box(.09,.2,.025,black,0,-.055,-.46);m.tube(.032,.032,.32,steel,0,.05,.015,'z');m.box(.06,.04,.29,steel,0,.033,.01);trigger(-.01);barrel((.45+barrelEnd)/2,barrelEnd-.45,heavy?.03:.021);straightMag(.09,false,bolt?.1:heavy?.18:.22);rail(-.14,.23,.105);iron(-.12,barrelEnd-.04,.12);
  if(bolt){m.tube(.008,.008,.068,steel,-.065,.04,-.07,'x',8);m.tube(.016,.016,.024,black,-.103,.032,-.07,'x',8)}
  if(heavy){m.box(.095,.075,.1,steel,0,.025,barrelEnd-.02);for(const side of[-1,1])for(let j=0;j<3;j++)p.box(.003,.035,.012,0x192a25,side*.049,.025,barrelEnd-.055+j*.025);for(const side of[-1,1])m.add(new T.CylinderGeometry(.007,.007,.25,6),steel,[side*.04,-.09,.56],[0,0,side*.3])}
  support.set(-.02,-.075,.35);bodyTop=.12;
 }
 else if(family==='ak'){
  const short=/74u/.test(name),sniper=/svd/.test(name),length=short?.59:sniper?1.04:.83;barrelEnd=length;m.profile([[-.15,.065],[.24,.065],[.27,-.03],[.08,-.075],[-.15,-.06]],.085,steel);m.tube(.043,.043,.28,0x536057,0,.066,.02,'z',8);pistolGrip(-.055,0x69503a);trigger(-.03);stock(-.16,.26,true);t.profile([[.24,.03],[.48,.025],[.49,-.055],[.27,-.066]],.08,wood);t.box(.078,.045,.23,shade(wood,1.15),0,.06,.36);barrel((.47+length)/2,length-.47);m.tube(.018,.018,.27,steel,0,.07,.58,'z');m.box(.06,.075,.025,black,0,.078,length-.06);straightMag(.12,true,/rpk/.test(name)?.3:.23);iron(-.1,length-.04,.1);rail(-.09,.18,.108);vents(.26,.48,.035,.042);support.set(-.015,-.065,.35);bodyTop=.11;
 }
 else if(family==='aug'||family==='bullpup'){
  barrelEnd=family==='aug'?.79:.74;if(/famas/.test(name)){m.box(.045,.1,.025,black,0,.14,-.08);m.box(.045,.1,.025,black,0,.14,.22);m.box(.055,.025,.33,black,0,.195,.07);}const color=family==='aug'?0x68755b:0x4b5750;p.profile([[-.3,.065],[.3,.065],[.34,-.025],[.15,-.065],[.08,-.2],[.01,-.19],[-.03,-.07],[-.3,-.13]],.1,color);barrel(.51,barrelEnd*.7);straightMag(-.12,true,.2);trigger(.035);p.box(.11,.2,.023,black,0,-.04,-.3);m.box(.055,.035,.22,steel,0,.1,.12);rail(-.06,.25,.145);iron(-.12,.31,.16);support.set(-.02,-.07,.28);bodyTop=.16;
 }
 else if(family==='pump-shotgun'||family==='tactical-shotgun'||family==='double-shotgun'){
  barrelEnd=/coach/.test(name)?.78:.97;const tactical=family==='tactical-shotgun';m.profile([[-.13,.065],[.2,.065],[.22,-.03],[-.05,-.065],[-.13,-.06]],.085,steel);stock(-.13,.31,!tactical);if(tactical)pistolGrip(-.06);else t.profile([[-.14,-.015],[-.025,-.035],[-.055,-.12],[-.17,-.13]],.065,wood);trigger(-.005);barrel((.18+barrelEnd)/2,barrelEnd-.18,.025);
  if(family==='double-shotgun'){m.tube(.025,.025,barrelEnd-.18,steel,.037,.025,(.18+barrelEnd)/2,'z');hasMag=false;t.box(.09,.055,.22,wood,0,-.025,.35)}
  else{m.tube(.02,.02,.58,steel,0,-.027,.47,'z');const fore=tactical?p:t;fore.box(.094,.072,.26,tactical?polymer:wood,0,-.025,.39);for(let j=0;j<9;j++)fore.box(.098,.008,.008,shade(tactical?polymer:wood,.7),0,-.027,.28+j*.027);hasMag=false}
  iron(-.08,barrelEnd-.03,.1);rail(-.1,.17,.095);support.set(-.015,-.05,.37);bodyTop=.1;
 }
 else if(family==='belt-fed'){
  barrelEnd=1.02;m.box(.13,.115,.39,steel,0,.015,.03);m.box(.145,.03,.24,shade(steel,.8),0,.09,-.02);stock(-.17,.29,/pkm/.test(name));pistolGrip(-.06);trigger(-.04);barrel(.63,.78,.025);p.box(.12,.08,.25,polymer,0,-.035,.38);mag.box(.15,.23,.18,0x69704d,0,-.14,.12);for(let j=0;j<8;j++){const x=-.06-j*.018;m.tube(.009,.009,.052,brass,x,.047,.065,'z',8);m.box(.014,.012,.02,black,x,.047,.046)}m.box(.025,.08,.12,black,0,.14,.24);m.box(.07,.025,.14,steel,0,.19,.24);iron(-.1,.92,.12);rail(-.14,.18,.12);for(const x of[-.037,.037])m.tube(.007,.007,.34,steel,x,-.06,.72,'z',6);support.set(-.03,-.06,.37);bodyTop=.13;magGrip.set(0,-.17,.13);
 }
 else{
  const bolt=family==='bolt-rifle',smg=family==='modern-smg',long=/m16|m14|m82|mk12|fal|g3/.test(name),length=bolt?1.02:long?.94:smg?.57:.79;barrelEnd=length;
  m.profile([[-.14,.067],[.2,.067],[.23,-.015],[.09,-.07],[-.14,-.056]],.083,steel);pistolGrip(-.04);trigger(-.015);stock(-.14,bolt?.32:smg?.2:.26,bolt&&/scout|m24/.test(name));
  const end=smg?.36:bolt?.48:.53;p.box(.092,.083,end-.2,/scar/.test(name)?0x8b825e:bolt?0x697158:polymer,0,.016,(.2+end)/2);if(/g36/.test(name)){p.box(.06,.08,.025,polymer,0,.145,-.09);p.box(.06,.08,.025,polymer,0,.145,.2);p.box(.065,.02,.32,polymer,0,.19,.05)}vents(.22,end-.01,.016,.048);rail(-.13,end,.103);barrel((end+length)/2,length-end);m.tube(.022,.022,.05,edge,0,.025,length-.03,'z');straightMag(.1,false,bolt?.11:smg?.22:.205,smg?black:0x667064);iron(-.11,length-.065,.128);m.box(.012,.04,.065,black,-.046,.018,.08);m.box(.009,.012,.12,0x8a9187,-.051,.02,.08);if(bolt){m.tube(.009,.009,.07,steel,-.077,.05,-.03,'x',8);m.tube(.018,.018,.025,black,-.11,.047,-.03,'x',8)}support.set(-.025,-.055,smg?.26:.34);bodyTop=.13;
 }
 // Attachments only appear when the matching accessory is actually equipped.
 if(!w.melee&&w.id!=='fists'){
  if(mods.muzzle==='suppressor'){const length=small?.19:.25;m.tube(small?.023:.032,small?.023:.032,length,black,0,.025,barrelEnd+length/2,'z',16);m.ring(small?.022:.031,.005,edge,0,.025,barrelEnd+length);barrelEnd+=length}
  if(mods.muzzle==='brake'||mods.muzzle==='choke'){m.tube(.028,.028,.07,steel,0,.025,barrelEnd+.035,'z',12);for(const x of[-.029,.029])for(let j=0;j<3;j++)p.box(.003,.025,.009,0x152420,x,.025,barrelEnd+.012+j*.017);barrelEnd+=.07}
  if(mods.grip==='vertical'||mods.grip==='angled')p.profile([[.31,-.02],[.36,-.02],[.36+(mods.grip==='angled'?.05:0),-.17],[.31,-.17]],.04,black);
  if(mods.grip==='bipod')for(const side of[-1,1])m.add(new T.CylinderGeometry(.006,.006,.25,6),steel,[side*.055,-.12,.49],[0,0,side*.3]);
  if(mods.stock==='light')p.box(.035,.12,.17,0x65715e,0,-.025,-.31);if(mods.stock==='stable')p.box(.105,.065,.16,0x64705d,0,.08,-.26);
  if(mods.optic&&mods.optic!=='none'){
   const scope=mods.optic.startsWith('scope'),y=bodyTop+.085,z=small?.11:.055;for(const at of[scope?z-.07:z,z+.07])m.box(.055,.045,.026,black,0,bodyTop+.025,at);
   if(scope){const len=mods.optic==='scope8'?.32:.24;m.tube(.035,.024,len,black,0,y,z,'z',12);m.ring(.035,.005,edge,0,y,z+len/2);m.ring(.026,.004,edge,0,y,z-len/2);m.tube(.017,.017,.045,edge,0,y+.025,z,'y',8);root.userData.lens={y,z:z+len/2+.003,r:.029}}
   else{m.box(.065,.055,.07,black,0,y-.025,z);m.box(.07,.009,.014,edge,0,y+.025,z+.025);for(const x of[-.034,.034])m.box(.008,.055,.04,black,x,y,z+.025);root.userData.lens={y,z:z+.048,r:.025}}
  }
 }
 for(const[key,batch]of Object.entries(bodies))if(batch.positions.length)root.add(batch.mesh(modelMaterials[key]||modelMaterials.polymer));
 if(hasMag&&mag.positions.length)magazine.add(mag.mesh(modelMaterials.metal));if(action.positions.length)slide.add(action.mesh(modelMaterials.metal));
 if(root.userData.lens){const l=root.userData.lens,mat=new T.MeshStandardMaterial({color:0x477c79,transparent:true,opacity:.55,roughness:.2,metalness:.2,side:T.DoubleSide,depthWrite:false});mat.userData.owned=true;const glass=new T.Mesh(new T.CircleGeometry(l.r,16),mat);glass.position.set(0,l.y,l.z);root.add(glass)}
 const flash=new T.Mesh(new T.ConeGeometry(.055,.18,6),new T.MeshBasicMaterial({color:0xffd896}));flash.material.userData.owned=true;flash.rotation.x=Math.PI/2;flash.position.set(0,.025,barrelEnd+.065);flash.visible=false;root.add(flash);
 root.userData={...root.userData,family,grip,support,magGrip,magazine,slide,flash,muzzle:new T.Vector3(0,.025,barrelEnd),small,melee:!!w.melee,aimHeight:root.userData.lens?.y||bodyTop+.04};return root;
}
export function addFirstPersonArms(root,skin,outfit){
 const group=new T.Group(),d=root.userData;root.add(group);const right=new T.Group(),left=new T.Group();group.add(right,left);
 for(const[side,parent,target,start]of[[-1,right,d.grip,new T.Vector3(.12,-.3,-.28)],[1,left,d.small?new T.Vector3(-.045,-.11,.065):d.support,new T.Vector3(-.22,-.31,-.13)]]){
  const b=new ModelBatch(),end=target.clone();const length=start.distanceTo(end),g=new T.CylinderGeometry(.036,.052,length,8),q=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),end.clone().sub(start).normalize());g.applyQuaternion(q);g.translate(...start.clone().add(end).multiplyScalar(.5).toArray());b.add(g,skin);b.loft([[end.y-.065,.038,.025,end.x,end.z],[end.y,.045,.032,end.x,end.z],[end.y+.045,.035,.027,end.x,end.z]],skin,8);b.box(.025,.054,.035,shade(skin,.85),end.x+side*.035,end.y-.025,end.z+.01);b.box(.09,.08,.09,outfit,start.x,start.y,start.z);parent.add(b.mesh(modelMaterials.cloth));
 }group.visible=false;root.userData.firstPersonArms=group;root.userData.supportArm=left;return group;
}
export function poseWeapon(p,{time=0,firstPerson=false,pitch=0,aim=false,moving=0}={}){
 const gun=p.gunModel;if(!gun)return;const d=gun.userData,age=Math.max(0,(Date.now()-(p.lastAttack||0))/1000),shot=p.lastAttackKind==='gun'?Math.max(0,1-age/.13):0,swing=p.lastAttackKind==='melee'&&age<.55?Math.sin(age/.55*Math.PI):0,reload=p.reloadLeft>0?Math.sin((1-p.reloadLeft/Math.max(.1,p.weapon.reload))*Math.PI):0;
 if(firstPerson&&p.equipment)p.equipment.scale.set(1/p.g.scale.x,1/p.g.scale.y,1/p.g.scale.z);else if(p.equipment)p.equipment.scale.set(1,1,1);if(firstPerson){const eye=(p.crouching?1.26:1.76)*(p.appearance?.height||100)/100;gun.position.set(aim?0:-.19,-(aim?d.aimHeight:.28),aim?.43:.38).applyAxisAngle(new T.Vector3(1,0,0),-pitch);gun.position.y+=eye;gun.rotation.set(-pitch+shot*.04+swing*.85,0,swing*-.2);gun.position.y+=Math.sin(time*7)*moving*.007;gun.position.z-=shot*.045}
 else{gun.position.set(-.12,aim?1.38:d.small?1.25:1.3,.16);gun.rotation.set((aim?0:.15)-pitch*.35+shot*.035+swing*.85,0,swing*-.2);gun.position.y-=reload*.04}
 d.magazine.position.y=-reload*.2;d.magazine.rotation.x=reload*.25;d.slide.position.z=-shot*.035;d.flash.visible=shot>.45&&!p.weapon.melee&&p.weapon.id!=='fists';if(d.firstPersonArms)d.firstPersonArms.visible=firstPerson;if(d.supportArm)d.supportArm.position.y=-reload*.13;
}
export{disposeModel};
