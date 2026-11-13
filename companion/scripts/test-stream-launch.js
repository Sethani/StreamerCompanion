const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),http=require('node:http'),zlib=require('node:zlib');
const AdmZip=require('adm-zip'),{fixture}=require('./launch-fixture'),{InstalledService}=require('../src/installed-service');
async function wait(check,label){const until=Date.now()+8000;while(Date.now()<until){if(await check())return;await new Promise(r=>setTimeout(r,50));}throw Error('Timed out: '+label);}
async function main(){const root=fs.mkdtempSync(path.join(os.tmpdir(),'stream-launch-'));let test,spotify;
 try{
  test=await fixture(root);const zip=new AdmZip(path.join(test.output,'stream-launch-1.0.1.streammodule')),manifest=JSON.parse(zip.readAsText('module.json'));
  const bytes=Buffer.from(zip.readAsText('streamerbot/stream-launch.sb'),'base64'),exported=JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
  assert.equal(exported.version,24);assert.equal(exported.data.actions.length,6);assert.equal(exported.meta.autoRunAction,null);assert.equal(manifest.service,undefined);assert.deepEqual(manifest.ui.overlays,[]);
  const actions=exported.data.actions,ids=new Set(actions.map(a=>a.id));assert.deepEqual(actions.map(a=>a.name),manifest.streamerbot.requiredActions);
  for(const action of actions)for(const sub of action.subActions)if(sub.type===4)assert.ok(ids.has(sub.actionId));
  assert.equal(actions.find(a=>a.name==='Stream - Launch').id,'be4b86a3-0d20-4664-bb2a-d7aa04c4ca8d');assert.equal(actions.find(a=>a.name==='Stream - Online Fallback').id,'e9529337-96f1-48b1-aced-fe30915bdb3b');
  assert.equal(actions.find(a=>a.name==='Stream - Initialize Launch').triggers[0].type,706);assert.equal(actions.find(a=>a.name==='Stream - Online Fallback').triggers[0].type,154);
  assert.equal(actions.some(a=>a.name==='GoingLive'||a.name==='Stream - Announce and Bookkeeping'),false,'Private wrappers/follow-up must not be overwritten');
  const source=Buffer.from(actions[0].subActions[0].byteCode,'base64').toString();assert.equal(/3124|7474|sethiduck|webhookUrl|rewardId|Intermission:/.test(source),false);
  assert.equal(test.calls.length,0);assert.equal((await test.host.listModules()).modules.find(m=>m.id==='stream-launch').state,'ready');test.setActions(test.allActions.filter(name=>!manifest.streamerbot.requiredActions.includes(name)));assert.equal((await test.host.listModules()).modules.find(m=>m.id==='stream-launch').state,'streamerbot-required');test.setActions(test.allActions);
  const registration=test.host.publicInstalledModules().modules.find(m=>m.packageId==='stream-launch');assert.equal(registration.extensionOverlayUrl,'');assert.equal((await fetch(registration.nodeUrl)).status,200);
  // Run the actual unchanged Spotify runtime in its explicit isolated test mode.
  const data=path.join(root,'spotify-data');fs.mkdirSync(data);fs.writeFileSync(path.join(data,'config.json'),JSON.stringify({playlist:'spotify:playlist:1234567890123456789012',startVolume:70,onStreamVolume:15,fadeSeconds:1,announcements:{nowPlayingEnabled:false},sceneAutomation:{enabled:true,scenes:['Fixture Music'],pauseOnLeave:true}}));
  const reservation=http.createServer();await new Promise(r=>reservation.listen(0,'127.0.0.1',r));const port=reservation.address().port;await new Promise(r=>reservation.close(r));
  const m=JSON.parse(fs.readFileSync(path.join(__dirname,'../../modules/spotify/module.json')));
  spotify=new InstalledService({app:{},moduleDirectory:path.resolve(__dirname,'../../modules/spotify'),dataDirectory:data,manifest:{...m,service:{...m.service,port}}});
  const old=process.env.SPOTIFY_TEST_MODE;process.env.SPOTIFY_TEST_MODE='1';try{assert.equal((await spotify.start()).status,'running');}finally{if(old===undefined)delete process.env.SPOTIFY_TEST_MODE;else process.env.SPOTIFY_TEST_MODE=old;}
  const base='http://127.0.0.1:'+port;const get=async route=>{const response=await fetch(base+route);assert.ok(response.ok);return response.json();};
  await get('/api/spotify/scene?scene=Fixture%20Music');assert.equal((await get('/health')).testPlayback.startCount,1);
  const start=await get('/api/spotify/stream-start?durationSeconds=2');assert.equal(start.playback,'preserved-active-session');assert.equal(start.fade.status,'armed');
  await get('/api/spotify/scene?scene=Fixture%20Other');assert.equal((await get('/health')).testPlayback.pauseCount,0,'Scene leave must preserve countdown-owned music');
  await wait(async()=>{const health=await get('/health');return !health.fade.enabled&&health.testPlayback.volume===15;},'autonomous Spotify fade');
  let health=await get('/health');assert.equal(health.testPlayback.startCount,1);assert.equal(health.testPlayback.isPlaying,true);
  // A streamer may pause Spotify after selecting Starting Soon so pre-stream
  // music is not audible locally. Stream start must observe the real paused
  // state instead of trusting the still-owned scene session.
  await get('/api/spotify/test/playback?playing=false');
  const restarted=await get('/api/spotify/stream-start?durationSeconds=2');
  assert.equal(restarted.playback,'started');
  health=await get('/health');assert.equal(health.testPlayback.startCount,2);assert.equal(health.testPlayback.isPlaying,true);
  // Scene entry and guided stream launch are independent controls.
  const saved=JSON.parse(fs.readFileSync(path.join(data,'config.json')));
  saved.sceneAutomation={enabled:true,bindings:[{scene:'Fixture Starting Soon',autoplayOnEnter:false,leaveBehavior:'pause'}]};
  fs.writeFileSync(path.join(data,'config.json'),JSON.stringify(saved));
  await spotify.stop();
  process.env.SPOTIFY_TEST_MODE='1';try{await spotify.start();}finally{if(old===undefined)delete process.env.SPOTIFY_TEST_MODE;else process.env.SPOTIFY_TEST_MODE=old;}
  await get('/api/spotify/test/playback?playing=false');
  const starts=(await get('/health')).testPlayback.startCount;
  assert.equal((await get('/api/spotify/scene?scene=Fixture%20Starting%20Soon')).status,'scene-autoplay-disabled');
  assert.equal((await get('/health')).testPlayback.startCount,starts,'Opening Starting Soon must stay silent when entry autoplay is off');
  await get('/api/spotify/stream-start?durationSeconds=10');
  assert.equal((await get('/health')).testPlayback.startCount,starts+1,'Stream launch must still start the music');
  await get('/api/spotify/scene?scene=Fixture%20Starting%20Soon');
  assert.equal((await get('/health')).testPlayback.startCount,starts+1,'Duplicate scene notification must not restart music');
  await spotify.stop();assert.equal((await spotify.probe(200)).ready,false);
  console.log('Stream Launch package passed: preserved action identities, safe trigger/export boundaries, no private/monolith dependency, import/Ready states and no overlay/service. Spotify passed autonomous fade, shared scene/countdown ownership, and restart-after-manual-pause in isolated test mode.');
 }finally{await spotify?.stop();await test?.close();fs.rmSync(root,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
