'use strict';
const fs=require('node:fs'),crypto=require('node:crypto');
const valid=id=>typeof id==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id);
function fail(message,code=409){throw Object.assign(Error(message),{statusCode:code});}
module.exports=function(file,write,options={}){
 const now=options.now||(()=>performance.now());let record={version:2,owner:null,revision:0,uncertain:false,recovery:null,operations:{}},broken=false,lastSeen=null;
 try{const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.owner!==null&&!valid(saved.owner))throw Error();
  if(saved.version===1){if(Object.keys(saved).some(k=>!['version','owner'].includes(k)))throw Error();record.owner=saved.owner;}
  else if(saved.version===2){if(Object.keys(saved).some(k=>!Object.hasOwn(record,k))||!Number.isSafeInteger(saved.revision)||saved.revision<0||typeof saved.uncertain!=='boolean'||!saved.operations||typeof saved.operations!=='object'||Array.isArray(saved.operations)||Object.keys(saved.operations).length>64)throw Error();for(const[id,op]of Object.entries(saved.operations))if(!valid(id)||!op||!['request-release','confirm-closed'].includes(op.command)||!['pending','completed'].includes(op.status)||typeof op.fingerprint!=='string'||!(/^[a-f0-9]{64}$/.test(op.fingerprint))||Object.keys(op).some(k=>!['command','status','fingerprint'].includes(k)))throw Error();if(saved.recovery!==null&&(Object.keys(saved.recovery).some(k=>!['requestId','command','status'].includes(k))||!valid(saved.recovery?.requestId)||!saved.operations[saved.recovery.requestId]||saved.operations[saved.recovery.requestId].status!==saved.recovery.status||saved.operations[saved.recovery.requestId].command!==saved.recovery.command))throw Error();if(saved.uncertain&&saved.owner!==null||Object.entries(saved.operations).some(([id,op])=>op.status==='pending'&&id!==saved.recovery?.requestId)||saved.recovery?.status==='pending'&&!saved.owner&&!saved.uncertain)throw Error();record=saved;}
  else throw Error();
 }catch(e){if(e.code!=='ENOENT')broken=true;}
 function check(id){if(!valid(id))fail('Invalid renderer session.',400);if(broken)fail('Widget renderer ownership needs an off-stream recovery check.',503);}
 function active(){return lastSeen!==null&&now()-lastSeen>=0&&now()-lastSeen<3000;}
 function observe(id){if(valid(id)&&(broken||record.owner===id))lastSeen=now();}
 function persist(next){if(record.revision>=Number.MAX_SAFE_INTEGER)fail('Renderer ownership needs an off-stream recovery check.',503);next.revision=record.revision+1;try{write(file,next);}catch{fail('Renderer ownership could not be saved.',503);}record=next;broken=false;}
 function status(){return{state:broken?'damaged':record.recovery?.status==='pending'?'release-requested':!record.owner&&!record.uncertain?'idle':active()?'active':'unconfirmed',active:active(),revision:record.revision,recovery:record.recovery?{requestId:record.recovery.requestId,command:record.recovery.command,status:record.recovery.status}:null};}
 function complete(next){if(next.recovery?.status==='pending'){next.recovery.status='completed';next.operations[next.recovery.requestId].status='completed';}}
 function fingerprint(input){return crypto.createHash('sha256').update(JSON.stringify([input.command,input.configRevision,input.offStream===true,input.viewsClosed===true,input.confirmation||''])).digest('hex');}
 function duplicate(input){if(!valid(input.requestId))fail('A unique recovery request ID is required.',400);const op=record.operations[input.requestId];if(op){if(op.fingerprint!==fingerprint(input))fail('Recovery request ID was already used for another operation.');return{requestId:input.requestId,command:op.command,status:op.status};}return null;}
 function recover(input){
  const previous=duplicate(input);if(previous)return previous;
  if(!['request-release','confirm-closed'].includes(input.command))fail('Invalid recovery command.',400);
  if(input.offStream!==true)fail('Confirm streaming is stopped before recovering widgets.',400);
  const next=structuredClone(record);let pending=false;
  if(input.command==='request-release'){
   if(record.recovery?.status==='pending')fail('A renderer release is already pending.');
   if(broken){if(!options.archive)fail('The damaged ownership record could not be archived.',503);try{options.archive(input.requestId);}catch{fail('The damaged ownership record could not be archived.',503);}next.owner=null;next.uncertain=true;}
   pending=!!next.owner||next.uncertain;
  }else{
   if(broken||record.recovery?.status!=='pending')fail('Request renderer release before confirming closed views.');
   if(input.viewsClosed!==true||input.confirmation!=='CLOSED')fail('Close every old overlay view, then explicitly confirm CLOSED.',400);
   if(active())fail('The old renderer is still responding. Wait for release or close its view.');
   complete(next);next.owner=null;next.uncertain=false;
  }
  const op={command:input.command,status:pending?'pending':'completed',fingerprint:fingerprint(input)};next.operations[input.requestId]=op;next.recovery={requestId:input.requestId,command:input.command,status:op.status};
  while(Object.keys(next.operations).length>64)delete next.operations[Object.keys(next.operations)[0]];
  persist(next);if(!record.owner&&!record.uncertain)lastSeen=null;return{requestId:input.requestId,command:op.command,status:op.status};
 }
 return{status,duplicate,recover,operation(id){if(!valid(id))fail('Invalid recovery request ID.',400);const op=record.operations[id];return op?{requestId:id,command:op.command,status:op.status}:null;},
  acquire(id){observe(id);check(id);if(record.uncertain||record.recovery?.status==='pending'||record.owner&&record.owner!==id)return false;if(!record.owner){const next=structuredClone(record);next.owner=id;persist(next);}lastSeen=now();return true;},
  heartbeat(id){observe(id);check(id);return record.owner===id&&!record.uncertain&&record.recovery?.status!=='pending';},
  release(id){check(id);if(record.uncertain||record.owner&&record.owner!==id)return false;if(record.owner){const next=structuredClone(record);next.owner=null;complete(next);persist(next);lastSeen=null;}return true;}
 };
};
