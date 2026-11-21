'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),zlib=require('node:zlib'),Zip=require('adm-zip');
const {fixture}=require('./self-clips-fixture'),schema=require('../../modules/phone-deck/service/provider-schema');
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'companion-self-clips-'));let test;
 try{test=await fixture(root);const archive=new Zip(path.join(test.output,'self-clips-1.0.1.streammodule')),manifest=JSON.parse(archive.readAsText('module.json'));schema.validate(manifest.ui.phoneDeck);
  assert.deepEqual(test.host.registry.manifests().map(m=>m.manifest.id).sort(),['self-clips','shoutout-clips','universal-dock']);assert.equal(test.host.services.services.size,0);
  const raw=Buffer.from(archive.readAsText(manifest.streamerbot.importFile),'base64');assert.equal(raw.subarray(0,4).toString(),'SBAE');const native=JSON.parse(zlib.gunzipSync(raw.subarray(4)));
  assert.deepEqual(native.data.actions.map(a=>a.name),manifest.streamerbot.requiredActions);assert.equal(new Set(native.data.actions.map(a=>a.id)).size,native.data.actions.length);
  assert.equal(native.data.actions.filter(a=>a.triggers.length).length,1);assert.equal(native.data.actions.find(a=>a.triggers.length).name,'Self Clips - Initialize');
  const engine=native.data.actions[0].subActions[0];assert.ok(engine.references.includes('.\\Twitch.Common.dll'));assert.ok(Buffer.from(engine.byteCode,'base64').toString().includes('selfClips.private.state'));
  assert.equal(archive.getEntries().some(e=>/\.dll$|\.sqlite$|\/module-data\//i.test(e.entryName)),false);
  const ids=native.data.actions.map(a=>a.id);for(const a of Object.values(manifest.ui.phoneDeck.actions))assert.ok(ids.includes(a.id));
  for(const id of ['return-last','skip-pending'])assert.equal(manifest.ui.phoneDeck.controls.find(c=>c.id===id).confirm,true);
  assert.equal(manifest.ui.phoneDeck.state.fields.catalogue,undefined);assert.equal(manifest.ui.phoneDeck.state.fields.used,undefined);assert.deepEqual(manifest.ui.overlays,[]);
  assert.equal(manifest.dependencies.modules['shoutout-clips'],'^2.2.1');const old=structuredClone(test.catalog);old.modules.find(m=>m.id==='shoutout-clips').version='2.1.3';const saved=test.host.catalog.catalog;
  const playerFile=path.join(test.host.registry.dataDirectory,'shoutout-clips/module.json'),playerBytes=fs.readFileSync(playerFile),playerManifest=JSON.parse(playerBytes);playerManifest.version='2.1.3';fs.writeFileSync(playerFile,JSON.stringify(playerManifest));test.host.catalog.catalog=old;
  try{assert.throws(()=>test.host.catalog.resolve('self-clips',new Set()),/compatible|version|dependency/i);}finally{test.host.catalog.catalog=saved;fs.writeFileSync(playerFile,playerBytes);}
  const module=(await test.host.listModules()).modules.find(m=>m.id==='self-clips');assert.equal(module.state,'ready');assert.equal(module.ui.extensionOverlayUrl,'');
  for(const file of ['index.html','app.js','styles.css'])assert.equal((await fetch(test.base+'/api/public/assets/self-clips/self-clips/'+file)).status,200);
  assert.ok(archive.readAsText('README.md').includes('does not')||archive.readAsText('README.md').includes('not automatically'));
  assert.equal(test.commands.length,0);console.log('Self Clips package passed: deterministic native identities, required player version, optional Phone Deck, scoped projections/confirmations, safe guides/assets, no service/renderer and inert install.');
 }finally{await test?.close();assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(root,{recursive:true,force:true});}}
if(require.main===module)main().catch(error=>{console.error(error);process.exitCode=1});module.exports={main};
