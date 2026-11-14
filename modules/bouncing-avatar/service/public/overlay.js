'use strict';
(()=>{const stage=document.getElementById('stage'),avatar=document.getElementById('avatar'),motion=AvatarMotion,state=motion.create();let enabled=false,colour=true,url='',frame=null,started=false,revision=-1,pending=false,closed=false,controller;
 const bounds=()=>({width:stage.clientWidth,height:stage.clientHeight,avatarWidth:avatar.offsetWidth,avatarHeight:avatar.offsetHeight});
 function appearance(){avatar.style.transform=`translate3d(${state.x}px, ${state.y}px, 0)`;avatar.style.filter=`hue-rotate(${colour?state.hue:0}deg) drop-shadow(0 0 18px rgba(255, 255, 255, 0.35))`;}
 function stop(){if(frame!==null)cancelAnimationFrame(frame);frame=null;started=false;state.lastFrameTime=null;avatar.hidden=true;}
 function clear(){stop();url='';avatar.removeAttribute('src');}
 function animate(time){frame=null;if(!enabled||avatar.hidden||!avatar.naturalWidth)return;motion.step(state,time,bounds(),colour);appearance();frame=requestAnimationFrame(animate);}
 function start(){if(!enabled||!url||!avatar.complete||!avatar.naturalWidth||closed)return;avatar.hidden=false;if(!started){started=true;motion.centre(state,bounds());}else motion.clamp(state,bounds());appearance();if(frame===null)frame=requestAnimationFrame(animate);}
 avatar.onload=start;avatar.onerror=()=>{stop();};window.addEventListener('resize',()=>{motion.clamp(state,bounds());appearance();});
 async function refresh(){if(pending||closed)return;pending=true;controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),1500);try{const response=await fetch('/api/avatar/state',{cache:'no-store',signal:controller.signal});if(!response.ok)throw Error();const next=await response.json();if(closed||!Number.isSafeInteger(next.revision)||next.revision<revision)return;revision=next.revision;enabled=next.enabled===true;colour=next.changeColorOnBounce===true;if(!colour)state.hue=0;const nextUrl=typeof next.imageUrl==='string'&&/^\/media\/[a-f0-9]{64}$/.test(next.imageUrl)?next.imageUrl:'';if(!enabled||!nextUrl){clear();return;}if(nextUrl!==url){stop();url=nextUrl;avatar.src=url;}else start();appearance();}catch{enabled=false;clear();}finally{clearTimeout(timeout);pending=false;}}
 const timer=setInterval(refresh,2000);window.addEventListener('pagehide',()=>{closed=true;clearInterval(timer);controller?.abort();clear();});refresh();
})();
