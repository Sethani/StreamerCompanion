const fs = require("node:fs");
const path = require("node:path");
const AdmZip = require("adm-zip");
const semver = require("semver");
const { getActions } = require("./streamerbot-client");

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

function validateRelativeFile(value, label) {
  const normalized = typeof value === "string" ? value.replaceAll("\\", "/") : "";
  if (!normalized || path.win32.isAbsolute(value) || path.posix.isAbsolute(normalized) ||
      /[\x00-\x1f:]/.test(normalized) || normalized.split("/").some((part) => !part || part === "." || part === ".." || /[. ]$/.test(part))) {
    throw new Error(label + " must be a safe relative file path.");
  }
}

class CompanionRegistry {
  constructor(options) {
    this.dataDirectory = options.dataDirectory;
    this.streamerBotUrl = options.streamerBotUrl;
    fs.mkdirSync(this.dataDirectory, { recursive: true });
  }

  validate(manifest) {
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new Error("Module manifest must be an object.");
    if (![1, 2].includes(manifest.schemaVersion)) throw new Error("Unsupported module package schema.");
    if (!ID_PATTERN.test(manifest.id || "")) throw new Error("Module has an invalid ID.");
    if (!VERSION_PATTERN.test(manifest.version || "")) throw new Error("Module has an invalid version.");
    if (!manifest.name || typeof manifest.name !== "string") throw new Error("Module name is required.");
    if (typeof manifest.description !== "string" || !manifest.description.trim() || manifest.description.trim().length > 160 || /[\r\n]/.test(manifest.description)) {
      throw new Error("Module description must be a non-empty single line of at most 160 characters.");
    }
    if (!Array.isArray(manifest.streamerbot && manifest.streamerbot.requiredActions)) {
      throw new Error("Module requiredActions must be an array.");
    }
    if (manifest.documentation !== undefined) validateRelativeFile(manifest.documentation, "Module documentation");
    if (manifest.streamerbot.importFile !== undefined) validateRelativeFile(manifest.streamerbot.importFile, "Module Streamer.bot import");
    if (manifest.provides !== undefined && (!Array.isArray(manifest.provides) || manifest.provides.some((value) => typeof value !== "string" || !ID_PATTERN.test(value)))) throw new Error("Invalid module capabilities.");
    if (manifest.dependencies) {
      if (manifest.dependencies.companion && !semver.validRange(manifest.dependencies.companion)) throw new Error("Invalid Companion compatibility range.");
      for (const field of ["modules", "optionalModules"]) if (manifest.dependencies[field]) {
        if (typeof manifest.dependencies[field] !== "object" || Array.isArray(manifest.dependencies[field])) throw new Error("Invalid module dependency map.");
        for (const [id, range] of Object.entries(manifest.dependencies[field])) if (!ID_PATTERN.test(id) || typeof range !== "string" || !semver.validRange(range)) throw new Error("Invalid module dependency range.");
      }
    }
    if (manifest.web) {
      if (manifest.schemaVersion < 2) throw new Error("Browser modules require package schema 2.");
      validateRelativeFile(manifest.web.root, "Browser asset root");
      const page = (value) => { if (typeof value !== "string" || !value.startsWith("/")) throw new Error("Browser page must start with /."); validateRelativeFile(value.slice(1), "Browser page"); };
      if (manifest.ui?.dockPage) page(manifest.ui.dockPage);
      if (manifest.web.overlayPage) page(manifest.web.overlayPage);
      for (const link of manifest.ui?.links || []) { if (!link.name || typeof link.name !== "string") throw new Error("Browser link name required."); page(link.path); }
    }
    if (manifest.media && manifest.media.kind !== "video") throw new Error("Unsupported module media type.");
    if (manifest.service) {
      if (manifest.schemaVersion < 2) throw new Error("Service modules require package schema 2.");
      if (manifest.service.apiVersion !== 1) throw new Error("Module requires an unsupported Companion service API version.");
      validateRelativeFile(manifest.service.entry, "Module service entry");
      const port = Number(manifest.service.port);
      if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Module service port is invalid.");
      if (manifest.service.healthPath && !String(manifest.service.healthPath).startsWith("/")) throw new Error("Module health path must begin with /.");
      if (manifest.service.settingsPath && !String(manifest.service.settingsPath).startsWith("/")) throw new Error("Module settings path must begin with /.");
    }
  }

  inspectPackage(packagePath) {
    if (!fs.existsSync(packagePath)) throw new Error("Module package not found: " + packagePath);
    const packageSize = fs.statSync(packagePath).size;
    if (packageSize > 100 * 1024 * 1024) throw new Error("Module packages may not exceed 100 MB.");
    const zip = new AdmZip(packagePath);
    const entries = zip.getEntries();
    if (entries.length > 2000) throw new Error("Module package contains too many files.");
    let expandedSize = 0;
    const seen = new Set();
    for (const item of entries) {
      const normalized = item.entryName.replaceAll("\\", "/");
      if (!normalized || normalized.startsWith("/") || normalized.includes("../") || /^[A-Za-z]:/.test(normalized)) throw new Error("Module package contains an unsafe path.");
      const key = normalized.toLowerCase();
      if (seen.has(key)) throw new Error("Module package contains duplicate paths.");
      seen.add(key);
      expandedSize += Number(item.header && item.header.size || 0);
      if (expandedSize > 250 * 1024 * 1024) throw new Error("Expanded module may not exceed 250 MB.");
    }
    const entry = zip.getEntry("module.json");
    if (!entry) throw new Error("The package does not contain module.json.");
    const manifest = JSON.parse(entry.getData().toString("utf8"));
    this.validate(manifest);
    return { zip, manifest };
  }

