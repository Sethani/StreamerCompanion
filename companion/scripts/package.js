const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const asar = require("@electron/asar");
const { createRequire } = require("node:module");
const root = path.resolve(__dirname, "..");

async function main() {
  const builds = path.join(root, "out");
  fs.mkdirSync(builds, { recursive: true });
  const directory = fs.mkdtempSync(path.join(builds, "build-"));
  const stage = path.join(directory, "app");
  fs.mkdirSync(stage);
  for (const file of ["main.js", "preload.js", "desktop.js", "companion-host.js", "catalog.js", "module-registry.js", "service-registry.js", "installed-service.js", "control-api.js", "streamerbot-client.js", "renderer/index.html", "renderer/app.js", "renderer/styles.css"]) {
    const destination = path.join(stage, "src", file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(path.join(root, "src", file), destination);
  }
  const original = require("../package.json");
  const manifest = { name: original.name, productName: original.productName, version: original.version, author: original.author, license: original.license, description: original.description, main: original.main, dependencies: original.dependencies };
  fs.writeFileSync(path.join(stage, "package.json"), JSON.stringify(manifest, null, 2));
  const seen = new Set();
  function dependency(name, from) {
    const file = createRequire(from).resolve(name + "/package.json");
    const source = path.dirname(file);
    if (seen.has(source)) return;
    seen.add(source);
    const relative = path.relative(path.join(root, "node_modules"), source);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error("Dependency resolved outside this project.");
    fs.cpSync(source, path.join(stage, "node_modules", relative), { recursive: true, filter: (file) => path.basename(file) !== "node_modules" && !fs.lstatSync(file).isSymbolicLink() });
    for (const child of Object.keys(JSON.parse(fs.readFileSync(file, "utf8")).dependencies || {})) dependency(child, file);
  }
  for (const name of Object.keys(original.dependencies)) dependency(name, path.join(root, "package.json"));
  fs.copyFileSync(path.join(root, "../LICENSE"), path.join(stage, "LICENSE"));
  const outputs = await require("@electron/packager")({ dir: stage, out: path.join(directory, "packages"), name: "Streamer Companion Preview", executableName: "StreamerCompanionPreview", platform: "win32", arch: "x64", electronVersion: require("electron/package.json").version, asar: true, prune: false });
  for (const output of outputs) {
    const archive = path.join(output, "resources/app.asar");
    const files = asar.listPackage(archive).map((file) => file.replace(/^[/\\]/, "")).filter((file) => !asar.statFile(archive, file).files);
    for (const file of files) {
      const relative = file.replace(/^[/\\]/, "");
      if (!asar.extractFile(archive, relative).equals(fs.readFileSync(path.join(stage, relative)))) throw new Error("Archive verification failed.");
    }
    if (JSON.stringify(fs.readdirSync(path.dirname(archive)).sort()) !== '["app.asar"]') throw new Error("Unexpected external resources.");
    fs.copyFileSync(path.join(root, "../THIRD_PARTY_NOTICES.md"), path.join(output, "THIRD_PARTY_NOTICES.md"));
    const report = { directory: output, payloadFiles: files.length, sha256: crypto.createHash("sha256").update(fs.readFileSync(archive)).digest("hex") };
    fs.writeFileSync(path.join(directory, "build-report.json"), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(builds, "latest-build.json"), JSON.stringify(report, null, 2));
    console.log("Verified standalone build: " + output);
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
