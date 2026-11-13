'use strict';
const controls=require('./obs-controls');
const crypto=require('node:crypto'),{EventEmitter}=require('node:events');
class ObsClient extends EventEmitter {
 constructor(options={}){super();this.timeout=options.timeout||4000;this.WebSocket=options.WebSocket||globalThis.WebSocket;this.pending=new Map();this.connection={configured:false,url:'ws://127.0.0.1:4455',password:''};this.state=this.empty();this.tail=Promise.resolve();this.generation=0;this.closed=false;}
 empty(error='OBS is not configured.'){return{connected:false,error,currentScene:'',scenes:[],inputs:[],inputMutes:{},streamActive:null,recording:null,common:controls.empty()};}
 configure(config){if(!config||typeof config.url!=='string'||typeof config.password!=='string')throw Error('Invalid OBS connection settings.');let url;try{url=new URL(config.url);}catch{throw Error('Invalid OBS WebSocket address.');}if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password||url.hash||url.search)throw Error('Use an OBS ws:// or wss:// address without embedded credentials.');this.connection={configured:true,url:url.href,password:config.password};this.disconnect();if(!this.closed)this.connect();}
 disconnect(){this.generation++;this.refreshing=null;this.commonRefreshing=null;clearTimeout(this.retry);clearTimeout(this.handshake);this.socket?.close();this.socket=null;this.identified=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('OBS disconnected; completion may be unknown.'));}this.pending.clear();this.state=this.empty('OBS disconnected.');this.emit('state',this.state);}
 connect(){if(this.closed||!this.connection.configured)return;const generation=++this.generation;let socket;try{socket=this.socket=new this.WebSocket(this.connection.url);}catch{this.schedule();return;}this.handshake=setTimeout(()=>socket.close(),this.timeout);
  socket.addEventListener('error',()=>{if(generation!==this.generation)return;this.disconnect();this.schedule();});socket.addEventListener('close',()=>{if(generation!==this.generation)return;clearTimeout(this.handshake);this.identified=false;for(const p of this.pending.values()){clearTimeout(p.timer);p.reject(Error('OBS disconnected; completion may be unknown.'));}this.pending.clear();this.state=this.empty('OBS disconnected.');this.emit('state',this.state);this.schedule();});
  socket.addEventListener('message',async event=>{if(generation!==this.generation)return;let m;try{m=JSON.parse(String(event.data));}catch{return;}if(m.op===0){const d={rpcVersion:1,eventSubscriptions:2047};if(m.d.authentication){const sha=x=>crypto.createHash('sha256').update(x).digest('base64');d.authentication=sha(sha(this.connection.password+m.d.authentication.salt)+m.d.authentication.challenge);}socket.send(JSON.stringify({op:1,d}));}else if(m.op===2){clearTimeout(this.handshake);this.identified=true;await this.refresh();}else if(m.op===7){const p=this.pending.get(m.d.requestId);if(!p)return;this.pending.delete(m.d.requestId);clearTimeout(p.timer);if(m.d.requestStatus?.result===true)p.resolve(m.d.responseData||{});else p.reject(Error('OBS rejected '+p.type+'.'));}else if(m.op===5){clearTimeout(this.eventTimer);this.eventTimer=setTimeout(()=>this.refresh(),60);}});
 }
 schedule(){if(this.closed)return;clearTimeout(this.retry);this.retry=setTimeout(()=>this.connect(),2000);}
 request(type,data={}){if(!this.identified||this.socket?.readyState!==1)return Promise.reject(Error('OBS is disconnected.'));const requestId=crypto.randomUUID();return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{this.pending.delete(requestId);reject(Error('OBS request timed out; completion may be unknown.'));},this.timeout);this.pending.set(requestId,{resolve,reject,timer,type});this.socket.send(JSON.stringify({op:6,d:{requestType:type,requestId,requestData:data}}));});}

 refresh({coreOnly=false,freshCommon=false}={}){
  if(!this.refreshing){
   const generation=this.generation;
   const work=(async()=>{try{
    const[scenes,stream,record,inputs]=await Promise.all([this.request('GetSceneList'),this.request('GetStreamStatus'),this.request('GetRecordStatus'),this.request('GetInputList')]);
    if(generation!==this.generation)return;
    if(!Array.isArray(scenes.scenes)||typeof scenes.currentProgramSceneName!=='string'||typeof stream.outputActive!=='boolean'||typeof record.outputActive!=='boolean'||!Array.isArray(inputs.inputs))throw Error('Invalid inventory.');
    const inputMutes={},names=inputs.inputs.map(i=>i.inputName).filter(n=>typeof n==='string');
    for(let offset=0;offset<names.length;offset+=4)await Promise.all(names.slice(offset,offset+4).map(async inputName=>{try{const v=await this.request('GetInputMute',{inputName});if(typeof v.inputMuted==='boolean')inputMutes[inputName]=v.inputMuted;}catch{}}));
    if(generation!==this.generation||!this.identified)return;
    this.readFailures=0;this.state={connected:true,error:'',currentScene:scenes.currentProgramSceneName,scenes:scenes.scenes.map(s=>s.sceneName),inputs:Object.keys(inputMutes),inputMutes,streamActive:stream.outputActive,recording:record.outputActive,common:this.state.common||controls.empty()};
   }catch(error){if(generation!==this.generation)return;this.state=this.empty('OBS inventory is unavailable.');if(!/timed out|disconnected|socket|network/i.test(error.message))this.readFailures=-1;if((this.readFailures=(this.readFailures||0)+1)>=2&&!this.closed){this.readFailures=0;this.disconnect();this.connect();return;}}
   this.emit('state',this.state);
   })();
   const tracked=work.finally(()=>{if(this.refreshing===tracked)this.refreshing=null;});this.refreshing=tracked;
  }
  const core=this.refreshing;
  return coreOnly?core:core.then(async()=>{if(freshCommon&&this.commonRefreshing)await this.commonRefreshing;return this.refreshCommon();});
 }
 refreshCommon(){
  if(!this.state.connected)return Promise.resolve();
  if(this.commonRefreshing)return this.commonRefreshing;
  const generation=this.generation,base=this.state;
  const work=controls.snapshot(this,base).then(common=>{if(generation!==this.generation||!this.identified||!this.state.connected)return;this.state={...this.state,common};this.emit('state',this.state);});
  const tracked=work.finally(()=>{if(this.commonRefreshing===tracked)this.commonRefreshing=null;});this.commonRefreshing=tracked;return tracked;
 }

 execute(action){const work=async()=>{const optional=Object.hasOwn(controls.LABELS,action.type);await this.refresh({coreOnly:!optional,freshCommon:optional});if(!this.state.connected)throw Error('OBS inventory is unavailable.');if(Object.hasOwn(controls.LABELS,action.type))return controls.execute(this,action);let type,data={},read,expected;switch(action.type){case 'obs.scene':if(!this.state.scenes.includes(action.sceneName))throw Error('Saved OBS scene is unavailable.');type='SetCurrentProgramScene';data={sceneName:action.sceneName};read=async()=>{const v=await this.request('GetCurrentProgramScene');return v.currentProgramSceneName;};expected=action.sceneName;break;
 case 'obs.stream.start':case 'obs.stream.stop':expected=action.type.endsWith('start');type=expected?'StartStream':'StopStream';read=async()=>{const v=await this.request('GetStreamStatus');return v.outputActive;};break;
 case 'obs.record.start':case 'obs.record.stop':case 'obs.record.toggle':expected=action.type.endsWith('toggle')?!(await this.request('GetRecordStatus')).outputActive:action.type.endsWith('start');type=expected?'StartRecord':'StopRecord';read=async()=>{const v=await this.request('GetRecordStatus');return v.outputActive;};break;
 case 'obs.mute.toggle':if(!Object.hasOwn(this.state.inputMutes,action.inputName))throw Error('Saved OBS audio input is unavailable.');expected=!(await this.request('GetInputMute',{inputName:action.inputName})).inputMuted;type='SetInputMute';data={inputName:action.inputName,inputMuted:expected};read=async()=>{const v=await this.request('GetInputMute',{inputName:action.inputName});return v.inputMuted;};break;
 default:throw Error('This control is unavailable in this session.');}
 if(await read()!==expected)await this.request(type,data);let confirmed=false;for(let i=0;i<8;i++){if(await read()===expected){confirmed=true;break;}await new Promise(resolve=>setTimeout(resolve,100));}if(!confirmed)throw Error('OBS readback did not confirm the requested state.');await this.refresh({coreOnly:true});return{status:'completed',confirmed:true};};const result=this.tail.then(work);this.tail=result.catch(()=>{});return result;}
 close(){this.closed=true;clearTimeout(this.eventTimer);this.disconnect();}
}
module.exports={ObsClient};
