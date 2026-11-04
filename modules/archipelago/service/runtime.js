"use strict";
const fs = require("node:fs"), path = require("node:path"), http = require("node:http"), crypto = require("node:crypto");
const model = require("./model");
function createService(options = {}) {
  const directory = options.dataDirectory || process.env.COMPANION_DATA_DIRECTORY || path.join(process.cwd(), "archipelago-data");
  fs.mkdirSync(directory, { recursive: true });
  const configFile = path.join(directory, "config.json"), authFile = path.join(directory, "auth.json");
  function read(file) { try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch (_) { return {}; } }
  function write(file, data) { fs.writeFileSync(file + ".tmp", JSON.stringify(data, null, 2)); fs.renameSync(file + ".tmp", file); }
  const saved = read(configFile);
  let config = { schemaVersion: 1, brokerUrl: model.brokerUrl(options.brokerUrl || saved.brokerUrl), roomId: typeof saved.roomId === "string" ? saved.roomId : "", enabled: saved.enabled === true, profiles: Object.assign(Object.create(null), Object.fromEntries(Object.entries(saved.profiles || {}).map(([id, value]) => [id, model.profile(value)]))) };
  let rooms = [], snapshot = null, connected = false, error = "", notice = "", events = [], cursor = null, seen = new Set(), timer, polling, failures = 0, closed = false;
  let etags = new Map(), generation = "", revision = 0, actionBusy = false;
  const csrf = crypto.randomBytes(32).toString("hex"), fetcher = options.fetch || globalThis.fetch;
  const clock = options.now || Date.now;
  const headersForBroker = () => { const token = read(authFile).token; return token ? { Authorization: "Bearer " + token } : {}; };
  const save = () => write(configFile, config);
  function resetFeed() { cursor = null; events = []; seen.clear(); }
  async function request(route, method = "GET", body) {
    const headers = { ...headersForBroker(), ...(body ? { "Content-Type": "application/json" } : {}) };
    if (method === "GET" && etags.has(route)) headers["If-None-Match"] = etags.get(route).etag;
    const response = await fetcher(config.brokerUrl + route, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000), redirect: "error" });
    if (response.status === 304 && etags.has(route)) return etags.get(route).data;
    const value = await response.json();
    if (!response.ok) {
      if (response.status === 409 && route.includes("/events")) { const failure = new Error("Activity stream reset."); failure.reset = true; throw failure; }
      throw new Error(response.status === 401 ? "Controller rejected the API key. Update it in Connection settings." : "Controller request failed (HTTP " + response.status + ").");
    }
    if (method === "GET" && response.headers.get("etag")) etags.set(route, { etag: response.headers.get("etag"), data: value });
    return value;
  }
  async function readEvents(base) {
    if (snapshot.enriched?.components?.activity?.state !== "ready") { resetFeed(); return; }
    for (let page = 0; page < 5; page++) {
      let value;
      try { value = await request(base + "/events" + (cursor ? "?after=" + encodeURIComponent(cursor) + "&limit=100" : "")); }
      catch (failure) { if (failure.reset) { resetFeed(); notice = "Activity stream changed. Resuming at current activity."; return; } throw failure; }
      if (typeof value.nextCursor !== "string" || !Array.isArray(value.events)) throw new Error("Controller returned invalid activity data.");
      const initial = !cursor; cursor = value.nextCursor;
      if (!initial && !value.initial) for (const event of value.events) {
        if (event.generationId !== snapshot.generationId || typeof event.id !== "string" || seen.has(event.id)) continue;
        seen.add(event.id); events.push(event);
      }
      events = events.filter((event) => clock() - Date.parse(event.timestamp) <= 75000).slice(-200);
      if (seen.size > 2000) seen = new Set(events.map((event) => event.id));
      if (initial || !value.hasMore) break;
    }
    // Cursors change frequently; cache only list/snapshot GETs, never event pages.
    for (const route of etags.keys()) if (route.includes("/events")) etags.delete(route);
  }
  async function poll() {
    if (polling) return polling;
    const expectedRevision = revision;
    polling = (async () => {
      try {
        const list = await request("/rooms");
        if (list.apiVersion !== 2 || !Array.isArray(list.rooms)) throw new Error("Controller Room API v2 is required.");
        if (expectedRevision !== revision) return;
        rooms = list.rooms.map((room) => ({ id: String(room.id), label: String(room.label || "Room"), online: !!room.online, stale: !!room.stale, capabilities: room.capabilities || {} }));
        if (config.roomId) {
          if (!rooms.some((room) => room.id === config.roomId)) throw new Error("The selected room is not exposed by Controller. Choose a room or enable it in Controller.");
          const base = "/rooms/" + encodeURIComponent(config.roomId);
          const next = await request(base + "/snapshot");
          if (expectedRevision !== revision) return;
          if (next.apiVersion !== 2 || !/^2\.2\./.test(next.schemaVersion || "") || next.roomId !== config.roomId || typeof next.generationId !== "string" || !next.generationId || !next.enriched?.components || !Array.isArray(next.enriched.dashboard?.players)) throw new Error("Controller returned an unsupported room snapshot. API 2.2 is required.");
          const current = config.profiles[config.roomId] ||= model.profile();
          if (current.generationId && current.generationId !== next.generationId) { current.slots = []; resetFeed(); notice = "This room has a new generation. Select its slots again before displaying them."; }
          if (generation !== next.generationId) resetFeed();
          generation = next.generationId;
          if (current.generationId !== generation) { current.generationId = generation; save(); }
          snapshot = next;
          try {
            await readEvents(base);
            if (notice === "Activity is temporarily unavailable. Progress and logic remain available.") notice = "";
          }
          catch (_) { events = []; notice = "Activity is temporarily unavailable. Progress and logic remain available."; }
        } else { snapshot = null; resetFeed(); }
        connected = true; error = ""; failures = 0;
      } catch (failure) { if (expectedRevision === revision) { connected = false; failures++; events = []; error = failure.name === "SyntaxError" ? "Controller returned invalid JSON." : failure.name === "TimeoutError" || failure.name === "TypeError" ? "Controller is unavailable. Check that the Room data API is running." : failure.message; } }
    })().finally(() => { polling = null; });
    return polling;
  }
  function schedule() {
    if (closed || options.autoPoll === false) return;
    clearTimeout(timer);
    const delay = failures ? Math.min(60000, 5000 * 2 ** Math.min(failures, 4)) : rooms.find((room) => room.id === config.roomId)?.online ? 5000 : 15000;
    timer = setTimeout(async () => { await poll(); schedule(); }, delay); timer.unref();
  }
  function publicState() {
    const selection = model.profile(config.profiles[config.roomId]);
    return {
      schemaVersion: 1, enabled: config.enabled, status: !connected ? "unavailable" : !config.roomId ? "no-room" : !selection.slots.length ? "no-slots" : "ready",
      room: config.enabled && connected ? rooms.find((room) => room.id === config.roomId)?.label || "" : "",
      ...(config.enabled && connected && snapshot ? model.project(snapshot, selection, events, clock()) : { players: [], events: [], stale: !connected, goals: null })
    };
  }
  function settings() {
    const waiting = connected && snapshot ? model.project(snapshot, model.profile(config.profiles[config.roomId]), [], clock()).waiting : "";
    return { config, hasToken: !!read(authFile).token, connected, error, notice: notice || waiting, rooms, eventTypes: model.EVENT_TYPES,
      slots: model.players(snapshot).map((player) => { const id = model.key(player), logic = snapshot.enriched?.logic?.[id]; return { id, name: String(player.alias || player.name || "Player"), game: String(player.game || "Game"), checksDone: player.checksDone, checksTotal: player.checksTotal, status: player.statusLabel, lock: model.lockState(snapshot, id), logicState: logic?.stale ? "stale" : logic?.state || "not_requested" }; }),
      components: Object.fromEntries(Object.entries(snapshot?.enriched?.components || {}).map(([name, component]) => [name, { state: component.state, stale: !!component.stale, supported: component.supported, reasonCode: component.reasonCode }])) };
  }
  let updates = Promise.resolve();
  function update(input) { const next = updates.then(() => updateSettings(input)); updates = next.catch(() => {}); return next; }
  async function updateSettings(input) {
    if (actionBusy) throw new Error("Wait for the Controller action before changing settings.");
    const nextUrl = model.brokerUrl(input.brokerUrl || config.brokerUrl);
    const roomId = typeof input.roomId === "string" ? input.roomId : config.roomId;
    if (roomId && !rooms.some((room) => room.id === roomId)) throw new Error("Choose an available room.");
    if (input.profile && roomId !== config.roomId) throw new Error("Select the room before saving its slots.");
    if (input.token !== undefined && (typeof input.token !== "string" || /[\s\x00-\x1f]/.test(input.token) || input.token.length > 4096)) throw new Error("Enter only the API key, without a Bearer prefix.");
    revision++; await polling;
    if (roomId !== config.roomId || nextUrl !== config.brokerUrl) { snapshot = null; generation = ""; resetFeed(); notice = ""; etags.clear(); }
    if (nextUrl !== config.brokerUrl) { write(authFile, {}); rooms = []; }
    config.brokerUrl = nextUrl; config.roomId = roomId;
    if (typeof input.enabled === "boolean") config.enabled = input.enabled;
    if (input.profile && roomId) { config.profiles[roomId] = model.profile({ ...input.profile, generationId: config.profiles[roomId]?.generationId || generation }); notice = ""; }
    if (input.token !== undefined && input.token) write(authFile, { token: input.token });
    if (input.clearToken) write(authFile, {});
    save(); await poll(); schedule(); return settings();
  }
  async function action(name, expectedRoomId) {
    if (actionBusy) throw new Error("A Controller action is already in progress.");
    if (expectedRoomId !== undefined && expectedRoomId !== config.roomId) throw new Error("The selected room changed. Refresh these controls before running an action.");
    if (!connected) throw new Error("Reconnect to Controller before running room actions.");
    if (!["refresh", "wake", "recalculate-logic"].includes(name)) throw new Error("Unknown Controller action.");
    if (!config.roomId || !rooms.some((room) => room.id === config.roomId)) throw new Error("Choose a room first.");
    if (!read(authFile).token) throw new Error("Add the Controller API key in Connection settings first.");
    const room = rooms.find((room) => room.id === config.roomId);
    if (name === "wake" && !room.capabilities.remoteWake || name === "recalculate-logic" && !room.capabilities.logicAnalysis) throw new Error("Controller does not support this action for the selected room.");
    const chosen = new Set(model.profile(config.profiles[config.roomId]).slots);
    const selected = model.players(snapshot).filter((player) => chosen.has(model.key(player))).map((player) => ({ team: player.team, slot: player.slot, playerKey: model.key(player) }));
    if (name === "recalculate-logic" && !selected.length) throw new Error("Select at least one reported game slot.");
    actionBusy = true;
    try {
      const result = await request("/rooms/" + encodeURIComponent(config.roomId) + "/actions/" + name, "POST", name === "recalculate-logic" ? { players: selected, force: true } : undefined);
      etags.clear(); await poll(); schedule();
      return { status: result.status || (name === "recalculate-logic" ? "accepted" : "refreshed"), states: (result.states || []).map((entry) => ({ playerKey: model.key(entry.player), state: entry.state, hasError: !!entry.error })) };
    } finally { actionBusy = false; }
  }
  function json(response, status, value) { const body = Buffer.from(JSON.stringify(value)); response.writeHead(status, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(body); }
  const server = http.createServer(async (request, response) => {
    try {
      if (!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(request.headers.host || "")) return json(response, 403, { error: "Local requests only." });
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { service: "archipelago", version: "1.0.1", ready: true, configured: !!config.roomId, brokerConnected: connected });
      if (request.method === "GET" && url.pathname === "/api/public/state") return json(response, 200, publicState());
      const pages = { "/settings": "settings.html", "/overlay": "overlay.html", "/app.js": "app.js", "/styles.css": "styles.css", "/overlay.js": "overlay.js", "/overlay.css": "overlay.css" };
      if (request.method === "GET" && pages[url.pathname]) {
        const file = pages[url.pathname], source = fs.readFileSync(path.join(__dirname, "public", file), "utf8").replace("__CSRF_TOKEN__", csrf);
        response.writeHead(200, { "Content-Type": file.endsWith("html") ? "text/html; charset=utf-8" : file.endsWith("js") ? "application/javascript" : "text/css", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(source); return;
      }
      if (request.headers["x-companion-csrf"] !== csrf) return json(response, 403, { error: "Open this module's controls to manage settings." });
      if (request.method === "GET" && url.pathname === "/api/settings") return json(response, 200, settings());
      if (request.method !== "POST") return json(response, 404, { error: "Not found." });
      let length = 0; const chunks = [];
      for await (const chunk of request) { length += chunk.length; if (length > 65536) throw new Error("Settings request is too large."); chunks.push(chunk); }
      const input = chunks.length ? JSON.parse(Buffer.concat(chunks)) : {};
      if (url.pathname === "/api/settings") return json(response, 200, await update(input));
      if (url.pathname === "/api/refresh") { await poll(); schedule(); return json(response, 200, settings()); }
      if (url.pathname === "/api/actions") return json(response, 200, await action(input.action, input.roomId));
      return json(response, 404, { error: "Not found." });
    } catch (failure) { json(response, 400, { error: failure.name === "SyntaxError" ? "Invalid settings request." : failure.message }); }
  });
  return { server, poll, update, action, settings, publicState, csrf,
    async start() { await new Promise((resolve, reject) => { server.once("error", reject); server.listen(options.port ?? Number(process.env.COMPANION_SERVICE_PORT || 3141), "127.0.0.1", resolve); }); await poll(); schedule(); return server.address().port; },
    async stop() { closed = true; clearTimeout(timer); await polling; if (server.listening) await new Promise((resolve) => server.close(resolve)); }
  };
}
if (require.main === module) { const service = createService(); service.start().catch(() => { console.error("Archipelago service could not start."); process.exitCode = 1; }); for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => service.stop().finally(() => process.exit(0))); }
module.exports = { createService };
