const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), os = require('node:os'), { once } = require('node:events');
const N = require('../src/renderer/navigation'), { UiPreferences } = require('../src/ui-preferences'), { ControlApi } = require('../src/control-api');
async function main() {
 const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'companion-navigation-')); let api;
 try {
  const prefs = new UiPreferences(directory);
  prefs.setFavorite('controller-input', true); prefs.setFavorite('video', true);
  assert.deepEqual(new UiPreferences(directory).read().favorites, ['controller-input','video']);
  prefs.setFavorite('video', false); assert.deepEqual(prefs.read().favorites,['controller-input']);
  const rename = fs.renameSync; try { fs.renameSync = () => { throw new Error('Synthetic disk failure'); }; assert.throws(() => prefs.setFavorite('video',true), /disk failure/); assert.deepEqual(prefs.read().favorites,['controller-input']); } finally {fs.renameSync=rename;}
  const items = Array.from({length:120},(_,i)=>({id:'module-'+i,name:'Module '+i,category:i%2?'Games':'Chat',description:'Synthetic café module',state:'ready',ui:{id:'alias-'+i}}));
  const services = [{manifest:{id:'module-2', name:'Different service name'},state:{status:'stopped',pid:null},dependencies:{ready:true}}, {manifest:{id:'standalone',name:'Standalone'},state:{status:'running',pid:1},dependencies:{ready:true}}];
  const merged=N.merge(items,services); assert.equal(merged.length,121);assert.equal(merged.find(i=>i.id==='module-2').service,services[0]);assert.equal(merged.find(i=>i.id==='standalone').category,'Other');
  assert.equal(N.filter(merged,'cafe module 2','all',new Set()).length,21);
  assert.equal(N.filter(merged,'','stopped',new Set()).length,1);assert.equal(N.filter(merged,'','running',new Set()).length,1);assert.equal(N.attention(merged.find(i=>i.id==='module-2')),false);
  assert.equal(N.filter(merged,'','favorites',new Set(['module-2'])).length,1);
  assert.deepEqual([{id:'b',name:'Module 10'},{id:'a',name:'module 2'}].sort(N.compare).map(i=>i.id),['a','b']);
  assert.equal(N.attention({state:'verification-unavailable'}),true);
  api = new ControlApi({dataDirectory:path.join(directory,'api'),uiPreferences:prefs}); api.port=0;api.start();await once(api.server,'listening');api.port=api.server.address().port;
  const base='http://127.0.0.1:'+api.port;
  const read=await fetch(base+'/api/ui/preferences');assert.equal(read.headers.get('access-control-allow-origin'),null);const a=await read.json(),b=await(await fetch(base+'/api/ui/preferences')).json();assert.equal(a.token,undefined);
  const put=(id,favorite,headers={Origin:base,'X-Companion-CSRF':a.csrf})=>fetch(base+'/api/ui/favorites/'+id,{method:'PUT',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({favorite})});
  assert.equal((await put('video',true,{})).status,403);
  assert.equal((await put('video',true,{Origin:'https://example.invalid','X-Companion-CSRF':a.csrf})).status,403);
  assert.equal((await fetch(base+'/api/ui/preferences',{headers:{Origin:'http://localhost:'+api.port}})).status,403);
  assert.equal(await new Promise((resolve,reject)=>{const req=require('node:http').get(base+'/api/ui/preferences',{headers:{Host:'example.invalid'}},response=>{response.resume();resolve(response.statusCode);});req.on('error',reject);}),403);
  const results=await Promise.all([put('video',true),put('spotify',true,{Origin:base,'X-Companion-CSRF':b.csrf})]);assert.ok(results.every(r=>r.ok));
  assert.deepEqual(new UiPreferences(directory).read().favorites,['controller-input','spotify','video']);
  assert.equal((await put('video','bad')).status,400);
  assert.equal((await fetch(base+'/api/modules')).status,401,'Favorites must not grant installation access');
  console.log('Navigation passed: 120 modules, package-ID merge, categories/natural order, accent search, filters, atomic favorite persistence/failure, concurrent clients and scoped HTTP security.');
 } finally {await api?.stop();fs.rmSync(directory,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
