const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

class ControlApi {
  constructor(options) {
    this.port = options.port || 3135;
    this.dataDirectory = options.dataDirectory;
    this.installPackage = options.installPackage;
    this.listModules = options.listModules;
    this.listServices = options.listServices;
    this.publicModules = options.publicModules;
    this.listCatalog = options.listCatalog;
    this.checkCatalog = options.checkCatalog;
    this.installCatalog = options.installCatalog;
    this.publicAssets = options.publicAssets;
    this.authPath = path.join(this.dataDirectory, "companion-api.json");
    this.server = null;
    this.token = this.loadToken();
    this.lastInstallation = null;
    this.installing = false;
  }

  loadToken() {
    try {
      const saved = JSON.parse(fs.readFileSync(this.authPath, "utf8"));
      if (/^[a-f0-9]{64}$/.test(saved.token || "")) return saved.token;
    } catch (_) {}
    return this.rotateToken();
  }

  rotateToken() {
    fs.mkdirSync(this.dataDirectory, { recursive: true });
    this.token = crypto.randomBytes(32).toString("hex");
    const temporary = this.authPath + ".tmp";
    fs.writeFileSync(temporary, JSON.stringify({ schemaVersion: 1, token: this.token, createdAt: new Date().toISOString() }, null, 2));
    fs.renameSync(temporary, this.authPath);
    return this.token;
  }

  authorized(request) {
    const header = String(request.headers.authorization || "");
    const supplied = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (supplied.length !== this.token.length) return false;
    return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(this.token));
  }

  json(response, status, payload) {
    const body = Buffer.from(JSON.stringify(payload));
    response.writeHead(status, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
    response.end(body);
  }

  async receivePackage(request) {
    const maximum = 100 * 1024 * 1024;
    const chunks = [];
    let length = 0;
    for await (const chunk of request) {
      length += chunk.length;
      if (length > maximum) throw Object.assign(new Error("Module packages may not exceed 100 MB."), { statusCode: 413 });
      chunks.push(chunk);
    }
    if (!length) throw Object.assign(new Error("The request did not contain a module package."), { statusCode: 400 });
    const uploads = path.join(this.dataDirectory, "api-uploads");
    fs.mkdirSync(uploads, { recursive: true });
    const file = path.join(uploads, crypto.randomUUID() + ".streammodule");
    fs.writeFileSync(file, Buffer.concat(chunks));
    return file;
  }

  async handle(request, response) {
    const url = new URL(request.url, "http://127.0.0.1:" + this.port);
    if (this.publicAssets && await this.publicAssets(request, response, url)) return;
    if (request.method === "GET" && url.pathname === "/health") return this.json(response, 200, { service: "streaming-companion-control", ready: true, port: this.port });
    if (request.method === "GET" && url.pathname === "/api/public/modules") {
      const origin = String(request.headers.origin || "");
      const allowed = /^(https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?)$/.test(origin) ? origin : "";
      const sameHost = ["http://127.0.0.1:" + this.port, "http://localhost:" + this.port].includes(origin);
      const body = Buffer.from(JSON.stringify(await this.publicModules({ browserModules: !origin || sameHost || url.searchParams.get("browserModules") === "1" })));
      response.writeHead(200, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store", ...(allowed ? { "Access-Control-Allow-Origin": allowed, "Vary": "Origin" } : {}) });
      return response.end(body);
    }
    if (!this.authorized(request)) return this.json(response, 401, { error: "A valid Companion API bearer token is required." });
    if (request.method === "GET" && url.pathname === "/api/catalog") return this.json(response, 200, await this.listCatalog());
    if (request.method === "POST" && url.pathname === "/api/catalog/check") return this.json(response, 200, await this.checkCatalog());
    if (request.method === "POST" && url.pathname === "/api/catalog/install") {
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        if (size > 4096) return this.json(response, 413, { error: "Catalogue request too large." });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch (_) { return this.json(response, 400, { error: "Invalid catalogue request." }); }
      if (typeof body?.id !== "string" || !/^[a-z0-9][a-z0-9-]*$/.test(body.id)) return this.json(response, 400, { error: "Invalid module ID." });
      try { return this.json(response, 200, await this.installCatalog(body.id)); }
      catch (error) { return this.json(response, error.statusCode || 422, { error: error.message }); }
    }
    if (request.method === "GET" && url.pathname === "/api/modules") return this.json(response, 200, await this.listModules());
    if (request.method === "GET" && url.pathname === "/api/services") return this.json(response, 200, await this.listServices());
    if (request.method === "GET" && url.pathname === "/api/modules/install/status") return this.json(response, 200, this.lastInstallation || { status: "idle" });
    if (request.method === "POST" && url.pathname === "/api/modules/install") {
      if (this.installing) return this.json(response, 409, { error: "Another module installation is already in progress." });
      this.installing = true;
      const installation = { id: crypto.randomUUID(), status: "installing", startedAt: new Date().toISOString() };
      this.lastInstallation = installation;
      let packagePath = "";
      try {
        packagePath = await this.receivePackage(request);
        const result = await this.installPackage(packagePath);
        Object.assign(installation, { status: "complete", completedAt: new Date().toISOString(), result });
        return this.json(response, 200, installation);
      } catch (error) {
        Object.assign(installation, { status: "failed", completedAt: new Date().toISOString(), error: error.message });
        return this.json(response, error.statusCode || 422, installation);
      } finally { this.installing = false; if (packagePath) fs.rmSync(packagePath, { force: true }); }
    }
    return this.json(response, 404, { error: "Not found" });
  }

  start() {
    if (this.server) return;
    this.server = http.createServer((request, response) => this.handle(request, response).catch((error) => this.json(response, error.statusCode || 500, { error: error.message })));
    this.server.listen(this.port, "127.0.0.1");
  }

  async stop() {
    if (!this.server) return;
    const server = this.server;
    this.server = null;
    await new Promise((resolve) => server.close(resolve));
  }
}

module.exports = { ControlApi };
