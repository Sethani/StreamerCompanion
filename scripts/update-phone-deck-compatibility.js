'use strict';
// Run deliberately after reviewing the affected owner contracts. Never follows
// a live declaration: an incompatible future owner must require a card edit.
const fs=require('node:fs'),path=require('node:path'),schema=require('../modules/phone-deck/service/provider-schema');
const controls={
 'stream-launch':['go-live'],countdown:['start','pause','resume','clear','preset-3','preset-5','status'],
 'audio-routing':['toggle'],wheel:['spin','clear'],video:['play','stop'],
 'phone-deck':['custom-action','title','category'],'chat-routing':['bot-message']
};
const refs={};for(const [packageId,ids]of Object.entries(controls)){const d=require('../modules/'+packageId+'/module.json').ui.phoneDeck;schema.validate(d);for(const controlId of ids){const c=d.controls.find(c=>c.id===controlId);if(!c)throw Error('Missing reviewed compatibility control.');refs[packageId+'/'+controlId]={packageId,controlId,providerRevision:schema.revision(d,c)};}}
fs.writeFileSync(path.join(__dirname,'../modules/phone-deck/service/legacy-contracts.json'),JSON.stringify(refs,null,2)+'\n');
