(() => {
  'use strict';
  const $=id=>document.getElementById(id),transport=StreamingTransport.create();
  let state=null,dirty=false,pending=null,timer=null;
  const buttons=['start','stop','toggle','save','refresh','clear'];
  function feedback(text,error=false){$('feedback').textContent=text;$('feedback').className=error?'error':'';}
  function render(){
    for(const id of buttons)$(id).disabled=!state||!!pending;
    if(!state)return;
    $('status').textContent=`${state.active?'On':'Off'} · ${state.status}${state.currentSource?' · '+state.currentSource:''}`;
    $('error').textContent=state.error||'';
    const c=state.counts||{};$('counts').textContent=`Accepted selections: ${c.videoAccepted||0} videos · ${c.followedAccepted||0} followed clips · ${c.selfAccepted||0} self clips. Player cleared: ${c.playerCleared||0}; failed/timeouts: ${c.failed||0}. Acceptance does not confirm audible output.`;
    $('cache').textContent=`${state.followedCached} channels cached. ${state.refreshRemaining?state.refreshRemaining+' channels left to refresh.':'No refresh running.'}`;
    $('start').disabled=!!pending||state.active||state.pending||!!state.refreshRemaining;
    for(const id of ['save','refresh'])$(id).disabled=!!pending||state.active||!!state.refreshRemaining;
    $('clear').disabled=!!pending||state.active||!state.pending;
    for(const id of ['video','followed','self'])$(id).disabled=!!pending||state.active;
    if(!dirty){for(const id of ['video','followed','self'])$(id).value=state.config[id];
      $('videos').replaceChildren();for(const item of state.videos||[]){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=item.id;input.checked=state.config.videos.includes(item.id);input.onchange=()=>{dirty=true;};label.append(input,document.createTextNode(' '+item.label));$('videos').append(label);}
      if(!(state.videos||[]).length)$('videos').textContent='No enabled registered videos. Add media in Video Player first.';
    }
    for(const input of $('videos').querySelectorAll('input'))input.disabled=!!pending||state.active;
  }
  async function command(mode,args={}){
    if(pending||!state)return;pending={id:crypto.randomUUID(),mode};const requestId=pending.id;render();feedback('Requesting…');
    timer=setTimeout(()=>{if(pending?.id===requestId){pending=null;feedback('Outcome not confirmed. Check session status before retrying; no automatic retry was sent.',true);render();}},30000);
    try{await transport.execute('brb',mode,{...args,requestId});}catch(error){if(pending?.id===requestId){clearTimeout(timer);pending=null;feedback(error.message,true);render();}}
  }
  for(const [id,mode] of Object.entries({start:'Start',stop:'Stop',toggle:'Toggle',refresh:'Refresh'}))$(id).onclick=()=>command(mode);
  $('clear').onclick=()=>{if(confirm('Clear unconfirmed ownership without replaying or stopping media? Check both players first; the request may already have played.'))command('Clear Pending');};
  for(const id of ['video','followed','self'])$(id).oninput=()=>{dirty=true;};
  $('mix').onsubmit=event=>{event.preventDefault();const config=Object.fromEntries(['video','followed','self'].map(id=>[id,Number($(id).value)]));if(Object.values(config).some(v=>!Number.isInteger(v)||v<0||v>100)||config.video+config.followed+config.self!==100){feedback('Use whole percentages totaling 100.',true);return;}config.videos=[...$('videos').querySelectorAll('input:checked')].map(input=>input.value);command('Configure',{config:JSON.stringify(config)});};
  transport.subscribe('brb',event=>{state=event.payload;const result=pending&&state.phoneDeckResults?.[pending.id];if(result){clearTimeout(timer);if(result.status==='completed'&&pending.mode==='Configure')dirty=false;pending=null;feedback(result.status==='completed'?'Completed.':result.error||'Outcome unconfirmed.',result.status!=='completed');}render();});
  transport.subscribe('connection',health=>{$('connection').textContent=health.connected?'Streamer.bot connected':'Streamer.bot disconnected';});
  render();transport.connect();window.addEventListener('beforeunload',()=>{clearTimeout(timer);transport.close();});
})();
