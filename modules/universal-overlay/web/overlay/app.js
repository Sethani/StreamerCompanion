"use strict";
const transport = StreamingTransport.create();
let modules = [], routing = null, connected = false;
let sceneRevisionFloor = -1;
function render() {
  const wanted = new Map();
  for (const module of modules) {
    if (!connected || module.state !== "ready" || module.packageId === "universal-overlay" || !module.extensionOverlayUrl) continue;
    const rule = routing?.modules?.[module.id];
    if (!rule || rule.mode === "disabled" || rule.mode !== "global" && !(rule.mode === "scenes" && rule.scenes?.includes(routing.currentScene))) continue;
    wanted.set(module.id, module.extensionOverlayUrl);
  }
  for (const frame of document.querySelectorAll("iframe")) if (wanted.get(frame.dataset.module) !== frame.getAttribute("src")) frame.remove();
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
async function refresh() { try { modules = (await StreamingModuleRegistry.load()).modules; await transport.refresh("moduleRouting"); render(); } catch (_) { modules = []; render(); } }
transport.connect(); refresh(); setInterval(refresh, 3000);
