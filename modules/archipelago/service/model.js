"use strict";
const DEFAULT_DISPLAY = { progress: true, goals: true, logic: true, activity: true, showNames: true, hideCompletedLogic: false, showBK: true };
const EVENT_TYPES = ["item_send", "item_cheat", "hint", "check", "chat", "server_chat", "death_link", "goal", "release", "collect", "join", "part", "countdown", "notice", "unknown"];
const key = (player) => Number.isInteger(player?.team) && player.team >= 0 && Number.isInteger(player?.slot) && player.slot > 0 ? player.team + ":" + player.slot : "";
function profile(input = {}) {
  return {
    generationId: typeof input.generationId === "string" ? input.generationId : "",
    slots: [...new Set((Array.isArray(input.slots) ? input.slots : []).filter((id) => typeof id === "string" && /^[0-9]+:[0-9]+$/.test(id)))].slice(0, 1000),
    slotDisplay: Object.fromEntries(Object.entries(input.slotDisplay || {}).filter(([id]) => /^[0-9]+:[0-9]+$/.test(id)).slice(0, 1000).map(([id, value]) => [id, { progress: value?.progress !== false, logic: value?.logic !== false }])),
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
function segmentsFor(event) {
  const raw = String(event.message || "").slice(0, 1000);
  if (["item_send", "item_cheat"].includes(event.type)) {
    const participants = event.participants || [];
    const sender = participants.find((player) => player.role === "sender");
    const receiver = participants.find((player) => player.role === "receiver");
    if (event.type === "item_cheat" && typeof event.item?.name === "string" && event.item.name && receiver?.name) return [{ type: "player", text: String(receiver.name).slice(0, 120) }, { type: "text", text: " received " }, { type: "item", text: event.item.name.slice(0, 200) }, { type: "text", text: " (cheat)" }];
    if (event.item?.name && typeof event.item.name === "string" && sender?.name && receiver?.name) {
      const segments = [{ type: "player", text: String(sender.name).slice(0, 120) }, { type: "text", text: " sent " }, { type: "item", text: event.item.name.slice(0, 200) }, { type: "text", text: " to " }, { type: "player", text: String(receiver.name).slice(0, 120) }];
      if (typeof event.location?.name === "string" && event.location.name) segments.push({ type: "text", text: " (" }, { type: "location", text: event.location.name.slice(0, 200) }, { type: "text", text: ")" });
      return segments;
    }
    if (/^\s*\d+\s+sent\s+\d+\s+to\s+\d+(?:\s*\(\d+\))?\s*$/.test(raw)) return [{ type: "text", text: "Item sent - details unavailable from Controller" }];
  }
  const text = raw;
  const tokens = [...(event.participants || []).map((player) => ({ text: player.name, type: "player" })), { text: event.item?.name, type: "item" }, { text: event.location?.name, type: "location" }].filter((token) => typeof token.text === "string" && token.text.length >= 2).sort((a, b) => b.text.length - a.text.length);
  const segments = []; let offset = 0;
  while (offset < text.length) {
    let next = null, position = text.length;
    for (const token of tokens) { const index = text.indexOf(token.text, offset); if (index >= offset && index < position) { position = index; next = token; } }
    if (position > offset) segments.push({ type: "text", text: text.slice(offset, position) });
    if (!next) break;
    segments.push(next); offset = position + next.text.length;
  }
  return segments;
}
function project(snapshot, selection, events, now = Date.now()) {
  const settings = profile(selection), chosen = new Set(settings.slots), enriched = snapshot.enriched || {}, stale = !!snapshot.stale || !snapshot.original?.endpoint;
  const selected = players(snapshot).filter((player) => chosen.has(key(player)));
  const rows = selected.map((player) => {
    const id = key(player), locked = lockState(snapshot, id) !== "unlocked";
    const slotOptions = settings.slotDisplay[id] || { progress: true, logic: true };
    const complete = Number.isInteger(player.checksDone) && Number.isInteger(player.checksTotal) && player.checksTotal > 0 && player.checksDone >= player.checksTotal;
    const progress = slotOptions.progress && settings.display.progress && !(locked && settings.filterLocks.progress);
    let showLogic = slotOptions.logic && settings.display.logic && !(settings.display.hideCompletedLogic && complete) && !(locked && settings.filterLocks.logic);
    const result = enriched.logic?.[id], wrongGeneration = !!result?.generationId && result.generationId !== snapshot.generationId;
    const logicReady = showLogic && !stale && !wrongGeneration && result?.state === "ready" && !result.stale && key(result.player) === id;
    const bk = logicReady && result.inLogic === 0 && !(result.glitchedSupported === true && result.glitched > 0) && !["yes", "glitched"].includes(result.goMode);
    if (bk && !settings.display.showBK) showLogic = false;
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
    if (event.displayEligible === false || event.audience === "operations") return false;
    // Server startup/save restoration is not a newly received item.
    if (/^\s*Loaded save file\b/i.test(String(event.message || ""))) return false;
    if (["item_send", "item_cheat"].includes(event.type) && !event.item && !(event.participants || []).length) return false;
    if (!settings.eventTypes.includes(event.type) || !Number.isFinite(Date.parse(event.timestamp)) || now - Date.parse(event.timestamp) > 75000 || Date.parse(event.timestamp) > now + 5000) return false;
    const participants = Array.isArray(event.participants) ? event.participants : [];
    if (participants.length && !participants.some((player) => chosen.has(key(player)))) return false;
    if (!chosen.size) return false;
    if (settings.filterLocks.activity) {
      if (!participants.length) return enriched.components?.slotLock?.supported === false || enriched.components?.slotLock?.state === "unsupported";
      if (participants.some((player) => lockState(snapshot, key(player)) !== "unlocked")) return false;
    }
    return true;
  }).slice(-settings.maxEvents).map((event) => ({ id: String(event.id), type: event.type, text: segmentsFor(event).map((segment) => segment.text).join(""), segments: segmentsFor(event), at: event.timestamp })) : [];
  const lockFiltered = selected.some((player) => lockState(snapshot, key(player)) !== "unlocked") && ((settings.filterLocks.progress && (settings.display.progress || settings.display.goals)) || settings.filterLocks.logic && settings.display.logic);
  const waiting = selected.length && !rows.length && lockFiltered ? selected.some((player) => lockState(snapshot, key(player)) === "unknown") ? "Waiting for SlotLock data" : "Selected slots are locked" : "";
  return { players: rows, events: filteredEvents, waiting, stale, goals: settings.display.goals ? { completed: rows.filter((row) => row.goal === true).length, total: rows.filter((row) => row.goal !== null).length } : null };
}
module.exports = { DEFAULT_DISPLAY, EVENT_TYPES, key, profile, brokerUrl, players, lockState, project };
