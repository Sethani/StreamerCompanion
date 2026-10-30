// Explicit network acceptance test; never part of automatic checks.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { once } = require("node:events");
const { WebSocketServer } = require("ws");
const { CompanionHost } = require("../src/companion-host");

async function freePort() {
  const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = server.address().port; await new Promise((resolve) => server.close(resolve)); return port;
}

async function main() {
  const phase = process.argv[2];
  const expected = process.argv[3] || (phase === "baseline" ? "1.0.1" : "1.0.2");
  assert.ok(["baseline", "upgrade"].includes(phase), "Choose baseline or upgrade phase");
  const occupied = await new Promise((resolve) => {
    const socket = net.connect({ host: "127.0.0.1", port: 3140 });
    socket.once("connect", () => { socket.destroy(); resolve(true); }); socket.once("error", () => resolve(false));
  });
  assert.equal(occupied, false, "Update Probe port 3140 is occupied; refusing to touch another service");
  const output = path.resolve(__dirname, "../out"); fs.mkdirSync(output, { recursive: true });
  const stateFile = path.join(output, "github-update-test.json");
  const state = phase === "baseline" ? { directory: fs.mkdtempSync(path.join(os.tmpdir(), "companion-github-")) } : JSON.parse(fs.readFileSync(stateFile, "utf8"));
  assert.ok(path.resolve(state.directory).startsWith(path.resolve(os.tmpdir()) + path.sep + "companion-github-"));
  let host;
  let websocket;
  let complete = false;
  try {
    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    websocket.on("connection", (socket) => socket.on("message", (raw) => socket.send(JSON.stringify({ id: JSON.parse(raw).id, status: "ok", actions: [] }))));
    host = new CompanionHost({ dataDirectory: state.directory, streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port, controlApiPort: await freePort() });
    host.start(); await once(host.controlApi.server, "listening");
    const catalog = await host.catalog.check();
    assert.equal(catalog.error, "", "GitHub catalogue check must succeed");
    const probe = catalog.modules.find((item) => item.id === "update-probe"); assert.ok(probe && !probe.problem);
    const marker = path.join(state.directory, "module-data/update-probe/private-marker.txt");
    if (phase === "baseline") {
      assert.equal(probe.version, expected);
      await host.installCatalogModule("update-probe");
      await host.services.execute("update-probe", "start");
      await host.services.setAutoStart("update-probe", true);
      fs.writeFileSync(marker, "Synthetic private data must survive a GitHub update.");
      state.version = expected;
      fs.writeFileSync(stateFile, JSON.stringify(state));
      console.log("Real module-repository baseline passed: installed and started Update Probe " + expected + " after SHA-256 verification.");
    } else {
      assert.equal(host.registry.readManifest("update-probe").version, state.version);
      assert.equal(probe.version, expected); assert.equal(probe.updateAvailable, true);
      await host.services.startAll({ automaticOnly: true });
      assert.equal(host.services.get("update-probe").status, "running");
      const result = await host.installCatalogModule("update-probe");
      assert.equal(result.installed[0].version, expected);
      const health = await fetch("http://127.0.0.1:3140/health").then((response) => response.json());
      assert.equal(health.version, expected);
      assert.equal(fs.readFileSync(marker, "utf8"), "Synthetic private data must survive a GitHub update.");
      assert.equal(host.services.config.autoStart["update-probe"], true);
      host.catalog.fetch = async () => { throw new Error("Synthetic offline check"); };
      const cached = await host.catalog.check(); assert.ok(cached.error); assert.equal(cached.modules.find((item) => item.id === "update-probe").version, expected);
      assert.equal(host.services.get("update-probe").status, "running");
      complete = true;
      console.log("Real module-repository update passed: " + state.version + " -> " + expected + ", service health, automatic-start preference, private data and offline cache preserved.");
    }
  } finally {
    if (host) { await host.services.stopAll(); await host.controlApi.stop(); }
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); }
    if (complete) { fs.rmSync(state.directory, { recursive: true, force: true }); fs.rmSync(stateFile, { force: true }); }
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
