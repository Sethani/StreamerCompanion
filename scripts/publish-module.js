const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const { createRequire } = require("node:module");
const { buildModules } = require("./build-modules");
const { ModuleCatalog } = require("../companion/src/catalog");
const root = path.resolve(__dirname, "..");
const semver = createRequire(path.join(root, "companion/package.json"))("semver");
const REPOSITORY = "Sethani/StreamerCompanion-Modules";

function mergeCatalog(current, entry) {
  if (current.schemaVersion !== 1 || !Array.isArray(current.modules)) throw new Error("Invalid existing distribution catalogue.");
  const old = current.modules.find((item) => item.id === entry.id);
  if (old) {
    if (semver.gt(old.version, entry.version)) throw new Error("Refusing to downgrade a published module.");
    if (old.version === entry.version) {
      if (old.package.sha256 !== entry.package.sha256 || old.package.url !== entry.package.url) throw new Error("Published version has different bytes or URL; bump the module version.");
      return current;
    }
  }
  return { ...current, modules: [...current.modules.filter((item) => item.id !== entry.id), entry].sort((a, b) => a.id.localeCompare(b.id, "en")) };
}

function command(executable, args, cwd, allowFailure = false) {
  const result = spawnSync(executable, args, { cwd, windowsHide: true, encoding: "utf8", env: { ...process.env, GIT_TERMINAL_PROMPT: "0" }, maxBuffer: 2 * 1024 * 1024 });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) throw new Error(executable + " failed: " + result.stderr.trim());
  return result;
}

function publishModule(id, distribution) {
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error("Pass one module ID and the distribution repository checkout directory.");
  const checkout = path.resolve(distribution);
  const git = (...args) => command("git", args, checkout).stdout.trim();
  const origin = git("remote", "get-url", "origin").replace(/\.git$/, "");
  if (origin !== "https://github.com/" + REPOSITORY) throw new Error("Refusing to modify a checkout of a different repository.");
  if (git("status", "--porcelain")) throw new Error("The distribution checkout must be clean before publishing.");
  git("pull", "--ff-only", "origin", "main");
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "companion-publish-"));
  try {
    const built = buildModules([id], { output: temporary });
    const entry = built.modules[0];
    entry.source = { repository: "Sethani/StreamerCompanion", commit: command("git", ["rev-parse", "HEAD"], root).stdout.trim() };
    const catalogFile = path.join(checkout, "catalog/modules.json");
    const current = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
    const next = mergeCatalog(current, entry);
    new ModuleCatalog({ directory: temporary, version: "1.1.1" }).validate(next);
    const file = path.basename(new URL(entry.package.url).pathname);
    const tag = id + "-v" + entry.version;
    const checksumFile = path.join(temporary, id + "-" + entry.version + ".SHA256SUMS");
    fs.writeFileSync(checksumFile, entry.package.sha256 + "  " + file + "\n");
    const existing = command("gh", ["api", "repos/" + REPOSITORY + "/releases/tags/" + tag], root, true);
    if (existing.status === 0) {
      const release = JSON.parse(existing.stdout);
      const asset = release.assets.find((item) => item.name === file);
      if (!asset) throw new Error("Existing release is missing its package asset; do not replace a published version.");
      if (asset.digest) assert.equal(asset.digest, "sha256:" + entry.package.sha256, "Published asset differs; bump the module version");
      else {
        const verify = path.join(temporary, "verify"); fs.mkdirSync(verify);
        command("gh", ["release", "download", tag, "--repo", REPOSITORY, "--pattern", file, "--dir", verify], root);
        assert.equal(crypto.createHash("sha256").update(fs.readFileSync(path.join(verify, file))).digest("hex"), entry.package.sha256, "Published asset differs; bump the module version");
      }
    } else {
      // A release and its verified asset must exist before any catalogue pointer is published.
      if (!/404|Not Found/.test(existing.stderr)) throw new Error("Could not inspect the module release: " + existing.stderr.trim());
      const notes = path.join(temporary, "notes.md");
      fs.writeFileSync(notes, entry.description + "\n\nBy Sethani, MIT. Source: https://github.com/Sethani/StreamerCompanion/tree/" + entry.source.commit + "/modules/" + id + "\n\nIndependent experimental module release. No Companion application or unrelated modules are included.\n");
      command("gh", ["release", "create", tag, path.join(temporary, file), checksumFile, "--repo", REPOSITORY, "--target", "main", "--prerelease", "--title", entry.name + " " + entry.version, "--notes-file", notes], root);
    }
    if (next === current) {
      console.log(id + " " + entry.version + " is already published; catalogue unchanged.");
      return;
    }
    fs.writeFileSync(catalogFile, JSON.stringify(next, null, 2) + "\n");
    git("config", "--local", "user.name", "Sethani");
    git("config", "--local", "user.email", "16097896+Sethani@users.noreply.github.com");
    git("add", "--", "catalog/modules.json");
    git("diff", "--cached", "--check");
    git("commit", "-m", "Publish " + id + " " + entry.version);
    git("-c", "credential.helper=", "-c", "credential.helper=!gh auth git-credential", "push", "origin", "HEAD:main");
    console.log("Published only " + id + " " + entry.version + ": https://github.com/" + REPOSITORY + "/releases/tag/" + tag);
  } finally {
    assert.ok(path.resolve(temporary).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temporary, { recursive: true, force: true });
  }
}

if (require.main === module) {
  try {
    if (!process.argv[3]) throw new Error("Usage: node scripts/publish-module.js <module-id> <distribution-checkout>");
    publishModule(process.argv[2], process.argv[3]);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { mergeCatalog, publishModule };
