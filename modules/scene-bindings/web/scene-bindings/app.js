const sceneList = document.getElementById("scene-list");
const obsStatus = document.getElementById("obs-status");
const currentScene = document.getElementById("current-scene");
const lastExecution = document.getElementById("last-execution");
const privateError = document.getElementById("private-error");
const feedback = document.getElementById("feedback");
const refreshButton = document.getElementById("refresh-button");
const saveButton = document.getElementById("save-button");
const portable = window.StreamingTransport.create();
let state = null;
let bindings = {};
let dirty = false, busy=false, refreshing=false, uncertainId="", connected=true;

function showFeedback(message, error = false) {
  feedback.textContent = message;
  feedback.className = error ? "feedback error" : "feedback";
}

function getBinding(sceneName) {
  return bindings[sceneName] || { category: "", window: { processName: "", titleContains: "" } };
}

function windowKey(processName, title) {
  return `${processName}\u0000${title}`;
}

function createWindowSelect(sceneName, binding) {
  const select = document.createElement("select");
  select.dataset.field = "window";
  select.dataset.scene = sceneName;
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "No window focus";
  select.append(none);
  (state.windows || []).forEach((window) => {
    const option = document.createElement("option");
    option.value = windowKey(window.processName, window.title);
    option.textContent = `${window.processName} - ${window.title}`;
    option.dataset.processName = window.processName;
    option.dataset.title = window.title;
    select.append(option);
  });
  const saved=windowKey(binding.window.processName,binding.window.titleContains),exact=[...select.options].find(option=>option.value===saved);
  if(binding.window.processName&&!exact){
    const option=document.createElement("option");option.value=saved;
    const available=(state.windows||[]).some(w=>w.processName.toLowerCase()===binding.window.processName.toLowerCase()&&w.title.toLowerCase().includes(binding.window.titleContains.toLowerCase()));
    option.textContent=binding.window.processName+" - "+(available?"saved title fragment":"unavailable");
    option.dataset.processName=binding.window.processName;option.dataset.title=binding.window.titleContains;select.append(option);
  }
  select.value=binding.window.processName?saved:"";
  return select;
}

function renderRow(sceneName, missing = false) {
  const binding = getBinding(sceneName);
  const row = document.createElement("div");
  row.className = `scene-row${missing ? " missing" : ""}${binding.category || binding.window.processName ? " configured" : ""}`;
  row.dataset.scene = sceneName;

  const name = document.createElement("strong");
  name.className = "scene-name";
  name.textContent = sceneName;
  if (missing) {
    const note = document.createElement("small");
    note.textContent = "Scene unavailable";
    name.append(note);
  }
  const category = document.createElement("input");
  category.type = "text";
  category.maxLength = 80;
  category.placeholder = "No category change";
  category.value = binding.category;
  category.dataset.field = "category";
  category.dataset.scene = sceneName;

  const windowSelect = createWindowSelect(sceneName, binding);
  const title = document.createElement("input");
  title.type = "text";
  title.maxLength = 240;
  title.placeholder = "Optional title fragment";
  title.value = binding.window.titleContains;
  title.dataset.field = "title";
  title.dataset.scene = sceneName;

  const tests = document.createElement("div");
  tests.className = "test-actions";
  const testFocus = document.createElement("button");
  testFocus.type = "button";
  testFocus.textContent = "Test focus";
  testFocus.dataset.action = "focus";
  testFocus.dataset.scene = sceneName;
  testFocus.disabled = !binding.window.processName;
  const testCategory = document.createElement("button");
  testCategory.type = "button";
  testCategory.textContent = "Test category";
  testCategory.dataset.action = "category";
  testCategory.dataset.scene = sceneName;
  testCategory.disabled = !binding.category;
  tests.append(testFocus, testCategory);
  if (missing) {
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.dataset.action = "remove";
    remove.dataset.scene = sceneName;
    tests.append(remove);
  }
  row.append(name, category, windowSelect, title, tests);
  return row;
}

function render() {
  obsStatus.textContent = state.obsAvailable ? "connected" : "not connected";
  currentScene.textContent = state.currentScene || "--";
  const execution = state.lastExecution || {};
  lastExecution.textContent = execution.sceneName ? `${execution.sceneName}: ${execution.status}` : "none";
  privateError.textContent = [state.obsError, state.windowsError].filter(Boolean).join(" ");
  const scenes=[...(state.scenes||[]),...(state.missingScenes||[]).filter(name=>!(state.scenes||[]).includes(name)&&bindings[name])],wanted=new Set(scenes);
  for(const row of [...sceneList.children])if(!wanted.has(row.dataset.scene))row.remove();
  scenes.forEach((name,index)=>{
    const missing=!(state.scenes||[]).includes(name),binding=getBinding(name);let row=[...sceneList.children].find(r=>r.dataset.scene===name);
    if(!row)row=renderRow(name,missing);
    else{
      row.classList.toggle("configured",Boolean(binding.category||binding.window.processName));row.classList.toggle("missing",missing);
      const note=row.querySelector('.scene-name small');if(missing&&!note){const label=document.createElement('small');label.textContent='Scene unavailable';row.querySelector('.scene-name').append(label);}else if(!missing&&note)note.remove();
      const remove=row.querySelector('[data-action="remove"]');if(missing&&!remove){const button=document.createElement('button');button.type='button';button.dataset.action='remove';button.dataset.scene=name;button.textContent='Remove';row.querySelector('.test-actions').append(button);}else if(!missing&&remove)remove.remove();
      row.querySelector('[data-field="category"]').value=binding.category;row.querySelector('[data-field="title"]').value=binding.window.titleContains;
      const select=row.querySelector("select");if(document.activeElement!==select){const replacement=createWindowSelect(name,binding),value=replacement.value;select.replaceChildren(...replacement.options);select.value=value;}
    }
    if(sceneList.children[index]!==row)sceneList.insertBefore(row,sceneList.children[index]||null);
    row.querySelector('[data-action="category"]').disabled=!binding.category||blocked();
    row.querySelector('[data-action="focus"]').disabled=!binding.window.processName||blocked();
  });
  saveButton.disabled=blocked();
}

