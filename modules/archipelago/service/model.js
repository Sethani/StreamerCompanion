"use strict";
const DEFAULT_DISPLAY = { progress: true, goals: true, logic: true, activity: true, showNames: true };
const EVENT_TYPES = ["item_send", "item_cheat", "hint", "check", "chat", "server_chat", "death_link", "goal", "release", "collect", "join", "part", "countdown", "notice", "unknown"];
const key = (player) => Number.isInteger(player?.team) && player.team >= 0 && Number.isInteger(player?.slot) && player.slot > 0 ? player.team + ":" + player.slot : "";
function profile(input = {}) {
  return {
    generationId: typeof input.generationId === "string" ? input.generationId : "",
    slots: [...new Set((Array.isArray(input.slots) ? input.slots : []).filter((id) => typeof id === "string" && /^[0-9]+:[0-9]+$/.test(id)))].slice(0, 1000),
    display: Object.fromEntries(Object.entries(DEFAULT_DISPLAY).map(([name, fallback]) => [name, typeof input.display?.[name] === "boolean" ? input.display[name] : fallback])),
    filterLocks: { progress: input.filterLocks?.progress !== false, logic: input.filterLocks?.logic !== false, activity: input.filterLocks?.activity !== false },
    eventTypes: (Array.isArray(input.eventTypes) ? input.eventTypes : ["item_send", "hint", "death_link", "goal"]).filter((value) => EVENT_TYPES.includes(value)),
    maxEvents: Number.isInteger(input.maxEvents) ? Math.min(12, Math.max(1, input.maxEvents)) : 6
  };
}
function brokerUrl(value) {
  const url = new URL(value || "http://127.0.0.1:38283/api/controller/v2");
  if (url.protocol !== "http:" || !["127.0.0.1", "localhost"].includes(url.hostname) || url.username || url.password || url.search || url.hash || url.pathname.replace(/\/$/, "") !== "/api/controller/v2") throw new Error("Use a local Controller Room API address ending in /api/controller/v2.");
  return url.href.replace(/\/$/, "");
}
function players(snapshot) { return (snapshot?.enriched?.dashboard?.players || []).filter((player) => key(player) && String(player.game).toLowerCase() !== "slotlock"); }
function lockState(snapshot, id) {
  const component = snapshot?.enriched?.components?.slotLock;
  if (component?.supported === false || component?.state === "unsupported") return "unlocked";
  const data = component?.data || snapshot?.enriched?.slotLock;
  if (component?.state !== "ready" || component.stale || !data?.synchronized) return "unknown";
  return data.targets?.find((target) => key(target) === id)?.state || "unknown";
}
function project(snapshot, selection, events, now = Date.now()) {
  const settings = profile(selection), chosen = new Set(settings.slots), enriched = snapshot.enriched || {}, stale = !!snapshot.stale || !snapshot.original?.endpoint;
  const selected = players(snapshot).filter((player) => chosen.has(key(player)));
  const rows = selected.map((player) => {
    const id = key(player), locked = lockState(snapshot, id) !== "unlocked";
    const progress = settings.display.progress && !(locked && settings.filterLocks.progress);
    const showLogic = settings.display.logic && !(locked && settings.filterLocks.logic);
    const result = enriched.logic?.[id], wrongGeneration = !!result?.generationId && result.generationId !== snapshot.generationId;
    const logicReady = showLogic && !stale && !wrongGeneration && result?.state === "ready" && !result.stale && key(result.player) === id;
    const validCount = (value) => Number.isInteger(value) && value >= 0 ? value : null;
    const done = validCount(player.checksDone), total = validCount(player.checksTotal);
    return {
      id, name: settings.display.showNames ? String(player.alias || player.name || "Player").slice(0, 120) : "", game: String(player.game || "Game").slice(0, 120), locked,
      progress: progress ? { done, total, percent: total > 0 && done !== null ? Math.min(100, Math.round(done / total * 100)) : null, stale: stale || !!enriched.components?.progress?.stale } : null,
      goal: settings.display.goals && !(locked && settings.filterLocks.progress) ? player.status === 30 : null,
      logic: showLogic ? { state: stale || result?.stale || wrongGeneration ? "stale" : result?.state === "ready" && (validCount(result.inLogic) === null || key(result.player) !== id) ? "unavailable" : result?.state || "not_requested", inLogic: logicReady ? validCount(result.inLogic) : null, glitched: logicReady && result.glitchedSupported === true ? validCount(result.glitched) : null, goMode: logicReady && ["yes", "glitched", "no"].includes(result.goMode) ? result.goMode : "unsupported" } : null
    };
  }).filter((row) => row.progress || row.logic || row.goal !== null);
  const filteredEvents = settings.display.activity && !stale ? events.filter((event) => {
    if (!settings.eventTypes.includes(event.type) || !Number.isFinite(Date.parse(event.timestamp)) || now - Date.parse(event.timestamp) > 75000 || Date.parse(event.timestamp) > now + 5000) return false;
    const participants = Array.isArray(event.participants) ? event.participants : [];
    if (participants.length && !participants.some((player) => chosen.has(key(player)))) return false;
    if (!chosen.size) return false;
    if (settings.filterLocks.activity) {
      if (!participants.length) return enriched.components?.slotLock?.supported === false || enriched.components?.slotLock?.state === "unsupported";
      if (participants.some((player) => lockState(snapshot, key(player)) !== "unlocked")) return false;
    }
    return true;
  }).slice(-settings.maxEvents).map((event) => ({ id: String(event.id), type: event.type, text: String(event.message || "").slice(0, 1000), at: event.timestamp })) : [];
  return { players: rows, events: filteredEvents, stale, goals: settings.display.goals ? { completed: rows.filter((row) => row.goal === true).length, total: rows.filter((row) => row.goal !== null).length } : null };
}
module.exports = { DEFAULT_DISPLAY, EVENT_TYPES, key, profile, brokerUrl, players, lockState, project };
