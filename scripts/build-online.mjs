import fs from 'node:fs';import path from 'node:path';
import {VEHICLES} from '../web/game/vehicles.js';
import {WEAPONS,ARMORS} from '../web/game/equipment.js';
const root=path.resolve('.'),dist=path.join(root,'dist');
// Only generated output within this checkout is replaced.
if(path.dirname(dist)!==root)throw Error('Dossier de construction invalide');
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(path.join(dist,'server'),{recursive:true});fs.mkdirSync(path.join(dist,'.openai'),{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.txt':'text/plain; charset=utf-8','.woff2':'font/woff2'};
const assets={};function add(dir,base=''){for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),key=base+'/'+name;if(fs.statSync(p).isDirectory())add(p,key);else assets[key]=[mime[path.extname(name)]||'application/octet-stream',fs.readFileSync(p).toString('base64')]}}add(path.join(root,'web'));
const map=JSON.parse(fs.readFileSync('web/game/hazebrouck-map.json','utf8'));const catalog={vehicles:VEHICLES.map(({id,name,speed,accel,turn,burn,shape})=>({id,name,speed,accel,turn,burn,shape})),weapons:WEAPONS,armors:ARMORS};
const arsenal=fs.readFileSync('web/game/arsenal-catalog.js','utf8').replace(/\bexport /g,'');
const world=fs.readFileSync('server/world.js','utf8').replace('export function createWorldService','function createWorldService');
const entry=fs.readFileSync('server/entry.js','utf8');
const source=`const ASSETS=${JSON.stringify(assets)};\nconst MAP=${JSON.stringify(map)};\nconst CATALOG=${JSON.stringify(catalog)};\n${arsenal}\n${world}\n${entry}`;
fs.writeFileSync(path.join(dist,'server/index.js'),source);fs.copyFileSync('.openai/hosting.json',path.join(dist,'.openai/hosting.json'));console.log(`Serveur construit : ${(source.length/1048576).toFixed(2)} Mo, ${Object.keys(assets).length} ressources intégrées.`);
