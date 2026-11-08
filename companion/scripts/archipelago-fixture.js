const path = require("node:path");
function snapshot(room = "alpha") {
  const players = [{ team: 0, slot: 1, playerKey: "0:1", name: "Synthetic A", game: "Game A", checksDone: 5, checksTotal: 10, status: 30, statusLabel: "Goal" }, { team: 1, slot: 1, playerKey: "1:1", name: "Synthetic B", game: "Game B", checksDone: 2, checksTotal: 20, status: 20, statusLabel: "Playing" }];
  const component = (data) => ({ state: "ready", supported: true, stale: false, data });
  return { apiVersion: 2, schemaVersion: "2.2.0", roomId: room, generationId: room + "-generation-1", stale: false, original: { endpoint: { host: "synthetic.invalid", port: 1234 } }, enriched: { dashboard: { players }, logic: Object.fromEntries(players.map((player) => [player.playerKey, { player, state: "ready", stale: false, inLogic: 4, glitched: 3, glitchedSupported: null, goMode: "unsupported" }])), components: { progress: component({}), logic: component({}), activity: component([]), slotLock: { state: "unsupported", supported: false, stale: false, data: { synchronized: false, controllers: [], targets: [] } } } } };
}
async function fixture(directory, runtimePath) {
  const { createService } = require(runtimePath || "../../modules/archipelago/service/runtime");
  const state = { snapshots: { alpha: snapshot("alpha"), beta: snapshot("beta") }, pages: [], requests: [], actions: [], unavailable: false, reset: false, baselineReads: 0, etagHits: 0 };
  const rawFetcher = async (address, options) => {
    const url = new URL(address); state.requests.push({ path: url.pathname + url.search, method: options.method });
    if (state.unavailable) throw new TypeError("Synthetic outage");
    let value;
    if (url.pathname.endsWith("/rooms")) value = { apiVersion: 2, rooms: ["alpha", "beta"].map((id) => ({ id, label: "Synthetic " + id, online: true, stale: false, capabilities: { remoteWake: true, logicAnalysis: true } })) };
    else {
      const match = /\/rooms\/([^/]+)\/(.*)$/.exec(url.pathname); if (!match) throw new Error("Unexpected fixture request");
      const [, id, route] = match;
      if (route === "snapshot") value = state.snapshots[id];
      else if (route === "dashboard") value = state.snapshots[id].enriched.dashboard;
      else if (route === "slotlock") value = state.snapshots[id].enriched.components.slotLock;
      else if (route.startsWith("slots/")) {
        const match = /^slots\/(\d+)\/(\d+)(?:\/(logic|actions\/recalculate-logic))?$/.exec(route);
        if (!match) throw new Error("Unexpected scoped fixture request");
        const [, team, slot, suffix] = match, key = team + ":" + slot, snapshot = state.snapshots[id], player = snapshot.enriched.dashboard.players.find((player) => player.playerKey === key);
        if (!player || state.missingSlot === key) return new Response("{}", { status: 404 });
        if (state.failedSlot === key) return new Response("{}", { status: 503 });
        if (suffix === "actions/recalculate-logic") {
          if (options.method !== "POST" || options.headers.Authorization !== "Bearer synthetic-private-key") return new Response("{}", { status: 401 });
          state.actions.push({ roomId: id, action: "recalculate-logic", playerKey: key, body: JSON.parse(options.body) });
          value = { states: [{ player: { team: Number(team), slot: Number(slot), playerKey: key }, state: "queued" }] };
          return new Response(JSON.stringify(value), { status: 202 });
        }
        const data = snapshot.enriched.logic[key], logic = { state: data?.state || "not_requested", stale: !!data?.stale, data: data || null };
        value = suffix === "logic" ? logic : { schemaVersion: snapshot.schemaVersion, roomId: id, generationId: snapshot.generationId, player, stale: snapshot.stale, progress: player, logic, configuration: { automaticLogic: null, effectiveAutomaticLogic: true, configurationRevision: 1 } };
      }
      else if (route === "events") {
        if (state.activityFailure) throw new TypeError("Synthetic activity outage");
        if (state.reset && url.searchParams.has("after")) { state.reset = false; return new Response(JSON.stringify({ error: { resetCursor: "synthetic-reset" } }), { status: 409 }); }
        if (!url.searchParams.has("after")) { state.baselineReads++; value = { events: [], nextCursor: "tail", hasMore: false, initial: true }; }
        else value = state.pages.shift() || { events: [], nextCursor: "tail", hasMore: false, initial: false };
      } else if (route.startsWith("actions/")) {
        if (options.headers.Authorization !== "Bearer synthetic-private-key") return new Response(JSON.stringify({ error: {} }), { status: 401 });
        state.actions.push({ roomId: id, action: route.slice(8), body: options.body ? JSON.parse(options.body) : null });
        value = route.endsWith("recalculate-logic") ? { states: state.actions.at(-1).body.players.map((player) => ({ player, state: "queued" })) } : { status: "starting" };
        return new Response(JSON.stringify(value), { status: route.endsWith("recalculate-logic") ? 202 : 200 });
      } else throw new Error("Unexpected fixture route");
    }
    const body = JSON.stringify(value), etag = '"' + require("node:crypto").createHash("sha256").update(body).digest("hex") + '"';
    if (options.headers["If-None-Match"] === etag) { state.etagHits++; return new Response(null, { status: 304 }); }
    return new Response(body, { headers: { etag, "Content-Type": "application/json" } });
  };
  let active = 0;
  const fetcher = async (...args) => {
    active++; state.maxConcurrent = Math.max(state.maxConcurrent || 0, active);
    try { if (state.delayMs) await new Promise((resolve) => setTimeout(resolve, state.delayMs)); return await rawFetcher(...args); }
    finally { active--; }
  };
  const service = createService({ dataDirectory: path.join(directory, "data"), port: 0, fetch: fetcher, autoPoll: false, now: () => state.now ?? Date.now() });
  const port = await service.start();
  return { service, state, base: "http://127.0.0.1:" + port,
    event(id, participant = { team: 0, slot: 1 }) { return { id, generationId: state.snapshots.alpha.generationId, type: "item_send", message: "Synthetic event " + id, timestamp: new Date().toISOString(), participants: [participant] }; },
    async close() { await service.stop(); }
  };
}
module.exports = { fixture, snapshot };
