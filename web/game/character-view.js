import * as T from './vendor/three.module.js';
import{normalizeAppearance,OUTFIT_COLORS}from'./appearance.js';
import{createHumanoid,setHumanoidAppearance,rebuildHumanoid,animateHumanoid}from'./humanoid.js';
export function applyCharacterAppearance(p,raw){setHumanoidAppearance(p,raw)}
export function createCharacterPreview(canvas){
 let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true})}catch{return{update(){},open(){}}}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,30);camera.position.set(2.2,1.65,4.15);camera.lookAt(0,1.04,0);scene.add(new T.HemisphereLight(0xe6ebde,0x485642,2.3));const light=new T.DirectionalLight(0xffdfb0,3);light.position.set(-3,6,4);light.castShadow=true;light.shadow.mapSize.set(256,256);scene.add(light);
 const p=createHumanoid();scene.add(p.g);const base=new T.Mesh(new T.CylinderGeometry(.68,.72,.05,40),new T.MeshStandardMaterial({color:0x37463b,roughness:.9}));base.position.y=-.05;base.receiveShadow=true;scene.add(base);
 let yaw=-.1,drag=null,scheduled=false,stamp=0;
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,yaw};canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(drag)yaw=drag.yaw+(e.clientX-drag.x)*.012});canvas.addEventListener('pointerup',()=>drag=null);
 function draw(now){scheduled=false;if(!canvas.closest('dialog')?.open)return;if(now-stamp>40){const r=canvas.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}p.g.rotation.y=yaw;animateHumanoid(p,{time:now/1000,dt:Math.min(.06,(now-stamp)/1000)});renderer.render(scene,camera);stamp=now}scheduled=true;requestAnimationFrame(draw)}
 function open(){if(!scheduled){scheduled=true;requestAnimationFrame(draw)}}
 return{open,update(raw){const a=normalizeAppearance(raw);p.rig.outfit={id:'civil',...OUTFIT_COLORS[a.outfit]};setHumanoidAppearance(p,a);open()}};
}
