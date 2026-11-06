"use strict";
const transport=StreamingTransport.create(),layer=document.getElementById("timers-layer"),list=document.getElementById("timers-list");
let state=null,connected=false;
function remaining(end){const seconds=Math.max(0,Math.ceil(Number(end)-Date.now()/1000));return String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}
function active(){const now=Date.now()/1000;return(state?.timers||[]).filter(timer=>Number(timer.endTimeSeconds)>now).sort((a,b)=>Number(a.endTimeSeconds)-Number(b.endTimeSeconds)||String(a.title||"").localeCompare(String(b.title||"")));}
function render(){const timers=active();layer.hidden=!connected||timers.length===0;layer.classList.toggle("idle",layer.hidden);list.replaceChildren(...timers.map(timer=>{const item=document.createElement("div");item.className="named-timer";const title=document.createElement("span");title.className="named-timer-title";title.textContent=String(timer.title||"Timer").replaceAll("_"," ");const time=document.createElement("strong");time.className="named-timer-time";time.textContent=remaining(timer.endTimeSeconds);item.append(title,time);return item;}));}
transport.subscribe("timers",event=>{state=event.payload;render();});transport.subscribe("connection",health=>{connected=health.connected;if(!connected)state=null;render();});transport.connect();render();setInterval(render,250);
