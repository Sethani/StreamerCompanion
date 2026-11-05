// Released Live Chatbox installation in the existing packaged host, isolated ports/data.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{once}=require('node:events');
const archive=path.join(path.resolve(process.argv[2]),'resources/app.asar');
const {CompanionHost}=require(path.join(archive,'src/companion-host')),{InstalledService}=require(path.join(archive,'src/installed-service')),{WebSocketServer}=require(path.join(archive,'node_modules/ws'));
async function freePort(){const server=http.createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(r=>server.close(r));return port;}
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'chat-core-release-'));let host,child,websocket;
 try{
  websocket=new WebSocketServer({host:'127.0.0.1',port:0});await once(websocket,'listening');const calls=[];
  websocket.on('connection',socket=>socket.on('message',raw=>{const packet=JSON.parse(raw);calls.push(packet);assert.ok(['GetActions','Subscribe','GetStatus'].includes(packet.request),'No action or chat send may execute');socket.send(JSON.stringify({id:packet.id,status:'ok',actions:[]}));}));
  const wsUrl='ws://127.0.0.1:'+websocket.address().port+'/';host=new CompanionHost({dataDirectory:root,controlApiPort:await freePort(),streamerBotUrl:wsUrl});host.start();await once(host.controlApi.server,'listening');
  const inventory=await host.catalog.check();assert.equal(inventory.error,'');const entry=inventory.modules.find(i=>i.id==='chat-core');assert.equal(entry.version,'1.0.0');assert.equal(entry.problem,'');await host.installCatalogModule('chat-core');
  const manifest=host.registry.readManifest('chat-core');assert.deepEqual(manifest.streamerbot.requiredActions,[]);
  const data=path.join(root,'module-data/chat-core');fs.mkdirSync(data,{recursive:true});fs.writeFileSync(path.join(data,'config.json'),JSON.stringify({enabled:true,streamerBotUrl:wsUrl,pronouns:false,pluralmind:false,appearance:'bubbles=true&fontsize=29px'}));
  const port=await freePort();child=new InstalledService({app:{},moduleDirectory:host.registry.moduleDirectory('chat-core'),dataDirectory:data,manifest:{...manifest,service:{...manifest.service,port}}});host.services.replace(child);await host.services.setAutoStart('chat-core',true);
  assert.equal((await child.start()).status,'running');const base='http://127.0.0.1:'+port;
  const page=await(await fetch(base+'/chat/chat.html')).text();assert.ok(page.includes('fontsize=29px'));assert.ok(page.includes('new EventSource'));assert.equal(page.includes('__CHAT_BOOTSTRAP__'),false);
  const html=await(await fetch(base+'/settings')).text(),csrf=html.match(/name="chat-csrf" content="([^"]+)"/)[1];
  const test=await fetch(base+'/api/chat-core/test',{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Companion-CSRF':csrf},body:'{"enriched":true}'});assert.ok(test.ok);
  assert.equal(host.publicInstalledModules().modules.find(i=>i.packageId==='chat-core').extensionOverlayUrl,'','Chatbox must not be added to the aggregate');
  await child.stop();assert.equal((await child.probe(200)).ready,false);assert.equal((await child.start()).status,'running');assert.equal((await child.state()).endpoint.details.service,'chat-core');
  assert.equal(host.services.config.autoStart['chat-core'],true);assert.equal(JSON.parse(fs.readFileSync(path.join(data,'config.json'))).appearance,'bubbles=true&fontsize=29px');
  assert.equal(fs.readdirSync(data).some(name=>/sqlite/.test(name)),false);assert.equal(calls.some(call=>call.request==='DoAction'),false);
  console.log('Published Live Chatbox 1.0.0 passed: real GitHub catalogue/hash/dependency installation, no import, packaged child start/restart, retained private appearance/auto-start, synthetic control, notices/assets and no aggregate registration or outgoing action.');
 }finally{await child?.stop();await host?.services.stopAll();if(host)await host.controlApi.stop();if(websocket){for(const socket of websocket.clients)socket.terminate();await new Promise(r=>websocket.close(r));}fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
