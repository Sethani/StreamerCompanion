// Launched only by test-desktop-smoke.js in a hidden Electron window with temporary data.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const crypto = require("node:crypto");
const { once } = require("node:events");
const electron = require("electron");
const { app } = electron;
const bundle = path.resolve(process.argv[2]);
const temporary = path.resolve(process.argv[3]);
const asar = path.join(bundle, "resources/app.asar");
const { WebSocketServer } = require(path.join(asar, "node_modules/ws"));
const AdmZip = require(path.join(asar, "node_modules/adm-zip"));
const { createDesktop } = require(path.join(asar, "src/desktop"));

app.setPath("userData", temporary);
app.commandLine.appendSwitch("disable-gpu");
let desktop;
let websocket;
const opened = [];
const errors = [];
electron.shell.openExternal = async (url) => { opened.push(url); };

async function freePort() {
  const server = http.createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function waitFor(check, label) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (await check()) return;
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  throw new Error("Timed out: " + label);
}

async function main() {
  websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 });
  await once(websocket, "listening");
  websocket.on("connection", (socket) => socket.on("message", (raw) => socket.send(JSON.stringify({ id: JSON.parse(raw).id, status: "ok", actions: [] }))));
  const servicePort = await freePort();
  const apiPort = await freePort();
  const moduleRoot = path.join(temporary, "modules/desktop-fixture");
  function fixture(version, ready = true) {
    const manifest = {
      schemaVersion: 2, id: "desktop-fixture", name: "Smoke fixture", version,
      description: "Synthetic desktop acceptance fixture.", author: "Sethani", dependencies: { modules: {}, optionalModules: {}, capabilities: { "embedded-node": "required" }, companion: ">=1.1.0" }, streamerbot: { requiredActions: [] },
      service: { apiVersion: 1, entry: "service.js", port: servicePort, healthService: "fixture", healthPath: "/health", settingsPath: "/settings", startTimeoutMs: 1500, dependencies: { requiredCapabilities: ["embedded-node"], optionalCapabilities: ["smoke-extra"] } }
    };
    const source = `const http=require('node:http');const s=http.createServer((q,r)=>{r.setHeader('Content-Type','application/json');r.end(JSON.stringify({service:'fixture',ready:${ready},version:${JSON.stringify(version)}}))});s.listen(Number(process.env.COMPANION_SERVICE_PORT),'127.0.0.1');process.on('SIGTERM',()=>s.close(()=>process.exit(0)));`;
    return { manifest, source };
  }
  fs.mkdirSync(moduleRoot, { recursive: true });
  const initial = fixture("1.0.0");
  fs.writeFileSync(path.join(moduleRoot, "module.json"), JSON.stringify(initial.manifest));
  fs.writeFileSync(path.join(moduleRoot, "service.js"), initial.source);
  const remote = fixture("1.1.0");
  const remoteZip = new AdmZip();
  remoteZip.addFile("module.json", Buffer.from(JSON.stringify(remote.manifest)));
  remoteZip.addFile("service.js", Buffer.from(remote.source));
  const remoteBytes = remoteZip.toBuffer();
  const packageUrl = "https://github.com/Sethani/StreamerCompanion/releases/download/smoke/fixture.streammodule";
  const catalogUrl = "https://github.com/Sethani/StreamerCompanion/releases/download/smoke/modules.json";
  const catalog = { schemaVersion: 1, modules: [{ id: remote.manifest.id, name: remote.manifest.name, description: remote.manifest.description, author: "Sethani", category: "Tests", version: "1.1.0", dependencies: remote.manifest.dependencies, provides: [], streamerbot: remote.manifest.streamerbot, package: { url: packageUrl, sha256: crypto.createHash("sha256").update(remoteBytes).digest("hex") } }] };
  const catalogFetch = async (url) => {
    if (url === packageUrl) return new Response(remoteBytes);
    if (url === catalogUrl) return new Response(JSON.stringify(catalog));
    if (url === "https://api.github.com/repos/Sethani/StreamerCompanion/releases?per_page=30") return new Response(JSON.stringify([{ published_at: "2026-01-01T00:00:00Z", assets: [{ name: "modules.json", browser_download_url: catalogUrl }] }]));
    throw new Error("Unexpected smoke-test network request");
  };
  desktop = createDesktop({
    electron, show: false, preload: "preload.js",
    hostOptions: { streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port, controlApiPort: apiPort, catalogFetch }
  });
  app.on("browser-window-created", (_event, window) => {
    window.webContents.on("preload-error", (_event, _file, error) => errors.push(error.message));
    window.webContents.on("console-message", (details) => { if (details.level === "error") errors.push(details.message); });
  });
  await desktop.ready;
  assert.equal(desktop.window.isVisible(), false);
  const execute = (source) => desktop.window.webContents.executeJavaScript(source);
  await waitFor(() => execute("document.querySelectorAll('#services .service').length === 1 && document.querySelector('#streamerbot').textContent === 'Streamer.bot connected'"), "initial desktop refresh");
  const labels = await execute("[...document.querySelectorAll('#services .actions button')].map(b=>b.textContent)");
  assert.deepEqual(labels, ["Start", "Stop", "Restart", "Settings"]);
  const dependencyText = await execute("document.querySelector('#services .service-meta').textContent");
  assert.ok(dependencyText.includes("Required: embedded-node"));
  assert.ok(dependencyText.includes("Optional: smoke-extra"));
  assert.ok(dependencyText.includes("Optional unavailable: smoke-extra"));
  assert.equal(await execute("document.querySelector('#services .actions button:last-child').disabled"), true);
  async function click(label) {
    await execute("[...document.querySelectorAll('#services .actions button')].find(b=>b.textContent===" + JSON.stringify(label) + ").click()");
  }
  await click("Start");
  await waitFor(() => execute("document.querySelector('#services .status').textContent === 'Running'"), "service Start through IPC");
  await click("Settings");
  await waitFor(() => opened.length === 1, "generic settings handler");
  assert.equal(opened[0], "http://127.0.0.1:" + servicePort + "/settings");
  await execute("document.querySelector('#services .autostart input').click()");
  await waitFor(() => desktop.host.services.config.autoStart["desktop-fixture"] === true, "automatic-start preference");
  const previousPid = desktop.host.services.get("desktop-fixture").process.pid;
  await click("Restart");
  await waitFor(async () => {
    const state = await desktop.host.services.get("desktop-fixture").state();
    return state.status === "running" && state.pid !== previousPid;
  }, "service Restart through IPC");

  await execute("window.confirm = () => true; document.querySelector('#catalog-check').click()");
  await waitFor(() => execute("document.querySelector('#catalog .status')?.textContent === 'Update available'"), "catalogue update comparison");
  await execute("document.querySelector('#catalog .actions button').click()");
  await waitFor(() => execute("document.querySelector('#services h3').textContent.includes('1.1.0')"), "confirmed catalogue update through sandboxed IPC");
  assert.equal(desktop.host.registry.readManifest("desktop-fixture").version, "1.1.0");
  const upgrade = fixture("1.2.0");
  const zip = new AdmZip();
  zip.addFile("module.json", Buffer.from(JSON.stringify(upgrade.manifest)));
  zip.addFile("service.js", Buffer.from(upgrade.source));
  const packageFile = path.join(temporary, "fixture.streammodule");
  zip.writeZip(packageFile);
  electron.dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [packageFile] });
  await execute("document.querySelector('#install').click()");
  await waitFor(() => execute("document.querySelector('#services h3').textContent.includes('1.2.0')"), "hot installation UI refresh");
  assert.equal(desktop.host.registry.readManifest("desktop-fixture").version, "1.2.0");
  assert.equal((await desktop.host.services.get("desktop-fixture").state()).status, "running");
  await execute("document.querySelector('#services details').open = true");
  await new Promise((resolve) => setTimeout(resolve, 2200));
  assert.equal(await execute("document.querySelector('#services details').open"), true, "Periodic refresh should preserve log expansion");
  assert.deepEqual(errors, [], "Renderer/preload errors");
  await click("Stop");
  await waitFor(() => execute("document.querySelector('#services .status').textContent === 'stopped'"), "service Stop through IPC");
  await click("Start");
  await waitFor(() => desktop.host.services.get("desktop-fixture").status === "running", "start before quit cleanup check");
  await new Promise((resolve) => websocket.close(resolve));
  websocket = null;
  app.once("will-quit", () => {
    assert.equal(desktop.host.services.hasRunningServices(), false);
    assert.equal(desktop.host.controlApi.server, null);
    console.log("Hidden Electron desktop passed: sandboxed preload, catalogue comparison/confirmed update, generic settings, Start/Stop/Restart, auto-start, hot upgrade UI, log persistence, and quit cleanup.");
  });
  app.quit();
}

main().catch(async (error) => {
  console.error(error.stack || error.message);
  if (desktop?.host) {
    await desktop.host.services.stopAll();
    await desktop.host.controlApi.stop();
  }
  if (websocket) await new Promise((resolve) => websocket.close(resolve));
  app.exit(1);
});
