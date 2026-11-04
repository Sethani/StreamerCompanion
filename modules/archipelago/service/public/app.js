"use strict";
const $ = (id) => document.getElementById(id);
const element = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
if (document.body.classList.contains("overlay")) {
  let signature = "";
  async function refreshOverlay() {
    try {
      const response = await fetch("/api/public/state", { cache: "no-store" }); if (!response.ok) throw new Error();
      const state = await response.json(), pageCount = Math.max(1, Math.ceil(state.players.length / 6)), page = Math.floor(Date.now() / 10000) % pageCount;
      const next = JSON.stringify([state, page]); if (next === signature) return; signature = next;
      const root = $("overlay"); root.replaceChildren(); if (!state.enabled || state.status !== "ready") return;
      if (!state.players.length && !state.events.length) return;
      root.append(element("div", state.room + (state.stale ? " · Last known data" : "") + (pageCount > 1 ? ` · ${page + 1}/${pageCount}` : ""), "ap-room"));
      const pageRows = state.players.slice(page * 6, page * 6 + 6), playerGrid = element("div", undefined, "ap-players" + (pageRows.length > 3 ? " many" : ""));
      for (const player of pageRows) {
        const card = element("div", undefined, "ap-player"); card.dataset.player = player.id;
        card.append(element("div", [player.name, player.game].filter(Boolean).join(" · "), "ap-name"));
        const details = [];
        if (player.progress) details.push(player.progress.percent === null ? "Progress unavailable" : `${player.progress.done}/${player.progress.total} · ${player.progress.percent}%${player.progress.stale ? " · Stale" : ""}`);
        if (player.goal === true) details.push("Goal complete");
        if (player.logic) {
          if (player.logic.inLogic !== null) { details.push(`${player.logic.inLogic} in logic`); if (player.logic.glitched !== null) details.push(`${player.logic.glitched} glitched`); if (player.logic.goMode === "yes") details.push("Go mode"); else if (player.logic.goMode === "glitched") details.push("Glitched go mode"); }
          else details.push("Logic: " + player.logic.state.replaceAll("_", " "));
        }
        card.append(element("div", details.join(" · "), "ap-details"));
        if (player.progress?.percent !== null && player.progress) { const bar = element("div", undefined, "ap-bar"), fill = element("span"); fill.style.width = player.progress.percent + "%"; bar.append(fill); card.append(bar); }
        playerGrid.append(card);
      }
      root.append(playerGrid);
      if (state.goals?.total) root.append(element("div", `${state.goals.completed}/${state.goals.total} selected goals complete`, "ap-details"));
      const events = element("div", undefined, "ap-events");
      for (const event of state.events) { const row = element("div", event.text, "ap-event"); row.dataset.event = event.id; events.append(row); } root.append(events);
    } catch (_) { $("overlay").replaceChildren(); signature = ""; }
  }
  refreshOverlay(); setInterval(refreshOverlay, 1000);
} else {
  const csrf = document.querySelector('meta[name="companion-csrf"]').content;
  let state, dirty = false, busy = false, renderedRoom = "", renderedGeneration = "";
  const note = (text, bad = false) => { $("feedback").textContent = text; $("feedback").classList.toggle("bad", bad); };
  function mark() { dirty = true; $("dirty").textContent = "Unsaved changes"; }
  async function api(route, input) {
    const response = await fetch(route, { method: input === undefined ? "GET" : "POST", headers: { "X-Companion-CSRF": csrf, ...(input === undefined ? {} : { "Content-Type": "application/json" }) }, ...(input === undefined ? {} : { body: JSON.stringify(input) }), cache: "no-store" });
    const result = await response.json(); if (!response.ok) throw new Error(result.error || "Request failed."); return result;
  }
  function selectedProfile() { return state.config.profiles[state.config.roomId] || { slots: [], display: { progress: true, goals: true, logic: true, activity: true, showNames: true }, filterLocks: { progress: true, logic: true, activity: true }, eventTypes: ["item_send", "hint", "death_link", "goal"], maxEvents: 6 }; }
  function count() { $("slot-count").textContent = `${document.querySelectorAll('[data-slot]:checked').length} selected · ${state.slots.length} reported game slots`; }
  function render(next) {
    state = next;
    $("connection").textContent = next.connected ? "Controller connected" : "Controller unavailable"; $("connection").classList.toggle("bad", !next.connected);
    $("room-status").textContent = next.error || next.notice || "";
    const current = next.rooms.find((room) => room.id === next.config.roomId);
    if (current && !next.error && !next.notice) $("room-status").textContent = `${current.online ? "Online" : "Offline"}${current.stale ? " · Stale room data" : ""}`;
    const options = [element("option", "Choose a room"), ...next.rooms.map((room) => { const option = element("option", `${room.label} · ${room.online ? "Online" : "Offline"}`); option.value = room.id; return option; })]; options[0].value = "";
    $("room").replaceChildren(...options); $("room").value = next.config.roomId;
    $("key-status").textContent = next.hasToken ? "An API key is saved privately." : "No API key saved. Reading local rooms does not require one.";
    for (const name of ["refresh-room", "wake", "recalculate"]) $(name).disabled = busy || !current || !next.hasToken || (name === "wake" && !current.capabilities.remoteWake) || (name === "recalculate" && !current.capabilities.logicAnalysis);
    $("components").replaceChildren(...Object.entries(next.components).map(([name, value]) => element("span", name + ": " + value.state + (value.stale ? " · stale" : ""), "component")));
    const generation = selectedProfile().generationId || "";
    if (renderedRoom !== next.config.roomId || renderedGeneration !== generation) dirty = false;
    if (!dirty) {
      const profile = selectedProfile(); $("slots").replaceChildren();
      for (const slot of next.slots) {
        const label = element("label", undefined, "slot"), checkbox = element("input"); checkbox.type = "checkbox"; checkbox.dataset.slot = slot.id; checkbox.checked = profile.slots.includes(slot.id);
        const text = element("span"); text.append(element("strong", slot.name), element("small", slot.game), element("small", `${slot.checksDone}/${slot.checksTotal} · ${slot.status || "Unknown"} · Logic: ${slot.logicState} · ${slot.lock}`));
        checkbox.onchange = () => { mark(); count(); }; label.append(checkbox, text); $("slots").append(label);
      }
      if (!next.slots.length) $("slots").append(element("p", next.config.roomId ? "No game slots reported yet. Check the room in Controller." : "Choose a room to see its slots.", "muted"));
      $("enabled").checked = next.config.enabled;
      for (const input of document.querySelectorAll("[data-display]")) input.checked = profile.display[input.dataset.display];
      for (const input of document.querySelectorAll("[data-lock]")) input.checked = profile.filterLocks[input.dataset.lock];
      $("event-types").replaceChildren(...next.eventTypes.map((type) => { const label = element("label", undefined, "check"), checkbox = element("input"); checkbox.type = "checkbox"; checkbox.dataset.eventType = type; checkbox.checked = profile.eventTypes.includes(type); checkbox.onchange = mark; label.append(checkbox, document.createTextNode(type.replaceAll("_", " "))); return label; }));
      $("max-events").value = profile.maxEvents; $("dirty").textContent = "Saved"; count();
      renderedRoom = next.config.roomId; renderedGeneration = generation;
    }
    if (document.activeElement !== $("broker-url")) $("broker-url").value = next.config.brokerUrl;
    $("save").disabled = busy || !next.config.roomId;
  }
  async function perform(work) { if (busy) return; busy = true; try { await work(); } catch (error) { note(error.message, true); } finally { busy = false; if (state) render(state); } }
  $("room").onchange = () => perform(async () => {
    if (dirty && !confirm("Discard unsaved display changes before switching rooms?")) { $("room").value = state.config.roomId; return; }
    const roomId = $("room").value; dirty = false; render(await api("/api/settings", { roomId })); note(roomId ? "Choose slots and save the display." : "No room selected.");
  });
  $("display").onchange = mark;
  $("select-all").onclick = () => { document.querySelectorAll("[data-slot]").forEach((input) => { input.checked = true; }); mark(); count(); };
  $("clear").onclick = () => { document.querySelectorAll("[data-slot]").forEach((input) => { input.checked = false; }); mark(); count(); };
  $("display").onsubmit = (event) => { event.preventDefault(); perform(async () => {
    const profile = { slots: [...document.querySelectorAll("[data-slot]:checked")].map((input) => input.dataset.slot), display: Object.fromEntries([...document.querySelectorAll("[data-display]")].map((input) => [input.dataset.display, input.checked])), filterLocks: Object.fromEntries([...document.querySelectorAll("[data-lock]")].map((input) => [input.dataset.lock, input.checked])), eventTypes: [...document.querySelectorAll("[data-event-type]:checked")].map((input) => input.dataset.eventType), maxEvents: Number($("max-events").value) };
    const next = await api("/api/settings", { roomId: state.config.roomId, enabled: $("enabled").checked, profile }); dirty = false; render(next); note("Display saved. OBS follows this selection automatically.");
  }); };
  $("reload").onclick = () => perform(async () => { render(await api("/api/refresh", {})); note("Room list refreshed."); });
  for (const [id, action] of [["refresh-room", "refresh"], ["wake", "wake"], ["recalculate", "recalculate-logic"]]) $(id).onclick = () => perform(async () => {
    if (dirty) throw new Error("Save your slot/display choices before running a room action.");
    if (action !== "refresh" && !confirm(action === "wake" ? "Ask Controller to start this room?" : "Start analysis for the selected slots? Controller needs their YAML templates.")) return;
    const result = await api("/api/actions", { action, roomId: state.config.roomId });
    const failures = (result.states || []).filter((entry) => entry.state === "error").length;
    note(failures ? `${failures} analysis request(s) could not start. Check slot templates and analysis details in Controller.` : "Controller: " + result.status, failures > 0);
    render(await api("/api/settings"));
  });
  $("overlay-url").value = location.origin + "/overlay";
  $("copy-overlay").onclick = async () => { try { await navigator.clipboard.writeText($("overlay-url").value); note("OBS browser source URL copied."); } catch (_) { $("overlay-url").select(); note("Press Ctrl+C to copy the selected overlay URL."); } };
  $("import-key").onclick = () => $("key-file").click();
  $("key-file").onchange = async (event) => { const file = event.target.files[0]; if (!file) return; if (file.size > 8192) { note("Choose the small text file containing only your API key.", true); return; } $("api-key").value = (await file.text()).replace(/^\uFEFF/, "").trim(); event.target.value = ""; note("API key file loaded. Save connection to apply it."); };
  $("connection-form").onsubmit = (event) => { event.preventDefault(); perform(async () => {
    const input = { brokerUrl: $("broker-url").value }; if ($("api-key").value.trim()) input.token = $("api-key").value.trim();
    render(await api("/api/settings", input)); $("api-key").value = ""; note("Connection saved.");
  }); };
  $("remove-key").onclick = () => perform(async () => { render(await api("/api/settings", { clearToken: true })); $("api-key").value = ""; note("Saved API key removed."); });
  api("/api/settings").then(render).catch((error) => note(error.message, true));
  setInterval(() => { if (!busy) api("/api/settings").then(render).catch((error) => note(error.message, true)); }, 3000);
}
