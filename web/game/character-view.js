import * as T from './vendor/three.module.js';
import{normalizeAppearance,bodyScale,SKIN_COLORS,HAIR_COLORS,OUTFIT_COLORS}from'./appearance.js';
export function applyCharacterAppearance(p,raw,material){
 const a=normalizeAppearance(raw),signature=JSON.stringify(a);if(p.lookSignature===signature)return;p.lookSignature=signature;p.appearance=a;
 const scale=bodyScale(a);p.g.scale.set(scale.x,scale.y,scale.x);p.head.material=material(SKIN_COLORS[a.skin]);p.hair.material=material(HAIR_COLORS[a.hair]);p.hair.visible=a.hairstyle!=='shaved';
 if(p.face){p.g.remove(p.face);p.face.traverse(o=>o.geometry?.dispose())}p.face=new T.Group();p.g.add(p.face);
 const box=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);m.castShadow=true;p.face.add(m);return m};
 const hair=HAIR_COLORS[a.hair],skin=SKIN_COLORS[a.skin];
 for(const x of[-.1,.1])box(.055,.035,.028,0x292e2b,x,1.86,.235);box(.065,.07,.055,skin,0,1.78,.24);box(.21,.12,.22,skin,0,1.56,0);
 if(a.hairstyle==='long'){box(.49,.42,.17,hair,0,1.8,-.2);for(const x of[-.23,.23])box(.07,.36,.4,hair,x,1.83,-.04)}
 if(a.hairstyle==='ponytail'){box(.3,.24,.17,hair,0,1.9,-.27);box(.18,.36,.18,hair,0,1.65,-.3)}
 if(a.beard!=='none')box(.4,a.beard==='full'?.25:.11,a.beard==='full'?.14:.06,hair,0,a.beard==='full'?1.62:1.69,.2);
 for(const x of[-.46,.46])box(.19,.17,.24,skin,x,.69,.015);for(const x of[-.2,.2])box(.26,.13,.4,0x262f2c,x,.03,.055);
}
export function createCharacterPreview(canvas){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true})}catch{return{update(){},open(){}}}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,30);camera.position.set(3,2.1,5.2);camera.lookAt(0,1.1,0);scene.add(new T.HemisphereLight(0xe6ebde,0x485642,2.3));const light=new T.DirectionalLight(0xffdfb0,3);light.position.set(-3,6,4);light.castShadow=true;light.shadow.mapSize.set(256,256);scene.add(light);
 const materials=new Map(),mat=color=>{if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.86}));return materials.get(color)};
 const g=new T.Group();scene.add(g);const box=(w,h,d,c,x,y,z)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);m.castShadow=true;g.add(m);return m};
 const body=box(.65,.9,.4,0x586b72,0,1.1,0),head=box(.45,.45,.45,0xd1ae83,0,1.83,0),hair=box(.47,.13,.47,0x63432e,0,2.04,0),legs=[box(.23,.8,.28,0x384a5c,-.2,.35,0),box(.23,.8,.28,0x384a5c,.2,.35,0)],arms=[box(.19,.8,.24,0x586b72,-.46,1.1,0),box(.19,.8,.24,0x586b72,.46,1.1,0)];
 const p={g,body,head,hair,legs},base=new T.Mesh(new T.CylinderGeometry(1,1,.05,40),mat(0x37463b));base.position.y=-.1;base.receiveShadow=true;scene.add(base);
 let yaw=-.1,drag=null,scheduled=false,stamp=0;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(drag)yaw=drag.yaw+(e.clientX-drag.x)*.012});canvas.addEventListener('pointerup',()=>drag=null);
 function draw(now){scheduled=false;if(!canvas.closest('dialog')?.open)return;if(now-stamp>40){const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}g.rotation.y=yaw;renderer.render(scene,camera);stamp=now}scheduled=true;requestAnimationFrame(draw)}
 function open(){if(!scheduled){scheduled=true;requestAnimationFrame(draw)}}
 return{open,update(raw){const a=normalizeAppearance(raw),outfit=OUTFIT_COLORS[a.outfit];applyCharacterAppearance(p,a,mat);body.material=mat(outfit.top);for(const arm of arms)arm.material=mat(outfit.top);for(const leg of legs)leg.material=mat(outfit.pants);open()}};
}
