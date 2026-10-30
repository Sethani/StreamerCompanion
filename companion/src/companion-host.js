const fs = require("node:fs");
const path = require("node:path");
const { CompanionRegistry } = require("./module-registry");
const { ServiceRegistry } = require("./service-registry");
const { InstalledService } = require("./installed-service");
const { ControlApi } = require("./control-api");
const { ModuleCatalog } = require("./catalog");
const { moduleStates } = require("./module-state");
const { WebAssets } = require("./web-assets");

// Application-independent orchestration. Personal services are registered by main.js.
class CompanionHost {
  constructor(options) {
    this.app = options.app;
    this.installing = false;
    this.version = options.version || require("../package.json").version;
    this.dataDirectory = options.dataDirectory || this.app.getPath("userData");
    this.registry = new CompanionRegistry({
      dataDirectory: path.join(this.dataDirectory, "modules"),
      streamerBotUrl: options.streamerBotUrl || "ws://127.0.0.1:8080/"
    });
    this.services = new ServiceRegistry({
      systemCapabilities: options.systemCapabilities || ["windows", "powershell", "embedded-node"],
      configPath: path.join(this.dataDirectory, "services.json")
    });
    this.controlApi = new ControlApi({
      port: options.controlApiPort ?? 3135,
      dataDirectory: path.join(this.dataDirectory, "control-api"),
      installPackage: (packagePath) => this.installModulePackage(packagePath),
      listModules: () => this.listModules(),
      listServices: () => this.listServices(),
      publicModules: async () => this.publicInstalledModules((await this.moduleState()).states),
      listCatalog: () => this.catalog.inventory(),
      checkCatalog: () => this.catalog.check(),
      installCatalog: (id) => this.installCatalogModule(id),
      publicAssets: (request, response, url) => this.webAssets.handle(request, response, url)
    });
    this.webAssets = new WebAssets({ registry: this.registry, dataDirectory: this.dataDirectory, port: () => this.controlApi.port, moduleStates: () => this.moduleState() });
    this.catalog = new ModuleCatalog({
      repository: options.catalogRepository, fetch: options.catalogFetch,
      version: this.version,
      registry: this.registry, directory: path.join(this.dataDirectory, "catalog"),
      capabilities: () => this.availableCapabilities()
    });
  }

  async availableCapabilities() {
    return (await this.moduleState()).capabilities;
  }

  async moduleState() {
    const state = await this.registry.refresh();
    if (state.streamerBot.connected) this.services.systemCapabilities.add("streamerbot-websocket");
    else this.services.systemCapabilities.delete("streamerbot-websocket");
    for (const capability of this.staticCapabilities || []) this.services.systemCapabilities.delete(capability);
    const actions = [...new Set(state.modules.flatMap((item) => item.requiredActions.filter((name) => !item.missingActions.includes(name))))];
    const result = moduleStates(this.registry.manifests(), this.version, this.services.systemCapabilities, actions, state.streamerBot.connected);
    this.staticCapabilities = [...result.capabilities].filter((value) => !this.services.systemCapabilities.has(value));
    for (const capability of this.staticCapabilities) this.services.systemCapabilities.add(capability);
    this.services.activeProviders = new Set([...result.states].filter(([, value]) => value.state === "ready").map(([id]) => id));
    this.services.moduleStates = result.states;
    return { ...result, registry: state };
  }

  async listModules() {
    const status = await this.moduleState();
    const ui = new Map(this.publicInstalledModules(status.states).modules.map((item) => [item.packageId, item]));
    const manifests = new Map(this.registry.manifests().map((item) => [item.manifest.id, item.manifest]));
    return { ...status.registry, modules: status.registry.modules.map((item) => ({ ...item, ...status.states.get(item.id), ui: ui.get(item.id) || null, hasMedia: manifests.get(item.id)?.media?.kind === "video" })) };
  }

  async listServices() {
    await this.availableCapabilities();
    return this.services.list();
  }

  // Keep automatic service startup separate so the desktop can create its window first.
  start() {
    this.registerInstalledServices();
    this.controlApi.start();
  }

  createInstalledService(manifest, directory) {
    const dataDirectory = path.join(this.dataDirectory, "module-data", manifest.id);
    if (!fs.existsSync(dataDirectory)) {
      for (const legacyId of manifest.dataMigration?.legacyIds || []) {
        if (!/^[a-z0-9][a-z0-9-]*$/.test(legacyId)) continue;
        const legacy = path.join(this.dataDirectory, legacyId);
        if (fs.existsSync(legacy)) { fs.cpSync(legacy, dataDirectory, { recursive: true }); break; }
      }
    }
    return new InstalledService({ app: this.app, manifest, moduleDirectory: directory, dataDirectory });
  }

  registerInstalledServices() {
    for (const item of this.registry.manifests()) {
      if (!item.error && item.manifest.service) this.services.replace(this.createInstalledService(item.manifest, item.directory));
    }
  }

