export const SKIN_COLORS=[0xe8c7a5,0xd1ae83,0xc49364,0xa47751,0x805535,0x593b2c];
export const HAIR_COLORS=[0x63432e,0x292722,0xc7ad65,0xa65b31,0x777c7b,0xe1dfce];
export const OUTFIT_COLORS=[{name:'Ardoise',top:0x586b72,pants:0x384a5c},{name:'Bordeaux',top:0x794f51,pants:0x343c45},{name:'Sable',top:0x9b8a6d,pants:0x4f5848},{name:'Vert forêt',top:0x4b6a57,pants:0x3c4547},{name:'Ivoire',top:0xc8c1ab,pants:0x45526b}];
const integer=(value,min,max,fallback)=>Number.isFinite(Number(value))?Math.max(min,Math.min(max,Math.round(Number(value)))):fallback;
const pick=(value,choices,fallback)=>choices.includes(value)?value:fallback;
export function normalizeAppearance(raw={}){
 raw=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return{skin:integer(raw.skin,0,5,1),hair:integer(raw.hair,0,5,0),hairstyle:pick(raw.hairstyle,['short','long','ponytail','shaved'],raw.hair===4?'shaved':'short'),beard:pick(raw.beard,['none','stubble','full'],'none'),body:pick(raw.body,['standard','slim','broad'],'standard'),height:integer(raw.height,90,110,100),age:integer(raw.age,18,80,28),outfit:integer(raw.outfit,0,OUTFIT_COLORS.length-1,0)};
}
export function bodyScale(raw){const a=normalizeAppearance(raw);return{x:a.body==='broad'?1.15:a.body==='slim'?.87:1,y:a.height/100}}
