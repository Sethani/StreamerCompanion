// Explicit network acceptance only; never included in normal checks or the app payload.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const bundle = path.resolve(process.argv[2]);
const archive = path.join(bundle, "resources/app.asar");
const { CompanionHost } = require(path.join(archive, "src/companion-host"));
const { WebSocketServer } = require(path.join(archive, "node_modules/ws"));

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-github-browser-")); let host, websocket;
  try {
    let actions = [];
    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    websocket.on("connection", (socket) => socket.on("message", (raw) => { const request = JSON.parse(raw); assert.equal(request.request, "GetActions", "No action may run during network acceptance"); socket.send(JSON.stringify({ id: request.id, status: "ok", actions: actions.map((name) => ({ name })) })); }));
    const reserve = http.createServer(); reserve.listen(0, "127.0.0.1"); await once(reserve, "listening"); const port = reserve.address().port; await new Promise((resolve) => reserve.close(resolve));
    host = new CompanionHost({ dataDirectory: path.join(temporary, "data"), controlApiPort: port, streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/" });
    host.start(); await once(host.controlApi.server, "listening");
    const old = await host.catalog.request("https://github.com/Sethani/StreamerCompanion-Modules/releases/download/video-v2.1.1/video-2.1.1.streammodule", 100 * 1024 * 1024);
    const oldFile = path.join(temporary, "video-old.streammodule"); fs.writeFileSync(oldFile, old); await host.installModulePackage(oldFile);
    const marker = path.join(host.dataDirectory, "module-data/video/private.txt"); fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, "synthetic-private-marker"); host.services.config.autoStart.video = true; host.services.saveConfig();
    const inventory = await host.catalog.check(); assert.equal(inventory.error, "");
    const video = inventory.modules.find((item) => item.id === "video"); assert.equal(video.version, "2.2.0"); assert.equal(video.updateAvailable, true); assert.equal(video.problem, "");
    assert.deepEqual(new Set(video.installationPlan.map((item) => item.id)), new Set(["universal-dock", "universal-overlay", "source-modules", "video"]));
    const result = await host.installCatalogModule("video"); assert.equal(result.installed.length, 4); assert.equal(host.registry.readManifest("video").version, "2.2.0");
    assert.equal(fs.readFileSync(marker, "utf8"), "synthetic-private-marker"); assert.equal(host.services.config.autoStart.video, true); assert.equal(host.services.services.size, 0); assert.deepEqual(host.webAssets.listMedia("video"), []);
    let states = await host.listModules(); assert.equal(states.modules.find((item) => item.id === "source-modules").state, "streamerbot-required"); assert.equal(states.modules.find((item) => item.id === "video").state, "missing-dependency");
    actions = states.modules.flatMap((item) => item.requiredActions); states = await host.listModules(); assert.ok(states.modules.every((item) => item.state === "ready"));
    for (const item of states.modules) for (const url of [item.ui?.nodeUrl, item.ui?.extensionOverlayUrl, ...(item.ui?.links || []).map((link) => link.url)].filter(Boolean)) assert.equal((await fetch(url)).status, 200);
    console.log("Real GitHub catalogue and packaged-host upgrade passed: Video 2.1.1 to 2.2.0 plus three dependencies, verified release hashes, preserved synthetic private data/preferences, explicit import states and served browser pages.");
  } finally {
    if (host) { await host.services.stopAll(); await host.controlApi.stop(); }
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); }
    assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true });
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
