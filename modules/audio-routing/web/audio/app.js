const gameVodSafeInput = document.getElementById("game-vod-safe");
const obsStatus = document.getElementById("obs-status");
const obsError = document.getElementById("obs-error");
const liveTrack = document.getElementById("live-track");
const vodTrack = document.getElementById("vod-track");
const planList = document.getElementById("plan-list");
const sourceList = document.getElementById("source-list");
const missingPanel = document.getElementById("missing-panel");
const missingList = document.getElementById("missing-list");
const feedback = document.getElementById("feedback");
const saveButton = document.getElementById("save-button");
const applyButton = document.getElementById("apply-button");

const portable=StreamingTransport.create();
let dirty=false,sourceRouting={},lastState=null,mutationBusy=false,uncertainId='',closed=false;
function showFeedback(message,isError=false){feedback.textContent=message;feedback.className=isError?'feedback error':'feedback';}
function terminal(p,id){return p?.lastRequestId===id&&p.operation?.requestId===id&&['ok','partial','error'].includes(p.operation.status);}
function execute(command,args={}){const requestId=crypto.randomUUID(),mutating=['Save','Apply','Toggle'].includes(command);return new Promise((resolve,reject)=>{let timer,poll,done=false;const finish=(error,p)=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);unsubscribe();error?reject(error):resolve(p);};const unsubscribe=portable.subscribe('audioRouting',event=>{const p=event.payload;if(!terminal(p,requestId))return;finish(p.operation.status==='error'?new Error(p.operation.error||'Operation failed.'):null,p);});timer=setTimeout(()=>{if(mutating)uncertainId=requestId;finish(new Error('Completion was not confirmed. Refresh before retrying; this action was not retried.'));},20000);poll=setInterval(()=>portable.refresh().catch(()=>{}),300);portable.execute('audioRouting',command,{...args,requestId}).catch(error=>finish(error));});}

function formatTracks(tracks) {
  return Array.isArray(tracks) && tracks.length ? tracks.join(", ") : "none";
}

function groupLabel(group) {
  if (group === "liveOnly") return "live-only";
  if (group === "vodSafe") return "VOD-safe";
  if (group === "game") return "game toggle";
  return "other";
}

function routingGroup(name) {
  return sourceRouting[name] || "unmanaged";
}

function routingSelect(name) {
  const select = document.createElement("select");
  select.dataset.sourceName = name;
  [
    ["unmanaged", "Unmanaged"],
    ["liveOnly", "Live only"],
    ["vodSafe", "Live + VOD"],
    ["game", "Game toggle"],
  ].forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    select.append(option);
  });
  select.value = routingGroup(name);
  return select;
}

function sourceRow(entry, missing = false) {
  const group = routingGroup(entry.name);
  const item = document.createElement("li");
  item.className = `source source-${group}${missing ? " source-missing" : ""}`;
  const main = document.createElement("div");
  main.className = "source-main";
  const title = document.createElement("strong");
  title.textContent = entry.name;
  const meta = document.createElement("span");
  meta.textContent = missing ? "Not currently exposed as an OBS audio source" : `tracks ${formatTracks(entry.tracks)}`;
  main.append(title, meta);
  if (entry.target) {
    const target = document.createElement("code");
    target.textContent = entry.target;
    main.append(target);
  }
  const actions = document.createElement("div");
  actions.className = "source-actions";
  actions.append(routingSelect(entry.name));
  if (missing) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.dataset.removeSource = entry.name;
    remove.textContent = "Remove";
    actions.append(remove);
  }
  item.append(main, actions);
  return item;
}

function renderSourceList(list,items,emptyText,missing=false){const wanted=new Set(items.map(entry=>entry.name));for(const row of [...list.children])if(!row.dataset.sourceKey||!wanted.has(row.dataset.sourceKey))row.remove();items.forEach((entry,index)=>{let row=[...list.children].find(row=>row.dataset.sourceKey===entry.name);if(!row){row=sourceRow(entry,missing);row.dataset.sourceKey=entry.name;}else{row.className='source source-'+routingGroup(entry.name)+(missing?' source-missing':'');row.querySelector('.source-main span').textContent=missing?'Not currently exposed as an OBS audio source':'tracks '+formatTracks(entry.tracks);row.querySelector('select').value=routingGroup(entry.name);const target=row.querySelector('code');if(target)target.textContent=entry.target||'';}if(list.children[index]!==row)list.insertBefore(row,list.children[index]||null);});if(!items.length){const item=document.createElement('li');item.className='empty';item.textContent=emptyText;list.append(item);}}

