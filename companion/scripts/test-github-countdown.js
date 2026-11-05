// Released package verification only; no live Streamer.bot or timer action.
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), { once } = require("node:events");
const bundle = path.resolve(process.argv[2]), archive = path.join(bundle, "resources/app.asar");
const { CompanionHost } = require(path.join(archive, "src/companion-host")), { WebSocketServer } = require(path.join(archive, "node_modules/ws"));
async function freePort() { const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening"); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "countdown-github-")); let host, websocket;
  try {
    let actions = [];
    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    websocket.on("connection", socket => socket.on("message", raw => { const request = JSON.parse(raw); assert.equal(request.request, "GetActions", "Release installation must not run any countdown or stream action"); socket.send(JSON.stringify({ id: request.id, status: "ok", actions: actions.map(name => ({ name })) })); }));
    host = new CompanionHost({ dataDirectory: root, controlApiPort: await freePort(), streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/" });
    host.start(); await once(host.controlApi.server, "listening");
    const inventory = await host.catalog.check(); assert.equal(inventory.error, "");
    const entry = inventory.modules.find(item => item.id === "countdown"); assert.equal(entry.version, "1.1.0"); assert.equal(entry.problem, "");
    await host.installCatalogModule("countdown");
    let modules = (await host.listModules()).modules; assert.equal(modules.find(item => item.id === "countdown").state, "streamerbot-required");
    actions = host.registry.readManifest("countdown").streamerbot.requiredActions; assert.equal(actions.length, 8);
    modules = (await host.listModules()).modules; assert.equal(modules.find(item => item.id === "countdown").state, "ready"); assert.equal(host.services.services.size, 0);
    const base = "http://127.0.0.1:" + host.controlApi.port;
    const origin = "http://127.0.0.1:7474";
    const response = await fetch(base + "/api/public/modules?browserModules=1", { headers: { Origin: origin } }); assert.equal(response.headers.get("access-control-allow-origin"), origin);
    const modern = (await response.json()).modules.find(item => item.id === "countdown"); assert.equal(modern.state, "ready");
    assert.ok(modern.extensionOverlayUrl.endsWith("/countdown/overlay/index.html"));
    assert.equal((await fetch(modern.extensionOverlayUrl)).status, 200); assert.equal((await fetch(modern.nodeUrl)).status, 200);
    const legacy = await (await fetch(base + "/api/public/modules", { headers: { Origin: origin } })).json(); assert.equal(legacy.modules.find(item => item.id === "countdown").extensionOverlayUrl, "");
    assert.ok(fs.existsSync(path.join(host.registry.moduleDirectory("countdown"), "streamerbot/countdown.sb")));
    console.log("Published Countdown passed in packaged host: GitHub hash/dependency installation, explicit import/Ready states, no child service, served controls/renderer and targeted combined-overlay discovery. No timer/stream/OBS/chat action invoked.");
  } finally { await host?.services.stopAll(); if (host) await host.controlApi.stop(); if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); } assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
