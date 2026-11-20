'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {createStore}=require('../../modules/chat-archive/service/store'),{createService,validate}=require('../../modules/chat-archive/service/runtime'),{buildModules}=require('../../scripts/build-modules'),{CompanionRegistry}=require('../src/module-registry'),{InstalledService}=require('../src/installed-service');
const {waitFor}=require('./chat-core-fixture');
const cfg={enabled:true,retentionDays:30,archiveAnnouncements:true,archiveDeletedText:false};
const message=(id,body='Hello archive',at=Date.now())=>({schemaVersion:1,messageId:'twitch:'+id,platform:'twitch',occurredAtMs:at,messageType:'chat',user:{id:'twitch:fixture',login:'fixture',displayName:'Fixture Viewer',pronouns:'They/Them'},text:body});
async function fixture(dir){const clients=new Set();const feed=http.createServer((req,res)=>{assert.equal(req.url,'/api/chat-core/events');res.writeHead(200,{'Content-Type':'text/event-stream'});res.write('event: ready\ndata: '+JSON.stringify({connection:{connected:true,subscribed:true}})+'\n\n');clients.add(res);req.on('close',()=>clients.delete(res));});await new Promise(r=>feed.listen(0,'127.0.0.1',r));const service=createService({dataDirectory:dir,port:0,feedUrl:'http://127.0.0.1:'+feed.address().port+'/api/chat-core/events',reconnectDelay:30}),port=await service.start(),base='http://127.0.0.1:'+port;return{service,base,clients,emit(type,data){for(const res of clients)res.write('event: '+type+'\ndata: '+JSON.stringify(data)+'\n\n');},post(route,data,headers={}){return fetch(base+'/api/archive/'+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Companion-CSRF':service.csrf,...headers},body:JSON.stringify(data)});},async close(){await service.stop();feed.closeAllConnections();await new Promise(r=>feed.close(r));}};}
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'archive-tests-'));let store,f,child,live,archive;try{
 let clock=Date.now();const dir=path.join(root,'store');fs.mkdirSync(dir);store=createStore(dir,{now:()=>clock});const page=(query='')=>store.page(new URLSearchParams(query));
 const commandDir=path.join(root,'commands');fs.mkdirSync(commandDir);let commandStore=createStore(commandDir,{now:()=>clock});
 try{
  const excluded={...cfg,excludeCommands:true,commandPrefix:'!'},params=new URLSearchParams('limit=1');
  for(const[id,body]of [['bang','\t\u2003!hello'],['ordinary','Hello !there'],['literal',' .*literal'],['proxy','M: !displayed']])commandStore.accept('message',message(id,body,clock),cfg);
  commandStore.accept('message-update',{schemaVersion:1,messageId:'twitch:bang',user:{displayName:'Member'},text:'Ordinary displayed text'},cfg);
  commandStore.accept('message-update',{schemaVersion:1,messageId:'twitch:proxy',user:{displayName:'Member'},text:'!displayed'},cfg);
  assert.equal(commandStore.page(params,excluded).total,3);assert.equal(commandStore.count(excluded),3);
  assert.equal(commandStore.exportRows(params,excluded).length,3);assert.equal(commandStore.page(new URLSearchParams('query=Ordinary%20displayed'),excluded).total,0);
  commandStore.accept('message',message('skip',' \n!skip',clock),excluded);commandStore.accept('message-update',{...message('skip'),text:'late'},excluded);assert.equal(commandStore.count(),4);
  assert.equal(commandStore.page(params,{...excluded,commandPrefix:'.*'}).total,3,'Prefix is literal, not a regex');
  commandStore.close();commandStore=createStore(commandDir,{now:()=>clock});assert.equal(commandStore.page(params,excluded).total,3);assert.equal(commandStore.page(params,cfg).total,4,'Disabling reveals original rows, never skipped rows');
  commandStore.accept('message-delete',{schemaVersion:1,messageId:'twitch:bang'},excluded);assert.equal(commandStore.page(new URLSearchParams('deleted=yes'),cfg).rows[0].original_text,'','Moderation still scrubs command text');
  assert.equal(commandStore.prune(0),0);clock+=31*86400000;assert.equal(commandStore.prune(30),4);clock-=31*86400000;
 }finally{commandStore.close();}
 assert.equal(validate({}).excludeCommands,false);assert.equal(validate({}).commandPrefix,'!');assert.throws(()=>validate({commandPrefix:''}));assert.throws(()=>validate({excludeCommands:'true'}));
 store.accept('message',message('off'),{...cfg,enabled:false});assert.equal(store.count(),0);
 for(let i=0;i<120;i++)store.accept('message',message('m'+i,i===0?'=SUM(A1)':'Entry '+i,clock-i),cfg);
 store.accept('message',message('m0'),cfg);assert.equal(store.count(),120);assert.equal(page('limit=50&offset=100').rows.length,20);
 assert.equal(page('query=Entry%201').total,31);assert.equal(page('query=%27%20OR%201%3D1').total,0);assert.equal(page('user=fixture').total,120);
 store.accept('message-update',{schemaVersion:1,messageId:'twitch:m1',pluralmind:true,pluralmindMember:{systemId:'fixture-system',id:'member'},normalPronouns:'They/Them',user:{displayName:'Fixture Member',pronouns:'She/Her'},text:'Proxy body'},cfg);assert.equal(page('user=Member').total,1);
 store.accept('message-delete',{schemaVersion:1,messageId:'twitch:m1'},cfg);store.accept('message-update',{schemaVersion:1,messageId:'twitch:m1',user:{displayName:'late'},text:'RESURRECT'},cfg);assert.equal(page('deleted=yes').rows[0].displayed_text,'');
 store.accept('message-delete',{schemaVersion:1,messageId:'twitch:before'},cfg);store.accept('message',message('before'),cfg);assert.equal(store.count(),120);
 store.accept('message',message('announcement'),{...cfg,archiveAnnouncements:false});const announcement=message('announce');announcement.messageType='announcement';store.accept('message',announcement,{...cfg,archiveAnnouncements:false});assert.equal(page('query=announce').total,0);
 const youtube={...message('yt'),platform:'youtube',messageId:'youtube:m0',user:{id:'youtube:fixture',displayName:'YT'}};store.accept('message',youtube,cfg);assert.equal(page('platform=youtube').total,1);
 store.accept('chat-clear',{schemaVersion:1,platform:'youtube',synthetic:true},cfg);assert.equal(page('platform=youtube&deleted=yes').total,0);
 const synthetic=message('test-one');synthetic.user.id='twitch:test';store.accept('message',synthetic,cfg);assert.equal(page('query=test-one').total,0);
 store.accept('user-delete',{schemaVersion:1,userId:'youtube:fixture'},cfg);assert.equal(page('platform=youtube&deleted=yes').total,1);
 assert.throws(()=>page('from=2026-02-30'));assert.throws(()=>page('limit=999'));assert.throws(()=>page('offset=-1'));assert.throws(()=>validate({retentionDays:0}));assert.throws(()=>validate({enabled:'yes'}));
 store.close();store=createStore(dir,{now:()=>clock});assert.equal(store.count(),122);clock+=31*86400000;assert.equal(store.prune(30),122);assert.equal(store.count(),0);store.close();store=null;
 f=await fixture(path.join(root,'runtime'));const initial=await(await fetch(f.base+'/api/archive/state')).json();assert.equal(initial.config.enabled,false);assert.equal(f.clients.size,0);
 assert.equal((await f.post('config',{...initial.config,enabled:true},{'X-Companion-CSRF':'wrong'})).status,403);
 assert.equal((await fetch(f.base+'/api/archive/search',{headers:{Origin:'http://127.0.0.1:9999'}})).status,403);
 assert.equal(await new Promise(resolve=>http.get(f.base+'/api/archive/state',{headers:{Host:'evil.invalid'}},r=>{r.resume();resolve(r.statusCode);})),403);
 assert.equal((await fetch(f.base+'/api/archive/export.json',{headers:{'Sec-Fetch-Site':'cross-site'}})).status,403);
 let result=await f.post('config',{...initial.config,enabled:true});assert.equal(result.status,200);await waitFor(()=>f.service.status().chatConnected,'feed connected');
 assert.equal((await f.post('config',{...initial.config,enabled:false})).status,409);
 const csvmessage=message('csv','=SUM(A1)');f.emit('message',csvmessage);f.emit('message',csvmessage);await waitFor(()=>f.service.store.count()===1,'one archived row');
 const csv=await(await fetch(f.base+'/api/archive/export.csv')).text();assert.ok(csv.includes("'=SUM(A1)"));const exp=await(await fetch(f.base+'/api/archive/export.json')).json();assert.equal(exp.rows[0].original_text,'=SUM(A1)');
 assert.equal((await f.post('config',{...f.service.config(),excludeCommands:true,commandPrefix:'='})).status,200);await waitFor(()=>f.service.status().chatConnected,'command filter reconnect');
 assert.equal((await(await fetch(f.base+'/api/archive/search')).json()).total,0);assert.equal((await(await fetch(f.base+'/api/archive/state')).json()).status.count,0);
 assert.equal((await(await fetch(f.base+'/api/archive/export.json')).json()).rows.length,0);assert.equal((await(await fetch(f.base+'/api/archive/export.csv')).text()).includes('SUM'),false);
 f.emit('message',message('excluded-http',' \t=skipped'));await new Promise(r=>setTimeout(r,70));assert.equal(f.service.store.count(),1);
 assert.equal((await f.post('config',{...f.service.config(),excludeCommands:false})).status,200);await waitFor(()=>f.service.status().chatConnected,'filter disabled reconnect');
 assert.equal((await(await fetch(f.base+'/api/archive/search?limit=1')).json()).rows.length,1);const health=await(await fetch(f.base+'/health')).text();assert.ok(!health.includes('SUM')&&!health.includes('Fixture'));
 for(const client of f.clients)client.destroy();await waitFor(()=>f.service.status().chatConnected&&f.clients.size===1,'reconnect');f.emit('message',csvmessage);await new Promise(r=>setTimeout(r,70));assert.equal(f.service.store.count(),1);
 const revision=f.service.config().revision,rename=fs.renameSync;try{fs.renameSync=()=>{throw Error('synthetic failed save');};assert.equal((await f.post('config',{...f.service.config(),enabled:false})).status,400);assert.equal(f.service.config().revision,revision);assert.equal(f.service.config().enabled,true);}finally{fs.renameSync=rename;}
 result=await f.post('config',{...f.service.config(),enabled:false});assert.equal(result.status,200);await waitFor(()=>f.clients.size===0,'capture disabled');assert.equal((await(await fetch(f.base+'/api/archive/search')).json()).total,1);
 const output=path.join(root,'packages');buildModules(['chat-archive'],{output});const registry=new CompanionRegistry({dataDirectory:path.join(root,'installed')}),staged=registry.stage(path.join(output,'chat-archive-1.2.1.streammodule'));registry.commit(staged);registry.finalize(staged);
 const manifest=JSON.parse(fs.readFileSync(path.join(registry.moduleDirectory('chat-archive'),'module.json'))),reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 child=new InstalledService({app:{},moduleDirectory:registry.moduleDirectory('chat-archive'),dataDirectory:path.join(root,'child'),manifest:{...manifest,service:{...manifest.service,port}}});assert.equal((await child.start()).status,'running');assert.equal((await child.state()).endpoint.details.service,'chat-archive');await child.stop();
 await f.close();f=null;const restart=createService({dataDirectory:path.join(root,'runtime'),port:0});assert.equal(restart.store.count(),1);await restart.start();await restart.stop();
 // Exercise the real Live Chatbox producer, including enrichment and its older synthetic identity.
 live=await require('./chat-core-fixture').fixture(path.join(root,'real-feed'));
 const target=path.join(root,'real-consumer');fs.mkdirSync(target);fs.writeFileSync(path.join(target,'config.json'),JSON.stringify(cfg));
 archive=createService({dataDirectory:target,port:0,feedUrl:live.base+'/api/chat-core/events'});await archive.start();await waitFor(()=>archive.status().chatConnected,'actual feed connected');
 live.emit('ChatMessage',require('./chat-core-fixture').message('actual','M: normalized'));await waitFor(()=>archive.store.page(new URLSearchParams('user=Fixture%20Member')).total===1,'actual proxy enrichment');
 await live.post('/api/chat-core/test',{enriched:true});await new Promise(r=>setTimeout(r,60));assert.equal(archive.store.count(),1);await live.post('/api/chat-core/test',{clear:true});assert.equal(archive.store.page(new URLSearchParams('deleted=yes')).total,0);
 live.emit('ChatMessageDeleted',{targetMessageId:'actual'});await waitFor(()=>archive.store.page(new URLSearchParams('deleted=yes')).total===1,'actual delete');assert.equal(archive.store.page(new URLSearchParams()).rows[0].displayed_text,'');
 console.log('Chat Archive passed: SQLite/restart/package runtime, opt-in capture, real Live Chatbox normalization/enrichment, dedup, moderation/tombstones/late updates, synthetic exclusion, retention, filters/pagination, formula-safe CSV/exact JSON, same-origin/CSRF, failed saves/two-client revisions, feed reconnect and capture-off history.');
 }finally{await archive?.stop();await live?.close();await child?.stop();await f?.close();store?.close();assert.ok(root.startsWith(os.tmpdir()+path.sep));fs.rmSync(root,{recursive:true,force:true});}}
if(require.main===module)main().catch(e=>{console.error(e.stack);process.exitCode=1;});
module.exports={fixture,message};
