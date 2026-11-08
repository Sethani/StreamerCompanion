'use strict';
const contracts=require('./legacy-contracts.json');
const reference=(key,values={})=>({...contracts[key],values});
// Translate saved cards once, in memory. Startup never writes the old file.
// The next explicit Save persists the translated deck with the same identities.
function convert(config){config=structuredClone(config);for(const p of config.pages)for(const i of p.items){
 let key,values={};const a=i.action;
 if(i.type==='button')switch(a?.type){
  case 'stream.stop':i.action={...a,type:'obs.stream.stop'};i.hold=true;break;
  case 'stream.launch':key='stream-launch/go-live';i.hold=true;break;
  case 'audio.gameVodSafe.toggle':key='audio-routing/toggle';break;
  case 'wheel.spin':key='wheel/spin';values={profile:typeof a.profile==='string'?a.profile.trim().toLowerCase():''};break;
  case 'wheel.clear':key='wheel/clear';break;
  case 'video.play':key='video/play';values={video:typeof a.videoId==='string'?a.videoId.trim().toLowerCase():'',title:a.title||''};break;
  case 'video.stop':key='video/stop';break;
  case 'streamerbot.action':key='phone-deck/custom-action';values={actionId:a.actionId||''};break;
  case 'countdown.start':key='countdown/start';i.legacyCountdownStart=true;break;
  case 'countdown.pause':key='countdown/pause';break;
  case 'countdown.resume':key='countdown/resume';break;
  case 'countdown.clear':key='countdown/clear';break;
  case 'countdown.preset3':key='countdown/preset-3';break;
  case 'countdown.preset5':key='countdown/preset-5';break;
 }
 if(i.type==='form'&&['chat','title','category'].includes(i.mode))key=i.mode==='chat'?'chat-routing/bot-message':'phone-deck/'+i.mode;
 if(i.type==='widget'&&i.kind==='countdown')key='countdown/status';
 if(key){const ref=reference(key,values);if(i.type==='button')i.action={...a,type:'provider',...ref};else Object.assign(i,ref,i.type==='form'?{mode:'provider'}:{kind:'provider'});}
 }return config;}
async function execute(providers,item,ref,input,requestId){
 // The old Start continued a paused timer and left a running timer alone.
 // Check the authoritative state inside the countdown operation queue.
 const saved=reference('countdown/start');
 if(item.legacyCountdownStart&&ref.packageId===saved.packageId&&ref.controlId===saved.controlId&&ref.providerRevision===saved.providerRevision&&Object.keys(ref.values||{}).length===0){
  const {e}=providers.locate(ref,'button');await providers.read(e);const status=providers.projection(e).status;
  if(status==='running')return{status:'completed',confirmed:true,unchanged:true};
  if(status==='paused')ref=reference('countdown/resume');
 }
 return providers.execute(ref,item.type,input,requestId);
}
module.exports={convert,execute,reference};
