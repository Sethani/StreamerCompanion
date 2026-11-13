'use strict';
const schema=require('../../modules/phone-deck/service/provider-schema'),{providerFixture}=require('./phone-deck-provider-fixture');
const manifests=Object.fromEntries(['named-timers','reminders','redeem-checklist'].map(id=>[id,require('../../modules/'+id+'/module.json')]));
function layout(){const items=[];for(const[packageId,m]of Object.entries(manifests))for(const c of m.ui.phoneDeck.controls){const ref={packageId,controlId:c.id,providerRevision:schema.revision(m.ui.phoneDeck,c),values:packageId==='reminders'&&c.id==='add'?{creator:'synthetic'}:{}};items.push({id:packageId+'-'+c.id,type:c.kind==='widget'?'widget':'form',label:c.name,size:'full',...(c.kind==='widget'?{kind:'provider',...ref}:{mode:'provider',...ref})});}return{version:3,revision:5,pages:[{id:'backlogs',title:'Backlog fixture',items}]};}
async function backlogFixture(directory){const f=await providerFixture(directory);try{
 const timers={phoneDeckVersion:1,phoneDeck:{activeCount:0,summary:''},phoneDeckResults:{},timers:[]};
 const reminders={phoneDeckVersion:1,phoneDeck:{openCount:1,unfinished:[{id:'open-one',label:'Synthetic · Current reminder'}]},phoneDeckResults:{},items:[{id:'open-one',status:'open',message:'Current reminder'},{id:'history',status:'completed',message:'synthetic-hidden-history'}]};
 const redeems={phoneDeckVersion:1,phoneDeck:{pendingCount:2,pending:[{id:'redeem-one',label:'Synthetic Reward · First viewer'},{id:'redeem-two',label:'Synthetic Reward · Second viewer'}]},phoneDeckResults:{},pending:[{redemptionId:'redeem-one',rewardId:'synthetic-reward',userInput:'synthetic-hidden-input'},{redemptionId:'redeem-two',rewardId:'synthetic-reward'}],history:[{redemptionId:'synthetic-hidden-history'}]};
 const states={'named-timers':timers,reminders,'redeem-checklist':redeems};for(const[id,m]of Object.entries(manifests)){f.modules.push({packageId:id,name:m.name,category:m.ui.category,state:'ready',phoneDeck:m.ui.phoneDeck});f.actions.push(...require('../../modules/'+id+'/streamerbot/export.json').data.actions.map(a=>({id:a.id,name:a.name,enabled:a.enabled})));f.globals[m.ui.phoneDeck.state.global]={payload:states[id]};}
 let ack='completed';const effects=[];
 f.onAction(m=>{const owner=Object.keys(manifests).find(id=>manifests[id].ui.phoneDeck.actions[Object.keys(manifests[id].ui.phoneDeck.actions)[0]].id===m.action.id);if(!owner)return;const s=states[owner],a=m.args;
  if(ack!=='error'){
   if(owner==='named-timers'){effects.push('timer');timers.timers.push({title:a.timerTitle,endTimeSeconds:Math.floor(Date.now()/1000)+a.timerSeconds});timers.phoneDeck.activeCount=timers.timers.length;timers.phoneDeck.summary=a.timerTitle+': '+a.timerSeconds+'s';}
   else if(owner==='reminders'){if(a.reminderMode==='phone-add'){effects.push('reminder-add');const id='new-'+reminders.items.length;reminders.items.push({id,status:'open',message:a.rawInput});reminders.phoneDeck.unfinished.push({id,label:a.userName+' · '+a.rawInput});}else{effects.push('reminder-complete');reminders.items.find(i=>i.id===a.id).status='completed';reminders.phoneDeck.unfinished=reminders.phoneDeck.unfinished.filter(i=>i.id!==a.id);}reminders.phoneDeck.openCount=reminders.phoneDeck.unfinished.length;}
   else{effects.push(a.resolution);redeems.pending=redeems.pending.filter(i=>i.redemptionId!==a.redemptionId);redeems.phoneDeck.pending=redeems.phoneDeck.pending.filter(i=>i.id!==a.redemptionId);redeems.phoneDeck.pendingCount=redeems.phoneDeck.pending.length;}
  }
  if(ack!=='mismatch')s.phoneDeckResults[a.requestId]={status:ack};else s.phoneDeckResults.unrelated={status:'completed'};
  s.lastOperation={requestId:'newer-unrelated',status:'running'};
 });
 return{...f,timers,reminders,redeems,effects,ack:v=>{ack=v;}};
 }catch(e){await f.close();throw e;}}
module.exports={layout,backlogFixture,manifests};
