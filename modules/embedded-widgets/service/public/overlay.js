'use strict';
(()=>{const params=new URLSearchParams(location.hash.slice(1)),expectedOrigin=params.get('parent'),channel=params.get('channel'),renderer=EmbeddedWidgetRenderer.create(document.getElementById('widgets')),owner=crypto.randomUUID();
 let groups=null,lastParent=0,epoch=0,owned=false,csrf=null,busy=false,closed=false,everVisible=false,cached=null,releasePending=false;
 if(parent===window||!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(expectedOrigin||'')||!channel)return;
 async function lease(command,keepalive=false,revision){if(!csrf)return false;const r=await fetch('/api/widgets/render/owner',{method:'POST',headers:{'Content-Type':'application/json','X-Widget-Render-CSRF':csrf},body:JSON.stringify({command,owner,...(command!=='release'?{revision}:{})}),signal:keepalive?undefined:AbortSignal.timeout(1500),keepalive});if(!r.ok)throw Error();const data=await r.json();return command==='release'?data.released===true:data.accepted===true;}
 async function release(keepalive=false){renderer.clear();releasePending=releasePending||owned;owned=false;if(releasePending)try{if(await lease('release',keepalive))releasePending=false;}catch{}}
 function draw(){if(!owned||!groups||!cached){renderer.clear();return;}const effective=structuredClone(cached);for(const w of Object.values(effective.widgets))if(!['visible','hidden'].includes(groups[w.group]))w.enabled=false;const container=document.getElementById('widgets');container.style.width=cached.canvasWidth+'px';container.style.height=cached.canvasHeight+'px';renderer.render(effective,Object.fromEntries(Object.entries(groups).map(([id,state])=>[id,state==='visible'])));}
 addEventListener('message',e=>{const m=e.data;if(e.source!==parent||e.origin!==expectedOrigin||m?.type!=='companion-widget-routing'||m.version!==1||m.channel!==channel)return;
  const next=Object.fromEntries(['tangia','microlayer'].map(id=>[id,['visible','hidden','disabled','unavailable'].includes(m.groups?.[id])?m.groups[id]:'unavailable']));lastParent=performance.now();if(JSON.stringify(groups)!==JSON.stringify(next)){groups=next;epoch++;draw();}tick();
 });
 async function tick(){if(busy||closed)return;busy=true;const generation=epoch;try{
  if(!groups){await release();return;}
  const r=await fetch('/api/widgets/render/bootstrap',{cache:'no-store',signal:AbortSignal.timeout(1500)});if(!r.ok)throw Error();const data=await r.json();if(closed||generation!==epoch)return;
  const changedOwner=csrf&&csrf!==data.csrf;csrf=data.csrf;if(changedOwner||releasePending){await release();return;}const config=data.config;
  const active=Object.values(config.widgets).some(w=>config.enabled&&w.enabled&&w.url&&['visible','hidden'].includes(groups[w.group]));
  if(!active){everVisible=false;await release();return;}const visible=Object.values(config.widgets).some(w=>config.enabled&&w.enabled&&w.url&&groups[w.group]==='visible');if(!visible&&!everVisible)return;
  if(!owned){releasePending=true;owned=await lease('acquire',false,config.revision);releasePending=false;}if(closed||generation!==epoch){await release();return;}if(!owned){renderer.clear();return;}if(!await lease('heartbeat',false,config.revision)){await release();return;}if(closed||generation!==epoch){await release();return;}everVisible=everVisible||visible;
  cached=config;draw();
 }catch{await release();}finally{busy=false;}}
 const timer=setInterval(()=>{if(groups&&performance.now()-lastParent>2200){groups=null;epoch++;everVisible=false;renderer.clear();}tick();},400);
 addEventListener('pagehide',()=>{closed=true;epoch++;clearInterval(timer);release(true);});
})();
