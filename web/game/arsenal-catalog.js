// All values below are fictional game balancing, not real-world specifications.
export const CALIBERS=[['22','.22 LR',40],['25','.25',25],['32','.32',30],['380','.380',30],['9','9 × 19 mm',45],['45','.45 ACP',35],['357','.357',24],['44','.44',20],['57','5,7 × 28 mm',50],['46','4,6 × 30 mm',50],['556','5,56 × 45 mm',40],['762x39','7,62 × 39 mm',35],['762x51','7,62 × 51 mm',30],['762x54','7,62 × 54 mm',25],['762x25','7,62 × 25 mm',35],['9x18','9 × 18 mm',40],['545','5,45 × 39 mm',40],['300','.300 BLK',30],['338','.338',15],['50','.50 BMG',10],['12','Calibre 12',16],['20','Calibre 20',18]].map(([id,name,box])=>({id,name,box}));
export const AMMO_PROFILES=[{id:'standard',name:'Standard',damage:1,range:1,noise:1},{id:'ap',name:'Perforante',damage:1.1,range:1,noise:1,pierce:2},{id:'hp',name:'Expansive',damage:1.35,range:.85,noise:1},{id:'sub',name:'Subsonique',damage:.92,range:.9,noise:.65},{id:'buck',name:'Chevrotine',damage:1,range:1,noise:1,pellets:4},{id:'slug',name:'Balle unique',damage:1.5,range:1.8,noise:1,pellets:1}];
export const profilesFor=caliber=>AMMO_PROFILES.filter(a=>['12','20'].includes(caliber)?['buck','slug'].includes(a.id):!['buck','slug'].includes(a.id));
export const AMMUNITION=CALIBERS.flatMap(c=>profilesFor(c.id).map(p=>({key:c.id+':'+p.id,caliber:c.id,name:c.name+' · '+p.name,box:c.box,profile:p.id})));
const extra=`
P226;pistol;9;15
P228;pistol;9;13
USP 45;pistol;45;12
P2000;pistol;9;13
CZ 75;pistol;9;16
Hi-Power;pistol;9;13
PPK;pistol;380;7
G19;pistol;9;15
G21;pistol;45;13
Five-seveN;pistol;57;20
PM;pistol;9x18;8
TT-33;pistol;762x25;8
P22;pistol;22;10
Pocket 25;pistol;25;6
P32;pistol;32;7
Model 36;revolver;357;5
Python;revolver;357;6
Model 29;revolver;44;6
Model 686;revolver;357;6
Single Action;revolver;45;6
MP7;smg;46;40
UMP 45;smg;45;25
Vector;smg;45;30
MAC-10;smg;45;30
MP40;smg;9;32
PP-19;smg;9;53
Thompson;smg;45;30
Scorpion;smg;9;20
MPX;smg;9;30
Sterling;smg;9;34
M16A2;rifle;556;30
HK416;rifle;556;30
G36;rifle;556;30
AUG;bullpup;556;30
FAMAS;bullpup;556;25
SCAR-L;rifle;556;30
SCAR-H;rifle;762x51;20
AK-74;rifle;545;30
AKS-74U;rifle;545;30
FAL;rifle;762x51;20
G3;rifle;762x51;20
SKS;rifle;762x39;10
Mini-14;rifle;556;20
MCX;rifle;300;30
ACR;rifle;556;30
Remington 870;shotgun;12;7
SPAS-12;shotgun;12;8
Saiga-12;shotgun;12;10
Double Barrel;shotgun;12;2
M590;shotgun;12;8
Coach 20;shotgun;20;2
M24;marksman;762x51;5
SVD;marksman;762x54;10
L96;marksman;338;5
M82;marksman;50;10
Scout;marksman;762x51;10
MK12;marksman;556;20
M60;lmg;762x51;100
PKM;lmg;762x54;100
RPK;lmg;762x39;75
`;
const baseStats={pistol:[1.45,25,.32,1.6],revolver:[2.5,26,.5,2.8],smg:[1.05,28,.11,2],rifle:[2.3,39,.16,2.4],bullpup:[2.1,36,.14,2.6],shotgun:[3.3,16,.75,3],marksman:[4.6,52,.9,3.2],lmg:[2,41,.12,4.6]};
export const EXTRA_WEAPONS=extra.trim().split('\n').map((row,i)=>{const [name,shape,caliber,mag]=row.split(';'),[damage,range,interval,reload]=baseStats[shape];return {id:'gun-'+i,name,type:{pistol:'Pistolet',revolver:'Revolver',smg:'Pistolet-mitrailleur',rifle:'Fusil',bullpup:'Bullpup',shotgun:'Fusil de chasse',marksman:'Précision',lmg:'Mitrailleuse'}[shape],shape,caliberId:caliber,caliber:CALIBERS.find(c=>c.id===caliber).name,mag:Number(mag),reserve:Number(mag)*4,damage,range,interval,reload,auto:['smg','rifle','bullpup','lmg'].includes(shape),color:[0x465247,0x82735a,0x4b5353,0x805b42][i%4],...(shape==='shotgun'?{pellets:4}:{})}});
export const EXTRA_ARMORS=[
 ['leather','Veste renforcée',.12,35,.99,0x72513b],['kevlar','Gilet discret',.32,75,.96,0x525c55],['press','Gilet de reporter',.38,85,.94,0x3c5d7f],['police','Gilet de patrouille',.42,95,.93,0x39484b],['ranger','Ensemble reconnaissance',.48,110,.9,0x77815c],['recon','Porte-plaques léger',.52,115,.91,0x8d8466],['assault','Gilet d’assaut',.64,145,.82,0x5f6e50],['riot','Tenue anti-émeute',.68,160,.78,0x344149],['marine','Ensemble amphibie',.56,125,.86,0x607771],['medic','Protection secouriste',.46,105,.91,0x978d71],['jugger','Tenue blindée',.8,200,.64,0x636957],['eod','Ensemble démineur',.9,250,.48,0x76826b]
].map(([id,name,reduction,durability,mobility,color])=>({id,name,reduction,durability,mobility,color,helmet:reduction>=.42,visor:['riot','jugger','eod'].includes(id),heavy:['jugger','eod'].includes(id),desc:'Protection '+Math.round(reduction*100)+' % · mobilité '+Math.round(mobility*100)+' % · résistance '+durability+'.'}));
const outfits=`
civil;T-shirt & jean;586b72;384a5c;1;1;0
hood;Sweat urbain;5d6372;3d454e;.99;1;0
leather;Blouson de route;6c4e3c;344448;.98;1;.1
sport;Survêtement;426e7c;354f5c;1.06;1;0
work;Tenue de mécanicien;697157;4c5748;.97;1;.2
denim;Ensemble denim;526f8a;3e5870;1;1;.1
hunter;Tenue de chasse;6f7150;515c3d;.98;.85;.15
olive;Treillis olive;657452;4e5b3e;.98;.9;.2
woodland;Treillis forêt;526640;3c5135;.97;.8;.2
desert;Treillis désert;b2a075;8b815c;.97;.92;.2
urban;Treillis urbain;68767c;4e5964;.98;.9;.2
snow;Tenue alpine;c0c5b4;8e9e9d;.95;1;.2
navy;Tenue marine;3f5361;344853;.98;.95;.2
black;Tenue noire;303d3c;253331;.99;.86;.15
scout;Tenue d’éclaireur;7b8467;54624d;1.04;.83;.1
medic;Tenue secouriste;ae9b79;6c775c;.98;1;.25
fire;Tenue de pompier;97845f;6c654b;.86;1;.2
police;Uniforme patrouille;44576b;35475b;1;1;.1
swat;Uniforme intervention;354751;2b3d45;.97;.9;.2
rain;Imperméable;9f9652;55644e;.96;1;.1
winter;Parka d’hiver;697e78;4d6058;.89;.95;.3
nomad;Ensemble nomade;9d8e70;6d7057;.96;.93;.4
ghillie;Tenue de camouflage;687547;4d6035;.84;.65;.1
cargo;Tenue cargo;8a8368;626c52;.96;.95;.5
`;
export const CLOTHES=outfits.trim().split('\n').map(row=>{const [id,name,top,pants,mobility,visibility,reserveBonus]=row.split(';');return {id,name,top:parseInt(top,16),pants:parseInt(pants,16),mobility:Number(mobility),visibility:Number(visibility),reserveBonus:Number(reserveBonus)}});
export const MODS={
 optic:[{id:'none',name:'Visée mécanique'},{id:'red',name:'Point rouge',range:1.1},{id:'holo',name:'Viseur holographique',range:1.16},{id:'scope4',name:'Lunette ×4',range:1.3,interval:1.05},{id:'scope8',name:'Lunette ×8',range:1.5,interval:1.15}],
 muzzle:[{id:'none',name:'Canon d’origine'},{id:'suppressor',name:'Silencieux',noise:.35,damage:.94,range:.95},{id:'brake',name:'Frein de bouche',interval:.9,noise:1.2},{id:'choke',name:'Choke',range:1.2,pellets:3}],
 grip:[{id:'none',name:'Sans poignée'},{id:'vertical',name:'Poignée verticale',interval:.9},{id:'angled',name:'Poignée inclinée',interval:.95,mobility:1.02},{id:'bipod',name:'Bipied',range:1.12,interval:1.05,mobility:.96}],
 magazine:[{id:'none',name:'Chargeur standard'},{id:'extended',name:'Chargeur étendu',mag:1.5,reload:1.15},{id:'drum',name:'Chargeur tambour',mag:2,reload:1.4,mobility:.94}],
 stock:[{id:'none',name:'Crosse d’origine'},{id:'light',name:'Crosse légère',mobility:1.04,range:.96},{id:'stable',name:'Crosse stabilisée',range:1.08,interval:.95,mobility:.98}]
};
export function compatibleMods(w,slot){return MODS[slot].filter(m=>{if(m.id==='none')return true;const small=['pistol','revolver'].includes(w.shape);if(slot==='optic')return !small||['red','holo'].includes(m.id)&&w.shape!=='revolver';if(slot==='muzzle'){if(m.id==='choke')return w.shape==='shotgun';if(m.id==='suppressor')return !['shotgun','revolver'].includes(w.shape);return !small}if(slot==='magazine')return !['revolver','shotgun'].includes(w.shape)&&(m.id!=='drum'||['smg','rifle','bullpup','lmg'].includes(w.shape));return !small})}
export function configureWeapon(base,loadout={}){const w={...base,noise:65,mobility:1,pierce:1,mods:{}};const valid=profilesFor(w.caliberId);const ammo=valid.find(a=>a.id===loadout.ammo)||valid[0];w.ammoProfile=ammo.id;w.ammoName=ammo.name;w.ammoKey=w.caliberId+':'+ammo.id;w.damage*=ammo.damage;w.range*=ammo.range;w.noise*=ammo.noise;w.pierce=ammo.pierce||1;if(ammo.pellets)w.pellets=ammo.pellets===1?undefined:ammo.pellets;
 for(const slot of Object.keys(MODS)){const mod=compatibleMods(base,slot).find(m=>m.id===loadout[slot])||MODS[slot][0];w.mods[slot]=mod.id;for(const stat of ['damage','range','interval','reload','mobility','noise'])w[stat]*=mod[stat]||1;if(mod.mag)w.mag=Math.round(w.mag*mod.mag);if(mod.pellets&&w.pellets)w.pellets=mod.pellets}return w}
