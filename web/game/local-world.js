import {createLocalService} from './local-engine.js';
export class LocalWorld{
 constructor(options,map){Object.assign(this,options);this.service=createLocalService(map);this.commands=[];this.connected=false;this.lastState=0;this.delay=0;this.local=true}
 saved(){try{return JSON.parse(localStorage.getItem('dh-survival-solo')||'null')}catch{return null}}
 hasSurvivor(){return this.saved()?.players?.some(p=>p.hp>0)}
 async connect(body={}){this.disconnect();const saved=this.saved();if(saved?.survivalVersion===1&&saved.players?.[0]?.hp>0){this.world=saved;this.player=saved.players[0];this.world.clock=Date.now();this.player.seen=this.player.inputAt=Date.now();this.player.input={x:0,z:0,yaw:0}}else{const fresh=this.service.startLocal(body);this.world=saved?.survivalVersion===1?saved:fresh.world;this.player=fresh.player;this.world.players=[this.player];this.world.clock=Date.now()}this.connected=true;this.lastSave=0;this.loop();return this.service.snapshot(this.world,this.player,Date.now())}
 command(command){if(this.connected&&this.commands.length<12)this.commands.push(command)}
 loop(){if(!this.connected)return;const now=Date.now(),p=this.player;p.seen=now;p.inputAt=now;p.input=this.readInput();this.service.step(this.world,now);for(const command of this.commands.splice(0))this.service.command(this.world,p,command,now);this.lastState=performance.now();const snapshot=this.service.snapshot(this.world,p,now);this.onState(snapshot);this.onStatus('connected',snapshot);if(now-this.lastSave>3000){this.save();this.lastSave=now}this.timer=setTimeout(()=>this.loop(),100)}
 save(){if(this.world)try{localStorage.setItem('dh-survival-solo',JSON.stringify(this.world))}catch{}}
 disconnect(){clearTimeout(this.timer);this.save();this.connected=false;this.commands=[]}
}
