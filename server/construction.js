import {panelEnds,validPanel} from '../web/game/construction.js';import {segmentDistance} from '../web/game/housing.js';
export function createConstruction({housing,rules,announce,drop}){
 const init=w=>{w.construction||={panels:[],removed:[],revision:0};housing.setConstruction(w.construction);return w.construction};
 const refund=(w,p,n)=>{const item=rules.item('buildingMaterials',n);try{rules.addItem(p,item)}catch{drop(w,p,[item],'Matériaux de construction')}};
 const house=p=>housing.insideHouse(p.x,p.z);
 const reach=(p,q)=>Math.hypot(q[0]-p.x,q[1]-p.z)<=4;
 function view(w,p){const s=init(w),h=house(p);if(!h)return null;const floor=p.floor||0;return{house:h.id,floor,poly:h.poly.map(q=>h.local(...q)),player:h.local(p.x,p.z),stairs:h.stairs,partitions:h.partitions.map((seg,i)=>({id:i,a:h.local(...seg.a),b:h.local(...seg.b)})).filter(seg=>!s.removed.includes(`${h.id}:${floor}:${seg.id}`)),panels:s.panels.filter(v=>v.house===h.id&&v.floor===floor),revision:s.revision}}
 function command(w,p,c){if(!c||!['buildPanel','removePanel','removePartition','togglePanel'].includes(c.type))return false;try{
  const s=init(w),h=house(p),floor=p.floor||0;if(!h||p.hp<=0||p.seated)throw Error('Entre dans une maison pour effectuer des travaux.');if(c.type!=='togglePanel'&&!rules.has(p,'toolkit'))throw Error('Une caisse à outils est nécessaire.');
  if(c.type==='buildPanel'){
   if(!['wall','door','window'].includes(c.kind)||!['u','v'].includes(c.axis)||!Number.isFinite(c.u)||!Number.isFinite(c.v))throw Error('Placement invalide.');
   const q={id:crypto.randomUUID(),house:h.id,floor,u:Math.round(c.u*2)/2,v:Math.round(c.v*2)/2,axis:c.axis,kind:c.kind,open:false};const pos=h.point(q.u,q.v),ends=panelEnds(h,q);
   if(!reach(p,pos)||!validPanel(h,q))throw Error('Choisis un emplacement intérieur à moins de 4 m.');
   if(s.panels.length>=4096||s.panels.filter(x=>x.house===h.id&&x.floor===floor).length>=64)throw Error('Limite de travaux atteinte pour ce niveau.');
   if([...w.players,...w.zombies].some(a=>a.hp>0&&(a.floor||0)===floor&&segmentDistance(a.x,a.z,...ends)<.75))throw Error('Un personnage occupe cet emplacement.');
   if(h.stairs&&[h.stairs.bottom,h.stairs.top,h.point(h.stairs.u,(h.stairs.start+h.stairs.end)/2)].some(a=>segmentDistance(...a,...ends)<1.2))throw Error('Laisse l’escalier et ses paliers dégagés.');
   for(let t=0;t<=1;t+=.1){const x=ends[0][0]*(1-t)+ends[1][0]*t,z=ends[0][1]*(1-t)+ends[1][1]*t;if(housing.blocked(x,z,.15,{floor,houseId:h.id}))throw Error('Un mur, un meuble ou une cloison occupe cet emplacement.');}
   if(q.kind==='door'&&[-.8,0,.8].some(t=>{const a=h.point(q.u+(q.axis==='v'?t:0),q.v+(q.axis==='u'?t:0));return housing.blocked(...a,.55,{floor,houseId:h.id})}))throw Error('Laisse un passage libre de chaque côté de la porte.');
   const cost=c.kind==='wall'?2:3,stock=p.bag.filter(i=>i.def==='buildingMaterials');if(stock.reduce((n,i)=>n+i.qty,0)<cost)throw Error(`Il faut ${cost} lots de matériaux récupérés.`);let remaining=cost;for(const i of stock){const n=Math.min(i.qty,remaining);rules.remove(p,i,n);remaining-=n;if(!remaining)break}s.panels.push(q);announce(p,'Élément construit et sauvegardé.');
  }else if(c.type==='removePartition'){
   const i=Number(c.partition),key=`${h.id}:${floor}:${i}`,seg=h.partitions[i];if(!Number.isInteger(i)||!seg||s.removed.includes(key)||segmentDistance(p.x,p.z,seg.a,seg.b)>4)throw Error('Approche-toi de cette cloison.');s.removed.push(key);refund(w,p,2);announce(p,'Cloison démontée · 2 lots de matériaux récupérés.');
  }else{const q=s.panels.find(q=>q.id===c.panel&&q.house===h.id&&q.floor===floor);if(!q||!reach(p,h.point(q.u,q.v)))throw Error('Approche-toi de cet élément.');if(c.type==='togglePanel'){if(q.kind!=='door')throw Error('Cet élément n’est pas une porte.');if(q.open&&[...w.players,...w.zombies].some(a=>a.hp>0&&(a.floor||0)===floor&&segmentDistance(a.x,a.z,...panelEnds(h,q))<.75))throw Error('Le passage est occupé.');q.open=!q.open}else{s.panels=s.panels.filter(x=>x!==q);refund(w,p,q.kind==='wall'?2:3);announce(p,'Élément démonté · matériaux récupérés.')}}
  s.revision++;housing.setConstruction(s);
 }catch(e){announce(p,e.message)}return true}
 function nearby(w,p){const s=init(w);if(!p)return{panels:[],removed:[]};const ids=new Set(housing.near(p.x,p.z,100).map(h=>h.id));return{revision:s.revision,panels:s.panels.filter(q=>ids.has(q.house)),removed:s.removed.filter(key=>ids.has(Number(key.split(':')[0])))}}
 function interact(w,p){const s=init(w),q=s.panels.filter(q=>q.kind==='door'&&q.floor===(p.floor||0)&&reach(p,housing.byId.get(q.house).point(q.u,q.v))).sort((a,b)=>{const pa=housing.byId.get(a.house).point(a.u,a.v),pb=housing.byId.get(b.house).point(b.u,b.v);return Math.hypot(pa[0]-p.x,pa[1]-p.z)-Math.hypot(pb[0]-p.x,pb[1]-p.z)})[0];if(!q)return false;const a=housing.byId.get(q.house).point(q.u,q.v);if(Math.hypot(a[0]-p.x,a[1]-p.z)>1.8)return false;return command(w,p,{type:'togglePanel',panel:q.id})}
 return{init,view,command,nearby,interact};
}
