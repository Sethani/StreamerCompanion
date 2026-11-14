'use strict';
const schema=require('../../modules/phone-deck/service/provider-schema'),{providerFixture}=require('./phone-deck-provider-fixture');
const manifests=Object.fromEntries(['walk-ons','shoutout-clips'].map(id=>[id,require('../../modules/'+id+'/module.json')]));
function layout(){const items=[];for(const[packageId,m]of Object.entries(manifests))for(const c of m.ui.phoneDeck.controls){const values=c.id==='test'?{login:'synthetic'}:c.id==='play'?{clipId:'SyntheticClip'}:{};const ref={packageId,controlId:c.id,providerRevision:schema.revision(m.ui.phoneDeck,c),values};items.push({id:packageId+'-'+c.id,type:c.kind,label:c.name,size:c.kind==='form'?'full':'2x1',...(c.kind==='button'?{icon:'play',color:'#315f78',action:{type:'provider',...ref}}:c.kind==='form'?{mode:'provider',...ref}:{kind:'provider',...ref})});}return{version:3,revision:6,pages:[{id:'entrances',title:'Entrances fixture',items}]};}
async function entranceFixture(directory){const f=await providerFixture(directory);try{
 const walkOns={config:{roster:{synthetic:{enabled:true,type:'soundpool',choices:[{value:'sound-one',weight:2}],volume:0.4},'video-person':{enabled:true,type:'video',value:'private-video'},disabled:{enabled:false,type:'sound',value:'sound-one'}},sounds:{'sound-one':{src:'http://private.invalid/synthetic-hidden-audio',enabled:true}},settings:{oncePerStream:true,defaultVolumePercent:73}},session:{seen:['synthetic','other']}};
 const sound={current:{visible:false,src:'http://private.invalid/synthetic-hidden-audio'}},video={current:{visible:false,id:'unrelated-video'}};
 const clips={config:{maximumDurationSeconds:17,clip:{muted:true,playerMode:'twitch'},label:{textColour:'#abcdef'}},clip:{visible:false}};
 const states={'walk-ons':walkOns,'shoutout-clips':clips};for(const[id,m]of Object.entries(manifests)){f.modules.push({packageId:id,name:m.name,category:m.ui.category,state:'ready',phoneDeck:m.ui.phoneDeck});f.actions.push(...require('../../modules/'+id+'/streamerbot/export.json').data.actions.map(a=>({id:a.id,name:a.name,enabled:a.enabled})));f.globals[m.ui.phoneDeck.state.global]={payload:states[id]};}
 f.globals['portable.walkonSound.state']={payload:sound};f.globals['portable.video.state']={payload:video};let busy=false;const effects=[];
 f.onAction(m=>{const a=m.args,id=m.action.id,w=manifests['walk-ons'].ui.phoneDeck.actions,c=manifests['shoutout-clips'].ui.phoneDeck.actions;
  if(id===w.test.id){if(!busy){effects.push('test');walkOns.lastEvent={login:a.login,test:true};}}
  else if(id===w.stop.id){effects.push('sound-stop');sound.current.visible=false;}
  else if(id===w.reset.id){effects.push('reset');walkOns.session.seen=[];}
  else if(id===c.play.id){effects.push('clip-play');clips.clip={visible:true,clipId:a.clipId,durationMs:17000};}
  else if(id===c.stop.id){effects.push('clip-stop');clips.clip={visible:false};}
 });return{...f,walkOns,sound,video,clips,effects,busy:v=>{busy=v;}};
 }catch(e){await f.close();throw e;}}
module.exports={layout,entranceFixture,manifests};
