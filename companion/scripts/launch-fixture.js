const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{once}=require('node:events');
const {WebSocketServer}=require('ws'),{CompanionHost}=require('../src/companion-host'),{buildModules}=require('../../scripts/build-modules');
async function fixture(root,Host=CompanionHost){
 const output=path.join(root,'packages'),catalog=buildModules(['stream-launch','countdown','universal-dock'],{output});
 const websocket=new WebSocketServer({host:'127.0.0.1',port:0});await once(websocket,'listening');
 const allActions=[...catalog.modules.flatMap(m=>m.streamerbot.requiredActions),'Stream - Announce and Bookkeeping'];let actions=[...allActions],revision=0;
 const calls=[],globals=new Map();let payload={status:'idle',config:{enabled:true,fallbackEnabled:true,spotifyEnabled:true,followupEnabled:true,followupAction:'Stream - Announce and Bookkeeping',durationSeconds:180,finishedText:'Fixture finish',startingSoonScene:'Fixture B',retained:'synthetic'},preflight:{ready:true,problems:[],obsConnected:true,obsStreaming:false,scenes:['Fixture B','Fixture A']}};
 function publish(value){payload=value;const envelope={schemaVersion:1,feature:'streamLaunch',revision:++revision,payload};globals.set('portable.streamLaunch.state',JSON.stringify(envelope));for(const socket of websocket.clients)if(socket.readyState===1)socket.send(JSON.stringify({event:{source:'General',type:'Custom'},data:envelope}));}
 publish(payload);
 websocket.on('connection',socket=>socket.on('message',raw=>{const request=JSON.parse(raw);let response={};
  if(request.request==='GetActions')response.actions=actions.map(name=>({name}));
  else if (request.request === 'GetGlobal') response.variables = { [request.variable]: { name: request.variable, value: globals.get(request.variable) } }; else if(request.request==='GetGlobals')response.variables=[...globals].map(([name,value])=>({name,value}));
  else if(request.request==='Subscribe'){}
  else if(request.request==='DoAction'){
   calls.push(request);const name=request.action.name;
   if(name==='Stream - Configure Launch'){const config={...payload.config,...JSON.parse(request.args.config)};publish({...payload,status:'configured',config,preflight:{...payload.preflight,ready:config.enabled,problems:config.enabled?[]:['Launch automation is disabled.']}});}
   else if(name==='Stream - Launch')publish({...payload,status:'complete',spotify:'started',followup:'requested',preflight:{...payload.preflight,obsStreaming:true}});
   else if(['Stream - Initialize Launch','Stream - Launch Health'].includes(name))publish({...payload});
   else throw Error('Unexpected fixture action: '+name);
  }else throw Error('Unexpected fixture request');
  socket.send(JSON.stringify({id:request.id,status:'ok',...response}));
 }));
 const reservation=http.createServer();reservation.listen(0,'127.0.0.1');await once(reservation,'listening');const port=reservation.address().port;await new Promise(r=>reservation.close(r));
 const host=new Host({dataDirectory:path.join(root,'data'),controlApiPort:port,version:require('../package.json').version,streamerBotUrl:'ws://127.0.0.1:'+websocket.address().port+'/',catalogFetch:async url=>{const item=catalog.modules.find(m=>m.package.url===url);if(!item)throw Error('Non-fixture request');return new Response(fs.readFileSync(path.join(output,path.basename(new URL(url).pathname))));}});host.catalog.catalog=catalog;host.start();await once(host.controlApi.server,'listening');await host.installCatalogModule('stream-launch');
 return {host,output,websocket,calls,allActions,publish,payload:()=>payload,setActions:value=>{actions=value;},base:'http://127.0.0.1:'+port,async close(){await host.services.stopAll();await host.controlApi.stop();for(const socket of websocket.clients)socket.terminate();await new Promise(r=>websocket.close(r));}};
}
module.exports={fixture};
