"use strict";
// Preserve the legacy two-strip summary/event-stack design. Nodes and animation
// timelines survive polling; there are no timed pages or alternating views.
const root = document.getElementById("overlay");
root.className = "archipelago-layer"; root.hidden = true;
const box = document.createElement("div"); box.className = "archipelago-box";
const summary = document.createElement("div"); summary.className = "archipelago-summary marquee";
const eventList = document.createElement("ul"); eventList.className = "archipelago-events";
box.append(summary, eventList); root.append(box);
const tracks = new Map(), eventNodes = new Map();
let inFlight = false, lastSuccess = 0;
function textTrack(id, text, className) {
  let track = tracks.get(id);
  if (!track) {
    track = document.createElement("div"); track.className = "archipelago-summary-track " + className;
    const first = document.createElement("span"), second = document.createElement("span");
    first.className = second.className = "archipelago-summary-copy"; second.setAttribute("aria-hidden", "true");
    track.append(first, second); summary.append(track); tracks.set(id, track);
  }
  track.hidden = !text;
  if (track.dataset.text !== text) {
    track.dataset.text = text;
    for (const child of track.children) child.textContent = text;
    track.style.setProperty("--archipelago-marquee-duration", Math.max(18, Math.min(70, text.length * 0.22)) + "s");
  }
}
function hide() { root.hidden = true; }
function render(state) {
  if (state.enabled && state.testEvent) state = { ...state, status: "ready", events: [...(state.events || []), state.testEvent] };
  if (!state.enabled || ["no-room", "no-slots"].includes(state.status)) { hide(); return; }
  const players = Array.isArray(state.players) ? state.players : [], events = Array.isArray(state.events) ? state.events : [];
  const identity = (player) => [player.name, player.game].filter(Boolean).join(" · ");
  const progressParts = players.filter((player) => player.progress?.percent !== null && player.progress).sort((a, b) => b.progress.percent - a.progress.percent).map((player) => identity(player) + " · " + player.progress.percent + "%" + (player.progress.stale ? " · Stale" : ""));
  if (state.goals?.total) progressParts.push(`${state.goals.completed}/${state.goals.total} goals`);
  const logicParts = players.filter((player) => player.logic?.inLogic !== null && player.logic).map((player) => {
    const details = [], logic = player.logic;
    if (logic.inLogic > 0) details.push("Logic: " + logic.inLogic);
    if (logic.glitched > 0) details.push("Glitched: " + logic.glitched);
    if (logic.goMode === "yes") details.push("Go mode");
    else if (logic.goMode === "glitched") details.push("Glitched go mode");
    return identity(player) + ": " + (details.length ? details.join(" · ") : "BK");
  });
  const separator = "\u2003\u2003•\u2003\u2003";
  const pending = state.waiting || (state.status === "unavailable" ? "Waiting for room data" : "");
  textTrack("progress", progressParts.join(separator) || (!logicParts.length ? pending : ""), "archipelago-progress-track");
  textTrack("logic", logicParts.join(separator), "archipelago-logic-track");
  summary.hidden = !progressParts.length && !logicParts.length && !pending;
  const wanted = new Set(events.map((event) => event.id));
  for (const [id, node] of eventNodes) if (!wanted.has(id)) { node.remove(); eventNodes.delete(id); }
  const kinds = { item_send: "item", item_cheat: "item", check: "item", chat: "chat", server_chat: "chat", death_link: "death", goal: "status", release: "status", collect: "status", join: "status", part: "status", hint: "hint" };
  for (const [index, event] of events.entries()) {
    let node = eventNodes.get(event.id);
    if (!node) {
      node = document.createElement("li"); node.dataset.event = event.id; node.dataset.at = event.at;
      const age = Math.max(0, Date.now() - Date.parse(event.at));
      node.className = "archipelago-event archipelago-event-" + (kinds[event.type] || "notice") + (age < 1000 ? " archipelago-event-new" : "");
      node.style.setProperty("--archipelago-age-offset", -Math.min(age, 74999) + "ms");
      const content = document.createElement("div"); content.className = "archipelago-event-content";
      for (const segment of event.segments || [{ text: event.text, type: "text" }]) {
        const span = document.createElement("span"); span.textContent = segment.text;
        span.className = "archipelago-segment-" + (["player", "item", "location"].includes(segment.type) ? segment.type : "text"); content.append(span);
      }
      node.append(content); eventNodes.set(event.id, node);
    }
    if (eventList.children[index] !== node) eventList.insertBefore(node, eventList.children[index] || null);
  }
  root.hidden = summary.hidden && !eventList.children.length;
}
function expireEvents() {
  for (const [id, node] of eventNodes) if (Date.now() - Date.parse(node.dataset.at) >= 75000) { node.remove(); eventNodes.delete(id); }
}
async function refresh() {
  if (inFlight) return;
  inFlight = true;
  try {
    const response = await fetch("/api/public/state", { cache: "no-store", signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error();
    const state = await response.json(); render(state); lastSuccess = Date.now();
  } catch (_) {
    // A single dropped local read must not erase the overlay. A prolonged loss
    // hides it; backend state still enforces SlotLock immediately on valid reads.
    if (!lastSuccess || Date.now() - lastSuccess >= 10000) hide();
  } finally { expireEvents(); inFlight = false; }
}
if (new URLSearchParams(location.search).get("demo") === "item") {
  const toolbar = document.createElement("div"); toolbar.className = "demo-controls";
  const description = document.createElement("p"); description.textContent = "TEST PREVIEW · Synthetic data only. Nothing is sent to Controller or the live overlay.";
  const button = document.createElement("button"); button.textContent = "Replay incoming item";
  toolbar.append(description, button); document.body.prepend(toolbar);
  const sample = () => render({ enabled: true, status: "ready", players: [], goals: null, events: [{ id: "demo-" + Date.now(), type: "item_send", at: new Date().toISOString(), segments: [{ type: "text", text: "TEST · " }, { type: "player", text: "Sample sender" }, { type: "text", text: " sent " }, { type: "item", text: "Sample item" }, { type: "text", text: " to " }, { type: "player", text: "Sample receiver" }, { type: "text", text: " (" }, { type: "location", text: "Sample location" }, { type: "text", text: ")" }] }] });
  button.onclick = sample; sample(); setInterval(expireEvents, 1000);
} else { refresh(); setInterval(refresh, 1000); }
