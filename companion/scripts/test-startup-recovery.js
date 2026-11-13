'use strict';
const assert=require('node:assert/strict'),{moduleStates}=require('../src/module-state'),{ServiceRegistry}=require('../src/service-registry');
async function main(){
 const manifests=['chat-routing','named-timers','spotify','phone-deck'].map(id=>({manifest:require('../../modules/'+id+'/module.json')}));
 manifests.push({manifest:require('../../modules/universal-dock/module.json')},{manifest:require('../../modules/source-modules/module.json')},{manifest:require('../../modules/universal-overlay/module.json')});
 const offline=moduleStates(manifests,'1.3.2',[],[],false);
 for(const id of ['chat-routing','named-timers','spotify']){assert.notEqual(offline.states.get(id).state,'missing-dependency');assert.match(offline.states.get(id).problem,/Streamer.bot/);}
 const actions=manifests.flatMap(m=>m.manifest.streamerbot.requiredActions);const online=moduleStates(manifests,'1.3.2',['streamerbot-websocket'],actions,true);assert.equal(online.states.get('named-timers').state,'ready');
 const actualMissing=moduleStates(manifests.filter(m=>m.manifest.id!=='chat-routing'),'1.3.2',['streamerbot-websocket'],actions,true);assert.equal(actualMissing.states.get('named-timers').state,'missing-dependency');
 const r=new ServiceRegistry(),calls=[];for(const id of ['spotify','phone-deck'])r.register({manifest:{schemaVersion:1,id,name:id,provides:[],dependencies:{requiredCapabilities:id==='spotify'?['streamerbot-websocket']:[]}},status:'stopped',async state(){return{status:this.status};},async start(){calls.push(id);await new Promise(r=>setTimeout(r,5));this.status='running';},async stop(){this.status='stopped';}});
 r.config.autoStart={spotify:true,'phone-deck':true};await r.startAll({automaticOnly:true});assert.deepEqual(calls,['phone-deck']);assert.equal(r.dependencyState(r.get('spotify')).missingRequired.length,0);assert.deepEqual(r.dependencyState(r.get('spotify')).waitingRequired,['streamerbot-websocket']);
 r.systemCapabilities.add('streamerbot-websocket');await Promise.all([r.reconcileAutomatic(),r.reconcileAutomatic()]);assert.deepEqual(calls,['phone-deck','spotify']);await r.reconcileAutomatic();assert.equal(calls.length,2);
 await r.execute('spotify','stop');await r.reconcileAutomatic();assert.equal(r.get('spotify').status,'stopped','Manual stop must not be undone by polling');
 await r.setAutoStart('spotify',true);await r.reconcileAutomatic();assert.equal(calls.length,3);r.systemCapabilities.delete('streamerbot-websocket');await r.execute('spotify','stop');await r.setAutoStart('spotify',true);await r.stopAll();r.systemCapabilities.add('streamerbot-websocket');await r.reconcileAutomatic();assert.equal(calls.length,3,'Stop all clears deferred starts');
 console.log('Startup recovery passed: installed/offline vs missing dependencies, late Streamer.bot availability, independent Phone Deck start, serialized pending startup, no duplicate starts and preserved manual Stop/Stop all.');
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
