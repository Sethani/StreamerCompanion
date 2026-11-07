// Published-package upgrade acceptance in a temporary profile; no live integrations.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), http = require('node:http'), { once } = require('node:events');
const bundle = path.resolve(process.argv[2]), archive = path.join(bundle,'resources/app.asar');
const { CompanionHost } = require(path.join(archive,'src/companion-host'));
const { WebSocketServer } = require(path.join(archive,'node_modules/ws'));
async function main(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dock-release-'));let host,websocket;
 try{
  const reservation=http.createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));
  websocket=new WebSocketServer({host:'127.0.0.1',port:0});await once(websocket,'listening');
  websocket.on('connection',socket=>socket.on('message',raw=>{const request=JSON.parse(raw);assert.equal(request.request,'GetActions','Release acceptance must not execute module actions');socket.send(JSON.stringify({id:request.id,status:'ok',actions:[]}));}));
  host=new CompanionHost({dataDirectory:root,controlApiPort:port,streamerBotUrl:'ws://127.0.0.1:'+websocket.address().port+'/'});host.start();await once(host.controlApi.server,'listening');
  const response=await fetch('https://github.com/Sethani/StreamerCompanion-Modules/releases/download/universal-dock-v1.0.0/universal-dock-1.0.0.streammodule');assert.ok(response.ok);const old=path.join(root,'old.streammodule');fs.writeFileSync(old,Buffer.from(await response.arrayBuffer()));
  await host.installModulePackage(old);assert.equal(host.registry.readManifest('universal-dock').version,'1.0.0');
  host.uiPreferences.setFavorite('video',true);const data=path.join(root,'module-data/universal-dock');fs.mkdirSync(data,{recursive:true});fs.writeFileSync(path.join(data,'sentinel'),'synthetic preserved data');
  const inventory=await host.catalog.check();assert.equal(inventory.error,'');const entry=inventory.modules.find(i=>i.id==='universal-dock');assert.equal(entry.version,'1.1.1');assert.equal(entry.problem,'');
  await host.installCatalogModule('universal-dock');assert.equal(host.registry.readManifest('universal-dock').dependencies.companion,'>=1.3.1');
  assert.equal(fs.readFileSync(path.join(data,'sentinel'),'utf8'),'synthetic preserved data');assert.deepEqual(host.uiPreferences.read().favorites,['video']);assert.equal(host.services.services.size,0);
  const base='http://127.0.0.1:'+port, preferences=await(await fetch(base+'/api/ui/preferences')).json();assert.deepEqual(preferences.favorites,['video']);assert.ok(preferences.csrf);assert.equal(preferences.token,undefined);
  const page=await(await fetch(base+'/api/public/assets/universal-dock/dock/index.html')).text();assert.ok(page.includes('module-picker'));assert.ok(page.includes('favorites'));
  assert.equal((await host.listModules()).modules.find(i=>i.id==='universal-dock').state,'ready');
  console.log('Published Universal Dock 1.1.1 passed: actual GitHub 1.0.0→1.1.1 upgrade/hash verification, host compatibility, preserved private data/favorites, served picker, Ready state and zero services/actions.');
 }finally{await host?.services.stopAll();if(host)await host.controlApi.stop();if(websocket){for(const s of websocket.clients)s.terminate();await new Promise(r=>websocket.close(r));}fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
