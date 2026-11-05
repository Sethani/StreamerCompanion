"use strict";
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto"), { spawn } = require("node:child_process");
const defaults = { enabled: false, x: 1420, y: 850, width: 260, height: 190, scaleX: 1, scaleY: 1, controllerIndex: -1 };
function normalize(input = {}) {
  const number = (name, min, max) => Number.isFinite(Number(input[name])) ? Math.max(min, Math.min(max, Number(input[name]))) : defaults[name];
  return { enabled: input.enabled === true, x: number("x", -4000, 8000), y: number("y", -4000, 8000), width: number("width", 50, 3840), height: number("height", 50, 2160), scaleX: number("scaleX", 0.1, 4), scaleY: number("scaleY", 0.1, 4), controllerIndex: Math.trunc(number("controllerIndex", -1, 3)) };
}
function snapshot(input = {}) {
  return { supported: input.supported === true, source: "native-xinput", pads: (Array.isArray(input.pads) ? input.pads : []).filter(pad => Number.isInteger(pad.index) && pad.index >= 0 && pad.index < 4 && pad.connected !== false).slice(0, 4).map(pad => ({ index: pad.index, id: "Windows XInput Controller", connected: true, mapping: "standard", pressed: [...new Set((Array.isArray(pad.pressed) ? pad.pressed : []).filter(index => Number.isInteger(index) && index >= 0 && index <= 16))], axes: Array.from({ length: 4 }, (_, index) => Number.isFinite(pad.axes?.[index]) ? Math.max(-1, Math.min(1, pad.axes[index])) : 0) })) };
}
function nativeProvider({ directory, onState, onError }) {
  const pwsh = path.join(process.env.ProgramFiles || "C:\\Program Files", "PowerShell/7/pwsh.exe");
  const child = spawn(fs.existsSync(pwsh) ? pwsh : "powershell.exe", ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-File", path.join(__dirname, "native-xinput.ps1"), "-ParentProcessId", String(process.pid), "-DataDirectory", directory], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
  let buffer = "";
  child.stdout.on("data", bytes => {
    buffer += bytes.toString("utf8");
    if (buffer.length > 65536) { buffer = ""; onError(); return; }
    let newline;
    while ((newline = buffer.indexOf("\n")) >= 0) { const line = buffer.slice(0, newline).trim(); buffer = buffer.slice(newline + 1); if (!line) continue; try { onState(JSON.parse(line)); } catch (_) { onError(); } }
  });
  child.stderr.on("data", () => onError()); child.on("error", onError); child.on("exit", onError);
  return { pid: child.pid, async stop() { if (child.exitCode !== null) return; await new Promise(resolve => { child.once("exit", resolve); child.kill(); const timer = setTimeout(resolve, 2000); timer.unref(); }); } };
}
function createService(options = {}) {
  const directory = options.dataDirectory || process.env.COMPANION_DATA_DIRECTORY || path.join(process.cwd(), "controller-data"); fs.mkdirSync(directory, { recursive: true });
  const file = path.join(directory, "config.json"), csrf = crypto.randomBytes(24).toString("hex"), now = options.now || Date.now;
  let saved = {}; try { saved = JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) {}
  let config = normalize(saved), input = snapshot(), lastInput = 0, provider, providerStatus = "starting", testUntil = 0, stopped = false;
  function onState(value) { input = snapshot(value); lastInput = now(); providerStatus = "ready"; }
  function onError() { providerStatus = "unavailable"; input = snapshot(); }
  function publicState() {
    const test = now() < testUntil;
    const fresh = providerStatus === "ready" && now() - lastInput < 1500;
    const current = test ? snapshot({ supported: true, pads: [{ index: config.controllerIndex < 0 ? 0 : config.controllerIndex, connected: true, pressed: [0, 4, 6], axes: [0.6, -0.5, -0.4, 0.3] }] }) : fresh ? input : snapshot();
    return { ...current, service: "controller-input", version: "1.1.0", ready: true, enabled: config.enabled, config, test, providerStatus: fresh ? "ready" : providerStatus === "ready" ? "stale" : providerStatus, atMs: now() };
  }
  function save(input) { config = normalize({ ...config, ...input }); fs.writeFileSync(file + ".tmp", JSON.stringify(config, null, 2)); fs.renameSync(file + ".tmp", file); return config; }
  function json(response, status, value) { const bytes = Buffer.from(JSON.stringify(value)); response.writeHead(status, { "Content-Type": "application/json", "Content-Length": bytes.length, "Cache-Control": "no-store" }); response.end(bytes); }
  const pages = { "/settings": "settings.html", "/overlay": "overlay.html", "/overlay.css": "overlay.css", "/overlay.js": "overlay.js", "/settings.js": "settings.js" };
  const server = http.createServer(async (request, response) => {
    try {
      if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(request.headers.host || "")) return json(response, 403, { error: "Local requests only." });
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && ["/health", "/state", "/api/controller/state"].includes(url.pathname)) {
        const origin = String(request.headers.origin || ""); if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) { response.setHeader("Access-Control-Allow-Origin", origin); response.setHeader("Vary", "Origin"); }
        return json(response, 200, publicState());
      }
      if (request.method === "GET" && pages[url.pathname]) { const name = pages[url.pathname]; response.writeHead(200, { "Content-Type": name.endsWith(".html") ? "text/html; charset=utf-8" : name.endsWith(".js") ? "application/javascript" : "text/css", "Cache-Control": "no-store" }); return response.end(fs.readFileSync(path.join(__dirname, name), "utf8").replace("__CSRF__", csrf)); }
      if (request.headers["x-companion-csrf"] !== csrf) return json(response, 403, { error: "Open Controller Settings to change the display." });
      if (request.method === "GET" && url.pathname === "/api/controller/settings") return json(response, 200, { config });
      if (request.method !== "POST") return json(response, 404, { error: "Not found." });
      let length = 0; const chunks = []; for await (const chunk of request) { length += chunk.length; if (length > 16384) throw new Error("Request is too large."); chunks.push(chunk); }
      const value = JSON.parse(Buffer.concat(chunks).toString() || "{}");
      if (url.pathname === "/api/controller/settings") return json(response, 200, { config: save(value) });
      if (url.pathname === "/api/controller/test") { if (value.clear) testUntil = 0; else { if (!config.enabled) throw new Error("Enable and save the display first."); testUntil = now() + 10000; } return json(response, 200, { status: value.clear ? "cleared" : "shown" }); }
      return json(response, 404, { error: "Not found." });
    } catch (error) { json(response, 400, { error: error.message }); }
  });
  return { server, publicState, csrf, nativePid: () => provider?.pid,
    async start() { stopped = false; await new Promise((resolve, reject) => { server.once("error", reject); server.listen(options.port ?? Number(process.env.COMPANION_SERVICE_PORT || 3126), "127.0.0.1", resolve); }); if (options.providerFactory) provider = options.providerFactory({ directory, onState, onError }); else if (process.platform === "win32") provider = nativeProvider({ directory, onState, onError }); else providerStatus = "unsupported"; return server.address().port; },
    async stop() { if (stopped) return; stopped = true; await provider?.stop(); if (server.listening) await new Promise(resolve => server.close(resolve)); },
  };
}
if (require.main === module) { const service = createService(); service.start().catch(() => { console.error("Controller service could not start."); process.exitCode = 1; }); for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => service.stop().finally(() => process.exit(0))); }
module.exports = { createService, normalize, snapshot };
