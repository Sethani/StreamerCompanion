"use strict";
const transport = StreamingTransport.create();
let config = { version: 1, modules: {} }, dirty = false, modules = [];
function routingRows(items) {
  const rows=new Map();
  for(const item of items.filter(m=>m.extensionOverlayUrl&&m.packageId!=="universal-overlay")){
    const p=item.overlayRouting;
    if(p){if(p.version!==1||p.retainOnSceneHide!==true||!Array.isArray(p.groups)||!p.groups.length||p.groups.length>16||new Set(p.groups).size!==p.groups.length||p.groups.some(id=>typeof id!=="string"||!/^[a-z][a-z0-9-]{0,63}$/.test(id)))continue;for(const id of p.groups)rows.set(id,{id,name:item.name+" · "+(typeof p.labels?.[id]==="string"?p.labels[id]:id)});}
    else rows.set(item.id,item);
  }return [...rows.values()];
}
const status = document.getElementById("status"), feedback = document.getElementById("feedback");
function render() {
  if (dirty) return;
  const root = document.getElementById("rules"); root.replaceChildren();
  for (const module of routingRows(modules)) {
    const section = document.createElement("section"), heading = document.createElement("h2"), label = document.createElement("label"), select = document.createElement("select"), scenes = document.createElement("textarea");
    heading.textContent = module.name; label.textContent = "Visibility"; select.dataset.module = module.id;
    for (const [value, text] of [["disabled", "Hidden"], ["global", "All scenes"], ["scenes", "Selected scenes"]]) { const option = document.createElement("option"); option.value = value; option.textContent = text; select.append(option); }
    select.value = config.modules?.[module.id]?.mode || "disabled"; scenes.value = (config.modules?.[module.id]?.scenes || []).join("\n"); scenes.placeholder = "One OBS scene name per line"; scenes.setAttribute("aria-label", module.name + " scenes");
    select.onchange = scenes.oninput = () => { dirty = true; feedback.textContent = "Unsaved changes"; };
    label.append(select); section.append(heading, label, scenes); root.append(section);
  }
}
transport.subscribe("moduleRouting", (event) => { if (!dirty) config = structuredClone(event.payload); status.textContent = "Current scene: " + (event.payload.currentScene || "unavailable"); render(); });
transport.subscribe("connection", (health) => { status.textContent = health.connected ? "Streamer.bot connected" : "Streamer.bot disconnected"; });
document.getElementById("routing").onsubmit = async (event) => {
  event.preventDefault();
  try {
    const rules = {};
    for (const select of document.querySelectorAll("select[data-module]")) rules[select.dataset.module] = { mode: select.value, scenes: select.closest("section").querySelector("textarea").value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean) };
    await transport.execute("moduleRouting", "Save", { moduleRoutingJson: JSON.stringify({ version: 1, modules: rules }) }); dirty = false;
    await transport.refresh(); feedback.textContent = "Routing saved.";
  } catch (error) { feedback.textContent = error.message; }
};
async function refresh() { modules = (await StreamingModuleRegistry.load()).modules; render(); }
transport.connect(); refresh().catch((error) => { feedback.textContent = error.message; }); setInterval(() => refresh().catch(() => {}), 3000);
