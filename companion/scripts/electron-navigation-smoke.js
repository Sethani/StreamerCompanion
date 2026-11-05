// Real renderer + two real dock browsers, synthetic inventories and isolated host.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');
const { fixture } = require('./test-browser-foundation');
const bundle = path.resolve(process.argv[2]), temporary = path.resolve(process.argv[3]), archive = path.join(bundle,'resources/app.asar');
const { CompanionHost } = require(path.join(archive,'src/companion-host'));
app.setPath('userData',temporary);app.commandLine.appendSwitch('disable-gpu');
let test;const windows=[];const errors=[];let effects=0, hiddenModule=false, offline=false, inventory, failed=false;
async function wait(check,label){const until=Date.now()+12000;while(Date.now()<until){if(await check())return;await new Promise(r=>setTimeout(r,50));}throw new Error('Timed out: '+label);}
function win(preload){const w=new BrowserWindow({show:false,width:920,height:680,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false,...(preload?{preload}: {})}});windows.push(w);w.webContents.on('console-message',(_e,level,message)=>{if(level===3&&!message.includes('Content Security Policy')){errors.push(message);console.error('Renderer:',message);}});return w;}
async function main(){
 await app.whenReady();test=await fixture(temporary,CompanionHost);await test.host.installCatalogModule('video');
 for(let i=0;i<120;i++) {
  const directory=path.join(test.host.registry.dataDirectory,'picker-'+i);fs.mkdirSync(path.join(directory,'web'),{recursive:true});
  fs.writeFileSync(path.join(directory,'module.json'),JSON.stringify({schemaVersion:2,id:'picker-'+i,name:'Picker '+i,version:'1.0.0',description:'Synthetic café controls',streamerbot:{requiredActions:[]},web:{root:'web'},ui:{id:'picker-alias-'+i,name:'Picker '+i,category:i%2?'Games':'Chat',dockPage:'/index.html'}}));
  fs.writeFileSync(path.join(directory,'web/index.html'),'<p>Synthetic controls</p>');
 }
 const items=Array.from({length:120},(_,i)=>({id:'navigation-'+i,name:'Module '+i,description:'Synthetic café controls',version:'1.0.0',state:i===4?'streamerbot-required':'ready',category:i%2?'Games':'Chat',requiredActions:[],missingActions:[],ui:{id:'alias-'+i,nodeUrl:'http://127.0.0.1:1/unused'},dependencies:{},hasImport:i===4}));
 const services=[{manifest:{id:'navigation-2',name:'Different service name',version:'1.0.0',provides:[]},state:{status:'stopped',pid:null,logs:Array.from({length:100},(_,i)=>({atMs:1,stream:'test',line:'Synthetic log '+i}))},dependencies:{ready:true,required:[],optional:[],missingRequired:[],missingOptional:[]},autoStart:false},{manifest:{id:'standalone',name:'Standalone service',version:'1.0.0',provides:[]},state:{status:'stopped',logs:[]},dependencies:{ready:true,required:[],optional:[],missingRequired:[],missingOptional:[]}}];
 inventory={streamerBot:{connected:true},modules:items};
 const catalogue={modules:items.map((i,index)=>({...i,author:'Sethani',installedVersion:index<60?'1.0.0':'',updateAvailable:index<3,dependencies:{companion:'>=1.3.0',modules:{},optionalModules:{},capabilities:{}},streamerbot:{requiredActions:[]},installationPlan:[],state:index<3?'Update available':'Available'}))};
 ipcMain.handle('navigation-test',(_e,method,...args)=>{if(method==='refresh')return inventory;if(method==='services')return services;if(method==='catalog')return catalogue;if(method==='uiPreferences')return test.host.uiPreferences.read();if(method==='setFavorite')return test.host.uiPreferences.setFavorite(...args);if(method==='apiState')return {port:test.host.controlApi.port};effects++;return null;});
 const preload=path.join(temporary,'navigation-preload.cjs');fs.writeFileSync(preload,"const {contextBridge,ipcRenderer}=require('electron');contextBridge.exposeInMainWorld('companion',Object.fromEntries("+JSON.stringify(['refresh','services','catalog','uiPreferences','setFavorite','apiState','moduleLink','openImport','startAllServices','stopAllServices','serviceAction','setServiceAutoStart','setAllServicesAutoStart','install','copyApiToken','rotateApiToken'])+".map(method=>[method,(...args)=>ipcRenderer.invoke('navigation-test',method,...args)]))); ");
 const desktop=win(preload),run=code=>desktop.webContents.executeJavaScript(code).catch(error=>{throw new Error(code+' :: '+error.message);});
 await desktop.loadFile(path.join(archive,'src/renderer/index.html'));
 await wait(()=>run("document.querySelectorAll('#modules .module').length===121"),'unified inventory');
 assert.equal(await run("document.querySelectorAll('[data-module-id=\"navigation-2\"]').length"),2,'One Installed row and one Catalogue row, no duplicate service row');
 assert.equal(await run("document.querySelector('#panel-installed').hidden"),false);
 assert.equal(await run("document.querySelector('#attention-count').textContent.includes('1 need attention')"),true);
 assert.equal(await run("document.querySelector('#update-count').textContent.includes('3 updates')"),true);
 await run("document.querySelector('#tab-installed').focus();document.querySelector('#tab-installed').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}))");
 assert.equal(await run('document.activeElement.id'),'tab-catalogue');
 await run("document.querySelector('#tab-catalogue').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))");
 assert.equal(await run('document.activeElement.id'),'tab-installed');
 fs.writeFileSync(path.join(__dirname,'../out/navigation-preview.png'),(await desktop.webContents.capturePage()).toPNG());
 await run("document.querySelector('#installed-search').value='cafe module 2';document.querySelector('#installed-search').dispatchEvent(new Event('input'))");
 assert.equal(await run("document.querySelector('#installed-count').textContent"),'21 of 121 modules');
 await run("document.querySelector('#installed-clear').click();document.querySelector('#installed-filter').value='stopped';document.querySelector('#installed-filter').dispatchEvent(new Event('change'))");
 assert.equal(await run("document.querySelector('#installed-count').textContent"),'2 of 121 modules');
 await run("document.querySelector('#installed-filter').value='all';document.querySelector('#installed-filter').dispatchEvent(new Event('change'));document.querySelector('[data-module-id=\"navigation-2\"] .row-toggle').click();document.querySelector('[data-module-id=\"navigation-2\"] .logs').open=true");
 await new Promise(r=>setTimeout(r,100));
 await run("window.savedRow=document.querySelector('[data-module-id=\"navigation-2\"]');window.savedPre=savedRow.querySelector('pre');savedPre.scrollTop=25;document.querySelector('#installed-search').focus();document.querySelector('#installed-search').value='module';document.querySelector('#installed-search').dispatchEvent(new Event('input'))");
 await new Promise(r=>setTimeout(r,3300));
 assert.equal(await run("document.activeElement.id"),'installed-search');
 assert.equal(await run("savedRow===document.querySelector('[data-module-id=\"navigation-2\"]')"),true);
 assert.equal(await run("savedRow.querySelector('.row-details').open && savedRow.querySelector('.logs').open"),true);
 assert.ok(Math.abs(await run('savedPre.scrollTop')-25)<1,'Log scrolling retained within one CSS pixel');
 // A search temporarily opens a folded group but must not overwrite the saved fold.
 await run("document.querySelector('#installed-clear').click();document.querySelector('#modules .category').open=false");await new Promise(r=>setTimeout(r,100));
 await run("document.querySelector('#installed-search').value='cafe';document.querySelector('#installed-search').dispatchEvent(new Event('input'))");await new Promise(r=>setTimeout(r,100));
 assert.equal(await run("document.querySelector('#modules .category').open"),true);
 await run("document.querySelector('#installed-clear').click()");await new Promise(r=>setTimeout(r,100));
 assert.equal(await run("document.querySelector('#modules .category').open"),false);
 // Make desktop's favorite a real dock module and test cross-client synchronization.
 items.push({id:'video',name:'Video',version:'2.2.0',state:'ready',category:'Effects',requiredActions:[],missingActions:[]});await run('refresh()');
 await run("document.querySelector('#modules [data-module-id=video] .favorite').click()");await wait(()=>test.host.uiPreferences.read().favorites.includes('video'),'desktop favorite write');
 const dock1=win(),dock2=win(),dockUrl=test.base+'/api/public/assets/universal-dock/dock/index.html';
 dock1.setSize(320,680);
 await Promise.all([dock1.loadURL(dockUrl),dock2.loadURL(dockUrl)]);
 const d1=code=>dock1.webContents.executeJavaScript(code), d2=code=>dock2.webContents.executeJavaScript(code);
 await wait(()=>d1("document.querySelectorAll('.choice').length===122"),'dock choices');
 assert.equal(await d1("document.querySelector('iframe').getAttribute('src')"),'about:blank','No automatic selection');
 await d1("document.querySelector('#module-picker').click();[...document.querySelectorAll('.choose')].find(b=>b.textContent.startsWith('Video Player ·')).click()");
 await wait(()=>d1("document.querySelector('iframe').contentDocument?.getElementById('refresh-media')!=null"),'selected module controls');
 await d1("window.originalFrame=document.querySelector('iframe').contentWindow;document.querySelector('#module-picker').click();document.querySelector('#search').value='no matches';document.querySelector('#search').dispatchEvent(new Event('input'))");
 await new Promise(r=>setTimeout(r,3300));assert.equal(await d1("originalFrame===document.querySelector('iframe').contentWindow"),true);
 await d1("document.querySelector('#search').value='cafe picker 2';document.querySelector('#search').dispatchEvent(new Event('input'))");
 assert.equal(await d1("document.querySelector('#count').textContent"),'21 of 122 modules');
 await d1("document.querySelector('#clear').click();document.querySelector('.choose').focus()");
 await new Promise(r=>setTimeout(r,3300));assert.equal(await d1("document.activeElement.className"),'choose','Dock polling must retain row focus');
 await d1("document.querySelector('#clear').click();[...document.querySelectorAll('.choice')].find(r=>r.querySelector('.choose').textContent.startsWith('Video Player ·')).querySelector('.star').click()");
 await wait(()=>!test.host.uiPreferences.read().favorites.includes('video'),'dock removes favorite');
 await wait(()=>d2("[...document.querySelectorAll('.choice')].find(r=>r.querySelector('.choose').textContent.startsWith('Video Player ·'))?.querySelector('.star').getAttribute('aria-pressed')==='false'"),'second dock favorite sync');
 await wait(()=>run("document.querySelector('#modules [data-module-id=video] .favorite').getAttribute('aria-pressed')==='false'"),'desktop favorite sync');
 const publicModules=test.host.publicInstalledModules.bind(test.host);test.host.publicInstalledModules=(...args)=>{if(offline)throw new Error('Synthetic outage');const result=publicModules(...args);if(hiddenModule)result.modules=result.modules.filter(m=>m.packageId!=='video');return result;};hiddenModule=true;
 await wait(()=>d1("document.querySelector('#placeholder').textContent.includes('selected module is unavailable') && !document.querySelector('#placeholder').hidden"),'missing selection');
 assert.equal(await d1("localStorage.getItem('companion-dock-selected')"),'video');hiddenModule=false;
 await wait(()=>d1("document.querySelector('iframe').getAttribute('src').includes('/video/')"),'selection recovery');
 offline=true;await wait(()=>d1("document.querySelector('#status').textContent.includes('Companion unavailable')"),'host outage');
 assert.equal(await d1("localStorage.getItem('companion-dock-selected')"),'video');offline=false;
 await wait(()=>d1("document.querySelector('iframe').getAttribute('src').includes('/video/')"),'outage recovery');
 await run("document.querySelector('#tab-catalogue').click();document.querySelector('#catalogue-filter').value='not-installed';document.querySelector('#catalogue-filter').dispatchEvent(new Event('change'))");
 await new Promise(r=>setTimeout(r,100));
 await run('window.scrollTo(0,350)');await new Promise(r=>setTimeout(r,100));
 assert.ok(Math.abs(await run('window.scrollY')-350)<1,'Fixture must scroll before testing restoration');
 await desktop.reload();await wait(()=>run("document.querySelectorAll('#modules .module').length>0"),'desktop reload');
 await wait(()=>run('Math.abs(window.scrollY-350)<1'),'restored scroll');
 assert.equal(await run("document.querySelector('#tab-catalogue').getAttribute('aria-selected')"),'true');assert.equal(await run("document.querySelector('#catalogue-filter').value"),'not-installed');assert.equal(await run("document.querySelector('#installed-search').value"),'');
 assert.equal(effects,0,'Navigation/favorites must not invoke module actions');assert.equal(test.calls.length,0);assert.deepEqual(errors,[]);
 console.log('Hidden navigation acceptance passed: 120 modules, unified rows, search/filters/counts, focus/node/log persistence, folding, restored navigation, desktop/two-dock favorites, stable iframe and missing-selection recovery. No module action executed.');
}
main().catch(error=>{console.error(error.stack);failed=true;}).finally(async()=>{await test?.close();for(const w of windows)w.destroy();app.exit(failed?1:0);});
