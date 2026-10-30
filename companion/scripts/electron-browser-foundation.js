// Hidden acceptance test: synthetic WebSocket, generated media, isolated app profile and ports.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const { app, BrowserWindow } = require("electron");
const { fixture } = require("./test-browser-foundation");
const bundle = path.resolve(process.argv[2]), temporary = path.resolve(process.argv[3]);
const { CompanionHost } = require(path.join(bundle, "resources/app.asar/src/companion-host"));
app.setPath("userData", temporary); app.commandLine.appendSwitch("disable-gpu"); app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
let test, localService; const windows = [];
async function waitFor(check, label, timeout = 12000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) { if (await check()) return; await new Promise((resolve) => setTimeout(resolve, 50)); }
  throw new Error("Timed out: " + label);
}
function window() { const result = new BrowserWindow({ show: false, webPreferences: { contextIsolation: true, nodeIntegration: false, backgroundThrottling: false } }); windows.push(result); return result; }
async function main() {
  await app.whenReady(); test = await fixture(temporary, CompanionHost); await test.host.installCatalogModule("video");
  const generator = window(); await generator.loadURL("data:text/html,<canvas width='64' height='36'></canvas>");
  const bytes = await generator.webContents.executeJavaScript(`(async()=>{
    const canvas=document.querySelector('canvas'),context=canvas.getContext('2d');context.fillStyle='#3498db';context.fillRect(0,0,64,36);
    const stream=canvas.captureStream(15),recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'}),chunks=[];
    const ready=new Promise(resolve=>{recorder.ondataavailable=event=>chunks.push(event.data);recorder.onstop=async()=>{for(const track of stream.getTracks())track.stop();resolve(Array.from(new Uint8Array(await new Blob(chunks).arrayBuffer())));};});
    let tick=0;const interval=setInterval(()=>{context.fillStyle=tick++%2?'#3498db':'#2ecc71';context.fillRect(0,0,64,36);},50);
    recorder.start();setTimeout(()=>{clearInterval(interval);recorder.stop();},1800);return ready;
  })()`);
  const synthetic = path.join(temporary, "synthetic.webm"); fs.writeFileSync(synthetic, Buffer.from(bytes)); assert.ok(bytes.length > 100);
  const [media] = test.host.webAssets.importMedia("video", [synthetic]);
  const config = { schemaVersion: 2, library: { legacy: { id: "legacy", label: "Existing ID", src: "/streaming/videos/synthetic.mp4", enabled: true } }, presentation: { anchor: "center", widthPercent: 50, aspectRatio: "16:9", volumePercent: 25 } };
  test.broadcast({ schemaVersion: 1, feature: "video", revision: 1, payload: { config, current: { visible: false } } });
  test.broadcast({ schemaVersion: 1, feature: "moduleRouting", revision: 1, payload: { version: 1, modules: {}, currentScene: "Synthetic Scene" } });
  const dock = window(); await dock.loadURL(test.base + "/api/public/assets/universal-dock/dock/index.html");
  const executeDock = (source) => dock.webContents.executeJavaScript(source);
  await waitFor(() => executeDock("document.querySelectorAll('#module option').length===2"), "manifest dock entries");
  await executeDock("document.getElementById('module').value='video';document.getElementById('module').dispatchEvent(new Event('change'))");
  await waitFor(() => executeDock("document.querySelector('iframe').contentDocument?.getElementById('refresh-media')!=null"), "Video editor from package");
  await waitFor(() => executeDock("document.querySelector('iframe').contentDocument.getElementById('status').textContent.includes('Connected')"), "editor Streamer.bot state");
  await executeDock("document.querySelector('iframe').contentDocument.getElementById('refresh-media').click()");
  await waitFor(() => executeDock("document.querySelector('iframe').contentDocument.querySelectorAll('.video-row').length===2"), "private media registration");
  await executeDock("{const select=document.querySelector('iframe').contentDocument.querySelector('.video-row select');select.selectedIndex=1;select.dispatchEvent(new Event('change'));}");
  await executeDock("document.querySelector('iframe').contentDocument.getElementById('form').requestSubmit()");
  await waitFor(() => test.calls.some((call) => call.action.name === "Video - Configure"), "editor save");
  assert.equal(JSON.parse(test.calls.find((call) => call.action.name === "Video - Configure").args.config).library[media.id].src, media.src);
  assert.equal(JSON.parse(test.calls.find((call) => call.action.name === "Video - Configure").args.config).library.legacy.src, media.src, "Relinking must retain an existing library/action ID");
  let cors = true; const localCalls = [];
  localService = http.createServer(async (request, response) => {
    if (cors) { response.setHeader("Access-Control-Allow-Origin", "*"); response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS"); response.setHeader("Access-Control-Allow-Headers", "Content-Type"); }
    if (request.method === "OPTIONS") { response.end(); return; }
    if (request.url.startsWith("/action")) { const chunks = []; for await (const chunk of request) chunks.push(chunk); localCalls.push({ url: request.url, method: request.method, body: Buffer.concat(chunks).toString() }); }
    response.setHeader("Content-Type", "application/json"); response.end('{"ready":true}');
  });
  localService.listen(0, "127.0.0.1"); await once(localService, "listening");
  const localRoot = path.join(test.host.registry.dataDirectory, "local-fixture"); fs.mkdirSync(localRoot);
  fs.writeFileSync(path.join(localRoot, "module.json"), JSON.stringify({ schemaVersion: 2, id: "local-fixture", name: "Local fixture", version: "1.0.0", description: "Synthetic local test fixture.", streamerbot: { requiredActions: [] }, ui: { id: "local-fixture", tests: [{ id: "local", name: "Local request", level: "mutating", fields: [{ id: "value", label: "Value", type: "text", value: " synthetic " }], buttons: [{ label: "Local request", localRequest: { url: "http://127.0.0.1:" + localService.address().port + "/action", method: "POST", query: { mode: { literal: "test" } }, body: { value: { field: "value", trim: true } } } }] }] } }));
  const tests = window(); await tests.loadURL(test.base + "/api/public/assets/universal-dock/tests/index.html");
  await waitFor(() => tests.webContents.executeJavaScript("document.querySelectorAll('#tests-video button').length===3"), "manifest tests registration");
  const before = test.calls.length;
  await tests.webContents.executeJavaScript("window.confirm=()=>false;document.querySelector('#tests-video button').click()");
  await new Promise((resolve) => setTimeout(resolve, 150)); assert.equal(test.calls.length, before, "Cancelled test must not run");
  await tests.webContents.executeJavaScript("[...document.querySelectorAll('#tests-video button')].find(button=>button.textContent==='Check health').click()");
  await waitFor(() => test.calls.some((call) => call.action.name === "Video - Health"), "explicit safe test");
  await tests.webContents.executeJavaScript("window.confirm=()=>true;document.querySelector('#tests-local-fixture button').click()");
  await waitFor(() => localCalls.length === 1, "explicit localRequest test"); assert.deepEqual(localCalls[0], { url: "/action?mode=test", method: "POST", body: '{"value":"synthetic"}' });
  await waitFor(() => tests.webContents.executeJavaScript("!document.querySelector('#tests-local-fixture button').disabled"), "local test completion");
  cors = false; await tests.webContents.executeJavaScript("document.querySelector('#tests-local-fixture button').click()");
  await waitFor(() => tests.webContents.executeJavaScript("document.getElementById('status').textContent.includes('test was not sent')"), "blocked cross-origin local service"); assert.equal(localCalls.length, 1, "CORS failure must not send a mutating request");
  const overlay = window(); await overlay.loadURL(test.base + "/api/public/assets/universal-overlay/overlay/index.html");
  const executeOverlay = (source) => overlay.webContents.executeJavaScript(source);
  await new Promise((resolve) => setTimeout(resolve, 400)); assert.equal(await executeOverlay("document.querySelectorAll('iframe').length"), 0, "Unconfigured overlays must stay hidden");
  const playback = (revision, startedAtMs, loop = true) => test.broadcast({ schemaVersion: 1, feature: "video", revision, payload: { config, current: { visible: true, src: media.src, title: "Synthetic title", volume: 0.25, loop, startedAtMs, presentation: config.presentation } } });
  playback(3, 101);
  test.broadcast({ schemaVersion: 1, feature: "moduleRouting", revision: 2, payload: { modules: { video: { mode: "scenes", scenes: ["Synthetic Scene"] } }, currentScene: "Synthetic Scene" } });
  const playing = "document.querySelector('iframe')?.contentDocument?.querySelector('video')?.paused===false";
  await waitFor(() => executeOverlay(playing), "real generated media playback through ranged host route");
  assert.equal(await executeOverlay("document.querySelector('iframe').contentDocument.getElementById('title').textContent"), "Synthetic title");
  assert.equal(await executeOverlay("document.querySelector('iframe').contentDocument.querySelector('video').volume"), 0.25);
  const time = await executeOverlay("document.querySelector('iframe').contentDocument.querySelector('video').currentTime");
  playback(4, 101); await new Promise((resolve) => setTimeout(resolve, 120));
  assert.ok(await executeOverlay("document.querySelector('iframe').contentDocument.querySelector('video').currentTime") >= time, "Duplicate state must not restart playback");
  test.broadcast({ schemaVersion: 1, feature: "moduleRouting", revision: 3, payload: { modules: { video: { mode: "scenes", scenes: ["Synthetic Scene"] } }, currentScene: "Other Scene" } });
  await waitFor(() => executeOverlay("document.querySelectorAll('iframe').length===0"), "scene routing removes playback frame");
  test.broadcast({ schemaVersion: 1, feature: "moduleRouting", revision: 4, payload: { modules: { video: { mode: "global", scenes: [] } }, currentScene: "Other Scene" } });
  await waitFor(() => executeOverlay(playing), "routing back into module");
  playback(5, 202, false);
  await waitFor(() => test.calls.some((call) => call.action.name === "Video - Stop" && call.args.startedAtMs === 202), "natural video completion acknowledgement");
  await waitFor(() => executeOverlay("document.querySelector('iframe').contentDocument.getElementById('player').style.display==='none'"), "completion hides player");
  playback(7, 303);
  await waitFor(() => executeOverlay(playing), "second playback");
  for (const socket of test.websocket.clients) socket.close();
  await waitFor(() => executeOverlay("document.querySelectorAll('iframe').length===0"), "disconnect hides overlays");
  await waitFor(() => executeOverlay(playing), "reconnect restores current globals", 15000);
  assert.equal(test.calls.filter((call) => call.action.name === "Video - Play").length, 0, "Opening pages/reconnecting must never invoke Play");
  assert.ok(windows.every((item) => !item.isVisible()));
  console.log("Packaged hidden browser acceptance passed: manifest Dock/Tests, explicit media/save, real video playback/completion, duplicate state, scene routing, disconnect/reconnect; no live services or data used.");
}
const deadline = setTimeout(() => { console.error("Browser acceptance deadline exceeded"); process.exitCode = 1; app.exit(1); }, 60000);
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => {
  clearTimeout(deadline); for (const item of windows) if (!item.isDestroyed()) item.destroy(); if (localService) await new Promise((resolve) => localService.close(resolve)); await test?.close(); app.exit(process.exitCode || 0);
});
