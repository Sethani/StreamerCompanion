const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

class InstalledService {
  constructor(options) {
    this.app = options.app;
    this.moduleDirectory = options.moduleDirectory;
    this.dataDirectory = options.dataDirectory;
    this.packageManifest = options.manifest;
    this.manifest = {
      schemaVersion: 1,
      id: options.manifest.id,
      name: options.manifest.name,
      version: options.manifest.version,
      description: options.manifest.description || "",
      provides: options.manifest.service.provides || [],
      dependencies: {
        requiredCapabilities: [...new Set([...(options.manifest.service.dependencies?.requiredCapabilities || ["embedded-node"]), ...Object.entries(options.manifest.dependencies?.capabilities || {}).filter(([, value]) => value === "required").map(([key]) => key)])],
        optionalCapabilities: [...new Set([...(options.manifest.service.dependencies?.optionalCapabilities || []), ...Object.entries(options.manifest.dependencies?.capabilities || {}).filter(([, value]) => value === "optional").map(([key]) => key)])]
      },
      installedModule: true,
      settingsPath: options.manifest.service.settingsPath || ""
    };
    this.definition = options.manifest.service;
    this.port = Number(this.definition.port);
    this.process = null;
    this.status = "stopped";
    this.error = "";
    this.logs = [];
    fs.mkdirSync(this.dataDirectory, { recursive: true });
  }

  addLog(stream, value) {
    for (const line of String(value || "").replace(/\r/g, "").split("\n").filter(Boolean)) {
      const entry = { atMs: Date.now(), stream, line };
      this.logs.push(entry);
      try { fs.appendFileSync(path.join(this.dataDirectory, "service.log"), new Date(entry.atMs).toISOString() + " [" + stream + "] " + line + "\n"); } catch (_) {}
    }
    if (this.logs.length > 150) this.logs.splice(0, this.logs.length - 150);
  }

  async probe(timeoutMs = 900) {
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    try {
      const response = await fetch("http://127.0.0.1:" + this.port + (this.definition.healthPath || "/health"), { cache: "no-store", signal: abort.signal });
      const details = await response.json().catch(() => ({}));
      const identity = this.definition.healthService;
      const ready = response.ok && (!identity || details.service === identity) && details.ready !== false;
      return { ready, configured: details.configured ?? details.enabled ?? true, details, error: ready ? "" : details.error || "HTTP " + response.status };
    } catch (error) {
      return { ready: false, configured: false, details: {}, error: error.name === "AbortError" ? "Timed out" : error.message };
    } finally { clearTimeout(timer); }
  }

  async state() {
    const endpoint = await this.probe();
    if (this.process && endpoint.ready && this.status === "starting") this.status = "running";
    return { status: this.status, error: this.error, pid: this.process ? this.process.pid : null, endpoint: { port: this.port, url: "http://127.0.0.1:" + this.port, ...endpoint }, logs: this.logs.slice(-80), installedModule: true };
  }

  async start() {
    if (this.process) return this.state();
    const existing = await this.probe();
    if (existing.ready) { this.status = "conflict"; this.error = "Port " + this.port + " is already in use by " + this.manifest.name + "."; return this.state(); }
    this.status = "starting"; this.error = ""; this.logs = [];
    const entry = path.resolve(this.moduleDirectory, this.definition.entry);
    if (!entry.startsWith(path.resolve(this.moduleDirectory) + path.sep) || !fs.existsSync(entry)) throw new Error("Installed service entry is unavailable.");
    const environment = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      COMPANION_SERVICE_PORT: String(this.port),
      COMPANION_DATA_DIRECTORY: this.dataDirectory,
      COMPANION_MODULE_DIRECTORY: this.moduleDirectory
    };
    const child = spawn(process.execPath, [entry], { cwd: path.dirname(entry), env: environment, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    this.process = child;
    child.stdout.on("data", (data) => this.addLog("out", data));
    child.stderr.on("data", (data) => this.addLog("error", data));
    child.once("error", (error) => { this.error = error.message; this.status = "error"; });
    child.once("exit", (code) => { this.process = null; if (this.status === "stopping") this.status = "stopped"; else if (code !== 0) { this.status = "error"; this.error ||= this.manifest.name + " exited with code " + code + "."; } else this.status = "stopped"; });
    const deadline = Date.now() + (Number(this.definition.startTimeoutMs) || 10000);
    while (Date.now() < deadline && this.process) {
      const health = await this.probe();
      if (health.ready) { this.status = "running"; return this.state(); }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    this.status = "error"; this.error = this.manifest.name + " did not become ready.";
    return this.state();
  }

  async stop() {
    if (!this.process) { this.status = "stopped"; return this.state(); }
    this.status = "stopping";
    const child = this.process;
    child.kill();
    const deadline = Date.now() + 3000;
    while (this.process && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100));
    if (this.process === child) child.kill("SIGKILL");
    this.process = null; this.status = "stopped";
    return this.state();
  }

  async restart() { await this.stop(); return this.start(); }
}

module.exports = { InstalledService };
