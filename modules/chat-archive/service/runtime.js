'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),crypto=require('node:crypto'),{createStore}=require('./store');
const defaults={revision:0,enabled:false,retentionDays:30,archiveAnnouncements:true,archiveDeletedText:false};
function validate(input,current=defaults){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid settings.');
 const next={...current};for(const key of ['enabled','archiveAnnouncements','archiveDeletedText'])if(key in input){if(typeof input[key]!=='boolean')throw Error('Invalid setting.');next[key]=input[key];}
 if('retentionDays'in input){if(!Number.isInteger(input.retentionDays)||input.retentionDays<1||input.retentionDays>3650)throw Error('Retention must be 1–3650 days.');next.retentionDays=input.retentionDays;}
 return next;
}
function createService(options={}){
 const dir=options.dataDirectory||process.env.COMPANION_DATA_DIRECTORY||path.join(process.cwd(),'chat-archive-data');fs.mkdirSync(dir,{recursive:true});const file=path.join(dir,'config.json'),csrf=crypto.randomBytes(24).toString('hex');
 let config={...defaults};if(fs.existsSync(file)){const saved=JSON.parse(fs.readFileSync(file,'utf8'));config=validate(saved);config.revision=Number.isSafeInteger(saved.revision)?saved.revision:0;}
 const store=createStore(dir,options),feed=options.feedUrl||'http://127.0.0.1:3136/api/chat-core/events';
 const feedUrl=new URL(feed);if(feedUrl.protocol!=='http:'||feedUrl.hostname!=='127.0.0.1'||feedUrl.pathname!=='/api/chat-core/events'||feedUrl.username||feedUrl.password||feedUrl.search||feedUrl.hash)throw Error('Invalid local feed.');
 let stopped=false,abort,retry,cleanup,generation=0,pumpTask;const connection={feedConnected:false,chatConnected:false,lastError:''};
 function disconnect(){generation++;abort?.abort();clearTimeout(retry);connection.feedConnected=false;connection.chatConnected=false;}
 function connect(){
  disconnect();if(stopped||!config.enabled)return;const version=generation;abort=new AbortController();const signal=abort.signal;
  pumpTask=(async()=>{let reader;try{
   const response=await fetch(feed,{signal,redirect:'error',headers:{Accept:'text/event-stream'}});if(!response.ok||!response.headers.get('content-type')?.startsWith('text/event-stream'))throw Error('Feed unavailable');
   reader=response.body.getReader();connection.feedConnected=true;connection.lastError='';let buffer='',decoder=new TextDecoder();
   while(!stopped&&version===generation){const result=await reader.read();if(result.done)break;buffer+=decoder.decode(result.value,{stream:true}).replaceAll('\r','');if(buffer.length>1048576)throw Error('Oversized feed');let end;
    while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=/^event: (.+)$/m.exec(frame)?.[1],data=/^data: (.+)$/m.exec(frame)?.[1];if(!data)continue;let message;try{message=JSON.parse(data);}catch(_){continue;}
     if(type==='ready'||type==='connection'){const state=message.connection||message;connection.chatConnected=state.connected===true&&state.subscribed===true;}else if(type==='configuration'){if(!message.enabled)connection.chatConnected=false;}else if(version===generation)store.accept(type,message,config);
    }
   }
  }catch(_){if(version===generation&&!stopped)connection.lastError='Live Chatbox feed unavailable. Messages while disconnected cannot be recovered.';}
  finally{await reader?.cancel().catch(()=>{});if(version===generation){connection.feedConnected=false;connection.chatConnected=false;if(!stopped&&config.enabled)retry=setTimeout(connect,options.reconnectDelay||3000);}}
  })();
 }
 function status(){return{enabled:config.enabled,...connection,count:store.count()};}
 function save(input){if(input.revision!==config.revision){const e=Error('Settings changed in another window. Reload before saving.');e.status=409;throw e;}const next=validate(input,config);next.revision=config.revision+1;fs.writeFileSync(file+'.tmp',JSON.stringify(next,null,2));fs.renameSync(file+'.tmp',file);config=next;if(!config.archiveDeletedText)store.scrub();store.prune(config.retentionDays);connect();return config;}
 const json=(res,code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body));};
 const server=http.createServer(async(req,res)=>{try{
  const host=req.headers.host,origin=req.headers.origin,port=server.address().port;
  if(!['127.0.0.1:'+port,'localhost:'+port].includes(host)||(origin&&origin!=='http://'+host)||req.headers['sec-fetch-site']==='cross-site')return json(res,403,{error:'Same-origin local requests only.'});
  const url=new URL(req.url,'http://'+host),route=url.pathname;
  if(req.method==='GET'&&route==='/health')return json(res,200,{service:'chat-archive',version:'1.0.0',ready:true,configured:true,enabled:config.enabled,connected:connection.feedConnected&&connection.chatConnected});
  if(req.method==='GET'&&['/settings','/settings.js'].includes(route)){res.writeHead(200,{'Content-Type':route.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; object-src 'none'; base-uri 'none'"});return res.end(fs.readFileSync(path.join(__dirname,route==='/settings'?'settings.html':'settings.js')));}
  if(req.method==='GET'&&route==='/api/archive/state')return json(res,200,{config,status:status(),csrf});
  if(req.method==='GET'&&route==='/api/archive/search')return json(res,200,store.page(url.searchParams));
  if(req.method==='GET'&&['/api/archive/export.csv','/api/archive/export.json'].includes(route)){
   const rows=store.exportRows(url.searchParams);const csv=route.endsWith('.csv'),keys=['occurred_at_ms','platform','login','original_name','display_name','pronouns','original_text','displayed_text','message_type','deleted'];
   const cell=value=>'"'+String(/^[\s]*[=+@-]/.test(String(value))?"'"+value:value).replaceAll('"','""')+'"';
   res.writeHead(200,{'Content-Type':csv?'text/csv; charset=utf-8':'application/json','Content-Disposition':'attachment; filename="chat-archive.'+(csv?'csv':'json')+'"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
   return res.end(csv?'\uFEFF'+[keys.join(','),...rows.map(r=>keys.map(k=>cell(r[k])).join(','))].join('\r\n'):JSON.stringify({schemaVersion:1,rows}));
  }
  if(req.method==='POST'&&['/api/archive/config','/api/archive/cleanup'].includes(route)){
   if(origin!=='http://'+host||req.headers['x-companion-csrf']!==csrf)return json(res,403,{error:'Invalid request token.'});
   let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>8192)return json(res,413,{error:'Request too large.'});}const input=raw?JSON.parse(raw):{};
   if(route.endsWith('/config'))return json(res,200,{config:save(input)});
   return json(res,200,{removed:store.prune(config.retentionDays)});
  }
  return json(res,404,{error:'Not found.'});
 }catch(e){return json(res,e.status||400,{error:e.status===409?e.message:'Archive request failed. Check settings and filters.'});}});
 return{server,store,status,config:()=>({...config}),csrf,
  async start(){await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(options.port??Number(process.env.COMPANION_SERVICE_PORT||3146),'127.0.0.1',resolve);});store.prune(config.retentionDays);cleanup=setInterval(()=>{try{store.prune(config.retentionDays);}catch(_){connection.lastError='Retention cleanup failed.';}},3600000);connect();return server.address().port;},
  async stop(){stopped=true;disconnect();clearInterval(cleanup);await pumpTask;if(server.listening){server.closeAllConnections();await new Promise(r=>server.close(r));}store.close();}
 };
}
if(require.main===module){let service;try{service=createService();service.start().catch(()=>{console.error('Chat Archive could not start.');process.exitCode=1;});}catch(_){console.error('Chat Archive storage could not open. Existing files were retained.');process.exitCode=1;}for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>service?.stop().finally(()=>process.exit(0)));}
module.exports={createService,validate};
