'use strict';
// Shared by the local editor and service. URLs carry a snapshot, never a saved-name lookup.
(function(root){
 const groups={
  'Layout and text':{direction:['Layout','vertical',['vertical','horizontal']],fontfamily:['Font family','Open Sans'],fontsize:['Font size','large'],emote_size:['Emote size','1.4rem'],max_messages:['Maximum messages','200'],fade_duration:['Fade after (seconds; empty keeps messages)','']},
  'Colors':Object.fromEntries(['background','bubble_color','text_color','msg_color','announcement_color','announcement_bg_color','highlight_color','highlight_bg_color','default_color','bubble_border_color'].map(k=>[k,[k.replaceAll('_',' '),k==='default_color'?'ffe0f0':'','color']])),
  'Bubbles and badges':{bubbles:['Message bubbles',false],bubble_border_radius:['Corner radius (CSS length)',''],bubble_border_size:['Border width (CSS length)',''],badges:['Badges',true],badges_left:['Badges before name',false],pastel:['Pastel name colors',false]},
  'Display and filtering':{timestamp:['Timestamps',false],timestamp_locale:['Timestamp locale','en-US'],highlights:['Highlights',true],announcements:['Announcements',true],bots:['Hidden accounts (comma separated)',''],hide_commands:['Hide commands',false],command_prefix:['Command prefix','!'],cmdprefix:['Legacy command prefix (empty disables legacy filter)','']},
  'Platforms and enrichment':{sb_twitch:['Twitch',true],sb_youtube:['YouTube',true],pronouns:['Pronouns',true],pluralmind:['PluralMind members',true],chat_core_delay_ms:['Enrichment wait (milliseconds, 0–1000)','200']}
 };
 const fields=Object.assign({},...Object.values(groups)),keys=new Set([...Object.keys(fields),'appearance_mode']);
 function clean(value){let p;try{p=new URL(value).searchParams;}catch(_){p=new URLSearchParams(String(value||'').replace(/^\?/,''));}const out=new URLSearchParams();for(const[rawKey,v]of p){const k=rawKey==='background_color'?'bubble_color':rawKey;if(keys.has(k)&&!out.has(k))out.set(k,v.slice(0,1000));}return out;}
 function snapshot(value){const p=clean(value);if(!p.get('command_prefix'))p.set('command_prefix','!');p.set('appearance_mode','standalone');return p.toString();}
 const meta={
  direction:{help:'Normal chat grows from bottom to top. A horizontal ticker scrolls from right to left.'},
  fontfamily:{optional:true,help:'Choose a suggested font or enter an installed font family. OBS needs the same font installed.'},
  fontsize:{optional:true,help:'CSS font size, for example 24px, 1.5rem or x-large.'},
  emote_size:{optional:true,help:'CSS emote height, for example 1.4rem or 32px.'},
  max_messages:{optional:true,type:'number',min:1,step:1,value:'200',help:'Remove the oldest messages after this limit is reached. Default: 200.'},
  fade_duration:{optional:true,type:'number',min:0,step:'any',value:'30',help:'Seconds before a message fades away. Without an override messages stay until the message limit removes them.'},
  bubbles:{help:'Display each message as a bubble instead of the standard chat log.'},
  bubble_border_radius:{optional:true,value:'12px',help:'Bubble corner radius as a CSS length, for example 12px or 1rem.'},
  bubble_border_size:{optional:true,value:'1px',help:'Bubble border width as a CSS length, for example 1px. Bubbles must be enabled.'},
  badges:{help:'Show broadcaster, moderator, VIP and other supplied platform badges.'},
  badges_left:{help:'Place badges before the username.'},pastel:{help:'Soften the colors used for viewer names.'},
  timestamp:{help:'Show the local message time beside the name.'},timestamp_locale:{help:'Time format locale, for example en-US, en-GB or nl-NL.'},
  highlights:{help:'Give highlighted messages their own colors.'},announcements:{help:'Show platform announcements with their own appearance.'},
  bots:{optional:true,help:'Hide accounts by display name, case-insensitively. Separate names with commas.'},
  hide_commands:{help:'Hide original messages beginning with the command prefix after leading whitespace. Other chatboxes and Chat Archive are unaffected.'},
  command_prefix:{help:'Literal prefix for Hide commands, normally !. It is not a regular expression.'},
  cmdprefix:{optional:true,help:'Compatibility with old URLs: hide messages beginning exactly with this prefix, without trimming whitespace. Prefer Hide commands for new designs.'},
  sb_twitch:{help:'Display Twitch messages from the shared Live Chatbox connection.'},sb_youtube:{help:'Display YouTube messages from the shared connection.'},
  pronouns:{help:'Display pronouns when supplied by the service.'},pluralmind:{help:'Display PluralMind member names, colors, pronouns and cleaned message text.'},
  chat_core_delay_ms:{type:'number',min:0,max:1000,step:1,help:'Milliseconds to wait for enrichment before showing ordinary chat. Maximum 1000; later updates can still arrive.'}
 };
 const colorLabels={background:['Page background','Transparent when not overridden. OBS browser-source CSS can override the page background.'],bubble_color:['Bubble fill','Override all bubble backgrounds instead of viewer colors.'],text_color:['Username','Override all username colors.'],msg_color:['Message text','Override the message text color.'],announcement_color:['Announcement text','Text and name color for announcements.'],announcement_bg_color:['Announcement background','Background color for announcements.'],highlight_color:['Highlight text','Text and name color for highlighted messages.'],highlight_bg_color:['Highlight background','Background color for highlighted messages.'],default_color:['Default viewer color','Fallback color for viewers without a supplied color.'],bubble_border_color:['Bubble border','Border color when bubbles and a border width are enabled.']};
 for(const[key,[label,help]]of Object.entries(colorLabels)){fields[key][0]=label;meta[key]={optional:true,type:'color',value:key==='default_color'?'#ffe0f0':'#ffffff',help};}
 const api={groups,fields,meta,keys,clean,snapshot};if(typeof module==='object')module.exports=api;else root.ChatboxOptions=api;
})(typeof window==='object'?window:globalThis);
