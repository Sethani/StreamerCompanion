'use strict';
// Rendering primitive only: no fetch, timers, routing connection or automatic start.
(function(root){
 function create(container){const frames=new Map();
  function remove(id){const node=frames.get(id);if(node){node.frame.removeAttribute('src');node.wrapper.remove();frames.delete(id);}}
  function render(config,visibility){const wanted=new Set();for(const[id,w]of Object.entries(config.widgets)){
   const active=config.enabled&&w.enabled&&!!w.url,allowed=visibility?.[w.group]===true;
   if(!active){remove(id);continue;}wanted.add(id);let node=frames.get(id);if(!node&&!allowed)continue;
   if(!node){const wrapper=container.ownerDocument.createElement('div'),frame=container.ownerDocument.createElement('iframe');wrapper.className='embedded-widget';wrapper.dataset.widget=id;frame.title=w.name;frame.allow='autoplay; fullscreen';frame.allowFullscreen=true;Object.assign(wrapper.style,{position:'absolute',overflow:'hidden',border:'0',background:'transparent',transformOrigin:'top left',pointerEvents:'none'});Object.assign(frame.style,{position:'absolute',left:'0',top:'0',width:'100%',height:'100%',border:'0',background:'transparent'});frame.referrerPolicy='no-referrer';wrapper.append(frame);container.append(wrapper);node={wrapper,frame,url:null};frames.set(id,node);}
   node.wrapper.hidden=!allowed;Object.assign(node.wrapper.style,{left:w.x+'px',top:w.y+'px',width:w.width+'px',height:w.height+'px',transform:`scale(${w.scaleX}, ${w.scaleY})`});node.frame.title=w.name;
   // A hidden never-loaded URL change must wait until the group becomes visible.
   if(node.url!==w.url){if(!allowed){remove(id);continue;}node.url=w.url;node.frame.setAttribute('src',w.url);}
  }for(const id of frames.keys())if(!wanted.has(id))remove(id);}
  return{render,clear(){for(const id of frames.keys())remove(id);}};
 }
 if(typeof module==='object'&&module.exports)module.exports={create};else root.EmbeddedWidgetRenderer={create};
})(typeof window==='object'?window:globalThis);
