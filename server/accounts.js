import {scryptAsync} from '@noble/hashes/scrypt.js';
const encoder=new TextEncoder(),hex=b=>Array.from(b,n=>n.toString(16).padStart(2,'0')).join('');
const digest=async s=>hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(s))));
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status})};
let queue=Promise.resolve(),queued=0;
async function derive(password,salt){
 if(queued>=4)fail('Connexions occupées. Réessaie dans quelques secondes.',429);queued++;
 const before=queue;let release;queue=new Promise(resolve=>{release=resolve});await before;
 try{return hex(await scryptAsync(password,salt,{N:32768,r:8,p:3,dkLen:32,maxmem:36*1024*1024,asyncTick:8}))}finally{queued--;release()}
}
function equal(a,b){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}
export function createAccountService(world){
 async function authenticate(request,db){const token=(request.headers.get('Authorization')||'').replace(/^Bearer /,'');if(!/^[0-9a-f]{64}$/.test(token))fail('Connecte-toi à ton compte.',401);const row=await db.prepare('SELECT a.id,a.username,s.expires FROM account_sessions s JOIN accounts a ON a.id=s.account_id WHERE s.token_hash=? AND s.expires>?').bind(await digest(token),Date.now()).first();if(!row)fail('Ta connexion a expiré. Reconnecte-toi.',401);return row}
 async function limit(db,request,scope,max,window=900000){const now=Date.now(),key='auth:'+await digest(scope+':'+(request.headers.get('CF-Connecting-IP')||'local')+':'+Math.floor(now/window));const row=await db.prepare('INSERT INTO join_limits (key,count,expires) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count').bind(key,now+window).first();if(row.count>max)fail('Trop de tentatives. Réessaie un peu plus tard.',429)}
 async function session(db,user){const token=hex(crypto.getRandomValues(new Uint8Array(32))),expires=Date.now()+30*86400000;await db.prepare('INSERT INTO account_sessions (token_hash,account_id,expires) VALUES (?,?,?)').bind(await digest(token),user.id,expires).run();await db.prepare('DELETE FROM account_sessions WHERE expires<?').bind(Date.now()).run();return{token,expires,user:{username:user.username},character:await world.characterProfile(db,user.id)}}
 async function handle(request,db){
  const path=new URL(request.url).pathname;if(path==='/api/account/me'){const user=await authenticate(request,db);return{user:{username:user.username},expires:user.expires,character:await world.characterProfile(db,user.id)}}
  if(request.method!=='POST')fail('Méthode non autorisée.',405);if(Number(request.headers.get('content-length')||0)>4096)fail('Données trop volumineuses.',413);let text='';if(request.body){const reader=request.body.getReader(),decoder=new TextDecoder();let total=0;while(true){const chunk=await reader.read();if(chunk.done)break;total+=chunk.value.length;if(total>4096){await reader.cancel();fail('Données trop volumineuses.',413)}text+=decoder.decode(chunk.value,{stream:true})}text+=decoder.decode()}if(text.length>4096)fail('Données trop volumineuses.',413);let body;try{body=JSON.parse(text)}catch{fail('Données invalides.')}
  if(path==='/api/account/register'||path==='/api/account/login'){
   await limit(db,request,'login',60);const username=typeof body.username==='string'?body.username.trim().toLowerCase():'';const password=typeof body.password==='string'?body.password:'';
   if(!/^[a-z0-9_]{3,20}$/.test(username))fail('Identifiant : 3 à 20 lettres, chiffres ou tirets bas.');if(password.length<12||password.length>64||encoder.encode(password).length>256)fail('Mot de passe : entre 12 et 64 caractères.');
   const accountKey='account:'+await digest(username);await limit(db,{headers:new Headers({'CF-Connecting-IP':accountKey})},'attempt',12);
   let user=await db.prepare('SELECT id,username,password_hash FROM accounts WHERE username=?').bind(username).first();
   if(path.endsWith('/register')){
    await limit(db,request,'register',8,3600000);if(user)fail('Cet identifiant est déjà utilisé.',409);
    const salt=hex(crypto.getRandomValues(new Uint8Array(16))),hash=await derive(password,salt);user={id:crypto.randomUUID(),username};
    const result=await db.prepare('INSERT OR IGNORE INTO accounts (id,username,password_hash,created) VALUES (?,?,?,?)').bind(user.id,username,'scrypt$32768$8$3$'+salt+'$'+hash,Date.now()).run();if(!result.meta.changes)fail('Cet identifiant est déjà utilisé.',409);
   }else{
    const stored=user?.password_hash?.split('$'),valid=stored?.length===6&&stored.slice(0,4).join('$')==='scrypt$32768$8$3'&&/^[0-9a-f]{32}$/.test(stored[4])&&/^[0-9a-f]{64}$/.test(stored[5]);
    const computed=await derive(password,valid?stored[4]:'00000000000000000000000000000000');if(!user||!valid||!equal(computed,stored[5]))fail('Identifiant ou mot de passe incorrect.',401);
   }
   return session(db,user);
  }
  const user=await authenticate(request,db);
  if(path==='/api/account/logout'){const token=request.headers.get('Authorization').slice(7);await db.prepare('DELETE FROM account_sessions WHERE token_hash=?').bind(await digest(token)).run();await world.disconnectAccount(db,user.id);return{ok:true}}
  if(path==='/api/account/character'){await limit(db,request,'character',40);return{user:{username:user.username},expires:user.expires,character:await world.createCharacter(db,user.id,body)}}
  fail('Introuvable.',404);
 }
 return{handle,authenticate};
}
