const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const semver = require("semver");

const ID = /^[a-z0-9][a-z0-9-]*$/;
const MAX_PACKAGE = 100 * 1024 * 1024;

class ModuleCatalog {
  constructor(options) {
    this.repository = options.repository || "Sethani/StreamerCompanion";
    if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(this.repository)) throw new Error("Invalid catalogue repository.");
    this.version = options.version;
    this.registry = options.registry;
    this.capabilities = options.capabilities;
    this.fetch = options.fetch || globalThis.fetch;
    this.directory = options.directory;
    this.cacheFile = path.join(this.directory, "cache.json");
    this.catalog = null;
    this.checkedAt = null;
    this.error = "";
    try {
      const saved = JSON.parse(fs.readFileSync(this.cacheFile, "utf8"));
      if (saved.repository === this.repository) {
        this.validate(saved.catalog);
        this.catalog = saved.catalog;
        this.checkedAt = saved.checkedAt;
      }
    } catch (_) { /* A corrupt or absent cache must not prevent installed services starting. */ }
  }

  assetUrl(value, extension) {
    if (typeof value !== "string") throw new Error("A release asset URL is required.");
    const url = new URL(value);
    const prefix = "/" + this.repository + "/releases/download/";
    const rest = url.pathname.startsWith(prefix) ? url.pathname.slice(prefix.length).split("/") : [];
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.port || url.username || url.password || url.search || url.hash || rest.length !== 2 ||
        !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(rest[0]) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(rest[1]) || !rest[1].endsWith(extension)) {
      throw new Error("Only versioned assets from the configured GitHub repository are allowed.");
    }
    return url.href;
  }

  validate(catalog) {
    if (!catalog || catalog.schemaVersion !== 1 || !Array.isArray(catalog.modules) || catalog.modules.length > 500) throw new Error("Unsupported module catalogue.");
    const ids = new Set();
    for (const item of catalog.modules) {
      if (!item || typeof item.id !== "string" || !ID.test(item.id) || ids.has(item.id)) throw new Error("Invalid or duplicate catalogue module ID.");
      ids.add(item.id);
      for (const field of ["name", "description", "author", "category"]) {
        if (typeof item[field] !== "string" || !item[field].trim() || item[field].length > (field === "description" ? 160 : 120) || /[\r\n]/.test(item[field])) throw new Error("Invalid catalogue " + field + ".");
      }
      if (!semver.valid(item.version) || !/^[a-f0-9]{64}$/.test(item.package?.sha256 || "")) throw new Error("Invalid catalogue version or SHA-256.");
      this.assetUrl(item.package.url, ".streammodule");
      const dependencies = item.dependencies;
      if (!dependencies || !semver.validRange(dependencies.companion)) throw new Error("Companion compatibility range is required.");
      for (const field of ["modules", "optionalModules"]) {
        const values = dependencies[field];
        if (!values || typeof values !== "object" || Array.isArray(values)) throw new Error("Invalid module dependency map.");
        for (const [id, range] of Object.entries(values)) if (!ID.test(id) || typeof range !== "string" || !semver.validRange(range)) throw new Error("Invalid module dependency range.");
      }
      if (!dependencies.capabilities || typeof dependencies.capabilities !== "object" || Array.isArray(dependencies.capabilities)) throw new Error("Invalid capability map.");
      for (const [capability, requirement] of Object.entries(dependencies.capabilities)) if (!ID.test(capability) || !["required", "optional"].includes(requirement)) throw new Error("Invalid capability dependency.");
      if (!Array.isArray(item.provides) || item.provides.some((value) => typeof value !== "string" || !ID.test(value))) throw new Error("Invalid provided capabilities.");
      if (!item.streamerbot || !Array.isArray(item.streamerbot.requiredActions) || item.streamerbot.requiredActions.some((value) => typeof value !== "string" || !value.trim())) throw new Error("Streamer.bot action requirements are required.");
    }
    return catalog;
  }

  async request(url, maximum) {
    let current = new URL(url);
    const allowed = new Set(["api.github.com", "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"]);
    for (let redirects = 0; redirects <= 5; redirects++) {
      if (current.protocol !== "https:" || !allowed.has(current.hostname) || current.username || current.password || current.port) throw new Error("Untrusted release download redirect.");
      const response = await this.fetch(current.href, { redirect: "manual", signal: AbortSignal.timeout(30000), headers: { Accept: current.hostname === "api.github.com" ? "application/vnd.github+json" : "application/octet-stream" } });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        await response.body?.cancel();
        const location = response.headers.get("location");
        if (!location) throw new Error("Release download redirect has no location.");
        current = new URL(location, current);
        continue;
      }
      if (!response.ok) { await response.body?.cancel(); throw new Error("GitHub request failed with HTTP " + response.status + "."); }
      if (Number(response.headers.get("content-length")) > maximum) { await response.body?.cancel(); throw new Error("Release download exceeds its size limit."); }
      const chunks = [];
      let length = 0;
      if (!response.body) throw new Error("Empty release response.");
      const reader = response.body.getReader();
      try {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          length += value.length;
          if (length > maximum) throw new Error("Release download exceeds its size limit.");
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel().catch(() => {}); }
      return Buffer.concat(chunks);
    }
    throw new Error("Too many release download redirects.");
  }

  async check() {
    try {
      const releases = JSON.parse((await this.request("https://api.github.com/repos/" + this.repository + "/releases?per_page=30", 2 * 1024 * 1024)).toString("utf8"));
      if (!Array.isArray(releases)) throw new Error("Invalid GitHub releases response.");
      // This preview intentionally includes prereleases; it never downloads or installs automatically.
      const release = releases.filter((item) => !item.draft && Array.isArray(item.assets) && item.assets.some((asset) => asset.name === "modules.json"))
        .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at))[0];
      if (!release) throw new Error("No published module catalogue is available yet.");
      const url = this.assetUrl(release.assets.find((asset) => asset.name === "modules.json").browser_download_url, ".json");
      const catalog = this.validate(JSON.parse((await this.request(url, 1024 * 1024)).toString("utf8")));
      const checkedAt = new Date().toISOString();
      fs.mkdirSync(this.directory, { recursive: true });
      fs.writeFileSync(this.cacheFile + ".tmp", JSON.stringify({ repository: this.repository, checkedAt, catalog }, null, 2));
      fs.renameSync(this.cacheFile + ".tmp", this.cacheFile);
      this.catalog = catalog;
      this.checkedAt = checkedAt;
      this.error = "";
    } catch (error) { this.error = error.message; }
    return this.inventory();
  }

  resolve(id, capabilities) {
    if (!this.catalog) throw new Error("Check for module updates first.");
    const catalog = new Map(this.catalog.modules.map((item) => [item.id, item]));
    const installed = new Map(this.registry.manifests().filter((item) => !item.error).map((item) => [item.manifest.id, item.manifest]));
    const requirements = new Map();
    const selected = new Map();
    const visiting = new Set();
    const visited = new Set();
    const checked = new Map();
    const ordered = [];
    const visit = (moduleId, range, root = false) => {
      const ranges = requirements.get(moduleId) || [];
      ranges.push(range);
      requirements.set(moduleId, ranges);
      const matches = (version) => semver.valid(version) && ranges.every((constraint) => semver.satisfies(version, constraint));
      const old = installed.get(moduleId);
      const entry = catalog.get(moduleId);
      const reuse = !root && !selected.has(moduleId) && old && matches(old.version);
      const candidate = reuse ? old : entry;
      if (!candidate || !matches(candidate.version)) throw new Error("No compatible catalogue version for dependency " + moduleId + ".");
      if (!reuse && old && semver.gt(old.version, candidate.version)) throw new Error("Automatic downgrade refused for " + moduleId + ".");
      if (visiting.has(moduleId)) throw new Error("Module dependency cycle involving " + moduleId + ".");
      if (candidate.dependencies?.companion && !semver.satisfies(this.version, candidate.dependencies.companion)) throw new Error("Incompatible Companion version for " + moduleId + ".");
      const key = moduleId + "@" + candidate.version;
      if (visited.has(key)) return;
      const changes = old?.version !== candidate.version;
      if (changes) selected.set(moduleId, entry);
      checked.set(moduleId, candidate);
      visiting.add(moduleId);
      for (const [dependency, constraint] of Object.entries(candidate.dependencies?.modules || {}).sort()) visit(dependency, constraint);
      visiting.delete(moduleId);
      visited.add(key);
      if (changes) ordered.push(entry);
    };
    const root = catalog.get(id);
    if (!root) throw new Error("Unknown catalogue module.");
    visit(id, root.version, true);
    const available = new Set(capabilities);
    for (const item of ordered) for (const capability of item.provides) available.add(capability);
    // Validate all accumulated constraints, including an installed version reused by another branch.
    for (const [moduleId, ranges] of requirements) {
      const version = selected.get(moduleId)?.version || installed.get(moduleId)?.version;
      if (!version || ranges.some((range) => !semver.satisfies(version, range))) throw new Error("Conflicting dependency constraints for " + moduleId + ".");
    }
    for (const item of checked.values()) {
      const missing = Object.entries(item.dependencies?.capabilities || {}).filter(([capability, requirement]) => requirement === "required" && !available.has(capability)).map(([capability]) => capability);
      if (missing.length) throw new Error("Missing required capabilities for " + item.id + ": " + missing.join(", "));
    }
    return ordered;
  }

  async inventory() {
    const capabilities = await this.capabilities();
    const installed = new Map(this.registry.manifests().filter((item) => !item.error).map((item) => [item.manifest.id, item.manifest]));
    const modules = (this.catalog?.modules || []).map((item) => {
      const old = installed.get(item.id);
      const updateAvailable = Boolean(old && semver.valid(old.version) && semver.gt(item.version, old.version));
      let problem = "";
      let plan = [];
      try { plan = this.resolve(item.id, capabilities); } catch (error) { problem = error.message; }
      if (!problem && !semver.satisfies(this.version, item.dependencies.companion)) problem = "Incompatible Companion version.";
      const unavailable = /Incompatible Companion/.test(problem) ? "Incompatible Companion version" : /Missing|dependency|compatible catalogue/.test(problem) ? "Missing dependency" : "Unavailable";
      return { ...item, installedVersion: old?.version || null, updateAvailable, problem, installationPlan: plan.map((entry) => ({ id: entry.id, name: entry.name, version: entry.version })), state: problem ? unavailable : !old ? "Available" : updateAvailable ? "Update available" : "Installed" };
    });
    return { repository: this.repository, checkedAt: this.checkedAt, error: this.error, modules };
  }

  async prepare(id) {
    const plan = this.resolve(id, await this.capabilities());
    if (!plan.length) throw new Error("This module is already current.");
    fs.mkdirSync(this.directory, { recursive: true });
    const temporary = fs.mkdtempSync(path.join(this.directory, "download-"));
    try {
      const packages = [];
      for (const item of plan) {
        const bytes = await this.request(this.assetUrl(item.package.url, ".streammodule"), MAX_PACKAGE);
        if (crypto.createHash("sha256").update(bytes).digest("hex") !== item.package.sha256) throw new Error("SHA-256 mismatch for " + item.id + ".");
        const file = path.join(temporary, item.id + ".streammodule");
        fs.writeFileSync(file, bytes);
        const { manifest } = this.registry.inspectPackage(file);
        if (manifest.id !== item.id || manifest.version !== item.version || manifest.author !== item.author || manifest.description !== item.description || JSON.stringify(manifest.dependencies) !== JSON.stringify(item.dependencies) || JSON.stringify(manifest.service?.provides || []) !== JSON.stringify(item.provides) || JSON.stringify(manifest.streamerbot.requiredActions) !== JSON.stringify(item.streamerbot.requiredActions)) throw new Error("Package metadata differs from its catalogue entry: " + item.id + ".");
        packages.push({ item, file });
      }
      return { temporary, packages };
    } catch (error) {
      fs.rmSync(temporary, { recursive: true, force: true });
      throw error;
    }
  }
}

module.exports = { ModuleCatalog };
