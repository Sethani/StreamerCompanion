'use strict';
const fs=require('node:fs'),path=require('node:path'),schema=require('../../modules/phone-deck/service/provider-schema'),{providerFixture}=require('./phone-deck-provider-fixture');
const manifests=Object.fromEntries(['archipelago','controller-input','pokemon-encounters'].map(id=>[id,require('../../modules/'+id+'/module.json')]));
function layout(){const items=[];for(const[packageId,m]of Object.entries(manifests))for(const c of m.ui.phoneDeck.controls){const ref={packageId,controlId:c.id,providerRevision:schema.revision(m.ui.phoneDeck,c),values:{}};items.push({id:packageId+'-'+c.id,type:c.kind,label:c.name,size:'2x1',...(c.kind==='button'?{icon:'gamepad-2',color:'#315f78',action:{type:'provider',...ref}}:{kind:'provider',...ref})});}return{version:3,revision:7,pages:[{id:'games',title:'Games fixture',items}]};}
async function gameFixture(directory){const f=await providerFixture(directory,{serviceOptions:{providerTimeout:1500}});let arch,controller,pokemon;try{
 arch=await require('./archipelago-fixture').fixture(path.join(directory,'archipelago'));
 await arch.service.update({roomId:'alpha',enabled:true,token:'synthetic-private-key'});await arch.service.update({profile:{slots:['0:1'],slotDisplay:{'0:1':{progress:true,logic:false}},display:{showNames:false},filterLocks:{logic:false},eventTypes:['item_send'],maxEvents:4}});
 controller=await require('./controller-fixture').fixture(path.join(directory,'controller'));
 await fetch(controller.base+'/api/controller/settings',{method:'POST',headers:{'X-Companion-CSRF':controller.service.csrf},body:JSON.stringify({enabled:true,x:123,y:234,width:370,height:210,scaleX:1.4,scaleY:0.8,controllerIndex:2})});
 const controllerFile=path.join(directory,'controller/data/config.json'),saved=JSON.parse(fs.readFileSync(controllerFile));fs.writeFileSync(controllerFile,JSON.stringify({...saved,futurePreference:'keep'}));
 pokemon=await require('./pokemon-fixture').fixture(path.join(directory,'pokemon'));
 await fetch(pokemon.base+'/api/pokemon/config',{method:'POST',body:JSON.stringify({enabled:true,width:420,position:'top-left',opacity:67,showThrowNames:false})});
 const owners={archipelago:arch,'controller-input':controller,'pokemon-encounters':pokemon};for(const[id,m]of Object.entries(manifests)){const base=owners[id].base;f.modules.push({packageId:id,name:m.name,category:m.ui.category,state:'ready',nodeUrl:base+m.service.settingsPath,phoneDeck:m.ui.phoneDeck});}
 return{...f,arch,controller,pokemon,async spawn(name='Weedle'){return pokemon.service.handleMessage('pokemoncommunitygame','A wild '+name+' appears Catch it using !pokecatch (winners revealed in 90s)');},close:async()=>{await f.close();await Promise.all([arch.close(),controller.close(),pokemon.close()]);}};
 }catch(e){await f.close();await Promise.allSettled([arch?.close(),controller?.close(),pokemon?.close()]);throw e;}}
module.exports={layout,gameFixture,manifests};
