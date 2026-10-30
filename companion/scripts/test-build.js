const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const zlib = require("node:zlib");
const AdmZip = require("adm-zip");
const { buildModules } = require("../../scripts/build-modules");
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-build-"));
try {
  const options = { output: temporary };
  const first = buildModules(undefined, options);
  const second = buildModules(undefined, options);
  assert.deepEqual(first, second, "Identical module source must produce identical release hashes");
  const selectedDirectory = path.join(temporary, "selected");
  const selected = buildModules(["update-probe"], { output: selectedDirectory });
  assert.deepEqual(selected.modules.map((entry) => entry.id), ["update-probe"]);
  assert.equal(fs.readdirSync(selectedDirectory).filter((file) => file.endsWith(".streammodule")).length, 1, "A single-module release must not build unrelated packages");
  for (const entry of second.modules) {
    const zip = new AdmZip(path.join(temporary, path.basename(new URL(entry.package.url).pathname)));
    const manifest = JSON.parse(zip.readAsText("module.json"));
    assert.equal(zip.readAsText("README.md").includes("\r"), false, "Release text must normalize Windows checkout line endings");
    assert.equal(manifest.author, "Sethani");
    assert.equal(manifest.license, "MIT");
    assert.equal(manifest.version, entry.version);
    if (manifest.streamerbot.importFile) {
      const bytes = Buffer.from(zip.readAsText(manifest.streamerbot.importFile), "base64");
      assert.equal(bytes.subarray(0, 4).toString(), "SBAE");
      const exported = JSON.parse(zlib.gunzipSync(bytes.subarray(4)));
      assert.equal(exported.meta.author, "Sethani");
      assert.equal(exported.meta.version, manifest.version);
      const names = exported.data.actions.map((action) => action.name).sort();
      assert.deepEqual(names, [...manifest.streamerbot.requiredActions].sort());
      for (const action of exported.data.actions) for (const subAction of action.subActions || []) {
        assert.equal(subAction.sourceFile, undefined);
        if (subAction.type === 99999) assert.ok(Buffer.from(subAction.byteCode, "base64").toString().includes("CPHInline"));
        if (subAction.type === 99999) assert.equal(Buffer.from(subAction.byteCode, "base64").toString().includes("\r"), false);
      }
      if (entry.id === "video") {
        assert.equal(exported.data.commands.length, 0);
        const engine = exported.data.actions.flatMap((action) => action.subActions || []).find((subAction) => subAction.type === 99999);
        const source = Buffer.from(engine.byteCode, "base64").toString();
        const defaults = source.match(/const string DefaultsJson=@"((?:""|[^"])*)";/);
        assert.ok(defaults);
        assert.deepEqual(JSON.parse(defaults[1].replaceAll('""', '"')).library, {}, "Public Video defaults must never seed a personal media library");
      }
    }
    assert.ok(zip.getEntry("LICENSE"));
  }
  console.log("Deterministic module archives, editable action compilation, action inventories and Sethani/MIT metadata passed.");
} finally {
  assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(temporary, { recursive: true, force: true });
}
