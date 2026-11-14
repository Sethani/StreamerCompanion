'use strict';
// One socket, event-fed state, bounded read-only reconciliation. Button dispatch
// deliberately retains the client's independent fresh reads and confirmations.
const STATUS_FEATURES=['pause','studio','preview','transition','transitionChoice','replay','virtualcam'];
class Background {
 constructor(client){this.client=client;this.reset();}
 reset(){clearTimeout(this.timer);this.timer=null;this.sequence=0;this.versions=new Map();this.values=new Map();this.epoch=(this.epoch||0)+1;this.lastInventory=0;this.lastStatus=0;this.dirty=new Set();this.changing=false;}
 stamp(){return{sequence:this.sequence,epoch:this.epoch};}
 changed(key,value){this.versions.set(key,++this.sequence);this.values.set(key,value);}
 newer(key,start){return(this.versions.get(key)||0)>start.sequence;}
 prune(start,common){for(const[key,sequence]of this.versions){const isCommon=key.startsWith('common:')||key.startsWith('volume:')||key.startsWith('item:');if(isCommon===common&&sequence<=start.sequence){this.versions.delete(key);this.values.delete(key);}}}
 core(next,start){for(const key of ['currentScene','streamActive','recording'])if(this.newer(key,start))next[key]=this.values.get(key);for(const name of Object.keys(next.inputMutes))if(this.newer('mute:'+name,start))next.inputMutes[name]=this.values.get('mute:'+name);return next;}
 common(next,start){for(const key of ['recordingPaused','studioMode','previewScene','currentTransition','replayActive','virtualcamActive'])if(this.newer('common:'+key,start))next[key]=this.values.get('common:'+key);for(const name of Object.keys(next.inputVolumes))if(this.newer('volume:'+name,start))next.inputVolumes[name]=this.values.get('volume:'+name);next.items=next.items.map(item=>{const key='item:'+JSON.stringify([item.sceneName,item.sceneItemId]);return this.newer(key,start)?{...item,enabled:this.values.get(key)}:item;});return next;}
 invalidate(...scopes){if(scopes.some(scope=>scope!=='status'))this.epoch++;for(const scope of scopes)this.dirty.add(scope);clearTimeout(this.timer);this.timer=setTimeout(()=>{this.timer=null;this.reconcile().catch(()=>{});},80);this.timer.unref?.();}
 event(type,data={}){
  const c=this.client,s=c.state,common=s.common;
  if(type==='CurrentSceneCollectionChanging'){this.changing=true;this.epoch++;c.state=c.empty('OBS scene collection is changing.');c.emit('state',c.state);return;}
  if(type==='CurrentSceneCollectionChanged'){this.changing=false;this.invalidate('inputs','scenes','common');return;}
  if(!c.identified||this.changing)return;
  const scalar=(key,value,isCommon=false)=>{const target=isCommon?common:s;target[key]=value;this.changed((isCommon?'common:':'')+key,value);};
  switch(type){
   case 'CurrentProgramSceneChanged':if(typeof data.sceneName==='string')scalar('currentScene',data.sceneName);break;
   case 'CurrentPreviewSceneChanged':if(typeof data.sceneName==='string')scalar('previewScene',data.sceneName,true);break;
   case 'StreamStateChanged':if(typeof data.outputActive==='boolean')scalar('streamActive',data.outputActive);break;
   case 'RecordStateChanged':
    if(typeof data.outputActive==='boolean')scalar('recording',data.outputActive);
    if(data.outputState==='OBS_WEBSOCKET_OUTPUT_PAUSED')scalar('recordingPaused',true,true);
    else if(['OBS_WEBSOCKET_OUTPUT_RESUMED','OBS_WEBSOCKET_OUTPUT_STARTED','OBS_WEBSOCKET_OUTPUT_STOPPED'].includes(data.outputState))scalar('recordingPaused',false,true);break;
   case 'InputMuteStateChanged':if(typeof data.inputName==='string'&&typeof data.inputMuted==='boolean'){if(Object.hasOwn(s.inputMutes,data.inputName))s.inputMutes[data.inputName]=data.inputMuted;this.changed('mute:'+data.inputName,data.inputMuted);}break;
   case 'InputVolumeChanged':if(typeof data.inputName==='string'&&Number.isFinite(data.inputVolumeMul)&&data.inputVolumeMul>=0){if(Object.hasOwn(common.inputVolumes,data.inputName))common.inputVolumes[data.inputName]=data.inputVolumeMul*100;this.changed('volume:'+data.inputName,data.inputVolumeMul*100);}break;
   case 'StudioModeStateChanged':if(typeof data.studioModeEnabled==='boolean'){scalar('studioMode',data.studioModeEnabled,true);if(!data.studioModeEnabled)scalar('previewScene','',true);else this.invalidate('status');}break;
   case 'ReplayBufferStateChanged':if(typeof data.outputActive==='boolean')scalar('replayActive',data.outputActive,true);break;
   case 'VirtualcamStateChanged':if(typeof data.outputActive==='boolean')scalar('virtualcamActive',data.outputActive,true);break;
   case 'CurrentSceneTransitionChanged':if(typeof data.transitionName==='string')scalar('currentTransition',data.transitionName,true);break;
   case 'SceneItemEnableStateChanged':if(typeof data.sceneName==='string'&&Number.isSafeInteger(data.sceneItemId)&&typeof data.sceneItemEnabled==='boolean'){const item=common.items.find(i=>i.sceneName===data.sceneName&&i.sceneItemId===data.sceneItemId);if(item)item.enabled=data.sceneItemEnabled;this.changed('item:'+JSON.stringify([data.sceneName,data.sceneItemId]),data.sceneItemEnabled);}break;
   case 'InputCreated':case 'InputRemoved':case 'InputNameChanged':this.invalidate('inputs','volume','items');return;
   case 'SceneCreated':case 'SceneRemoved':case 'SceneNameChanged':case 'SceneListChanged':this.invalidate('scenes','items');return;
   case 'SceneItemCreated':case 'SceneItemRemoved':case 'SceneItemListReindexed':this.invalidate('items');return;
   default:return; // Meter, transform and vendor events must not cause scans.
  }
  c.emit('state',s);
 }
 reconcile(){
  if(this.running)return this.running;
  const epoch=this.epoch,work=(async()=>{
   const c=this.client;if(c.closed||!c.identified||this.changing)return;
   // Do not hide a required inventory read behind an older coalesced refresh.
   if(c.refreshing)await c.refreshing;if(c.commonRefreshing)await c.commonRefreshing;
   if(c.closed||!c.identified||this.changing||epoch!==this.epoch)return;
   const now=Date.now(),full=!c.state.connected||!this.lastInventory||now-this.lastInventory>=30000;
   const dirty=new Set(this.dirty);this.dirty.clear();
   if(full){await c.refresh();return;}
   const inputs=dirty.has('inputs'),scenes=dirty.has('scenes');
   if(inputs||scenes)await c.refresh({coreOnly:true,inventory:inputs&&scenes?true:inputs?'inputs':'scenes'});
   const features=dirty.has('common')?null:[...new Set([...(['volume','items'].filter(f=>dirty.has(f))),...((dirty.has('status')||now-this.lastStatus>=5000)?STATUS_FEATURES:[])])];
   if(features===null||features.length)await c.refreshCommon({features,cachedCapabilities:true});
   if(now-this.lastStatus>=5000){await c.refresh({coreOnly:true,inventory:false});this.lastStatus=Date.now();}
  })();
  const tracked=work.finally(()=>{if(this.running===tracked)this.running=null;if(epoch!==this.epoch&&!this.changing&&!this.client.closed){this.dirty.add('inputs');this.dirty.add('scenes');this.dirty.add('common');}if(this.dirty.size&&!this.changing&&!this.client.closed&&!this.timer){this.timer=setTimeout(()=>{this.timer=null;this.reconcile().catch(()=>{});},80);this.timer.unref?.();}});this.running=tracked;return tracked;
 }
}
module.exports={Background};
