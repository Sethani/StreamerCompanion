'use strict';
// Opt-in grouped widget frames. Existing modules retain their ordinary lifetime.
(function(root){
 function policy(module){const p=module.overlayRouting;return p?.version===1&&p.retainOnSceneHide===true&&Array.isArray(p.groups)&&p.groups.length>0&&p.groups.length<=16&&new Set(p.groups).size===p.groups.length&&p.groups.every(id=>typeof id==='string'&&/^[a-z][a-z0-9-]{0,63}$/.test(id))?p:null;}
 function create(container){const frames=new Map();let modules=[],routing=null,connected=false,freshUntil=Infinity;
  function remove(id){const f=frames.get(id);if(f){f.element.remove();frames.delete(id);}}
  function update(nextModules,nextRouting,nextConnected,until=Infinity){modules=nextModules;routing=nextRouting;connected=nextConnected;freshUntil=until;const wanted=new Set();
   for(const m of modules){const p=policy(m);if(!p||!connected||Date.now()>=freshUntil||!routing||m.state!=='ready'||!m.extensionOverlayUrl)continue;
    const groups=Object.fromEntries(p.groups.map(id=>{const rule=routing.modules?.[id];return[id,!rule?'unavailable':rule.mode==='disabled'?'disabled':rule.mode==='global'?'visible':rule.mode==='scenes'&&Array.isArray(rule.scenes)?rule.scenes.includes(routing.currentScene)?'visible':'hidden':'unavailable'];}));
    if(!Object.values(groups).some(v=>v==='visible'||v==='hidden'))continue;wanted.add(m.id);let f=frames.get(m.id);if(f&&f.url!==m.extensionOverlayUrl){remove(m.id);f=null;}
    const visible=Object.values(groups).includes('visible');if(!f&&!visible)continue;
    if(!f){let url;try{url=new URL(m.extensionOverlayUrl);if(url.protocol!=='http:'||!['localhost','127.0.0.1'].includes(url.hostname)||url.username||url.password)continue;}catch{continue;}
     const channel=crypto.randomUUID(),element=container.ownerDocument.createElement('iframe');element.dataset.widgetHost=m.id;element.title=m.name+' overlay';element.allow='autoplay; fullscreen';element.referrerPolicy='no-referrer';url.hash=new URLSearchParams({parent:location.origin,channel}).toString();f={element,url:m.extensionOverlayUrl,origin:url.origin,channel,groups};frames.set(m.id,f);element.onload=()=>send(f);element.src=url.href;container.append(element);
    }f.groups=groups;f.element.hidden=!visible;send(f);
   }for(const id of frames.keys())if(!wanted.has(id))remove(id);
  }
  function send(f){f.element.contentWindow?.postMessage({type:'companion-widget-routing',version:1,channel:f.channel,groups:f.groups},f.origin);}
  const timer=setInterval(()=>update(modules,routing,connected,freshUntil),500);
  return{update,clear(){for(const id of frames.keys())remove(id);},stop(){clearInterval(timer);this.clear();}};
 }
 const api={policy,create};if(typeof module==='object'&&module.exports)module.exports=api;else root.WidgetOverlayHost=api;
})(typeof window==='object'?window:globalThis);
