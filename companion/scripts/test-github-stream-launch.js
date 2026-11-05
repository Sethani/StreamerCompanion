// Released Stream Launch installation only; no live Streamer.bot, OBS, Spotify or follow-up action.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),{once}=require('node:events');
const archive=path.join(path.resolve(process.argv[2]),'resources/app.asar');
const {CompanionHost}=require(path.join(archive,'src/companion-host')),{WebSocketServer}=require(path.join(archive,'node_modules/ws'));
async function freePort(){const server=http.createServer();server.listen(0,'127.0.0.1');await once(server,'listening');const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'stream-launch-release-'));let host,websocket;
 try{
  let actions=[];const calls=[];websocket=new WebSocketServer({host:'127.0.0.1',port:0});await once(websocket,'listening');
  websocket.on('connection',socket=>socket.on('message',raw=>{const request=JSON.parse(raw);calls.push(request);assert.equal(request.request,'GetActions','Released-package verification must not execute launch, OBS, Countdown, Spotify or follow-up actions');socket.send(JSON.stringify({id:request.id,status:'ok',actions:actions.map(name=>({name}))}));}));
  host=new CompanionHost({dataDirectory:root,controlApiPort:await freePort(),streamerBotUrl:'ws://127.0.0.1:'+websocket.address().port+'/'});host.start();await once(host.controlApi.server,'listening');
  const inventory=await host.catalog.check();assert.equal(inventory.error,'');const entry=inventory.modules.find(item=>item.id==='stream-launch');assert.equal(entry.version,'1.0.0');assert.equal(entry.problem,'');
  assert.deepEqual(new Set(entry.installationPlan.map(item=>item.id)),new Set(['universal-dock','countdown','stream-launch']));
  await host.installCatalogModule('stream-launch');let modules=(await host.listModules()).modules;assert.equal(modules.find(item=>item.id==='countdown').state,'streamerbot-required');assert.equal(modules.find(item=>item.id==='stream-launch').state,'missing-dependency');
  const manifest=host.registry.readManifest('stream-launch');assert.equal(manifest.service,undefined);assert.deepEqual(manifest.ui.overlays,[]);assert.equal(manifest.streamerbot.requiredActions.length,6);
  const dependencyActions=['countdown','stream-launch'].flatMap(id=>host.registry.readManifest(id).streamerbot.requiredActions);actions=[...new Set(dependencyActions)];modules=(await host.listModules()).modules;assert.equal(modules.find(item=>item.id==='stream-launch').state,'ready');assert.equal(host.services.services.size,0);
  const registration=host.publicInstalledModules().modules.find(item=>item.packageId==='stream-launch');assert.equal(registration.extensionOverlayUrl,'');assert.equal((await fetch(registration.nodeUrl)).status,200);assert.ok(fs.existsSync(path.join(host.registry.moduleDirectory('stream-launch'),'streamerbot/stream-launch.sb')));
  assert.equal(calls.some(call=>call.request==='DoAction'),false);
  console.log('Published Stream Launch 1.0.0 passed: real GitHub catalogue/hash/dependency installation, explicit import/Ready states, served controls, no child service/overlay and no launch/OBS/Countdown/Spotify/follow-up action.');
 }finally{await host?.services.stopAll();if(host)await host.controlApi.stop();if(websocket){for(const socket of websocket.clients)socket.terminate();await new Promise(resolve=>websocket.close(resolve));}assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