  stage(packagePath) {
    const inspected = this.inspectPackage(packagePath);
    const destination = path.join(this.dataDirectory, inspected.manifest.id);
    const temporary = destination + ".installing";
    const backup = destination + ".rollback";
    fs.rmSync(temporary, { recursive: true, force: true });
    fs.mkdirSync(temporary, { recursive: true });
    try {
      inspected.zip.extractAllTo(temporary, true);
      const extracted = JSON.parse(fs.readFileSync(path.join(temporary, "module.json"), "utf8"));
      this.validate(extracted);
      if (extracted.id !== inspected.manifest.id || extracted.version !== inspected.manifest.version) throw new Error("Extracted module manifest changed during installation.");
      for (const [file, label] of [[extracted.service?.entry, "service entry"], [extracted.streamerbot.importFile, "Streamer.bot import file"], [extracted.documentation, "documentation file"]]) {
        if (file && (!fs.existsSync(path.join(temporary, file)) || !fs.statSync(path.join(temporary, file)).isFile())) throw new Error("Module " + label + " was not included in the package.");
      }
      if (extracted.web) {
        const root = path.join(temporary, extracted.web.root);
        if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error("Browser asset root was not included in the package.");
        for (const page of [extracted.ui?.dockPage, extracted.web.overlayPage, ...(extracted.ui?.links || []).map((link) => link.path)].filter(Boolean)) {
          if (!fs.existsSync(path.join(root, page.slice(1))) || !fs.statSync(path.join(root, page.slice(1))).isFile()) throw new Error("Browser page was not included in the package.");
        }
      }
      return { manifest: extracted, destination, temporary, backup, hadPrevious: fs.existsSync(destination), committed: false };
    } catch (error) {
      fs.rmSync(temporary, { recursive: true, force: true });
      throw error;
    }
  }

  commit(staged) {
    fs.rmSync(staged.backup, { recursive: true, force: true });
    if (staged.hadPrevious) fs.renameSync(staged.destination, staged.backup);
    try { fs.renameSync(staged.temporary, staged.destination); staged.committed = true; }
    catch (error) { if (staged.hadPrevious && fs.existsSync(staged.backup)) fs.renameSync(staged.backup, staged.destination); throw error; }
    return staged;
  }

  rollback(staged) {
    fs.rmSync(staged.temporary, { recursive: true, force: true });
    if (staged.committed) fs.rmSync(staged.destination, { recursive: true, force: true });
    if (staged.hadPrevious && fs.existsSync(staged.backup)) fs.renameSync(staged.backup, staged.destination);
  }

  finalize(staged) { fs.rmSync(staged.backup, { recursive: true, force: true }); }

  install(packagePath) {
    const staged = this.stage(packagePath);
    this.commit(staged);
    this.finalize(staged);
    return this.refresh();
  }

  manifests() {
    return fs.readdirSync(this.dataDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.endsWith(".installing") && !entry.name.endsWith(".rollback"))
      .map((entry) => {
        const file = path.join(this.dataDirectory, entry.name, "module.json");
        try {
          const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
          this.validate(manifest);
          return { directory: path.dirname(file), manifest };
        } catch (error) {
          return {
            directory: path.dirname(file),
            error: error.message,
            manifest: {
              id: entry.name,
              name: entry.name,
              version: "0.0.0",
              streamerbot: { requiredActions: [] }
            }
          };
        }
      });
  }

  async refresh() {
    let actions = [];
    let streamerBot = { connected: false, error: "Streamer.bot WebSocket is unavailable." };
    try {
      actions = await getActions(this.streamerBotUrl);
      streamerBot = { connected: true, error: "" };
    } catch (error) {
      streamerBot.error = error.message;
    }
    const installed = this.manifests().map(({ directory, manifest, error }) => {
      const required = manifest.streamerbot.requiredActions;
      const missingActions = required.filter((name) => !actions.includes(name));
      const importFile = manifest.streamerbot.importFile ? path.join(directory, manifest.streamerbot.importFile) : "";
      const documentationFile = manifest.documentation ? path.join(directory, manifest.documentation) : "";
      let state = "ready";
      if (error) state = "broken";
      else if (required.length && !streamerBot.connected) state = "verification-unavailable";
      else if (missingActions.length) state = "streamerbot-required";
      else if (manifest.configurationRequired) state = "configuration-required";
      return {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        description: manifest.description || "",
        state,
        error: error || "",
        missingActions,
        requiredActions: required,
        hasImport: Boolean(importFile && fs.existsSync(importFile)),
        hasDocumentation: Boolean(documentationFile && fs.existsSync(documentationFile))
      };
    });
    return { streamerBot, modules: installed };
  }

  list() {
    return this.refresh();
  }

  moduleDirectory(id) {
    if (!ID_PATTERN.test(id || "")) return "";
    const directory = path.join(this.dataDirectory, id);
    return fs.existsSync(directory) ? directory : "";
  }

  readManifest(id) {
    const directory = this.moduleDirectory(id);
    if (!directory) return null;
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, "module.json"), "utf8"));
    this.validate(manifest);
    return manifest;
  }

  getImportFile(id) {
    const manifest = this.readManifest(id);
    if (!manifest || !manifest.streamerbot || !manifest.streamerbot.importFile) return "";
    const file = path.join(this.moduleDirectory(id), manifest.streamerbot.importFile);
    return fs.existsSync(file) ? file : "";
  }

  getDocumentationFile(id) {
    const manifest = this.readManifest(id);
    if (!manifest || !manifest.documentation) return "";
    const file = path.join(this.moduleDirectory(id), manifest.documentation);
    return fs.existsSync(file) ? file : "";
  }
}

module.exports = { CompanionRegistry };
