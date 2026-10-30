const fs = require("node:fs");
const path = require("node:path");

class ServiceRegistry {
  constructor(options = {}) {
    this.systemCapabilities = new Set(options.systemCapabilities || []);
    this.services = new Map();
    this.configPath = options.configPath || "";
    this.config = { schemaVersion: 1, autoStart: {} };
    this.loadConfig();
  }

  loadConfig() {
    if (!this.configPath || !fs.existsSync(this.configPath)) return;
    try {
      const saved = JSON.parse(fs.readFileSync(this.configPath, "utf8"));
      if (saved && saved.schemaVersion === 1 && saved.autoStart) this.config = saved;
    } catch (_) {}
  }

  saveConfig() {
    if (!this.configPath) return;
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    const temporary = this.configPath + ".tmp";
    fs.writeFileSync(temporary, JSON.stringify(this.config, null, 2));
    fs.renameSync(temporary, this.configPath);
  }

  register(service) {
    const manifest = service.manifest;
    if (!manifest || manifest.schemaVersion !== 1 || !manifest.id || !manifest.name) {
      throw new Error("Invalid Companion service manifest.");
    }
    if (this.services.has(manifest.id)) throw new Error("Duplicate Companion service: " + manifest.id);
    this.services.set(manifest.id, service);
    return service;
  }

  replace(service) {
    const existing = this.services.get(service.manifest.id) || null;
    this.services.set(service.manifest.id, service);
    return existing;
  }

  unregister(id) {
    const existing = this.services.get(id) || null;
    this.services.delete(id);
    return existing;
  }

  get(id) { return this.services.get(id) || null; }

  dependencyState(service) {
    const dependencies = service.manifest.dependencies || {};
    const provided = new Set(this.systemCapabilities);
    for (const candidate of this.services.values()) {
      if (candidate.manifest.installedModule && this.activeProviders && !this.activeProviders.has(candidate.manifest.id)) continue;
      for (const capability of candidate.manifest.provides || []) provided.add(capability);
    }
    const required = dependencies.requiredCapabilities || [];
    const optional = dependencies.optionalCapabilities || [];
    const moduleState = service.manifest.installedModule && this.moduleStates?.get(service.manifest.id);
    const moduleProblem = moduleState && ["broken", "incompatible", "missing-dependency"].includes(moduleState.state) ? [moduleState.problem] : [];
    const missingRequired = [...required.filter((capability) => !provided.has(capability)), ...moduleProblem];
    return {
      ready: missingRequired.length === 0,
      required,
      optional,
      missingRequired,
      missingOptional: optional.filter((capability) => !provided.has(capability))
    };
  }

  async list() {
    return Promise.all(Array.from(this.services.values(), async (service) => ({
      manifest: service.manifest,
      autoStart: Boolean(this.config.autoStart[service.manifest.id]),
      dependencies: this.dependencyState(service),
      state: await service.state()
    })));
  }

  async execute(id, action) {
    const service = this.services.get(id);
    if (!service) throw new Error("Unknown Companion service: " + id);
    const dependencies = this.dependencyState(service);
    if (["start", "restart"].includes(action) && !dependencies.ready) {
      throw new Error("Missing required capabilities: " + dependencies.missingRequired.join(", "));
    }
    if (!["start", "stop", "restart"].includes(action) || typeof service[action] !== "function") {
      throw new Error("Unsupported service action: " + action);
    }
    await service[action]();
    return this.list();
  }

  async setAutoStart(id, enabled) {
    if (!this.services.has(id)) throw new Error("Unknown Companion service: " + id);
    this.config.autoStart[id] = Boolean(enabled);
    this.saveConfig();
    return this.list();
  }

  async setAutoStartAll(enabled) {
    for (const id of this.services.keys()) this.config.autoStart[id] = Boolean(enabled);
    this.saveConfig();
    return this.list();
  }

  async startAll(options = {}) {
    const automaticOnly = Boolean(options.automaticOnly);
    const results = [];
    for (const [id, service] of this.services) {
      if (automaticOnly && !this.config.autoStart[id]) continue;
      const dependencies = this.dependencyState(service);
      if (!dependencies.ready) continue;
      results.push(await Promise.resolve(service.start()).catch((error) => ({ error })));
    }
    return automaticOnly ? results : this.list();
  }

  async stopAll() {
    await Promise.allSettled(Array.from(this.services.values(), (service) => service.stop()));
    return this.list();
  }

  hasRunningServices() {
    return Array.from(this.services.values()).some((service) => service.process);
  }
}

module.exports = { ServiceRegistry };
