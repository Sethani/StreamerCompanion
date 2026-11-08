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
  let testEvent = null;
  let rooms = [], snapshot = null, connected = false, error = "", notice = "", events = [], cursor = null, seen = new Set(), timer, polling, failures = 0, closed = false;
  let etags = new Map(), generation = "", revision = 0, actionBusy = false;
  const csrf = crypto.randomBytes(32).toString("hex"), fetcher = options.fetch || globalThis.fetch;
  const clock = options.now || Date.now;
  const headersForBroker = () => { const token = read(authFile).token; return token ? { Authorization: "Bearer " + token } : {}; };
  const save = () => write(configFile, config);
  function resetFeed() { cursor = null; events = []; seen.clear(); }
  const slotPath = (base, player) => base + "/slots/" + player.team + "/" + player.slot;
  async function limited(items, work) {
    const results = new Array(items.length); let index = 0;
    await Promise.all(Array.from({ length: Math.min(4, items.length) }, async () => {
      while (index < items.length) { const position = index++; try { results[position] = { value: await work(items[position]) }; } catch (error) { results[position] = { error }; } }
    }));
    return results;
  }
  function slotLogic(value, player) {
    if (!value || typeof value.state !== "string" || typeof value.stale !== "boolean" || value.data && model.key(value.data.player) !== model.key(player)) throw new Error("Controller returned invalid slot logic.");
    return { ...(value.data || {}), player, state: value.state, stale: value.stale };
  }
  async function scopedSnapshot(base, room) {
    const selection = model.profile(config.profiles[config.roomId]);
    const activityRecovering = room.online && ["loading", "not_loaded", "error", "stale"].includes(snapshot?.enriched?.components?.activity?.state);
    if (!snapshot || !selection.slots.length || activityRecovering || room.online !== !!snapshot.original?.endpoint) return request(base + "/snapshot");
    const dashboard = await request(base + "/dashboard");
    if (!Array.isArray(dashboard.players)) throw new Error("Controller returned invalid slot inventory.");
    const next = { ...snapshot, stale: !!room.stale, original: { ...snapshot.original, endpoint: room.online ? room.endpoint || snapshot.original.endpoint : null }, enriched: { ...snapshot.enriched, dashboard, logic: {}, components: { ...snapshot.enriched.components } } };
    try { next.enriched.components.slotLock = await request(base + "/slotlock"); }
    catch (_) { next.enriched.components.slotLock = { state: "unavailable", supported: true, stale: true }; }
    // A stale duplicate outside the component must never bypass its freshness gate.
    delete next.enriched.slotLock;
    const selected = model.players(next).filter((player) => selection.slots.includes(model.key(player)));
    if (selected.length !== selection.slots.length) return request(base + "/snapshot");
    const results = await limited(selected, (player) => request(slotPath(base, player)));
    if (results.some((entry) => entry.error?.statusCode === 404 || entry.value && entry.value.generationId !== snapshot.generationId)) return request(base + "/snapshot");
    for (let index = 0; index < selected.length; index++) {
      const player = selected[index], entry = results[index], value = entry.value;
      try {
        if (entry.error) throw entry.error;
        if (value.roomId !== config.roomId || model.key(value.player) !== model.key(player) || !/^2\.2\./.test(value.schemaVersion || "")) throw new Error("Invalid slot identity.");
        next.enriched.logic[model.key(player)] = slotLogic(value.logic, player);
        if (value.stale) next.enriched.logic[model.key(player)].stale = true;
      } catch (_) { next.enriched.logic[model.key(player)] = { player, state: "unavailable", stale: true }; }
    }
    next.enriched.components.progress = { ...next.enriched.components.progress, stale: !!room.stale };
    next.enriched.components.logic = { ...next.enriched.components.logic, state: Object.values(next.enriched.logic).some((value) => value.stale) ? "stale" : "ready" };
    return next;
  }
  let activeRequests = 0; const requestWaiters = [];
  async function request(route, method = "GET", body) {
    if (activeRequests >= 4) await new Promise((resolve) => requestWaiters.push(resolve)); else activeRequests++;
    try { return await performRequest(route, method, body); }
    finally { const next = requestWaiters.shift(); if (next) next(); else activeRequests--; }
  }
  async function performRequest(route, method = "GET", body) {
    const headers = { ...headersForBroker(), ...(body ? { "Content-Type": "application/json" } : {}) };
    const cacheable = method === "GET" && !route.includes("/events");
    if (cacheable && etags.has(route)) headers["If-None-Match"] = etags.get(route).etag;
    const response = await fetcher(config.brokerUrl + route, { method, headers, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(8000), redirect: "error" });
    if (response.status === 304 && etags.has(route)) return etags.get(route).data;
    const value = await response.json();
    if (!response.ok) {
      if (response.status === 409 && route.includes("/events")) { const failure = new Error("Activity stream reset."); failure.reset = true; throw failure; }
      throw Object.assign(new Error(response.status === 401 ? "Controller rejected the API key. Update it in Connection settings." : "Controller request failed (HTTP " + response.status + ")."), { statusCode: response.status });
    }
    if (cacheable && response.headers.get("etag")) etags.set(route, { etag: response.headers.get("etag"), data: value });
    return value;
  }
  async function readEvents(base) {
    if (snapshot.enriched?.components?.activity?.state !== "ready") { resetFeed(); return; }
    const logicUpdates = new Map(), selection = model.profile(config.profiles[config.roomId]);
    for (let page = 0; page < 5; page++) {
      let value;
      try { value = await request(base + "/events" + (cursor ? "?after=" + encodeURIComponent(cursor) + "&limit=100" : "")); }
      catch (failure) { if (failure.reset) { resetFeed(); notice = "Activity stream changed. Resuming at current activity."; return; } throw failure; }
      if (typeof value.nextCursor !== "string" || !Array.isArray(value.events)) throw new Error("Controller returned invalid activity data.");
      const initial = !cursor; cursor = value.nextCursor;
      if (!initial && !value.initial) for (const event of value.events) {
        if (event.generationId !== snapshot.generationId || typeof event.id !== "string" || seen.has(event.id)) continue;
        seen.add(event.id);
        if (event.displayEligible !== false && event.audience !== "operations") events.push(event);
        const updatedKey = model.key(event.update?.player);
        if (event.type === "logic_updated" && selection.slots.includes(updatedKey) && (!event.update.resultRevision || event.update.resultRevision !== snapshot.enriched.logic[updatedKey]?.resultRevision)) logicUpdates.set(updatedKey, event.update.player);
      }
      events = events.filter((event) => clock() - Date.parse(event.timestamp) <= 75000).slice(-200);
      if (seen.size > 2000) seen = new Set(events.map((event) => event.id));
      if (initial || !value.hasMore) break;
    }
    // Cursors change frequently; cache only list/snapshot GETs, never event pages.
    for (const route of etags.keys()) if (route.includes("/events")) etags.delete(route);
    const players = [...logicUpdates.values()], results = await limited(players, (player) => request(slotPath(base, player) + "/logic"));
    for (let index = 0; index < players.length; index++) {
      const player = players[index], entry = results[index];
      try {
        if (entry.error) throw entry.error;
        const value = slotLogic(entry.value, player);
        if (value.generationId && value.generationId !== snapshot.generationId) throw new Error("Changed slot generation.");
        snapshot.enriched.logic[model.key(player)] = value;
      } catch (_) { snapshot.enriched.logic[model.key(player)] = { player, state: "unavailable", stale: true }; }
    }
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
          const next = await scopedSnapshot(base, list.rooms.find((room) => room.id === config.roomId));
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
    if (testEvent && clock() - Date.parse(testEvent.at) >= 15000) testEvent = null;
    return {
      testEvent: config.enabled ? testEvent : null,
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
      const base = "/rooms/" + encodeURIComponent(config.roomId);
      let result;
      if (name === "recalculate-logic") {
        const outcomes = await limited(selected, (player) => request(slotPath(base, player) + "/actions/recalculate-logic", "POST", { force: true }));
        result = { status: outcomes.some((entry) => entry.error) ? "partial" : "accepted", states: outcomes.flatMap((entry, index) => entry.error ? [{ player: selected[index], state: "error", error: true }] : entry.value.states?.length ? entry.value.states : [{ player: selected[index], state: "queued" }]) };
      } else result = await request(base + "/actions/" + name, "POST");
      etags.clear(); await poll(); schedule();
      return { status: result.status || (name === "recalculate-logic" ? "accepted" : "refreshed"), states: (result.states || []).map((entry) => ({ playerKey: model.key(entry.player), state: entry.state, hasError: !!entry.error })) };
    } finally { actionBusy = false; }
  }
  function json(response, status, value) { const body = Buffer.from(JSON.stringify(value)); response.writeHead(status, { "Content-Type": "application/json", "Content-Length": body.length, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }); response.end(body); }
  const server = http.createServer(async (request, response) => {
    try {
      if (!/^((127\.0\.0\.1|localhost)(:\d+)?)$/.test(request.headers.host || "")) return json(response, 403, { error: "Local requests only." });
      const url = new URL(request.url, "http://127.0.0.1");
      if (request.method === "GET" && ["/health", "/api/public/state"].includes(url.pathname)) {
        const origin = String(request.headers.origin || "");
        if (/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) { response.setHeader("Access-Control-Allow-Origin", origin); response.setHeader("Vary", "Origin"); }
      }
      if (request.method === "GET" && url.pathname === "/health") return json(response, 200, { service: "archipelago", version: "1.0.9", ready: true, configured: !!config.roomId, brokerConnected: connected });
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
      if (url.pathname === "/api/overlay") {
        if (typeof input.enabled !== "boolean") throw new Error("Choose whether the overlay is enabled.");
        config.enabled = input.enabled; if (!config.enabled) testEvent = null; save();
        return json(response, 200, settings());
      }
      if (url.pathname === "/api/test-item") {
        if (input.clear === true) { testEvent = null; return json(response, 200, { status: "cleared" }); }
        if (!config.enabled) throw new Error("Enable and save the overlay before testing it live.");
        testEvent = { id: "test-" + crypto.randomUUID(), type: "item_send", at: new Date(clock()).toISOString(), segments: [{ type: "text", text: "TEST ITEM: " }, { type: "player", text: "Sample sender" }, { type: "text", text: " sent " }, { type: "item", text: "Sample item" }, { type: "text", text: " to " }, { type: "player", text: "Sample receiver" }, { type: "text", text: " (" }, { type: "location", text: "Sample location" }, { type: "text", text: ")" }] };
        return json(response, 200, { status: "shown", expiresInSeconds: 15 });
      }
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
