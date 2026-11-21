(() => {
  'use strict';
  const $=id=>document.getElementById(id),transport=StreamingTransport.create();let state=null,pending=null,timer=null;
  const buttons=['refresh','play','stop','return','resolve','skip','previous','next'];
  function feedback(text,error=false){$('feedback').textContent=text;$('feedback').className=error?'error':'';}
  function render(){
    for(const id of buttons)$(id).disabled=!!pending;
    if(!state)return;
    $('summary').textContent=`${state.ownerLogin} · Cycle ${state.cycle} · ${state.usedCount} used / ${state.eligibleCount} available · ${state.remainingCount} unused`;
    $('last').textContent=state.lastTitle?`${state.lastTitle} · ${state.lastStatus}`:state.lastStatus;
    $('error').textContent=state.lastError||'';
    const page=state.view||{clips:[],offset:0,total:0};$('clips').replaceChildren();
    for(const clip of page.clips){const row=document.createElement('tr'),title=document.createElement('td'),status=document.createElement('td');title.textContent=clip.title||clip.id;status.textContent=clip.used?'Used':'Unused';row.append(title,status);$('clips').append(row);}
    $('page-status').textContent=page.total?`Clips ${page.offset+1}–${page.offset+page.clips.length} of ${page.total}`:'No clips loaded';
    $('previous').disabled=!!pending||page.offset===0;$('next').disabled=!!pending||page.offset+50>=page.total;
    $('play').disabled=!!pending||!state.eligibleCount||!!state.pendingRequestId;$('skip').disabled=!!pending||!state.pendingRequestId;
  }
  async function command(mode,args={}){
    if(pending)return;const requestId=crypto.randomUUID();pending=requestId;render();feedback('Requesting…');
    timer=setTimeout(()=>{if(pending===requestId){pending=null;feedback('Outcome not confirmed. Check status before retrying; no automatic retry was sent.',true);render();}},30000);
    try{await transport.execute('selfClip',mode,{...args,requestId});if(pending===requestId)feedback('Requested; waiting for the module result.');}
    catch(error){if(pending===requestId){clearTimeout(timer);pending=null;feedback(error.message+' Check status before retrying.',true);render();}}
  }
  $('refresh').onclick=()=>command('Refresh');$('play').onclick=()=>command('Play Next');$('stop').onclick=()=>command('Stop');$('resolve').onclick=()=>command('Resolve Pending');
  $('return').onclick=()=>{if(confirm('Return the last accepted clip to this cycle’s unused pool? This does not replay or stop it.'))command('Return Last');};
  $('skip').onclick=()=>{if(confirm('Mark the unconfirmed selection used without retrying playback? It may already have played.'))command('Skip Pending');};
  $('previous').onclick=()=>command('Show Clips',{offset:Math.max(0,(state?.view?.offset||0)-50)});$('next').onclick=()=>command('Show Clips',{offset:(state?.view?.offset||0)+50});
  transport.subscribe('selfClip',event=>{state=event.payload;const result=pending&&state?.phoneDeckResults?.[pending];if(result){clearTimeout(timer);pending=null;feedback(result.status==='completed'?'Completed. Check the clip player and OBS output.':result.error||'Outcome unconfirmed.',result.status!=='completed');}render();});
  transport.subscribe('connection',health=>{$('connection').textContent=health.connected?'Streamer.bot connected':'Streamer.bot disconnected';});
  transport.connect();window.addEventListener('beforeunload',()=>{clearTimeout(timer);transport.close();});
})();
