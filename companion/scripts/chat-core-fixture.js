const fs=require('node:fs'),path=require('node:path'),{once}=require('node:events');
const {WebSocketServer}=require('ws');
const {createService}=require('../../modules/chat-core/service/runtime');
async function waitFor(check,label,timeout=5000){const until=Date.now()+timeout;while(Date.now()<until){if(await check())return;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out: '+label);}
async function fixture(root,options={}){
 const websocket=new WebSocketServer({host:'127.0.0.1',port:0});await once(websocket,'listening');
 const calls=[],lookups=[];let responses=options.responses,subscriptionStatus='ok';
 websocket.on('connection',socket=>{socket.send(JSON.stringify({request:'Hello'}));socket.on('message',raw=>{const packet=JSON.parse(raw);calls.push(packet);if(!['Subscribe','GetStatus'].includes(packet.request))throw Error('Unexpected chat action');socket.send(JSON.stringify({id:packet.id,status:packet.request==='Subscribe'?subscriptionStatus:'ok'}));});});
 fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'config.json'),JSON.stringify({streamerBotUrl:'ws://127.0.0.1:'+websocket.address().port+'/',enabled:true,...options.config}));
 const factory=options.runtimePath?require(options.runtimePath).createService:createService;
 const service=factory({dataDirectory:root,port:0,reconnectDelay:50,lookupTimeout:100,...options.serviceOptions,fetch:async(url,init)=>{
  lookups.push(url);if(responses)return responses(url,init);
  if(url.endsWith('/api/pronouns'))return Response.json([{name:'theythem',display:'They/Them'}]);
  if(url.includes('/api/users/'))return Response.json([{pronoun_id:'theythem'}]);
  if(url.startsWith('https://pluralmind.chat/'))return Response.json({id:'fixture-system',color:'#00ff00',pronouns:'They/Them',members:[{id:'member',name:'Fixture Member',color:'#ff00ff',pronouns:'She/Her',proxies:[{text:'M:',type:1}],require_space:false,case_sensitive:false}]});
  throw Error('Non-fixture network request');
 }});
 const port=await service.start(),base='http://127.0.0.1:'+port,abort=new AbortController(),events=[];
 const response=await fetch(base+'/api/chat-core/events',{signal:abort.signal});const reader=response.body.getReader();
 const pump=(async()=>{let buffer='';try{while(true){const{done,value}=await reader.read();if(done)break;buffer+=Buffer.from(value).toString();let end;while((end=buffer.indexOf('\n\n'))>=0){const frame=buffer.slice(0,end);buffer=buffer.slice(end+2);const type=/^event: (.+)$/m.exec(frame)?.[1],data=/^data: (.+)$/m.exec(frame)?.[1];if(type&&data)events.push({type,data:JSON.parse(data)});}}}catch(_){}})();
 await waitFor(()=>service.status().subscribed,'chat subscription');
 return {service,websocket,base,events,calls,lookups,setResponses(value){responses=value;},setSubscriptionStatus(value){subscriptionStatus=value;},
  emit(type,data,source='Twitch'){for(const socket of websocket.clients)socket.send(JSON.stringify({event:{source,type},data}));},
  post(route,input,headers={}){return fetch(base+route,{method:'POST',headers:{Origin:base,'Content-Type':'application/json','X-Companion-CSRF':service.csrf,...headers},body:JSON.stringify(input)});},
  async close(){abort.abort();await pump;await service.stop();for(const socket of websocket.clients)socket.terminate();await new Promise(r=>websocket.close(r));}
 };
}
function message(id,body='ordinary message',user='fixture'){return {message:{msgId:id,userId:user,login:user,displayName:'Fixture Viewer',color:'#44aa88',message:body,emotes:[],badges:[]}};}
module.exports={fixture,message,waitFor};
