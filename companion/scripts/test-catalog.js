const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const http = require("node:http");
const { once } = require("node:events");
const AdmZip = require("adm-zip");
const { WebSocketServer } = require("ws");
const { CompanionHost } = require("../src/companion-host");
const { ModuleCatalog } = require("../src/catalog");

async function freePort() {
  const server = http.createServer(); server.listen(0, "127.0.0.1"); await once(server, "listening");
  const port = server.address().port; await new Promise((resolve) => server.close(resolve)); return port;
}

async function main() {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-catalog-"));
  let host;
  let websocket;
  try {
    const transport = new Map();
    let requests = 0;
    const fetcher = async (url) => {
      requests++;
      if (!transport.has(url)) throw new Error("Synthetic network failure");
      const value = transport.get(url);
      return typeof value === "function" ? value() : new Response(value);
    };
    function fixture(id, version, modules = {}, extra = {}) {
      const manifest = {
        schemaVersion: extra.service ? 2 : 1, id, version, name: id, description: "Synthetic catalogue fixture.", author: "Sethani",
        streamerbot: { requiredActions: [] }, dependencies: { modules, optionalModules: {}, capabilities: {}, companion: ">=1.1.0" }, ...extra
      };
      const zip = new AdmZip();
      zip.addFile("module.json", Buffer.from(JSON.stringify(manifest)));
      if (extra.service) zip.addFile("runtime.js", Buffer.from("process.exit(1);"));
      const bytes = zip.toBuffer();
      const entry = { id, version, name: id, description: manifest.description, author: "Sethani", category: "Tests", dependencies: manifest.dependencies, provides: [], streamerbot: manifest.streamerbot,
        package: { url: "https://github.com/Sethani/StreamerCompanion/releases/download/test/" + id + "-" + version + ".streammodule", sha256: crypto.createHash("sha256").update(bytes).digest("hex") } };
      transport.set(entry.package.url, bytes);
      return { manifest, entry, bytes };
    }
    websocket = new WebSocketServer({ host: "127.0.0.1", port: 0 }); await once(websocket, "listening");
    websocket.on("connection", (socket) => socket.on("message", (raw) => socket.send(JSON.stringify({ id: JSON.parse(raw).id, status: "ok", actions: [] }))));
    const apiPort = await freePort();
    host = new CompanionHost({ dataDirectory: path.join(temporary, "data"), streamerBotUrl: "ws://127.0.0.1:" + websocket.address().port, controlApiPort: apiPort, catalogFetch: fetcher });
    host.start(); await once(host.controlApi.server, "listening");
    assert.equal(requests, 0, "Startup must not require GitHub");
    const first = fixture("probe", "1.0.0");
    const catalogUrl = "https://github.com/Sethani/StreamerCompanion/releases/download/test/modules.json";
    const releasesUrl = "https://api.github.com/repos/Sethani/StreamerCompanion/releases?per_page=30";
    transport.set(releasesUrl, JSON.stringify([{ draft: false, prerelease: true, published_at: "2026-01-01T00:00:00Z", assets: [{ name: "modules.json", browser_download_url: catalogUrl }] }]));
    transport.set(catalogUrl, JSON.stringify({ schemaVersion: 1, modules: [first.entry] }));
    let inventory = await host.catalog.check();
    assert.equal(inventory.modules[0].state, "Available");
    assert.ok(inventory.checkedAt);
    assert.equal(host.registry.manifests().length, 0, "Checking must never install anything");
    await host.installCatalogModule("probe");
    assert.equal(host.registry.readManifest("probe").version, "1.0.0");
    const marker = path.join(host.dataDirectory, "module-data/probe/private.txt"); fs.mkdirSync(path.dirname(marker), { recursive: true }); fs.writeFileSync(marker, "preserved");
    const next = fixture("probe", "1.1.0");
    transport.set(catalogUrl, JSON.stringify({ schemaVersion: 1, modules: [next.entry] }));
    inventory = await host.catalog.check();
    assert.equal(inventory.modules[0].updateAvailable, true);
    await host.installCatalogModule("probe");
    assert.equal(host.registry.readManifest("probe").version, "1.1.0");
    assert.equal(fs.readFileSync(marker, "utf8"), "preserved");
    const checkedAt = host.catalog.checkedAt;
    transport.delete(releasesUrl);
    inventory = await host.catalog.check();
    assert.equal(inventory.checkedAt, checkedAt); assert.ok(inventory.error); assert.equal(inventory.modules.length, 1);
    const cached = new ModuleCatalog({ directory: host.catalog.directory, version: "1.1.0", registry: host.registry, capabilities: async () => [], fetch: fetcher });
    assert.equal(cached.catalog.modules[0].version, "1.1.0");
    host.catalog.catalog = { schemaVersion: 1, modules: [first.entry] };
    await assert.rejects(host.installCatalogModule("probe"), /downgrade/);
    const badHash = structuredClone(next.entry); badHash.version = "1.2.0"; badHash.package.sha256 = "0".repeat(64);
    host.catalog.catalog = { schemaVersion: 1, modules: [badHash] };
    await assert.rejects(host.installCatalogModule("probe"), /SHA-256 mismatch/);
    assert.equal(host.registry.readManifest("probe").version, "1.1.0");
    assert.equal(host.installing, false);
    assert.equal(fs.readdirSync(host.catalog.directory).some((name) => name.startsWith("download-")), false);

    const a = fixture("a", "1.0.0", { b: ">=1.0.0" });
    const b = fixture("b", "1.0.0", { a: ">=1.0.0" });
    host.catalog.catalog = { schemaVersion: 1, modules: [a.entry, b.entry] };
    assert.throws(() => host.catalog.resolve("a", []), /cycle/);
    const incompatible = structuredClone(a.entry); incompatible.dependencies.companion = ">=9.0.0";
    host.catalog.catalog = { schemaVersion: 1, modules: [incompatible, b.entry] };
    assert.throws(() => host.catalog.resolve("a", []), /Incompatible Companion/);
    const dependency = fixture("dependency", "1.0.0");
    const dependencyNew = fixture("dependency", "1.1.0");
    const parent = fixture("parent", "1.0.0", { dependency: ">=1.1.0" }, { service: { apiVersion: 1, entry: "runtime.js", port: await freePort(), startTimeoutMs: 500, healthPath: "/health", healthService: "parent" } });
    const oldFile = path.join(temporary, "old.streammodule"); fs.writeFileSync(oldFile, dependency.bytes); await host.installModulePackage(oldFile);
    host.catalog.catalog = { schemaVersion: 1, modules: [parent.entry, dependencyNew.entry] };
    assert.deepEqual(host.catalog.resolve("parent", ["embedded-node"]).map((entry) => entry.id), ["dependency", "parent"]);
    host.services.config.autoStart.parent = true;
    await assert.rejects(host.installCatalogModule("parent"), /failed its installation health check/);
    assert.equal(host.registry.readManifest("dependency").version, "1.0.0", "Dependency code must roll back when the parent fails");
    assert.equal(host.registry.readManifest("parent"), null, "A failed new module must not remain installed");
    assert.equal(host.services.get("parent"), null);
    const leaf = fixture("leaf", "1.0.0");
    const middle = fixture("middle", "1.0.0", { leaf: ">=1.0.0" });
    const top = fixture("top", "1.0.0", { middle: ">=1.0.0" });
    const middleFile = path.join(temporary, "middle.streammodule"); fs.writeFileSync(middleFile, middle.bytes); await host.installModulePackage(middleFile);
    host.catalog.catalog = { schemaVersion: 1, modules: [top.entry, leaf.entry] };
    assert.deepEqual(host.catalog.resolve("top", []).map((entry) => entry.id), ["leaf", "top"], "Installed dependencies must still expose their transitive requirements");
    await host.installCatalogModule("top");
    fs.rmSync(path.join(host.registry.dataDirectory, "leaf"), { recursive: true, force: true });
    assert.deepEqual(host.catalog.resolve("top", []).map((entry) => entry.id), ["leaf"], "An existing root should repair missing dependencies without reinstalling itself");
    await host.installCatalogModule("top");
    const optional = fixture("optional", "1.0.0"); optional.entry.dependencies.optionalModules.absent = ">=1.0.0";
    host.catalog.catalog = { schemaVersion: 1, modules: [optional.entry] };
    assert.equal(host.catalog.resolve("optional", []).length, 1, "Optional modules must not block installation");
    const missingCapability = fixture("needs-capability", "1.0.0"); missingCapability.entry.dependencies.capabilities.absent = "required";
    host.catalog.catalog = { schemaVersion: 1, modules: [missingCapability.entry] };
    assert.throws(() => host.catalog.resolve("needs-capability", []), /Missing required capabilities/);
    const branchA = fixture("branch-a", "1.0.0", { dependency: "<2.0.0" });
    const branchB = fixture("branch-b", "1.0.0", { dependency: ">=2.0.0" });
    const conflict = fixture("conflict", "1.0.0", { "branch-a": "*", "branch-b": "*" });
    host.catalog.catalog = { schemaVersion: 1, modules: [conflict.entry, branchA.entry, branchB.entry, dependencyNew.entry] };
    assert.throws(() => host.catalog.resolve("conflict", []), /compatible catalogue version|Conflicting/);

    for (const url of ["http://github.com/Sethani/StreamerCompanion/releases/download/test/a.streammodule", "https://github.com/other/repo/releases/download/test/a.streammodule", "https://github.com/Sethani/StreamerCompanion/releases/latest/download/a.streammodule", "https://user:pass@github.com/Sethani/StreamerCompanion/releases/download/test/a.streammodule", "https://github.com/Sethani/StreamerCompanion/releases/download/test/a.streammodule?auth=secret"]) {
      assert.throws(() => host.catalog.assetUrl(url, ".streammodule"));
    }
    const redirectUrl = first.entry.package.url;
    transport.set(redirectUrl, () => new Response(null, { status: 302, headers: { location: "https://untrusted.invalid/file" } }));
    await assert.rejects(host.catalog.request(redirectUrl, 100), /Untrusted/);
    transport.set(redirectUrl, () => new Response("too large", { headers: { "content-length": "1000" } }));
    await assert.rejects(host.catalog.request(redirectUrl, 10), /size limit/);
    for (const mutate of [
      (entry) => { entry.description = ""; }, (entry) => { entry.author = ""; },
      (entry) => { entry.package.sha256 = "bad"; }, (entry) => { entry.dependencies.modules.bad = "invalid range"; }
    ]) {
      const entry = structuredClone(first.entry); mutate(entry); assert.throws(() => host.catalog.validate({ schemaVersion: 1, modules: [entry] }));
    }
    const base = "http://127.0.0.1:" + apiPort;
    assert.equal((await fetch(base + "/api/catalog")).status, 401);
    assert.equal((await fetch(base + "/api/catalog", { headers: { Authorization: "Bearer " + host.controlApi.token } })).status, 200);
    assert.equal(fs.readFileSync(marker, "utf8"), "preserved");
    console.log("Catalogue caching, version comparison, explicit updates, hash/URL limits, dependency ordering/cycles/conflicts, compatibility, multi-module rollback and data preservation passed.");
  } finally {
    if (host) { await host.services.stopAll(); await host.controlApi.stop(); }
    if (websocket) { for (const socket of websocket.clients) socket.terminate(); await new Promise((resolve) => websocket.close(resolve)); }
    assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
