// Explicit network acceptance using only temporary module data and isolated ports.
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http"), { once } = require("node:events");
const bundle = path.resolve(process.argv[2]);
const { CompanionHost } = require(path.join(bundle, "resources/app.asar/src/companion-host"));
async function freePort() { const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening"); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function waitFor(check, label) { const deadline = Date.now() + 12000; while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error("Timed out: " + label); }
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "controller-github-")); let host, nativePid;
  try {
    host = new CompanionHost({ dataDirectory: root, controlApiPort: await freePort(), streamerBotUrl: "ws://127.0.0.1:1" });
    host.start(); await once(host.controlApi.server, "listening");
    const inventory = await host.catalog.check(); assert.equal(inventory.error, "");
    const entry = inventory.modules.find(item => item.id === "controller-input"); assert.equal(entry.version, "1.1.0"); assert.equal(entry.problem, "");
    await host.installCatalogModule("controller-input");
    assert.equal((await host.listModules()).modules.find(item => item.id === "controller-input").state, "ready");
    const manifest = host.registry.readManifest("controller-input"), directory = host.registry.moduleDirectory("controller-input");
    assert.equal(manifest.ui.id, "controller"); assert.deepEqual(manifest.streamerbot.requiredActions, []);
    manifest.service.port = await freePort(); fs.writeFileSync(path.join(directory, "module.json"), JSON.stringify(manifest)); host.registerInstalledServices();
    await host.availableCapabilities(); await host.services.execute("controller-input", "start");
    const base = "http://127.0.0.1:" + manifest.service.port;
    await waitFor(async () => (await (await fetch(base + "/health")).json()).providerStatus === "ready", "native XInput input readiness");
    const html = await (await fetch(base + "/settings")).text(), csrf = html.match(/name="companion-csrf" content="([^"]+)"/)[1];
    const post = async (route, body) => { const response = await fetch(base + route, { method: "POST", headers: { "X-Companion-CSRF": csrf }, body: JSON.stringify(body) }); assert.equal(response.status, 200); return response.json(); };
    assert.equal((await (await fetch(base + "/state")).json()).source, "native-xinput");
    await post("/api/controller/settings", { enabled: true, width: 390, controllerIndex: 2 });
    await post("/api/controller/test", {}); const state = await (await fetch(base + "/api/controller/state")).json(); assert.equal(state.test, true); assert.equal(state.pads[0].index, 2);
    for (const route of ["/settings", "/overlay", "/overlay.js", "/overlay.css"]) assert.equal((await fetch(base + route)).status, 200);
    await host.services.setAutoStart("controller-input", true); await host.services.execute("controller-input", "restart");
    const restarted = await (await fetch(base + "/health")).json(); assert.equal(restarted.config.width, 390); assert.equal(restarted.test, false); assert.equal(host.services.config.autoStart["controller-input"], true);
    await waitFor(async () => (await (await fetch(base + "/health")).json()).providerStatus === "ready", "native helper restart");
    nativePid = Number(fs.readFileSync(path.join(root, "module-data/controller-input/controller-xinput-bridge.pid"), "utf8").trim());
    assert.equal(host.publicInstalledModules(undefined, false).modules.find(item => item.packageId === "controller-input").extensionOverlayUrl, "");
    await host.services.execute("controller-input", "stop");
    await waitFor(() => { try { process.kill(nativePid, 0); return false; } catch (_) { return true; } }, "native helper cleanup");
    console.log("Published Controller passed in packaged host: GitHub hashes/dependency install, no-import Ready, real native helper start/restart/cleanup, synthetic test, preserved layout/auto-start and duplicate guard. Live data/OBS untouched.");
  } finally { await host?.services.stopAll(); if (host) await host.controlApi.stop(); assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
