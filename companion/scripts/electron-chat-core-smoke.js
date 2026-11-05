// Actual existing renderer and new settings; synthetic chat/profile providers only.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {app,BrowserWindow}=require('electron'),{fixture,message,waitFor}=require('./chat-core-fixture');
const {once}=require('node:events');
const temporary=path.resolve(process.argv[3]);app.setPath('userData',temporary);app.commandLine.appendSwitch('disable-gpu');
let test,failed=false;const windows=[];const errors=[],blocked=[];
function window(){const w=new BrowserWindow({show:false,width:700,height:600,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});windows.push(w);w.webContents.on('render-process-gone',()=>errors.push('renderer lost'));return w;}
async function main(){
 await app.whenReady();test=await fixture(path.join(temporary,'data'),{config:{appearance:'bubbles=true&timestamp=true&fontsize=24px&max_messages=4&chat_core_delay_ms=20'}});
 const overlay=window(),settings=window();const session=overlay.webContents.session;
 session.webRequest.onBeforeRequest((details,callback)=>{if(details.url.startsWith(test.base+'/')||details.url.startsWith('devtools:')||details.url==='about:blank')return callback({});blocked.push(details.url);callback({cancel:true});});
 await overlay.loadURL(test.base+'/chat/chat.html');await settings.loadURL(test.base+'/settings');
 const view=code=>overlay.webContents.executeJavaScript(code),control=code=>settings.webContents.executeJavaScript(code);
 await waitFor(()=>view('chatCoreSource?.readyState===1'),'renderer feed open');
 await waitFor(()=>control("document.getElementById('connection').textContent.includes('ready')"),'settings connection');
 assert.equal(await view("getComputedStyle(document.documentElement).backgroundColor"),'rgba(0, 0, 0, 0)');
 assert.equal(await view("getComputedStyle(document.body).fontSize"),'24px');
 assert.equal(await control("document.getElementById('preview').hasAttribute('src')"),false,'No live preview opened automatically');
 test.emit('ChatMessage',message('proxy','M: Hello stream'));
 await waitFor(()=>view("document.getElementById('twitch:proxy')?.textContent.includes('Fixture Member')"),'original bubble with proxy');
 assert.ok((await view("document.getElementById('twitch:proxy').textContent")).includes('(She/Her)'));
 assert.equal(await view("document.getElementById('twitch:proxy').querySelector('.msg-text').textContent.trim()"),'Hello stream');
 const emote={messageId:'emote',text:'Hi Kappa',user:{id:'fixture',login:'fixture',name:'Fixture Viewer',color:'#44aa88'},parts:[{type:'text',text:'Hi '},{type:'emote',text:'Kappa',imageUrl:'https://example.invalid/kappa.png'}]};test.emit('ChatMessage',emote);
 await waitFor(()=>view("document.getElementById('twitch:emote')?.querySelector('.msg-text img')!=null"),'emote rendering');
 await new Promise(r=>setTimeout(r,100));assert.equal(await view("document.getElementById('twitch:emote').querySelectorAll('.msg-text img').length"),1,'Pronoun updates must preserve emotes');
 test.emit('ChatMessage',message('unsafe','<img src=x onerror="window.viewerScriptRan=true">'));
 await waitFor(()=>view("document.getElementById('twitch:unsafe')!=null"),'escaped text');assert.equal(await view('window.viewerScriptRan===true'),false);assert.equal(await view("document.getElementById('twitch:unsafe').querySelector('.msg-text img')"),null);
 test.emit('ChatMessageDeleted',{targetMessageId:'proxy'});await waitFor(()=>view("document.getElementById('twitch:proxy')===null"),'message delete');
 test.emit('UserBanned',{targetUser:{id:'fixture'}});await waitFor(()=>view("document.querySelectorAll('.chat-message').length===0"),'ban removes existing user messages');
 // Delete while display delay is pending.
 test.emit('ChatMessage',message('pending'));test.emit('ChatMessageDeleted',{targetMessageId:'pending'});await new Promise(r=>setTimeout(r,120));assert.equal(await view("document.getElementById('twitch:pending')"),null);
 test.emit('Message',{eventId:'yt',message:'YouTube fixture',user:{id:'yt-user',name:'YouTube Viewer'}},'YouTube');await waitFor(()=>view("document.getElementById('youtube:yt')!=null"),'YouTube retained');
 test.emit('MessageDeleted',{eventId:'yt'},'YouTube');await waitFor(()=>view("document.getElementById('youtube:yt')===null"),'YouTube deletion');
 await control("document.getElementById('test-enriched').click()");await waitFor(()=>view("document.querySelector('#chat').textContent.includes('Test Member')"),'operator synthetic test reaches renderer');
 await control("document.getElementById('clear-test').click()");await waitFor(()=>view("!document.querySelector('#chat').textContent.includes('Test Member')"),'clear synthetic only');
 await control("document.querySelector('[name=appearance]').value='http://old.invalid/chat/chat.html?bubbles=true&fontsize=30px&bots=ignored&token=private';document.querySelector('[name=enabled]').checked=false;document.getElementById('settings').requestSubmit()");
 await waitFor(()=>!test.service.config().enabled,'disable/save');assert.equal(test.service.config().appearance.includes('private'),false);
 assert.equal(await control("document.querySelector('[name=appearance]').value.includes('token')"),false);
 await control("document.querySelector('[name=enabled]').checked=true;document.getElementById('settings').requestSubmit()");await waitFor(()=>test.service.status().subscribed,'re-enable');
 const loaded=once(overlay.webContents,'did-finish-load');overlay.reload();await loaded;
 await waitFor(()=>view("getComputedStyle(document.body).fontSize==='30px' && chatCoreSource?.readyState===1"),'saved appearance and connected feed without old query');
 test.emit('ChatMessage',message('recovery','Recovered message'));await waitFor(()=>view("document.getElementById('twitch:recovery')!=null"),'live recovery');
 for(const socket of test.websocket.clients)socket.terminate();await new Promise(r=>setTimeout(r,150));
 assert.equal(await view("getComputedStyle(document.getElementById('connection-status')).display"),'none','No operational note in live output');
 await waitFor(()=>test.service.status().subscribed,'connection restored');
 for(let i=0;i<8;i++)test.emit('ChatMessage',message('bound-'+i));await waitFor(()=>view("document.getElementById('twitch:bound-7')!=null"),'batch');
 // Saved import omitted max_messages, so the managed default is bounded at 200.
 assert.equal(await view('config.ui.max_messages'),200);
 assert.equal(blocked.some(url=>/pluralmind|pronouns\.alejo|127\.0\.0\.1:8080/.test(url)),false,'Browser must never perform independent chat/enrichment requests');
 assert.ok(test.calls.every(call=>['Subscribe','GetStatus'].includes(call.request)));assert.deepEqual(errors,[]);
 console.log('Hidden Live Chatbox passed: retained CSS/bubbles/font/transparency, proxy/pronouns/emotes, escaped viewer text, pending deletion/ban, YouTube, settings/import/disable, synthetic controls, reconnection and no live diagnostics or duplicate browser ingestion.');
}
main().catch(error=>{console.error(error.stack);failed=true;}).finally(async()=>{for(const w of windows)w.destroy();await test?.close();app.exit(failed?1:0);});
