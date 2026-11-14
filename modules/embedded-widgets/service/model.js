'use strict';
function invalid(){throw Object.assign(Error('Invalid widget settings. Check field types, URL scheme and layout limits.'),{statusCode:400});}
function object(v){return v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;}
function keys(v,allowed){if(!object(v)||Object.keys(v).some(k=>!allowed.includes(k)))invalid();}
function numeric(v,min,max,integer=false){if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max||integer&&!Number.isSafeInteger(v))invalid();return v;}
function text(v,max,empty=true){if(typeof v!=='string'||v.length>max||!empty&&!v.length||/[\u0000-\u001f\u007f]/.test(v))invalid();return v;}
function defaults(){return{version:1,revision:0,enabled:false,canvasWidth:1920,canvasHeight:1080,widgets:{}};}
function validate(input){
 keys(input,['version','revision','enabled','canvasWidth','canvasHeight','widgets']);
 if(input.version!==1||typeof input.enabled!=='boolean')invalid();
 numeric(input.revision,0,Number.MAX_SAFE_INTEGER,true);numeric(input.canvasWidth,640,7680,true);numeric(input.canvasHeight,360,4320,true);
 if(!object(input.widgets)||Object.keys(input.widgets).length>64)invalid();
 const entries=[];
 for(const[id,w]of Object.entries(input.widgets)){
  text(id,100,false);if(['__proto__','prototype','constructor'].includes(id))invalid();
  keys(w,['name','group','enabled','url','x','y','width','height','scaleX','scaleY']);
  text(w.name,100,false);text(w.url,8192);if(typeof w.enabled!=='boolean'||!['tangia','microlayer'].includes(w.group))invalid();
  if(w.url){let parsed;try{parsed=new URL(w.url);}catch{invalid();}if(!['http:','https:'].includes(parsed.protocol)||w.url.trim()!==w.url||!/^https?:\/\//i.test(w.url))invalid();}
  numeric(w.x,-10000,10000,true);numeric(w.y,-10000,10000,true);numeric(w.width,1,7680,true);numeric(w.height,1,4320,true);numeric(w.scaleX,0.05,10);numeric(w.scaleY,0.05,10);
  entries.push([id,{name:w.name,group:w.group,enabled:w.enabled,url:w.url,x:w.x,y:w.y,width:w.width,height:w.height,scaleX:w.scaleX,scaleY:w.scaleY}]);
 }
 return{version:1,revision:input.revision,enabled:input.enabled,canvasWidth:input.canvasWidth,canvasHeight:input.canvasHeight,widgets:Object.fromEntries(entries)};
}
function summary(config){const widgets=Object.values(config.widgets);return{enabled:config.enabled,savedCount:widgets.length,configuredCount:widgets.filter(w=>!!w.url).length};}
module.exports={defaults,validate,summary};
