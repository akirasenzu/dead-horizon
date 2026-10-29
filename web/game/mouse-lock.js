export function setupMouseLock({canvas,canPlay,isPlaying,onResume,onLost,onMove}){
  const panel=document.getElementById('mouse-lock'),button=document.getElementById('mouse-lock-button'),message=document.getElementById('mouse-lock-message');
  let pending=false,attempt=0;
  const locked=()=>document.pointerLockElement===canvas;
  function sync(){
    const show=isPlaying()&&!document.querySelector('dialog[open]')&&!locked();
    if(panel.hidden===show)panel.hidden=!show;
    document.body.classList.toggle('mouse-captured',locked());
    if(button.disabled!==pending)button.disabled=pending;
  }
  function release(){attempt++;pending=false;if(locked())document.exitPointerLock();sync()}
  function failed(id){if(id!==attempt)return;pending=false;message.textContent='La souris n’a pas été capturée. Cliquez à nouveau. Si ce navigateur refuse, ouvrez le jeu dans Chrome ou Edge.';sync()}
  function capture(){
    if(!canPlay()){sync();return}
    if(locked()){sync();return}
    if(pending)return;
    const id=++attempt;pending=true;message.textContent='Cliquez pour capturer la souris. Échap la libère et met le jeu en pause.';sync();
    if(!canvas.requestPointerLock){failed(id);return}
    try{const result=canvas.requestPointerLock();if(result?.catch)result.catch(error=>{console.warn('Capture souris :',error.name,error.message);failed(id)});setTimeout(()=>{if(id===attempt&&!locked())failed(id)},2000)}catch(error){console.warn('Capture souris :',error.name,error.message);failed(id)}
  }
  document.addEventListener('pointerlockchange',()=>{
    attempt++;pending=false;
    if(locked()&&!canPlay()){document.exitPointerLock();sync();return}
    if(!locked()&&canPlay())onLost();
    sync();
  });
  document.addEventListener('pointerlockerror',()=>failed(attempt));
  document.addEventListener('mousemove',e=>{if(locked()&&canPlay())onMove(e)});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('click',()=>{if(canPlay())capture()});
  button.addEventListener('click',()=>{onResume();capture()});
  for(const dialog of document.querySelectorAll('dialog')){
    new MutationObserver(()=>{if(dialog.open)release();else sync()}).observe(dialog,{attributes:true,attributeFilter:['open']});
    dialog.addEventListener('close',()=>sync());
  }
  sync();
  return {capture,release,locked,sync};
}
