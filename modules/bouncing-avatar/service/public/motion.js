'use strict';
// Copied from the original combined overlay: pixels/second, clamped delta,
// centred start, reflected axes, and one 47-degree hue step per bounced frame.
(function(root){
 function create(){return{x:0,y:0,vx:220,vy:220,hue:0,lastFrameTime:null};}
 function bounds(b){return{maxX:Math.max(0,b.width-b.avatarWidth),maxY:Math.max(0,b.height-b.avatarHeight)};}
 function centre(s,b){const m=bounds(b);s.x=m.maxX/2;s.y=m.maxY/2;s.lastFrameTime=null;}
 function clamp(s,b){const m=bounds(b);s.x=Math.min(Math.max(0,s.x),m.maxX);s.y=Math.min(Math.max(0,s.y),m.maxY);}
 function step(s,frameTime,b,changeColor=true){if(s.lastFrameTime===null)s.lastFrameTime=frameTime;const delta=Math.max(0,Math.min((frameTime-s.lastFrameTime)/1000,.05));s.lastFrameTime=frameTime;s.x+=s.vx*delta;s.y+=s.vy*delta;const m=bounds(b);let bounced=false;
  if(m.maxX===0)s.x=0;else if(s.x<=0){s.x=0;s.vx=Math.abs(s.vx);bounced=true;}else if(s.x>=m.maxX){s.x=m.maxX;s.vx=-Math.abs(s.vx);bounced=true;}
  if(m.maxY===0)s.y=0;else if(s.y<=0){s.y=0;s.vy=Math.abs(s.vy);bounced=true;}else if(s.y>=m.maxY){s.y=m.maxY;s.vy=-Math.abs(s.vy);bounced=true;}
  if(!changeColor)s.hue=0;else if(bounced)s.hue=(s.hue+47)%360;return bounced;
 }
 const api={create,centre,clamp,step};if(typeof module==='object'&&module.exports)module.exports=api;else root.AvatarMotion=api;
})(globalThis);