  publicInstalledModules(states) {
    const modules = this.registry.manifests().filter((item) => !item.error && item.manifest.ui).map((item) => {
      const manifest = item.manifest;
      const service = manifest.service || {};
      const base = manifest.web ? this.webAssets.base(manifest.id) : service.port ? "http://127.0.0.1:" + service.port : "";
      return { ...manifest.ui, packageId: manifest.id, id: manifest.ui.id || manifest.id, name: manifest.ui.name || manifest.name, author: manifest.author || manifest.ui.author || "", description: manifest.description, version: manifest.version, state: states?.get(manifest.id)?.state || "ready", problem: states?.get(manifest.id)?.problem || "", nodeUrl: manifest.ui.dockPage && base ? base + manifest.ui.dockPage : manifest.ui.nodeUrl || "", extensionOverlayUrl: manifest.web?.overlayPage ? base + manifest.web.overlayPage : service.overlayPath && base ? base + service.overlayPath : "", links: (manifest.ui.links || []).map((link) => ({ name: link.name, url: base + link.path })) };
    });
    return { schemaVersion: 3, transport: { streamerBotUrl: this.registry.streamerBotUrl }, categories: Array.from(new Set(modules.map((item) => item.category).filter(Boolean))), modules };
  }

  async installModulePackage(packagePath) {
    return this.withInstallationLock(() => this.performModuleInstallation(packagePath));
  }

  async withInstallationLock(operation) {
    if (this.installing) throw Object.assign(new Error("Another module installation is already in progress."), { statusCode: 409 });
    this.installing = true;
    try {
      return await operation();
    } finally {
      this.installing = false;
    }
  }

  async installCatalogModule(id) {
    return this.withInstallationLock(async () => {
      const prepared = await this.catalog.prepare(id);
      const snapshots = [];
      const changed = [];
      try {
        for (const { item } of prepared.packages) {
          const directory = path.join(this.registry.dataDirectory, item.id);
          const service = this.services.get(item.id);
          const state = service ? await service.state() : null;
          const backup = path.join(prepared.temporary, "rollback", item.id);
          const existed = fs.existsSync(directory);
          if (existed) fs.cpSync(directory, backup, { recursive: true });
          snapshots.push({ id: item.id, directory, service, backup, existed, running: Boolean(state?.pid || state?.status === "running") });
        }
        const results = [];
        for (const { item, file } of prepared.packages) {
          changed.push(item.id);
          results.push(await this.performModuleInstallation(file));
        }
        return { installed: results.map((result) => result.module), catalog: await this.catalog.inventory() };
      } catch (error) {
        const failures = [];
        const affected = snapshots.filter((snapshot) => changed.includes(snapshot.id));
        for (const snapshot of [...affected].reverse()) {
          try { await this.services.get(snapshot.id)?.stop(); } catch (_) { failures.push(snapshot.id); }
          this.services.unregister(snapshot.id);
        }
        for (const snapshot of affected) {
          try {
            fs.rmSync(snapshot.directory, { recursive: true, force: true });
            if (snapshot.existed) fs.cpSync(snapshot.backup, snapshot.directory, { recursive: true });
            if (snapshot.service) this.services.register(snapshot.service);
          } catch (_) { failures.push(snapshot.id); }
        }
        for (const snapshot of affected) if (snapshot.running && snapshot.service) {
          try {
            const state = await snapshot.service.start();
            if (state?.status !== "running") failures.push(snapshot.id);
          } catch (_) { failures.push(snapshot.id); }
        }
        if (failures.length) error.message += " Rollback needs attention for: " + [...new Set(failures)].join(", ") + ".";
        throw error;
      } finally { fs.rmSync(prepared.temporary, { recursive: true, force: true }); }
    });
  }

  async performModuleInstallation(packagePath) {
    const staged = this.registry.stage(packagePath);
    const id = staged.manifest.id;
    const previous = this.services.get(id);
    let shouldStart = false;
    let replacement = null;
    try {
      const previousState = previous ? await previous.state() : null;
      shouldStart = Boolean(previousState?.pid || previousState?.status === "running" || this.services.config.autoStart[id]);
      if (previous) await previous.stop();
      this.registry.commit(staged);
      if (staged.manifest.service) {
        replacement = this.createInstalledService(staged.manifest, staged.destination);
        this.services.replace(replacement);
        if (shouldStart) {
          await this.availableCapabilities();
          const dependencies = this.services.dependencyState(replacement);
          if (!dependencies.ready) throw new Error("Missing required capabilities: " + dependencies.missingRequired.join(", "));
          const started = await replacement.start();
          if (started.status !== "running" || !started.endpoint?.ready) throw new Error(staged.manifest.name + " failed its installation health check: " + (started.error || started.endpoint?.error || "service unavailable"));
        }
      } else if (previous?.manifest?.installedModule) this.services.unregister(id);
      const result = { module: { id, name: staged.manifest.name, version: staged.manifest.version }, service: replacement ? await replacement.state() : null, registry: await this.registry.refresh() };
      this.registry.finalize(staged);
      return result;
    } catch (error) {
      if (replacement) await replacement.stop().catch(() => {});
      this.services.unregister(id);
      this.registry.rollback(staged);
      if (previous) { this.services.register(previous); if (shouldStart) await previous.start().catch(() => {}); }
      throw error;
    }
  }
}

module.exports = { CompanionHost };
