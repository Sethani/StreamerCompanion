const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { once } = require("node:events");
const { WebSocketServer } = require("ws");
const AdmZip = require("adm-zip");
const { CompanionHost } = require("../src/companion-host");
const { moduleStates } = require("../src/module-state");
const { inside } = require("../src/web-assets");
const { buildModules } = require("../../scripts/build-modules");

async function fixture(temporary, Host = CompanionHost) {
  const output = path.join(temporary, "packages"), catalog = buildModules(["universal-dock", "universal-overlay", "source-modules", "video"], { output });
  const websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
  const calls = [], globals = new Map();
  const allActions = catalog.modules.flatMap((item) => item.streamerbot.requiredActions);
  let actions = [...allActions];
  const broadcast = (value) => { globals.set(value.feature === "video" ? "portable.video.state" : "portable.moduleRouting.state", JSON.stringify(value)); for (const socket of websocket.clients) if (socket.readyState === 1) socket.send(JSON.stringify({ event: { source: "General", type: "Custom" }, data: value })); };
  websocket.on("connection", (socket) => socket.on("message", (raw) => {
    const message = JSON.parse(raw); let response = {};
    if (message.request === "GetActions") response.actions = actions.map((name) => ({ name }));
    else if (message.request === "GetGlobals") response.variables = [...globals].map(([name, value]) => ({ variableName: name, value }));
    else if (message.request === "DoAction") {
      calls.push(message);
      if (message.action.name === "Video - Configure") {
        const current = JSON.parse(globals.get("portable.video.state") || "null");
        broadcast({ schemaVersion: 1, feature: "video", revision: (current?.revision || 0) + 1, payload: { config: JSON.parse(message.args.config), current: { visible: false } } });
      }
      if (message.action.name === "Video - Stop") {
        const current = JSON.parse(globals.get("portable.video.state") || "null");
        if (current && (!message.args.startedAtMs || current.payload.current.startedAtMs === message.args.startedAtMs)) broadcast({ ...current, revision: current.revision + 1, payload: { ...current.payload, current: { visible: false } } });
      }
    }
    socket.send(JSON.stringify({ id: message.id, status: "ok", ...response }));
  }));
  const reservation = http.createServer(); reservation.listen(0, "127.0.0.1"); await once(reservation, "listening"); const port = reservation.address().port; await new Promise((resolve) => reservation.close(resolve));
  const host = new Host({ version: "1.2.0", dataDirectory: path.join(temporary, "data"), controlApiPort: port, streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port + "/", catalogFetch: async (url) => {
    const entry = catalog.modules.find((item) => item.package.url === url);
    if (!entry) throw new Error("Unexpected network request in isolated test.");
    return new Response(fs.readFileSync(path.join(output, path.basename(new URL(url).pathname))));
  } });
  host.catalog.catalog = catalog; host.start(); await once(host.controlApi.server, "listening");
  return { host, catalog, output, websocket, calls, globals, broadcast, allActions, setActions: (value) => { actions = value; }, base: "http://127.0.0.1:" + port,
    async close() { await host.services.stopAll(); await host.controlApi.stop(); for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); }
  };
}

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-web-")); let test;
  try {
    test = await fixture(temporary); const { host, base } = test;
    assert.deepEqual(host.catalog.resolve("video", []).map((item) => item.id), ["universal-dock", "source-modules", "universal-overlay", "video"]);
    await host.installCatalogModule("video");
    assert.equal(host.services.services.size, 0, "Static browser modules must not spawn services");
    assert.ok((await host.listModules()).modules.every((item) => item.state === "ready"));
    assert.ok((await host.availableCapabilities()).has("universal-overlay"));
    const registry = await (await fetch(base + "/api/public/modules")).json();
    assert.equal(registry.modules.find((item) => item.id === "video").nodeUrl, base + "/api/public/assets/video/video/index.html");
    const legacy = await (await fetch(base + "/api/public/modules", { headers: { Origin: "http://127.0.0.1:7474" } })).json();
    for (const module of legacy.modules) {
      for (const field of ["overlays", "actions", "dependencies", "optionalDependencies", "settings", "tests"]) assert.ok(Array.isArray(module[field]), "Legacy UI registry requires " + field);
      assert.ok(["node", "streamerbot", "mixed", "system"].includes(module.ownership));
      assert.equal(module.extensionOverlayUrl, "", "Legacy overlays must not automatically embed the new aggregate overlay or duplicate Video renderer");
    }
    const optedIn = await (await fetch(base + "/api/public/modules?browserModules=1", { headers: { Origin: "http://127.0.0.1:7474" } })).json();
    assert.ok(optedIn.modules.find((item) => item.id === "video").extensionOverlayUrl);
    for (const item of registry.modules) for (const url of [item.nodeUrl, item.extensionOverlayUrl, ...item.links.map((link) => link.url)].filter(Boolean)) assert.equal((await fetch(url)).status, 200, url);
    assert.equal((await fetch(base + "/api/public/assets/video/module.json")).status, 404);
    for (const unsafe of ["../module.json", "x/../../module.json", "C:/private", "x\\y", "x."]) assert.throws(() => inside(path.join(host.registry.moduleDirectory("video"), "web"), unsafe));
    assert.equal((await fetch(base + "/api/public/assets/video/%2e%2e%2fmodule.json")).status, 400);
    assert.equal((await fetch(base + "/api/public/assets/video/video/index.html", { method: "POST" })).status, 405);
    const synthetic = path.join(temporary, "synthetic.webm"); fs.writeFileSync(synthetic, Buffer.from("0123456789"));
    const media = host.webAssets.importMedia("video", [synthetic]);
    assert.equal(media.length, 1); assert.equal(JSON.stringify(media).includes(temporary), false);
    assert.equal(JSON.stringify(await (await fetch(base + "/api/public/media/video")).json()).includes(temporary), false);
    const partial = await fetch(media[0].src, { headers: { Range: "bytes=2-5" } }); assert.equal(partial.status, 206); assert.equal(partial.headers.get("content-range"), "bytes 2-5/10"); assert.equal(await partial.text(), "2345");
    const suffix = await fetch(media[0].src, { headers: { Range: "bytes=-3" } }); assert.equal(await suffix.text(), "789");
    assert.equal((await fetch(media[0].src, { method: "HEAD" })).headers.get("content-length"), "10");
    assert.equal((await fetch(media[0].src, { headers: { Range: "bytes=100-" } })).status, 416);
    assert.equal((await fetch(base + "/api/public/media/video/index.json")).status, 404);
    assert.equal((await fetch(base + "/api/public/media/video/synthetic.webm")).status, 404);
    assert.throws(() => host.webAssets.importMedia("universal-dock", [synthetic]), /does not accept/);
    assert.throws(() => host.webAssets.importMedia("video", [synthetic, __filename]), /supported/);
    assert.equal(host.webAssets.listMedia("video").length, 1);
    const marker = path.join(host.dataDirectory, "module-data/video/private.txt"); fs.writeFileSync(marker, "preserved");
    host.services.config.autoStart.video = true; host.services.saveConfig();
    const zip = new AdmZip(path.join(test.output, "video-2.2.0.streammodule")); const manifest = JSON.parse(zip.readAsText("module.json")); manifest.version = "2.2.1"; zip.updateFile("module.json", Buffer.from(JSON.stringify(manifest)));
    const upgrade = path.join(temporary, "upgrade.streammodule"); zip.writeZip(upgrade); await host.installModulePackage(upgrade);
    assert.equal(host.webAssets.listMedia("video")[0].src, media[0].src); assert.equal(fs.readFileSync(marker, "utf8"), "preserved"); assert.equal(host.services.config.autoStart.video, true);
    zip.deleteFile("web/video/index.html"); manifest.version = "2.2.2"; zip.updateFile("module.json", Buffer.from(JSON.stringify(manifest))); zip.writeZip(upgrade);
    await assert.rejects(host.installModulePackage(upgrade), /Browser page/); assert.equal(host.registry.readManifest("video").version, "2.2.1"); assert.equal(host.webAssets.listMedia("video").length, 1);
    test.setActions([]);
    const pending = await host.listModules(); assert.equal(pending.modules.find((item) => item.id === "source-modules").state, "streamerbot-required"); assert.equal(pending.modules.find((item) => item.id === "video").state, "missing-dependency");
    assert.equal((await fetch(base + "/api/public/assets/video/video/index.html")).status, 409);
    test.setActions(test.allActions);
    fs.renameSync(host.registry.moduleDirectory("universal-dock"), path.join(temporary, "removed-dock"));
    assert.equal((await host.moduleState()).states.get("video").state, "missing-dependency");
    fs.renameSync(path.join(temporary, "removed-dock"), path.join(host.registry.dataDirectory, "universal-dock"));
    assert.equal((await host.moduleState()).states.get("video").state, "ready");
    const items = host.registry.manifests(); assert.equal(moduleStates(items, "1.1.1", [], test.allActions, true).states.get("video").state, "incompatible");
    const mismatch = structuredClone(items); mismatch.find((item) => item.manifest.id === "universal-dock").manifest.version = "2.0.0";
    assert.equal(moduleStates(mismatch, "1.2.0", [], test.allActions, true).states.get("video").state, "missing-dependency");
    const cycle = structuredClone(items); cycle.find((item) => item.manifest.id === "universal-dock").manifest.dependencies.modules.video = "*";
    assert.equal(moduleStates(cycle, "1.2.0", [], test.allActions, true).states.get("universal-overlay").state, "missing-dependency");
    assert.equal(moduleStates(items, "1.2.0", [], [], false).states.get("universal-dock").state, "ready");
    assert.equal(moduleStates(items, "1.2.0", [], [], false).states.get("source-modules").state, "verification-unavailable");
    fs.mkdirSync(path.join(host.registry.dataDirectory, "broken")); fs.writeFileSync(path.join(host.registry.dataDirectory, "broken/module.json"), "bad json");
    assert.equal((await host.listModules()).modules.find((item) => item.id === "broken").state, "broken");
    assert.equal(test.calls.length, 0, "Installing and checking packages must never execute a Streamer.bot action");
    console.log("Browser foundation dependency installation, public assets, traversal/ranges, private media, upgrades/rollback and offline/import states passed.");
  } finally { await test?.close(); assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(temporary, { recursive: true, force: true }); }
}
if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { fixture };
