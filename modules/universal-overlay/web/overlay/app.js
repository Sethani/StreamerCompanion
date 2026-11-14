"use strict";
const transport = StreamingTransport.create();
const widgetHost = typeof WidgetOverlayHost === "object" ? WidgetOverlayHost.create(document.body) : null;
let modules = [], routing = null, connected = false;
let sceneRevisionFloor = -1, registryFreshUntil = 0, refreshVersion = 0;
function render() {
  widgetHost?.update(modules, routing, connected, registryFreshUntil);
  const wanted = new Map();
  for (const module of modules) {
    if (module.overlayRouting) continue;
    if (!connected || module.state !== "ready" || module.packageId === "universal-overlay" || !module.extensionOverlayUrl) continue;
    const rule = routing?.modules?.[module.id];
    if (!rule || rule.mode === "disabled" || rule.mode !== "global" && !(rule.mode === "scenes" && rule.scenes?.includes(routing.currentScene))) continue;
    wanted.set(module.id, module.extensionOverlayUrl);
  }
  for (const frame of document.querySelectorAll("iframe")) if (!frame.dataset.widgetHost && wanted.get(frame.dataset.module) !== frame.getAttribute("src")) frame.remove();
  for (const [id, url] of wanted) if (![...document.querySelectorAll("iframe")].some((frame) => frame.dataset.module === id)) {
    const frame = document.createElement("iframe"); frame.dataset.module = id; frame.title = id; frame.src = url; frame.allow = "autoplay"; document.body.append(frame);
  }
}
transport.subscribe("moduleRouting", (event) => {
  const scene = routing?.currentScene;
  routing = structuredClone(event.payload);
  if (scene && scene !== routing.currentScene && Number(event.revision) <= sceneRevisionFloor) routing.currentScene = scene;
  else sceneRevisionFloor = Number(event.revision) || 0;
  render();
});
transport.subscribe("connection", (health) => { connected = health.connected; if (!connected) { routing = null; sceneRevisionFloor = -1; } render(); });
transport.subscribe("obs", (event) => { const scene = event.sceneName || event.newSceneName || event.name || event.scene; if (routing && typeof scene === "string") { sceneRevisionFloor = Number(transport.getState("moduleRouting")?.revision) || 0; routing.currentScene = scene; render(); } });
async function refresh() { const version=++refreshVersion;try { const next=(await StreamingModuleRegistry.load()).modules; await transport.refresh("moduleRouting"); if(version!==refreshVersion)return;modules=next;registryFreshUntil=Date.now()+5000;render(); } catch (_) { if(version!==refreshVersion)return;modules = []; registryFreshUntil=0;render(); } }
transport.connect(); refresh(); setInterval(refresh, 3000);
