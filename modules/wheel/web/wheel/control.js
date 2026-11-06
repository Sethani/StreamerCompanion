(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const transport = window.StreamingTransport.create();
  const defaults = {
    behaviour: { minSpinSeconds: 5, maxSpinSeconds: 8, holdSeconds: 4 },
    position: { anchor: "center", offsetX: 0, offsetY: 0, sizePercent: 100 },
    appearance: {
      opacityPercent: 100, labelSize: 26, labelColour: "#ffffff", borderColour: "#ffffff",
      pointerColour: "#ffffff", resultColour: "#ffffff", resultBackground: "#141414",
      resultOpacityPercent: 82,
      palette: ["#e85d75", "#f39c35", "#f3d34a", "#58b368", "#3aa7a3", "#4682d9", "#8f63d9", "#d760b8"]
    }
  };
  let state = null;
  let config = null;
  let selectedSlug = "";
  let dirty = false;

  function feedback(message, error = false) { $("feedback").textContent = message; $("feedback").className = error ? "feedback error" : "feedback"; }
  function setDirty(value = true) { dirty = value; $("dirty-indicator").textContent = value ? "Unsaved changes" : "Saved"; $("dirty-indicator").classList.toggle("dirty", value); }
  function slugify(value) { return String(value || "profile").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "profile"; }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function currentProfile() { return config?.profiles?.[selectedSlug] || null; }
  function createEntry(entry = { label: "", weight: 1 }) {
    const row = document.createElement("div"); row.className = "entry-row";
    row.innerHTML = `<div class="drag-buttons"><button type="button" class="up" title="Move up">↑</button><button type="button" class="down" title="Move down">↓</button></div><label>Result<input class="entry-label" maxlength="100"></label><label>Weight<input class="entry-weight" type="number" min="0" max="10000" step="0.1"></label><button class="remove-entry" type="button" title="Remove">×</button>`;
    row.querySelector(".entry-label").value = entry.label || ""; row.querySelector(".entry-weight").value = entry.weight ?? 1;
    row.querySelector(".up").onclick = () => { if (row.previousElementSibling) row.parentNode.insertBefore(row, row.previousElementSibling); setDirty(); };
    row.querySelector(".down").onclick = () => { if (row.nextElementSibling) row.parentNode.insertBefore(row.nextElementSibling, row); setDirty(); };
    row.querySelector(".remove-entry").onclick = () => { row.remove(); setDirty(); };
    row.querySelectorAll("input").forEach((input) => input.addEventListener("input", () => setDirty()));
    $("entries").append(row);
  }
  function readEntries() { return [...document.querySelectorAll(".entry-row")].map((row) => ({ label: row.querySelector(".entry-label").value.trim(), weight: Number(row.querySelector(".entry-weight").value) })); }
  function renderPalette(values) { $("palette").replaceChildren(); values.forEach((colour, index) => { const input = document.createElement("input"); input.type = "color"; input.value = colour; input.title = `Segment colour ${index + 1}`; input.addEventListener("input", () => setDirty()); $("palette").append(input); }); }
  function readPalette() { return [...$("palette").querySelectorAll("input")].map((input) => input.value); }
  function applyForm(profile) {
    const behaviour = { ...defaults.behaviour, ...(profile.settings || {}) };
    const position = { ...defaults.position, ...(config.position || {}) };
    const appearance = { ...defaults.appearance, ...(config.appearance || {}) };
    $("profile-name").value = profile.name || selectedSlug; $("entries").replaceChildren(); (profile.entries || []).forEach(createEntry);
    $("min-spin").value = behaviour.minSpinSeconds; $("max-spin").value = behaviour.maxSpinSeconds; $("hold-seconds").value = behaviour.holdSeconds;
    $("anchor").value = position.anchor; $("offset-x").value = position.offsetX; $("offset-y").value = position.offsetY; $("size").value = position.sizePercent;
    $("opacity").value = appearance.opacityPercent; $("label-size").value = appearance.labelSize; $("label-colour").value = appearance.labelColour; $("border-colour").value = appearance.borderColour;
    $("pointer-colour").value = appearance.pointerColour; $("result-colour").value = appearance.resultColour; $("result-background").value = appearance.resultBackground; $("result-opacity").value = appearance.resultOpacityPercent;
    $("adapter-profile").textContent = selectedSlug;
    renderPalette(appearance.palette || defaults.appearance.palette); setDirty(false);
  }
  function readForm() {
    const next = clone(config); const profile = next.profiles[selectedSlug];
    profile.name = $("profile-name").value.trim(); profile.entries = readEntries(); profile.settings = { minSpinSeconds: Number($("min-spin").value), maxSpinSeconds: Number($("max-spin").value), holdSeconds: Number($("hold-seconds").value) };
    next.activeProfile = selectedSlug;
    next.position = { anchor: $("anchor").value, offsetX: Number($("offset-x").value), offsetY: Number($("offset-y").value), sizePercent: Number($("size").value) };
    next.appearance = { opacityPercent: Number($("opacity").value), labelSize: Number($("label-size").value), labelColour: $("label-colour").value, borderColour: $("border-colour").value, pointerColour: $("pointer-colour").value, resultColour: $("result-colour").value, resultBackground: $("result-background").value, resultOpacityPercent: Number($("result-opacity").value), palette: readPalette() };
    return next;
  }
  function validate(next) {
    const profile = next.profiles[selectedSlug]; if (!profile.name) throw new Error("Profile name is required.");
    if (!profile.entries.length || profile.entries.some((entry) => !entry.label)) throw new Error("Every profile needs at least one named entry.");
    if (!profile.entries.some((entry) => Number(entry.weight) > 0)) throw new Error("At least one entry needs a positive weight.");
    if (profile.settings.minSpinSeconds > profile.settings.maxSpinSeconds) throw new Error("Minimum spin time cannot exceed maximum spin time.");
  }
  function renderState(payload, force = false) {
    state = payload;
    const now = Date.now();
    const spin = payload.currentSpin;
    const effectiveStatus = spin
      ? now >= Number(spin.hideTimeMs) ? "idle" : now >= Number(spin.endTimeMs) ? "result" : "spinning"
      : payload.status || "idle";
    $("status-text").textContent = `${effectiveStatus} · ${payload.activeProfileName || "-"}`;
    $("last-result").textContent = payload.lastResult?.result || (spin && now >= Number(spin.endTimeMs) ? spin.result : "None");
    $("module-version").textContent = payload.moduleVersion || "1.0.0";
    if (!payload.config || (dirty && !force)) return;
    config = clone(payload.config); selectedSlug = config.activeProfile || Object.keys(config.profiles || {})[0] || "";
    renderProfileSelect(); if (currentProfile()) applyForm(currentProfile());
  }
  function renderProfileSelect() { const select = $("profile-select"); select.replaceChildren(); Object.entries(config.profiles || {}).forEach(([slug, profile]) => { const option = document.createElement("option"); option.value = slug; option.textContent = profile.name || slug; select.append(option); }); select.value = selectedSlug; }
  async function waitRefresh() { await new Promise((resolve) => setTimeout(resolve, 180)); await transport.refresh(true); const envelope = transport.getState("wheel"); if (envelope?.payload) renderState(envelope.payload, true); }
  async function execute(command, args = {}) { await transport.execute("wheel", command, args); await waitRefresh(); }
  async function save() { const next = readForm(); validate(next); await execute("Configure", { config: JSON.stringify(next) }); config = next; setDirty(false); feedback(`Saved ${currentProfile()?.name || "wheel"}.`); }
  function chooseProfile(slug) { if (dirty && !confirm("Discard unsaved changes?")) { $("profile-select").value = selectedSlug; return; } selectedSlug = slug; config.activeProfile = slug; applyForm(currentProfile()); }
  function resetSection(section) { if (section === "behaviour") Object.assign(currentProfile().settings, defaults.behaviour); if (section === "position") config.position = clone(defaults.position); if (section === "appearance") config.appearance = clone(defaults.appearance); applyForm(currentProfile()); setDirty(); }

  transport.subscribe("connection", (health) => { $("connection").textContent = health.connected ? "Connected" : "Disconnected"; $("connection").classList.toggle("connected", health.connected); });
  transport.subscribe("wheel", (envelope) => renderState(envelope.payload)); transport.connect();
  $("wheel-form").addEventListener("submit", (event) => { event.preventDefault(); save().catch((error) => feedback(error.message, true)); });
  $("profile-select").onchange = () => chooseProfile($("profile-select").value);
  $("add-entry-button").onclick = () => { createEntry(); setDirty(); };
  $("new-profile-button").onclick = () => { const name = prompt("New profile name"); if (!name) return; let slug = slugify(name), suffix = 2; while (config.profiles[slug]) slug = `${slugify(name)}-${suffix++}`; config.profiles[slug] = { name: name.trim(), entries: [{ label: "New result", weight: 1 }], settings: clone(defaults.behaviour) }; selectedSlug = slug; config.activeProfile = slug; renderProfileSelect(); applyForm(currentProfile()); setDirty(); };
  $("duplicate-profile-button").onclick = () => { const name = prompt("Duplicate profile as", `${currentProfile().name} copy`); if (!name) return; let slug = slugify(name), suffix = 2; while (config.profiles[slug]) slug = `${slugify(name)}-${suffix++}`; config.profiles[slug] = clone(currentProfile()); config.profiles[slug].name = name.trim(); selectedSlug = slug; config.activeProfile = slug; renderProfileSelect(); applyForm(currentProfile()); setDirty(); };
  $("delete-profile-button").onclick = () => { if (Object.keys(config.profiles).length < 2) return feedback("The last profile cannot be deleted.", true); if (!confirm(`Delete ${currentProfile().name}?`)) return; delete config.profiles[selectedSlug]; selectedSlug = Object.keys(config.profiles)[0]; config.activeProfile = selectedSlug; renderProfileSelect(); applyForm(currentProfile()); setDirty(); };
  $("reset-behaviour").onclick = () => resetSection("behaviour"); $("reset-position").onclick = () => resetSection("position"); $("reset-appearance").onclick = () => resetSection("appearance");
  $("preview-button").onclick = async () => { try { if (dirty) await save(); await execute("Spin", { profile: selectedSlug, user: $("spin-user").value.trim() }); feedback("Preview spin started."); } catch (error) { feedback(error.message, true); } };
  $("clear-button").onclick = () => execute("Clear").then(() => feedback("Wheel cleared.")).catch((error) => feedback(error.message, true));
  $("copy-profile-slug").onclick = async () => { try { await navigator.clipboard.writeText(selectedSlug); feedback(`Copied profile slug: ${selectedSlug}`); } catch { prompt("Copy this profile slug", selectedSlug); } };
  $("export-button").onclick = () => { try { const value = readForm(); validate(value); const blob = new Blob([JSON.stringify({ module: "wheel", version: 2, config: value }, null, 2)], { type: "application/json" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "wheel-settings.json"; link.click(); URL.revokeObjectURL(link.href); } catch (error) { feedback(error.message, true); } };
  $("import-button").onclick = () => $("import-file").click();
  $("import-file").onchange = async (event) => { try { const parsed = JSON.parse(await event.target.files[0].text()); const imported = parsed.config || parsed; if (!imported.profiles || !Object.keys(imported.profiles).length) throw new Error("This is not a Wheel settings export."); config = imported; selectedSlug = imported.activeProfile || Object.keys(imported.profiles)[0]; renderProfileSelect(); applyForm(currentProfile()); setDirty(); feedback("Imported settings. Review them, then save."); } catch (error) { feedback(error.message, true); } finally { event.target.value = ""; } };
  document.addEventListener("input", (event) => { if (event.target.closest("#wheel-form") && event.target.id !== "spin-user") setDirty(); });
  setTimeout(() => transport.refresh(true).then(() => { const envelope = transport.getState("wheel"); if (envelope?.payload) renderState(envelope.payload, true); }).catch((error) => feedback(error.message, true)), 250);
})();
