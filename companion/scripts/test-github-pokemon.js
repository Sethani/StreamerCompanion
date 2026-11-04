// Explicit published-package acceptance. Uses only a temporary profile and fake Streamer.bot.
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const { once } = require("node:events");
const bundle = path.resolve(process.argv[2]), archive = path.join(bundle, "resources/app.asar");
const { CompanionHost } = require(path.join(archive, "src/companion-host"));
const { WebSocketServer } = require(path.join(archive, "node_modules/ws"));
async function freePort() { const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening"); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "pokemon-github-")); let host, websocket;
  try {
    let actions = [];
    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    websocket.on("connection", socket => socket.on("message", raw => { const request = JSON.parse(raw); assert.equal(request.request, "GetActions", "No Streamer.bot action may execute"); socket.send(JSON.stringify({ id: request.id, status: "ok", actions: actions.map(name => ({ name })) })); }));
    host = new CompanionHost({ dataDirectory: root, controlApiPort: await freePort(), streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/" });
    host.start(); await once(host.controlApi.server, "listening");
    const inventory = await host.catalog.check(); assert.equal(inventory.error, "");
    const entry = inventory.modules.find(item => item.id === "pokemon-encounters"); assert.equal(entry.version, "1.7.0"); assert.equal(entry.problem, "");
    await host.installCatalogModule("pokemon-encounters");
    assert.equal((await host.listModules()).modules.find(item => item.id === "pokemon-encounters").state, "streamerbot-required");
    actions = ["Pokemon Encounters - Chat", "Pokemon Encounters - Initialize"];
    assert.equal((await host.listModules()).modules.find(item => item.id === "pokemon-encounters").state, "ready");
    const directory = host.registry.moduleDirectory("pokemon-encounters"), manifest = host.registry.readManifest("pokemon-encounters");
    const review = JSON.parse(fs.readFileSync(path.join(directory, "ASSET-PROVENANCE.json"), "utf8")); assert.equal(review.files.length, 45);
    for (const item of review.files) assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(directory, item.path))).digest("hex"), item.sha256);
    assert.ok(fs.existsSync(path.join(directory, review.notice)));
    manifest.service.port = await freePort(); fs.writeFileSync(path.join(directory, "module.json"), JSON.stringify(manifest)); host.registerInstalledServices();
    await host.services.execute("pokemon-encounters", "start"); const base = "http://127.0.0.1:" + manifest.service.port;
    assert.equal((await (await fetch(base + "/health")).json()).enabled, false);
    await fetch(base + "/api/pokemon/config", { method: "POST", body: JSON.stringify({ enabled: true, width: 430, position: "top-left" }) });
    const ghost = await (await fetch(base + "/api/pokemon/test?name=Unidentified%20Ghost")).json(); assert.equal(ghost.encounter.mystery, true);
    const thrown = await (await fetch(base + "/api/pokemon/test-throw?user=Synthetic&ball=great%20ball")).json(); assert.equal(thrown.thrown.ball, "great-ball");
    for (const route of ["/pokemon/settings", "/pokemon/overlay", "/pokemon/type/7.png", "/pokemon/ball/great-ball.png"]) assert.equal((await fetch(base + route)).status, 200);
    await host.services.setAutoStart("pokemon-encounters", true); await host.services.execute("pokemon-encounters", "restart");
    const state = await (await fetch(base + "/health")).json(); assert.equal(state.config.width, 430); assert.equal(state.encounter, null); assert.deepEqual(state.throws, []);
    assert.equal(host.services.config.autoStart["pokemon-encounters"], true);
    assert.equal(host.publicInstalledModules(undefined, false).modules.find(item => item.packageId === "pokemon-encounters").extensionOverlayUrl, "");
    console.log("Published Pokemon GitHub install passed in packaged host: hashes/assets/notices, pending import, isolated start/restart, synthetic mystery/throw, preferences and legacy duplicate guard. No live integration or external Pokemon lookup used.");
  } finally { await host?.services.stopAll(); if (host) await host.controlApi.stop(); if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise(resolve => websocket.close(resolve)); } assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
