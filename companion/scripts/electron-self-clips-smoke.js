'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{app,BrowserWindow}=require('electron'),{fixture}=require('./self-clips-fixture');
const root=path.resolve(process.argv[3]);app.setPath('userData',root);app.commandLine.appendSwitch('disable-gpu');let test,window;const errors=[];
const {once}=require('node:events');
async function wait(fn,label){const end=Date.now()+10000;while(Date.now()<end){if(await fn())return;await new Promise(r=>setTimeout(r,40));}throw Error('Timed out: '+label);}
async function main(){await app.whenReady();test=await fixture(root);window=new BrowserWindow({show:false,width:760,height:800,webPreferences:{contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});window.webContents.on('console-message',(_e,level,message)=>{if(level>=3)errors.push(message)});
 window.webContents.session.webRequest.onBeforeRequest((details,callback)=>callback({cancel:!details.url.startsWith(test.base)&&!details.url.startsWith('ws://127.0.0.1:')}));
 const run=code=>window.webContents.executeJavaScript(code);await window.loadURL(test.base+'/api/public/assets/self-clips/self-clips/index.html');
 await wait(()=>run("document.querySelector('#connection').textContent==='Streamer.bot connected'"),'connection');await wait(()=>run("document.querySelector('#summary').textContent.includes('Cycle 1')"),'initial state');assert.equal(test.commands.length,0,'Opening controls dispatched a command');
 await run("document.querySelector('#refresh').click()");await wait(()=>run("document.querySelectorAll('#clips tr').length===2"),'catalogue');assert.equal(test.commands[0].name,'Self Clips - Refresh');
 assert.equal(await run("document.querySelector('#clips img')"),null,'Clip title executed HTML');assert.equal(await run("document.querySelector('#clips td').textContent"),'<img src=x onerror=alert(1)>');
 await wait(()=>run("!document.querySelector('#play').disabled"),'acknowledged refresh');await run("document.querySelector('#play').click()");await wait(()=>test.payload.usedCount===1,'play request');await wait(()=>run("document.querySelector('#feedback').textContent.startsWith('Completed')"),'acknowledgement');
 const request=test.commands.find(c=>c.name==='Self Clips - Play Next').args.requestId;assert.match(request,/^[0-9a-f-]{36}$/i);
 await run('void(window.confirm=()=>false)');const count=test.commands.length;await run("document.querySelector('#return').click()");assert.equal(test.commands.length,count,'Cancelled return dispatched');
 await run('void(window.confirm=()=>true)');await run("document.querySelector('#return').click()");await wait(()=>test.payload.usedCount===0,'confirmed return');await wait(()=>run("!document.querySelector('#play').disabled"),'return ack');
 test.payload.pendingRequestId='uncertain';test.payload.lastError='Outcome unknown';test.publish();await wait(()=>run("document.querySelector('#play').disabled && !document.querySelector('#skip').disabled"),'pending guard');
 await run("document.querySelector('#skip').click()");await wait(()=>test.payload.pendingRequestId==='','skip unknown');await wait(()=>run("!document.querySelector('#refresh').disabled"),'skip ack');
 test.setHold(true);await run("document.querySelector('#play').click();document.querySelector('#play').click()");await wait(()=>test.commands.at(-1)?.name==='Self Clips - Play Next','held request');assert.equal(test.commands.filter(c=>c.name==='Self Clips - Play Next').length,2,'Double click duplicated request');
 const loaded=once(window.webContents,'did-finish-load');window.reload();await loaded;await wait(()=>run("document.querySelector('#summary').textContent.includes('Cycle 1')"),'reload');assert.equal(test.commands.filter(c=>c.name==='Self Clips - Play Next').length,2,'Reload retried playback');
 assert.equal(await run('document.documentElement.scrollWidth<=innerWidth'),true,'Narrow layout overflow');assert.deepEqual(errors,[]);
 console.log('Self Clips browser passed: real packaged controls/transport, inert open/reload, safe clip titles, correlated results, confirmed recovery, unknown guard, double-click prevention and narrow layout. Synthetic native transport only.');
}
main().catch(error=>{console.error(error);process.exitCode=1}).finally(async()=>{window?.destroy();await test?.close();app.exit(process.exitCode||0)});
