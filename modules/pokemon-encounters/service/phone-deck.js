'use strict';
// Kept byte-identical in the three Session 11 packages so each installs independently.
const crypto=require('node:crypto');
module.exports=function make({prefix,port,state,context=()=>'',commands,execute,read,write,validate=()=>true}){
 const secret=crypto.randomBytes(32);let queue=Promise.resolve(),closed=false;
 const scope=()=>crypto.createHash('sha256').update(String(context())).digest('hex');
 const token=()=>crypto.createHmac('sha256',secret).update(scope()).digest('hex');
 function allowed(req,mutation){const host=req.headers.host,origins=['http://127.0.0.1:'+port(),'http://localhost:'+port()];return origins.some(o=>new URL(o).host===host)&&(!req.headers.origin||origins.includes(req.headers.origin)&&new URL(req.headers.origin).host===host)&&req.headers['sec-fetch-site']!=='cross-site'&&(!mutation||req.headers['x-companion-csrf']===token());}
 function send(res,status,value){const bytes=Buffer.from(JSON.stringify(value));res.writeHead(status,{'Content-Type':'application/json','Content-Length':bytes.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(bytes);return true;}
 async function handle(req,res,url){if(!url.pathname.startsWith(prefix))return false;const reply=(code,v)=>send(res,code,v);if(closed)return reply(503,{error:'Owner is stopping.'});if(!allowed(req,req.method!=='GET'))return reply(403,{error:'Unexpected host, origin or CSRF token.'});
  if(req.method==='GET'&&url.pathname===prefix+'state'){try{return reply(200,{...await state(),csrf:token()});}catch{return reply(503,{error:'Owner state is unavailable.'});}}
  if(req.method!=='POST'||url.pathname!==prefix+'control')return reply(404,{error:'Not found.'});
  let input;try{let length=0;const chunks=[];for await(const c of req){length+=c.length;if(length>4096)throw Error();chunks.push(c);}input=JSON.parse(Buffer.concat(chunks).toString());if(!input||Array.isArray(input)||Object.keys(input).some(k=>!['command','requestId'].includes(k))||!commands.includes(input.command)||typeof input.requestId!=='string'||!/^[\w-]{1,128}$/.test(input.requestId))throw Error();}catch{return reply(400,{error:'Invalid module control request.'});}
  const operation=async()=>{
   if(closed)return reply(503,{error:'Owner is stopping; nothing was dispatched.'});
   const guard=()=>{if(closed||!allowed(req,true))throw Object.assign(Error('Selected context changed.'),{statusCode:403});};
   try{guard();}catch{return reply(403,{error:'Selected context changed; refresh before another operation.'});}
   let records;try{records=read();if(!records||Array.isArray(records)||typeof records!=='object')throw Error();}catch{return reply(503,{error:'Operation history is unavailable; nothing was dispatched.'});}
   const intent=JSON.stringify([input.command,scope()]),old=Object.hasOwn(records,input.requestId)?records[input.requestId]:null;
   if(old)return reply(old.intent===intent&&old.status==='requested'?200:409,{status:old.status,error:old.intent===intent&&old.status==='requested'?undefined:'Previous request was not replayed.'});
   try{if(!validate(input))return reply(503,{error:'Operation is unavailable; nothing was dispatched.'});}catch{return reply(503,{error:'Operation is unavailable; nothing was dispatched.'});}
   const record={intent,status:'unknown'};Object.defineProperty(records,input.requestId,{value:record,enumerable:true,configurable:true,writable:true});while(Object.keys(records).length>256)delete records[Object.keys(records)[0]];
   try{write(records);}catch{return reply(503,{error:'Could not save the intent; nothing was dispatched.'});}
   try{await execute(input,guard);record.status='requested';write(records);return reply(200,{status:'requested'});}catch(e){return reply(e.statusCode===403?403:502,{error:e.statusCode===403?'Selected context changed; nothing was dispatched.':'Operation outcome is unknown; no automatic retry was made.'});}
  };
  const result=queue.then(operation);queue=result.catch(()=>{});return result;
 }
 handle.stop=()=>{closed=true;return queue;};return handle;
};
