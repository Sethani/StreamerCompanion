'use strict';
// Optional OBS controls. Discovery is read-only and failures stay scoped to a feature.
const LABELS={
 'obs.volume':'Set audio volume','obs.item.toggle':'Toggle scene/group item','obs.item.show':'Show scene/group item','obs.item.hide':'Hide scene/group item',
 'obs.record.pause':'Pause recording','obs.record.resume':'Resume recording','obs.studio.toggle':'Toggle Studio Mode',
 'obs.preview':'Set preview scene','obs.transition':'Transition preview to program','obs.transition.set':'Choose transition',
 'obs.replay.start':'Start replay buffer','obs.replay.stop':'Stop replay buffer','obs.replay.save':'Save replay',
 'obs.virtualcam.start':'Start virtual camera','obs.virtualcam.stop':'Stop virtual camera','obs.virtualcam.toggle':'Toggle virtual camera'
};
const REQUIREMENTS={
 volume:['GetInputVolume','SetInputVolume'],items:['GetSceneItemList','GetSceneItemEnabled','SetSceneItemEnabled'],
 pause:['GetRecordStatus','PauseRecord','ResumeRecord'],studio:['GetStudioModeEnabled','SetStudioModeEnabled'],
 preview:['GetStudioModeEnabled','GetCurrentPreviewScene','SetCurrentPreviewScene'],
 transition:['GetStudioModeEnabled','GetCurrentPreviewScene','GetCurrentProgramScene','TriggerStudioModeTransition'],
 transitionChoice:['GetSceneTransitionList','GetCurrentSceneTransition','SetCurrentSceneTransition'],
 replay:['GetReplayBufferStatus'],virtualcam:['GetVirtualCamStatus']
};
const feature=type=>type==='obs.volume'?'volume':type.startsWith('obs.item.')?'items':type.startsWith('obs.record.p')||type==='obs.record.resume'?'pause':type==='obs.studio.toggle'?'studio':type==='obs.preview'?'preview':type==='obs.transition.set'?'transitionChoice':type==='obs.transition'?'transition':type.startsWith('obs.replay.')?'replay':'virtualcam';
function empty(){return{features:{},availableRequests:[],inputVolumes:{},items:[],recordingPaused:null,studioMode:null,previewScene:'',transitions:[],currentTransition:'',replayActive:null,virtualcamActive:null};}
async function pool(values,worker){let index=0;await Promise.all(Array.from({length:Math.min(4,values.length)},async()=>{while(index<values.length){const value=values[index++];await worker(value);}}));}
function boolean(value){if(typeof value!=='boolean')throw Error('OBS returned an unavailable status.');return value;}
async function snapshot(client,base){const out=empty();let version;try{version=await client.request('GetVersion');}catch{return out;}if(!Array.isArray(version.availableRequests))return out;const supported=new Set(version.availableRequests);out.availableRequests=[...supported];
 for(const[key,requirements]of Object.entries(REQUIREMENTS))out.features[key]={available:requirements.every(r=>supported.has(r)),error:'Unsupported by this OBS connection.'};
 const tasks=[];const task=(key,run)=>{if(out.features[key].available)tasks.push(async()=>{try{await run();out.features[key].error='';}catch{out.features[key]={available:false,error:'OBS status is unavailable for this feature.'};}});};
 task('volume',async()=>{await pool(base.inputs,async inputName=>{try{const v=await client.request('GetInputVolume',{inputName});if(Number.isFinite(v.inputVolumeMul)&&v.inputVolumeMul>=0)out.inputVolumes[inputName]=v.inputVolumeMul*100;}catch{}});});
 task('items',async()=>{const seen=new Set();let queue=base.scenes.map(sceneName=>({sceneName,group:false}));while(queue.length){const next=[];await pool(queue,async container=>{if(seen.has(container.sceneName))return;seen.add(container.sceneName);if(container.group&&!supported.has('GetGroupSceneItemList'))return;try{const v=await client.request(container.group?'GetGroupSceneItemList':'GetSceneItemList',{sceneName:container.sceneName});if(!Array.isArray(v.sceneItems))return;for(const i of v.sceneItems){if(Number.isSafeInteger(i.sceneItemId)&&typeof i.sourceName==='string'&&typeof i.sceneItemEnabled==='boolean')out.items.push({sceneName:container.sceneName,sceneItemId:i.sceneItemId,sourceName:i.sourceName,enabled:i.sceneItemEnabled,group:container.group});if(i.isGroup===true&&typeof i.sourceName==='string')next.push({sceneName:i.sourceName,group:true});}}catch{/* Missing scene/group disables only its saved targets. */}});queue=next;}});
 task('pause',async()=>{out.recordingPaused=boolean((await client.request('GetRecordStatus')).outputPaused);});
 task('studio',async()=>{out.studioMode=boolean((await client.request('GetStudioModeEnabled')).studioModeEnabled);});
 task('preview',async()=>{const enabled=out.studioMode=boolean((await client.request('GetStudioModeEnabled')).studioModeEnabled);if(enabled){const v=await client.request('GetCurrentPreviewScene');if(typeof v.currentPreviewSceneName!=='string')throw Error();out.previewScene=v.currentPreviewSceneName;}});
 task('transition',async()=>{out.studioMode=boolean((await client.request('GetStudioModeEnabled')).studioModeEnabled);});
 task('transitionChoice',async()=>{const [list,current]=await Promise.all([client.request('GetSceneTransitionList'),client.request('GetCurrentSceneTransition')]);if(!Array.isArray(list.transitions)||typeof current.transitionName!=='string')throw Error();out.transitions=list.transitions.map(t=>t.transitionName).filter(n=>typeof n==='string');out.currentTransition=current.transitionName;});
 task('replay',async()=>{out.replayActive=boolean((await client.request('GetReplayBufferStatus')).outputActive);});
 task('virtualcam',async()=>{out.virtualcamActive=boolean((await client.request('GetVirtualCamStatus')).outputActive);});
 // Bound total optional request concurrency, including per-input and scene/group scans.
 for(const run of tasks)await run();return out;
}
function unavailable(action,base){const c=base.common||empty(),f=c.features[feature(action.type)];if(!f?.available)return f?.error||'Feature support has not been verified.';
 if(action.type==='obs.volume'&&!Object.hasOwn(c.inputVolumes,action.inputName))return 'Saved OBS volume input is unavailable.';
 if(action.type.startsWith('obs.item.')&&!c.items.some(i=>i.sceneName===action.sceneName&&i.sceneItemId===action.sceneItemId&&i.sourceName===action.sourceName))return 'Saved OBS scene/group item is unavailable.';
 if(feature(action.type)==='pause'&&!base.recording)return 'Recording must be active.';
 if(['obs.preview','obs.transition'].includes(action.type)&&c.studioMode!==true)return 'Enable Studio Mode first.';
 if(action.type==='obs.preview'&&!base.scenes.includes(action.sceneName))return 'Saved OBS preview scene is unavailable.';
 if(action.type==='obs.transition.set'&&!c.transitions.includes(action.transitionName))return 'Saved OBS transition is unavailable.';
 const request={'obs.replay.start':'StartReplayBuffer','obs.replay.stop':'StopReplayBuffer','obs.replay.save':'SaveReplayBuffer','obs.virtualcam.start':'StartVirtualCam','obs.virtualcam.stop':'StopVirtualCam','obs.virtualcam.toggle':c.virtualcamActive?'StopVirtualCam':'StartVirtualCam'}[action.type];
 if(request&&!c.availableRequests.includes(request))return 'Unsupported by this OBS connection.';
 if(action.type==='obs.replay.save'&&!c.replayActive)return 'Start the replay buffer first.';return '';
}
function validate(action){const text=(value)=>{if(typeof value!=='string'||value.length>200)throw Error('Invalid OBS target.');};if(action.type==='obs.volume'){text(action.inputName??'');if(!Number.isFinite(action.volumePercent)||action.volumePercent<0||action.volumePercent>100)throw Error('Volume must be between 0 and 100%.');}if(action.type==='obs.preview')text(action.sceneName??'');if(action.type==='obs.transition.set')text(action.transitionName??'');if(action.type.startsWith('obs.item.')){text(action.sceneName??'');text(action.sourceName??'');if(!Number.isSafeInteger(action.sceneItemId)||action.sceneItemId<0)throw Error('Select an OBS scene/group item.');}}
async function execute(client,action){validate(action);const problem=unavailable(action,client.state);if(problem)throw Error(problem);let type,data={},expected,read,requested=false;
 const getBool=async(type,key,data)=>boolean((await client.request(type,data))[key]);
 switch(action.type){
 case'obs.volume':type='SetInputVolume';data={inputName:action.inputName,inputVolumeMul:action.volumePercent/100};expected=data.inputVolumeMul;read=async()=>{const v=await client.request('GetInputVolume',{inputName:action.inputName});if(!Number.isFinite(v.inputVolumeMul))throw Error('OBS volume status is unavailable.');return v.inputVolumeMul;};break;
 case'obs.item.show':case'obs.item.hide':case'obs.item.toggle':data={sceneName:action.sceneName,sceneItemId:action.sceneItemId};read=()=>getBool('GetSceneItemEnabled','sceneItemEnabled',{sceneName:action.sceneName,sceneItemId:action.sceneItemId});expected=action.type.endsWith('toggle')?!await read():action.type.endsWith('show');type='SetSceneItemEnabled';data={...data,sceneItemEnabled:expected};break;
 case'obs.record.pause':case'obs.record.resume':expected=action.type.endsWith('pause');type=expected?'PauseRecord':'ResumeRecord';read=()=>getBool('GetRecordStatus','outputPaused');break;
 case'obs.studio.toggle':expected=!await getBool('GetStudioModeEnabled','studioModeEnabled');type='SetStudioModeEnabled';data={studioModeEnabled:expected};read=()=>getBool('GetStudioModeEnabled','studioModeEnabled');break;
 case'obs.preview':type='SetCurrentPreviewScene';data={sceneName:action.sceneName};expected=action.sceneName;read=async()=>(await client.request('GetCurrentPreviewScene')).currentPreviewSceneName;break;
 case'obs.transition.set':type='SetCurrentSceneTransition';data={transitionName:action.transitionName};expected=action.transitionName;read=async()=>(await client.request('GetCurrentSceneTransition')).transitionName;break;
 case'obs.transition':{const preview=await client.request('GetCurrentPreviewScene');expected=preview.currentPreviewSceneName;if(typeof expected!=='string'||!client.state.scenes.includes(expected))throw Error('Preview scene is unavailable.');type='TriggerStudioModeTransition';read=async()=>(await client.request('GetCurrentProgramScene')).currentProgramSceneName;requested=await read()===expected;break;}
 case'obs.replay.save':await client.request('SaveReplayBuffer');await client.refresh();return{status:'requested',confirmed:false,message:'OBS accepted the replay save request.'};
 default:{const virtual=action.type.startsWith('obs.virtualcam.'),get=virtual?'GetVirtualCamStatus':'GetReplayBufferStatus',suffix=virtual?'VirtualCam':'ReplayBuffer';read=()=>getBool(get,'outputActive');expected=action.type.endsWith('toggle')?!await read():action.type.endsWith('start');type=(expected?'Start':'Stop')+suffix;}
 }
 const equal=(a,b)=>typeof b==='number'?Number.isFinite(a)&&Math.abs(a-b)<0.0001:a===b;
 // Transitions are explicit one-shot commands, even when preview and program match.
 if(action.type==='obs.transition'||!equal(await read(),expected))await client.request(type,data);
 if(requested){await client.refresh();return{status:'requested',confirmed:false,message:'OBS accepted the transition request.'};}
 let confirmed=false;try{for(let i=0;i<30;i++){if(equal(await read(),expected)){confirmed=true;break;}await new Promise(r=>setTimeout(r,100));}}catch{throw Error('OBS readback is unavailable; completion may be unknown.');}if(!confirmed)throw Error('OBS readback did not confirm the requested state.');await client.refresh();return{status:'completed',confirmed:true};
}
module.exports={LABELS,empty,snapshot,unavailable,validate,execute};
