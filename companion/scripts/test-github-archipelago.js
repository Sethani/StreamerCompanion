// Explicit real-download/passive-broker acceptance. Never runs against the user's profile.
const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const { once } = require("node:events");
const bundle = path.resolve(process.argv[2]);
const { CompanionHost } = require(path.join(bundle, "resources/app.asar/src/companion-host"));
async function freePort() { const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening"); const port = server.address().port; await new Promise((resolve) => server.close(resolve)); return port; }
async function waitFor(check) { const until = Date.now() + 12000; while (Date.now() < until) { if (await check()) return; await new Promise((resolve) => setTimeout(resolve, 150)); } throw new Error("Timed out waiting for initial passive broker discovery."); }
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "archipelago-github-")); let host;
  try {
    host = new CompanionHost({ dataDirectory: root, streamerBotUrl: "ws://127.0.0.1:1", controlApiPort: await freePort() });
    const inventory = await host.catalog.check(); assert.equal(inventory.error, "");
    const entry = inventory.modules.find((item) => item.id === "archipelago"); assert.equal(entry.version, "1.0.5"); assert.equal(entry.problem, "");
    await host.installCatalogModule("archipelago");
    assert.equal(host.registry.readManifest("archipelago").version, "1.0.5");
    assert.equal(host.registry.readManifest("universal-dock").version, "1.0.0");
    // Override only the private test installation's port, preserving the published runtime bytes.
    const manifestFile = path.join(host.registry.moduleDirectory("archipelago"), "module.json"), manifest = host.registry.readManifest("archipelago");
    manifest.service.port = await freePort(); fs.writeFileSync(manifestFile, JSON.stringify(manifest)); host.registerInstalledServices();
    await host.availableCapabilities(); await host.services.execute("archipelago", "start");
    const base = "http://127.0.0.1:" + manifest.service.port;
    const html = await (await fetch(base + "/settings")).text(); const csrf = html.match(/name="companion-csrf" content="([^"]+)"/)[1];
    const api = async (body) => { const response = await fetch(base + "/api/settings", { method: body ? "POST" : "GET", headers: { "X-Companion-CSRF": csrf, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) }); assert.equal(response.status, 200); return response.json(); };
    let settings;
    await waitFor(async () => { settings = await api(); return settings.connected || settings.error; });
    assert.equal(settings.config.enabled, false); assert.equal(settings.config.roomId, ""); assert.equal(settings.connected, true, settings.error);
    const testRoom = settings.rooms.find((room) => room.label === "Guru Test"); assert.ok(testRoom, "Keep Controller open with Guru Test exposed for passive acceptance");
    settings = await api({ roomId: testRoom.id }); assert.ok(settings.slots.length > 0);
    const selected = settings.slots.map((slot) => slot.id); await api({ enabled: true, roomId: testRoom.id, profile: { slots: selected } });
    const publicState = await (await fetch(base + "/api/public/state")).json(); assert.equal(publicState.players.length, selected.length);
    assert.equal((await fetch(base + "/overlay")).status, 200);
    await host.services.setAutoStart("archipelago", true); await host.services.execute("archipelago", "restart");
    const health = await (await fetch(base + "/health")).json(); assert.equal(health.configured, true);
    await waitFor(async () => (await (await fetch(base + "/api/public/state")).json()).players.length === selected.length); assert.equal(host.services.config.autoStart.archipelago, true);
    assert.equal(fs.existsSync(path.join(root, "module-data/archipelago/auth.json")), false, "Passive acceptance must not adopt any real key");
    console.log("Released Archipelago GitHub install passed under the packaged host: verified package/dependency hashes, isolated service start/restart, real passive room/slot discovery, stable overlay, saved selections and automatic-start preference; no broker actions or real credentials used.");
  } finally { await host?.services.stopAll(); assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
