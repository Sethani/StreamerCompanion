'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{fixture,wait,sleep}=require('./phone-deck-fixture');
const MUTATION=/^(Set|Start|Stop|Pause|Resume|Save|Trigger)/;
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'phone-obs-traffic-'));let f;try{
 f=await fixture(root);const{service,status,calls}=f,obs=service.obs;
 for(let i=0;i<100;i++){status.mutes['Input '+i]=false;status.volumes['Input '+i]=.5;}
 await f.connect();assert.equal(obs.state.inputs.length,102);assert.equal(Object.keys(obs.state.common.inputVolumes).length,102);
 const count=t=>calls.filter(c=>c.type===t).length;
 // Virtual passage of reconciliation deadlines; no global clock overrides.
 let start=calls.length;
 for(let i=0;i<15;i++)await obs.reconcile();
 assert.equal(calls.length,start,'No requests between reconciliation deadlines');
 await sleep(6300);assert.ok(calls.length-start<=12,'Actual two-second runtime ticks must not restore inventory polling');
 assert.equal(calls.slice(start).filter(c=>['GetInputList','GetInputMute','GetInputVolume','GetSceneList','GetSceneItemList'].includes(c.type)).length,0);
 start=calls.length;
 obs.background.lastStatus=Date.now()-6000;await obs.reconcile();
 assert.ok(calls.length-start<=12,'Health reconciliation must be independent of input count');
 for(const t of ['GetInputList','GetInputMute','GetInputVolume','GetSceneList','GetSceneItemList','GetGroupSceneItemList','GetVersion'])assert.equal(calls.slice(start).filter(c=>c.type===t).length,0,t);
 // A long event storm, including unrelated events, must make no reads or writes.
 start=calls.length;
 for(let i=0;i<120;i++){f.publish('InputMuteStateChanged',{inputName:'Mic',inputMuted:true});f.publish('InputVolumeChanged',{inputName:'Music',inputVolumeMul:.25});f.publish('SceneItemEnableStateChanged',{sceneName:'Group',sceneItemId:7,sceneItemEnabled:false});f.publish('InputVolumeMeters',{});}
 f.publish('StreamStateChanged',{outputActive:true});f.publish('RecordStateChanged',{outputActive:true,outputState:'OBS_WEBSOCKET_OUTPUT_PAUSED'});f.publish('CurrentProgramSceneChanged',{sceneName:'B'});f.publish('CurrentPreviewSceneChanged',{sceneName:'A'});f.publish('ReplayBufferStateChanged',{outputActive:true});f.publish('VirtualcamStateChanged',{outputActive:true});f.publish('CurrentSceneTransitionChanged',{transitionName:'Cut'});
 await wait(()=>obs.state.currentScene==='B'&&obs.state.common.currentTransition==='Cut','event updates');await sleep(150);
 assert.equal(calls.length,start);assert.equal(obs.state.inputMutes.Mic,true);assert.equal(obs.state.common.inputVolumes.Music,25);assert.equal(obs.state.common.items.find(i=>i.sceneName==='Group').enabled,false);assert.equal(obs.state.streamActive,true);assert.equal(obs.state.recording,true);assert.equal(obs.state.common.recordingPaused,true);assert.equal(obs.state.common.previewScene,'A');assert.equal(obs.state.common.replayActive,true);assert.equal(obs.state.common.virtualcamActive,true);
 // A missed event is repaired by bounded reconciliation, including inventories.
 obs.background.lastStatus=Date.now()-6000;await obs.reconcile();assert.equal(obs.state.currentScene,'A');assert.equal(obs.state.streamActive,false);assert.equal(obs.state.common.recordingPaused,false);
 obs.background.lastInventory=Date.now()-31000;await obs.reconcile();assert.equal(obs.state.inputMutes.Mic,false);assert.equal(obs.state.common.inputVolumes.Music,70);
 // An event received after a snapshot began wins over its delayed old response.
 const reads=count('GetInputMute');f.hold('GetInputMute');const pending=obs.refresh({coreOnly:true});await wait(()=>count('GetInputMute')>reads,'held input snapshot');f.publish('InputMuteStateChanged',{inputName:'Mic',inputMuted:true});await wait(()=>obs.state.inputMutes.Mic===true,'newer mute event');f.release('GetInputMute');await pending;assert.equal(obs.state.inputMutes.Mic,true);
 const volumes=count('GetInputVolume');f.hold('GetInputVolume');const common=obs.refreshCommon();await wait(()=>count('GetInputVolume')>volumes,'held volume snapshot');f.publish('InputVolumeChanged',{inputName:'Mic',inputVolumeMul:.9});await wait(()=>obs.state.common.inputVolumes.Mic===90,'newer volume event');f.release('GetInputVolume');await common;assert.equal(obs.state.common.inputVolumes.Mic,90);
 const streams=count('GetStreamStatus');f.hold('GetStreamStatus');const health=obs.refresh({coreOnly:true,inventory:false});await wait(()=>count('GetStreamStatus')>streams,'held status snapshot');f.publish('StreamStateChanged',{outputActive:true});await wait(()=>obs.state.streamActive===true,'newer output event');f.release('GetStreamStatus');await health;assert.equal(obs.state.streamActive,true);
 // Scope structural work. No audio inventories for a changed scene/group item.
 start=calls.length;status.items.Group.push({sceneItemId:8,sourceName:'New',sceneItemEnabled:true});for(let i=0;i<50;i++)f.publish('SceneItemCreated',{sceneName:'Group',sceneItemId:8});
 await wait(()=>obs.state.common.items.some(i=>i.sceneItemId===8),'coalesced structural snapshot');
 assert.equal(calls.slice(start).filter(c=>c.type==='GetGroupSceneItemList').length,1);assert.equal(calls.slice(start).filter(c=>['GetInputList','GetInputMute','GetInputVolume','GetSceneList'].includes(c.type)).length,0);
 start=calls.length;status.scenes=['A','B','New Scene'];f.publish('SceneCreated',{sceneName:'New Scene'});await wait(()=>obs.state.scenes.includes('New Scene'),'scene inventory');assert.equal(calls.slice(start).filter(c=>c.type==='GetInputMute').length,0);
 // Different structural changes during an in-flight read cannot lose a scope.
 const lists=count('GetInputList');f.hold('GetInputList');status.mutes.NewInput=false;status.volumes.NewInput=.4;f.publish('InputCreated',{inputName:'NewInput'});await wait(()=>count('GetInputList')>lists,'in-flight structural read');status.scenes.push('Another Scene');f.publish('SceneCreated',{sceneName:'Another Scene'});await sleep(25);f.release('GetInputList');await wait(()=>obs.state.inputs.includes('NewInput')&&obs.state.scenes.includes('Another Scene')&&obs.state.common.inputVolumes.NewInput===40,'all invalidated scopes recovered');
 // Collection changes fence old reads and clear old targets until bootstrap.
 const oldLists=count('GetInputList');f.hold('GetInputList');const old=obs.refresh();await wait(()=>count('GetInputList')>oldLists,'old collection read');f.publish('CurrentSceneCollectionChanging',{});await wait(()=>!obs.state.connected,'changing collection');assert.deepEqual(obs.state.inputs,[]);status.scenes=['Replacement'];status.scene='Replacement';f.publish('CurrentSceneCollectionChanged',{});await sleep(25);f.release('GetInputList');await old;await wait(()=>obs.state.connected&&obs.state.currentScene==='Replacement','collection bootstrap');assert.deepEqual(obs.state.scenes,['Replacement']);
 // Startup with a missed source event: bootstrap and events may overlap.
 f.disconnect();await wait(()=>!obs.state.connected,'disconnect');await wait(()=>obs.state.connected&&obs.state.common.features.items?.available,'reconnect');assert.equal(calls.filter(c=>MUTATION.test(c.type)).length,0);
 const connections=f.authCount;for(let i=0;i<4;i++)await obs.reconcile();assert.equal(f.authCount,connections,'Idle health does not open extra sockets');
 console.log('Phone Deck OBS traffic passed: 102 audio inputs, bounded idle/status requests, event storms without scans, scoped coalesced structural reads, missed-event repair, event/snapshot ordering, collection fencing and mutation-free reconnect.');
 }finally{await f?.close();assert.ok(root.startsWith(os.tmpdir()+path.sep)&&path.basename(root).startsWith('phone-obs-traffic-'));fs.rmSync(root,{recursive:true,force:true});}}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