function renderPlan(items) {
  planList.innerHTML = "";
  const managed = items.filter((entry) => routingGroup(entry.name) !== "unmanaged");
  if (!managed.length) {
    planList.innerHTML = '<li class="empty">No managed audio sources.</li>';
    return;
  }
  managed.forEach((entry) => {
    const group = routingGroup(entry.name);
    const tracks = group === "liveOnly" ? [1] : group === "vodSafe" ? [1, 2] : gameVodSafeInput.checked ? [1, 2] : [1];
    const item = document.createElement("li");
    item.className = `source source-${group}`;
    item.innerHTML = `<div class="source-main"><strong></strong><span></span></div>`;
    item.querySelector("strong").textContent = entry.name;
    item.querySelector("span").textContent = `${groupLabel(group)} - tracks ${formatTracks(tracks)}${entry.available === false ? " - unavailable" : ""}`;
    planList.append(item);
  });
}

function renderState(state) {
  lastState = state;
  obsStatus.textContent = state.obsAvailable ? "connected" : "not connected";
  obsError.textContent = state.obsError || "";
  liveTrack.textContent = state.liveTrack || 1;
  vodTrack.textContent = state.vodTrack || 2;
  applyButton.disabled = !state.obsAvailable || mutationBusy || Boolean(uncertainId) || state.operation?.status === "running";
  saveButton.disabled = mutationBusy || Boolean(uncertainId) || state.operation?.status === "running";
  if (!dirty) {
    gameVodSafeInput.checked = Boolean(state.config && state.config.gameAudioVodSafe);
    sourceRouting = { ...(state.config?.sourceRouting || {}) };
  }
  const missing = (state.missingSources || []).filter((entry) => sourceRouting[entry.name]);
  const allConfigured = [...(state.sources || []), ...missing];
  renderPlan(allConfigured);
  renderSourceList(sourceList, state.sources || [], "No audio sources found.");
  missingPanel.hidden = !missing.length;
  renderSourceList(missingList, missing, "No unavailable sources.", true);
}


function draft(){return{version:2,gameAudioVodSafe:gameVodSafeInput.checked,sourceRouting:{...sourceRouting}};}
async function mutate(command){if(mutationBusy||uncertainId)return;mutationBusy=true;if(lastState)renderState(lastState);try{const state=await execute(command,{configJson:JSON.stringify(draft())});dirty=false;renderState(state);const failed=(state.results||[]).filter(r=>r.status==='failed').length,skipped=(state.results||[]).filter(r=>r.status==='skipped').length;showFeedback(command==='Save'?'Audio routing preference saved in Streamer.bot.':failed?'Applied with '+failed+' issue(s).':skipped?'Routing applied; '+skipped+' unavailable source(s) skipped.':'Audio routing applied to OBS.',failed>0);}catch(error){showFeedback(error.message,true);}finally{mutationBusy=false;if(lastState)renderState(lastState);}}
saveButton.onclick=()=>mutate('Save');applyButton.onclick=()=>mutate('Apply');
const refreshButton=document.getElementById('refresh-button');
async function refreshInventory(){try{const p=await execute('Refresh');uncertainId='';renderState(p);}catch(error){showFeedback(error.message,true);}}
refreshButton.onclick=refreshInventory;
portable.subscribe('audioRouting',event=>{if(uncertainId&&terminal(event.payload,uncertainId))uncertainId='';renderState(event.payload);});
portable.subscribe('connection',health=>{if(!health.connected){obsStatus.textContent='Streamer.bot disconnected';applyButton.disabled=true;saveButton.disabled=true;showFeedback('Streamer.bot is unavailable. No Node fallback was used.',true);}});
gameVodSafeInput.addEventListener('input',()=>{dirty=true;if(lastState)renderPlan([...(lastState.sources||[]),...(lastState.missingSources||[]).filter(entry=>sourceRouting[entry.name])]);});
document.body.addEventListener('change',event=>{const select=event.target.closest('select[data-source-name]');if(!select)return;const name=select.dataset.sourceName;if(select.value==='unmanaged')delete sourceRouting[name];else sourceRouting[name]=select.value;dirty=true;select.closest('.source').className='source source-'+select.value+(select.closest('#missing-list')?' source-missing':'');if(lastState)renderPlan([...(lastState.sources||[]),...(lastState.missingSources||[]).filter(entry=>sourceRouting[entry.name])]);});
missingList.addEventListener('click',event=>{const name=event.target.dataset.removeSource;if(!name)return;delete sourceRouting[name];dirty=true;event.target.closest('.source').remove();if(!missingList.children.length)missingPanel.hidden=true;if(lastState)renderPlan([...(lastState.sources||[]),...(lastState.missingSources||[]).filter(entry=>sourceRouting[entry.name])]);});
portable.connect();setTimeout(()=>refreshInventory(),300);const stateTimer=setInterval(()=>portable.refresh().catch(()=>{}),2500),inventoryTimer=setInterval(()=>{if(!mutationBusy&&!closed)refreshInventory();},15000);window.addEventListener('beforeunload',()=>{closed=true;clearInterval(stateTimer);clearInterval(inventoryTimer);portable.close();});
