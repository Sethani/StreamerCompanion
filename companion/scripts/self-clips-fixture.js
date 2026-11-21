'use strict';
const fs=require('node:fs'),path=require('node:path'),{fixture:base}=require('./test-browser-foundation'),{buildModules}=require('../../scripts/build-modules');
async function fixture(root){
 const test=await base(root);const extra=buildModules(['self-clips','shoutout-clips'],{output:test.output});test.catalog.modules.push(...extra.modules);test.setActions(test.catalog.modules.flatMap(m=>m.streamerbot.requiredActions));
 await test.host.installCatalogModule('self-clips');
 let revision=0,hold=false;const calls=[];
 const state={phoneDeckVersion:1,ownerLogin:'synthetic',cycle:1,eligibleCount:0,usedCount:0,remainingCount:0,lastTitle:'',lastClipId:'',lastStatus:'Not requested',lastError:'',pendingRequestId:'',phoneDeckResults:{},view:{offset:0,total:0,clips:[]}};
 function publish(){const value={schemaVersion:1,feature:'selfClip',type:'state',revision:++revision,payload:structuredClone(state)};test.globals.set('portable.selfClips.state',JSON.stringify(value));for(const socket of test.websocket.clients)if(socket.readyState===1)socket.send(JSON.stringify({event:{source:'General',type:'Custom'},data:value}));}
 function command(name,args={}){
  calls.push({name,args});if(hold)return;
  if(name==='Self Clips - Refresh'){state.eligibleCount=2;state.remainingCount=2;state.view={offset:0,total:2,clips:[{id:'SyntheticA',title:'<img src=x onerror=alert(1)>',used:false},{id:'SyntheticB',title:'Synthetic B',used:false}]};}
  else if(name==='Self Clips - Play Next'){state.usedCount=1;state.remainingCount=1;state.lastTitle=state.view.clips[0].title;state.lastClipId='SyntheticA';state.lastStatus='Accepted by clip player';state.view.clips[0].used=true;}
  else if(name==='Self Clips - Skip Pending'){state.pendingRequestId='';state.lastStatus='Unconfirmed selection skipped';}
  else if(name==='Self Clips - Return Last'){state.usedCount=0;state.remainingCount=2;state.view.clips[0].used=false;}
  if(args.requestId)state.phoneDeckResults[args.requestId]={status:'completed'};publish();
 }
 test.websocket.on('connection',socket=>socket.on('message',raw=>{const m=JSON.parse(raw);if(m.request==='DoAction'&&m.action?.name?.startsWith('Self Clips - '))command(m.action.name,m.args||{});}));
 publish();return {...test,payload:state,commands:calls,publish,setHold:value=>{hold=value;}};
}
module.exports={fixture};