function renderLiveStatus(liveState) {
  obsStatus.textContent = liveState.obsAvailable ? "connected" : "not connected";
  currentScene.textContent = liveState.currentScene || "--";
  const execution = liveState.lastExecution || {};
  lastExecution.textContent = execution.sceneName ? `${execution.sceneName}: ${execution.status}` : "none";
  if (liveState.obsError) privateError.textContent = liveState.obsError;
}

function blocked(){return busy||refreshing||Boolean(uncertainId)||!connected||state?.operation?.status==="running";}
function acknowledgement(p,id){return p?.completedOperations?.[id]||(p?.lastRequestId===id&&p.operation?.requestId===id?p.operation:null);}
function terminal(p,id){return ["ok","partial","error","superseded"].includes(acknowledgement(p,id)?.status);}
function execute(command,args={}){
 const requestId=crypto.randomUUID(),mutating=command!=="Refresh";
 return new Promise((resolve,reject)=>{
  let timer,poll,done=false,unsubscribe=()=>{};const finish=(error,p)=>{if(done)return;done=true;clearTimeout(timer);clearInterval(poll);unsubscribe();error?reject(error):resolve(p);};
  unsubscribe=portable.subscribe("sceneBindings",event=>{const p=event.payload;if(terminal(p,requestId)){const ack=acknowledgement(p,requestId);finish(["error","partial","superseded"].includes(ack.status)?new Error(ack.error||"Scene link completed with issues."):null,{...p,operation:ack,lastRequestId:requestId});}});
  timer=setTimeout(()=>{if(mutating)uncertainId=requestId;finish(new Error("Completion was not confirmed. Refresh before retrying; no action was retried."));},20000);
  poll=setInterval(()=>portable.refresh().catch(()=>{}),300);
  portable.execute("sceneBindings",command,{...args,requestId}).catch(error=>{if(mutating)uncertainId=requestId;finish(error);});
 });
}
function accept(p){state=p;if(!dirty)bindings=structuredClone(p.config?.bindings||{});render();}
async function refresh(){
 refreshing=true;refreshButton.disabled=true;if(state)render();
 try{const p=await execute("Refresh");uncertainId="";accept(p);showFeedback("Scene and window inventory refreshed.");}
 catch(error){showFeedback(error.message,true);}finally{refreshing=false;refreshButton.disabled=false;if(state)render();}
}
sceneList.addEventListener("input",event=>{
 const field=event.target.dataset.field,name=event.target.dataset.scene;if(!name||!["category","title"].includes(field))return;
 const binding=structuredClone(getBinding(name));if(field==="category")binding.category=event.target.value;else binding.window.titleContains=event.target.value;
 if(!binding.category&&!binding.window.processName)delete bindings[name];else bindings[name]=binding;dirty=true;
 const row=event.target.closest(".scene-row");row.classList.toggle("configured",Boolean(binding.category||binding.window.processName));row.querySelector('[data-action="category"]').disabled=!binding.category||blocked();showFeedback("Unsaved changes.");
});
sceneList.addEventListener("change",event=>{
 if(event.target.dataset.field!=="window")return;const name=event.target.dataset.scene,binding=structuredClone(getBinding(name)),option=event.target.selectedOptions[0];
 binding.window={processName:option?.dataset.processName||"",titleContains:option?.dataset.title||""};if(!binding.category&&!binding.window.processName)delete bindings[name];else bindings[name]=binding;dirty=true;render();showFeedback("Unsaved changes.");
});
sceneList.addEventListener("click",async event=>{
 const button=event.target.closest("button[data-action]");if(!button)return;const name=button.dataset.scene,binding=getBinding(name);
 if(button.dataset.action==="remove"){delete bindings[name];dirty=true;render();showFeedback("Mapping removed locally. Save to keep the change.");return;}
 if(blocked())return;busy=true;render();
 try{await execute(button.dataset.action==="focus"?"Test Focus":"Test Category",button.dataset.action==="focus"?{windowJson:JSON.stringify(binding.window)}:{category:binding.category});showFeedback(button.dataset.action==="focus"?"Window focus confirmed.":"Twitch accepted the category request.");}
 catch(error){showFeedback(error.message,true);}finally{busy=false;if(state)render();}
});
saveButton.addEventListener("click",async()=>{
 if(blocked())return;busy=true;render();
 try{const p=await execute("Save",{configJson:JSON.stringify({version:1,bindings})});dirty=false;accept(p);showFeedback("Scene links saved. Future scene changes will apply them.");}
 catch(error){showFeedback(error.message,true);}finally{busy=false;if(state)render();}
});
refreshButton.addEventListener("click",refresh);
portable.subscribe("sceneBindings",event=>{if(uncertainId&&terminal(event.payload,uncertainId))uncertainId="";accept(event.payload);});
portable.subscribe("connection",health=>{connected=Boolean(health.connected);if(!connected)showFeedback("Streamer.bot is unavailable. No Node fallback was used.",true);if(state)render();});
portable.connect();setTimeout(refresh,300);
const stateTimer=setInterval(()=>portable.refresh().catch(()=>{}),1500);window.addEventListener("beforeunload",()=>{clearInterval(stateTimer);portable.close();});

