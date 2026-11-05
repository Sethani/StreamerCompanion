const assert = require("node:assert/strict"), fs = require("node:fs"), os = require("node:os"), path = require("node:path"), http = require("node:http");
const { buildModules } = require("../../scripts/build-modules");
const AdmZip = require("adm-zip");
const { CompanionRegistry } = require("../src/module-registry"), { InstalledService } = require("../src/installed-service");
const { fixture } = require("./controller-fixture");
const { normalize, snapshot } = require("../../modules/controller-input/service/runtime");
async function freePort() { const server = http.createServer(); await new Promise(resolve => server.listen(0, "127.0.0.1", resolve)); const port = server.address().port; await new Promise(resolve => server.close(resolve)); return port; }
async function waitFor(check, label) { const deadline = Date.now() + 10000; while (Date.now() < deadline) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); } throw new Error("Timed out: " + label); }
async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "companion-controller-")); let test, child;
  try {
    assert.equal(normalize().enabled, false); assert.equal(normalize({ width: 999999 }).width, 3840);
    assert.deepEqual(snapshot({ supported: true, pads: [{ index: 0, pressed: [0, 0, 999], axes: [9, -9, null, 0.1] }] }).pads[0].pressed, [0]);
    assert.deepEqual(snapshot({ pads: [{ index: 0, axes: [9, -9, null, 0.1] }] }).pads[0].axes, [1, -1, 0, 0.1]);
    buildModules(["controller-input"], { output: path.join(root, "packages") });
    const registry = new CompanionRegistry({ dataDirectory: path.join(root, "modules") });
    const staged = registry.stage(path.join(root, "packages/controller-input-1.1.0.streammodule")); registry.commit(staged); registry.finalize(staged);
    const moduleDirectory = registry.moduleDirectory("controller-input");
    const helper = fs.readFileSync(path.join(moduleDirectory, "service/native-xinput.ps1"), "utf8");
    assert.ok(helper.includes("XInputGetState") && helper.includes("7849") && helper.includes("8689") && helper.includes("$parentProcess.HasExited"));
    test = await fixture(root, path.join(moduleDirectory, "service/runtime.js"));
    const api = async (route, body, token = test.service.csrf) => fetch(test.base + route, { method: body ? "POST" : "GET", headers: { "X-Companion-CSRF": token }, ...(body ? { body: JSON.stringify(body) } : {}) });
    assert.equal(test.service.publicState().enabled, false);
    assert.equal((await api("/api/controller/settings", { enabled: true }, "wrong")).status, 403);
    assert.equal((await fetch(test.base + "/health", { headers: { Origin: "http://127.0.0.1:7474" } })).headers.get("access-control-allow-origin"), "http://127.0.0.1:7474");
    assert.equal((await fetch(test.base + "/api/controller/settings")).status, 403);
    await api("/api/controller/settings", { enabled: true, width: 310, controllerIndex: 0 });
    assert.equal((await (await fetch(test.base + "/state")).json()).source, "native-xinput");
    const before = JSON.stringify(test.state.pads); await api("/api/controller/test", {}); assert.equal(test.service.publicState().test, true); assert.equal(JSON.stringify(test.state.pads), before);
    await api("/api/controller/test", { clear: true }); assert.equal(test.service.publicState().test, false);
    await api("/api/controller/settings", { controllerIndex: 2 }); await api("/api/controller/test", {});
    assert.equal(test.service.publicState().pads[0].index, 2, "Live simulation follows the selected controller index");
    await api("/api/controller/test", { clear: true }); await api("/api/controller/settings", { controllerIndex: 0 });
    test.state.paused = true; test.state.now = Date.now() + 2000; assert.equal(test.service.publicState().providerStatus, "stale"); assert.deepEqual(test.service.publicState().pads, []);
    await api("/api/controller/test", {}); test.state.now += 11000; assert.equal(test.service.publicState().test, false);
    await test.close(); assert.equal(test.stopped(), true); test = null;
    const manifest = registry.readManifest("controller-input");
    const upgrade = new AdmZip(path.join(root, "packages/controller-input-1.1.0.streammodule")); manifest.version = "1.1.1";
    upgrade.updateFile("module.json", Buffer.from(JSON.stringify(manifest))); const upgradedFile = path.join(root, "upgrade.streammodule"); upgrade.writeZip(upgradedFile);
    const replacement = registry.stage(upgradedFile); registry.commit(replacement); registry.finalize(replacement);
    assert.equal(JSON.parse(fs.readFileSync(path.join(root, "data/config.json"), "utf8")).width, 310, "Package upgrade preserves private layout");
    if (process.platform === "win32") {
      child = new InstalledService({ app: {}, moduleDirectory, dataDirectory: path.join(root, "data"), manifest: { ...manifest, service: { ...manifest.service, port: await freePort() } } });
      assert.equal((await child.start()).status, "running");
      await waitFor(async () => (await child.state()).endpoint.details.providerStatus === "ready", "native PowerShell XInput snapshot");
      const details = (await child.state()).endpoint.details; assert.equal(details.config.width, 310); assert.equal(details.test, false);
      const pidFile = path.join(root, "data/controller-xinput-bridge.pid"); const nativePid = Number(fs.readFileSync(pidFile, "utf8").trim()); assert.ok(nativePid > 0);
      await child.stop();
      await waitFor(() => { try { process.kill(nativePid, 0); return false; } catch (_) { return true; } }, "native helper exits after installed Node parent stops");
      // Windows may terminate the helper before PowerShell finally runs. The
      // process must be gone; a stale private PID marker is not a live process.
      assert.equal((await child.probe(200)).ready, false);
    }
    console.log("Controller passed: package/settings/input compatibility, CSRF, stale clearing, synthetic test expiry, preserved layout and real native helper parent-exit cleanup.");
  } finally { await test?.close(); await child?.stop(); assert.ok(path.resolve(root).startsWith(path.resolve(os.tmpdir()) + path.sep)); fs.rmSync(root, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
