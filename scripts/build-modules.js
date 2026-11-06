const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const crypto = require("node:crypto");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");
const requireCompanion = createRequire(path.join(root, "companion/package.json"));
const AdmZip = requireCompanion("adm-zip");
const { CompanionRegistry } = require("../companion/src/module-registry");
const textBytes = (file) => Buffer.from(fs.readFileSync(file, "utf8").replaceAll("\r\n", "\n"));

function buildModules(ids, options = {}) {
  if (ids !== undefined && (!Array.isArray(ids) || !ids.length || ids.some((id) => typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)))) throw new Error("Pass valid module IDs.");
  const output = options.output || path.join(root, "dist", "modules");
  fs.mkdirSync(output, { recursive: true });
  const modules = [];
  for (const id of (ids || fs.readdirSync(path.join(root, "modules"))).sort()) {
    const source = path.join(root, "modules", id);
    if (!fs.statSync(source).isDirectory()) continue;
    const manifest = JSON.parse(fs.readFileSync(path.join(source, "module.json"), "utf8"));
    if (manifest.id !== id || manifest.author !== "Sethani" || manifest.license !== "MIT") throw new Error("Invalid first-party module identity: " + id);
    // Validation does not touch installed data; the instance has no filesystem constructor here.
    CompanionRegistry.prototype.validate(manifest);
    const zip = new AdmZip();
    zip.addFile("module.json", Buffer.from(JSON.stringify(manifest, null, 2) + "\n"));
    zip.addFile("README.md", textBytes(path.join(source, "README.md")));
    zip.addFile("LICENSE", textBytes(path.join(root, "LICENSE")));
    const reviewFile = path.join(source, "reviewed-assets.json");
    const review = fs.existsSync(reviewFile) ? JSON.parse(fs.readFileSync(reviewFile, "utf8")) : { files: [] };
    const reviewedAssets = new Map((review.files || []).map((entry) => [entry.path, entry]));
    if (reviewedAssets.size) {
      zip.addFile("ASSET-PROVENANCE.json", textBytes(reviewFile));
      if (!/^third-party\/[a-z0-9-]+\.txt$/.test(review.notice || "")) throw new Error("Reviewed assets require an upstream notice.");
      zip.addFile(review.notice, textBytes(path.join(source, review.notice)));
    }
    const notices = path.join(source, 'third-party');
    if (fs.existsSync(notices)) for (const entry of fs.readdirSync(notices, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
      if (!entry.isFile() || entry.isSymbolicLink() || !/^[a-z0-9-]+\.txt$/.test(entry.name)) throw new Error('Unsafe third-party notice.');
      if (reviewedAssets.size && 'third-party/' + entry.name === review.notice) continue;
      zip.addFile('third-party/' + entry.name, textBytes(path.join(notices, entry.name)));
    }
    const service = path.join(source, "service");
    const addService = (directory, prefix) => {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, "en"))) {
        if (entry.isSymbolicLink()) throw new Error("Service symlinks are not distributable.");
        if (entry.isDirectory()) addService(path.join(directory, entry.name), prefix + entry.name + "/");
        else {
          if (/\.(mp3|ogg|wav)\.b64$/.test(entry.name)) {
            const assetPath = prefix + entry.name.slice(0, -4), reviewed = reviewedAssets.get(assetPath);
            const encoded = fs.readFileSync(path.join(directory, entry.name), "utf8").trim();
            const bytes = Buffer.from(encoded, "base64");
            if (!reviewed || bytes.toString("base64") !== encoded || crypto.createHash("sha256").update(bytes).digest("hex") !== reviewed.sha256) throw new Error("Unreviewed, invalid or changed audio: " + assetPath);
            zip.addFile(assetPath, bytes);
            continue;
          }
          if (entry.name.endsWith(".png")) {
            const assetPath = prefix + entry.name, reviewed = reviewedAssets.get(assetPath);
            const bytes = fs.readFileSync(path.join(directory, entry.name));
            if (!reviewed || crypto.createHash("sha256").update(bytes).digest("hex") !== reviewed.sha256) throw new Error("Unreviewed or changed image: " + assetPath);
            zip.addFile(assetPath, bytes);
            continue;
          }
          if (!/\.(js|cjs|mjs|html|css|json|ps1)$/.test(entry.name)) throw new Error("Service asset needs redistribution review: " + entry.name);
          zip.addFile(prefix + entry.name, textBytes(path.join(directory, entry.name)));
        }
      }
    };
    if (fs.existsSync(service)) addService(service, "service/");
    if (manifest.web) addService(path.join(source, manifest.web.root), manifest.web.root + "/");
    if (manifest.streamerbot.importFile) {
      const exportRoot = path.join(source, "streamerbot");
      const exported = JSON.parse(fs.readFileSync(path.join(exportRoot, "export.json"), "utf8"));
      if (exported.version !== 24 || typeof exported.exportedFrom !== "string" || !exported.exportedFrom || typeof exported.minimumVersion !== "string" || !exported.minimumVersion) throw new Error("Missing or unsupported Streamer.bot export format metadata: " + id);
      for (const collection of ["actions", "queues", "commands", "websocketServers", "websocketClients", "timers"]) {
        if (!Array.isArray(exported.data?.[collection])) throw new Error("Missing Streamer.bot export collection " + collection + ": " + id);
      }
      const compile = (value) => {
        if (!value || typeof value !== "object") return;
        if (value.sourceFile) {
          if (!/^[a-z0-9-]+\.cs$/.test(value.sourceFile)) throw new Error("Unsafe C# source filename.");
          value.byteCode = textBytes(path.join(exportRoot, value.sourceFile)).toString("base64");
          delete value.sourceFile;
        }
        Object.values(value).forEach(compile);
      };
      compile(exported);
      exported.meta.author = manifest.author;
      exported.meta.version = manifest.version;
      const bytes = Buffer.concat([Buffer.from("SBAE"), zlib.gzipSync(Buffer.from(JSON.stringify(exported)))]);
      zip.addFile(manifest.streamerbot.importFile, Buffer.from(bytes.toString("base64")));
    }
    for (const entry of zip.getEntries()) entry.header.time = new Date(2000, 0, 1, 0, 0, 0);
    const name = id + "-" + manifest.version + ".streammodule";
    const bytes = zip.toBuffer();
    fs.writeFileSync(path.join(output, name), bytes);
    modules.push({
      id, name: manifest.name, version: manifest.version, description: manifest.description,
      author: manifest.author, category: manifest.ui?.category || "System",
      dependencies: manifest.dependencies, provides: [...new Set([...(manifest.provides || []), ...(manifest.service?.provides || [])])],
      streamerbot: { minimumVersion: manifest.streamerbot.minimumVersion || "1.0.0", requiredActions: manifest.streamerbot.requiredActions },
      package: { url: "https://github.com/Sethani/StreamerCompanion-Modules/releases/download/" + id + "-v" + manifest.version + "/" + name, sha256: crypto.createHash("sha256").update(bytes).digest("hex") }
    });
  }
  const catalog = { schemaVersion: 1, modules };
  const catalogText = JSON.stringify(catalog, null, 2) + "\n";
  // This is a build result, never a replacement for the complete distribution catalogue.
  fs.writeFileSync(path.join(output, "module-entries.json"), catalogText);
  fs.writeFileSync(path.join(output, "SHA256SUMS"), modules.map((item) => item.package.sha256 + "  " + path.basename(new URL(item.package.url).pathname)).join("\n") + "\n");
  console.log("Built " + modules.length + " selected module(s): " + modules.map((item) => item.id).join(", ") + ".");
  return catalog;
}

if (require.main === module) buildModules(process.argv.length > 2 ? process.argv.slice(2) : undefined);
module.exports = { buildModules };
