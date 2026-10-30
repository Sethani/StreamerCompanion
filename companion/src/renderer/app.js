const $ = (selector) => document.querySelector(selector);
const labels = {
  ready: "Ready",
  broken: "Broken",
  "streamerbot-required": "Streamer.bot confirmation needed",
  "verification-unavailable": "Verification unavailable",
  "configuration-required": "Configuration needed"
};
const serviceViewState = new Map();

function renderCatalog(state) {
  $("#catalog-status").textContent = (state.checkedAt ? "Last checked " + new Date(state.checkedAt).toLocaleString() + ". " : "Not checked yet. ") + (state.error ? "Using the last saved catalogue. " + state.error : "Source: " + state.repository + " (experimental releases).");
  const list = $("#catalog");
  list.replaceChildren();
  for (const module of state.modules) {
    const card = $("#module-template").content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = module.name + " · " + module.version;
    card.querySelector(".description").textContent = module.description;
    card.querySelector(".status").textContent = module.state;
    const dependencies = module.dependencies;
    card.querySelector(".details").textContent = "By " + module.author + " · " + module.category + " · Installed: " + (module.installedVersion || "none") + " · Companion " + dependencies.companion +
      " · Required modules: " + (Object.entries(dependencies.modules).map(([id, range]) => id + " " + range).join(", ") || "none") +
      " · Optional modules: " + (Object.entries(dependencies.optionalModules).map(([id, range]) => id + " " + range).join(", ") || "none") +
      " · Facilities: " + (Object.entries(dependencies.capabilities).map(([id, requirement]) => id + " (" + requirement + ")").join(", ") || "none") +
      " · Streamer.bot " + (module.streamerbot.minimumVersion || "version not specified") + " · Required actions: " + (module.streamerbot.requiredActions.join(", ") || "none") + (module.problem ? " · " + module.problem : "");
    if (module.installationPlan.length) {
      const button = action(module.installedVersion ? module.updateAvailable ? "Update" : "Install dependencies" : "Install", async () => {
        const operation = module.installationPlan.map((item) => item.name + " " + item.version).join(", ");
        if (!window.confirm("Download, verify and install: " + operation + "? Required dependencies are included.")) return;
        feedback("Downloading and verifying " + module.name + "…");
        const result = await window.companion.installCatalog(module.id);
        renderCatalog(result.catalog);
        await refresh();
        feedback("Installed " + result.installed.map((item) => item.name + " " + item.version).join(", ") + ".");
      });
      button.disabled = Boolean(module.problem);
      card.querySelector(".actions").append(button);
    }
    list.append(card);
  }
}

function rememberServiceViews() {
  document.querySelectorAll("#services .service[data-service-id]").forEach((card) => {
    const details = card.querySelector("details");
    const log = card.querySelector("pre");
    const previous = serviceViewState.get(card.dataset.serviceId) || {};
    serviceViewState.set(card.dataset.serviceId, {
      ...previous,
      logsOpen: Boolean(details?.open),
      logScrollTop: log?.scrollTop || 0,
      followLogs: log ? log.scrollHeight - log.clientHeight - log.scrollTop < 12 : true
    });
  });
}

function feedback(message, error = false) {
  $("#feedback").textContent = message || "";
  $("#feedback").classList.toggle("error", error);
}

function action(label, handler, secondary = false) {
  const button = document.createElement("button");
  button.textContent = label;
  if (secondary) button.className = "secondary";
  button.onclick = async () => {
    button.disabled = true;
    try {
      await handler();
    } catch (error) {
      feedback(error.message, true);
    } finally {
      button.disabled = false;
    }
  };
  return button;
}

function render(state) {
  const connection = $("#streamerbot");
  connection.textContent = state.streamerBot.connected ? "Streamer.bot connected" : "Streamer.bot unavailable";
  connection.className = "connection " + (state.streamerBot.connected ? "ok" : "error");
  connection.title = state.streamerBot.error || "Actions can be verified.";
  const list = $("#modules");
  list.replaceChildren();
  if (!state.modules.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "No Companion modules are installed.";
    list.append(empty);
    return;
  }
  for (const module of state.modules) {
    const card = $("#module-template").content.firstElementChild.cloneNode(true);
    card.querySelector("h3").textContent = module.name + " " + module.version;
    card.querySelector(".description").textContent = module.description;
    const status = card.querySelector(".status");
    status.textContent = labels[module.state] || module.state;
    status.classList.add(module.state);
    const details = card.querySelector(".details");
    if (module.error) details.textContent = module.error;
    else if (module.missingActions.length) details.textContent = "Missing Streamer.bot actions: " + module.missingActions.join(", ");
    else if (module.state === "verification-unavailable") details.textContent = "Start Streamer.bot to verify the module installation.";
    else details.textContent = module.requiredActions.length + " required Streamer.bot actions verified.";
    const actions = card.querySelector(".actions");
    if (module.state === "streamerbot-required" && module.hasImport) {
      actions.append(action("Open Streamer.bot import", () => window.companion.openImport(module.id)));
    }
    if (module.hasDocumentation) {
      actions.append(action("Documentation", () => window.companion.openDocs(module.id), true));
    }
    list.append(card);
  }
}

function healthItem(label, value) {
  const item = document.createElement("div");
  const caption = document.createElement("span");
  const strong = document.createElement("strong");
  caption.textContent = label;
  strong.textContent = value;
  item.append(caption, strong);
  return item;
}

function renderServices(services) {
  const list = $("#services");
  rememberServiceViews();
  list.replaceChildren();
  $("#autostart-all").checked = services.length > 0 && services.every((service) => service.autoStart);
  $("#autostart-all").indeterminate = services.some((service) => service.autoStart) && !services.every((service) => service.autoStart);
  for (const service of services) {
    const card = $("#service-template").content.firstElementChild.cloneNode(true);
    const manifest = service.manifest;
    const state = service.state;
    const view = serviceViewState.get(manifest.id) || { logsOpen: false, logScrollTop: 0, followLogs: true };
    card.dataset.serviceId = manifest.id;
    card.querySelector("h3").textContent = manifest.name + " " + manifest.version;
    card.querySelector(".description").textContent = manifest.description;
    const status = card.querySelector(".status");
    status.textContent = state.status === "running" ? "Running" : state.status;
    status.classList.add(state.status === "running" ? "ready" : ["error", "conflict"].includes(state.status) ? "broken" : "verification-unavailable");
    status.title = state.error || "";
    const health = card.querySelector(".service-health");
    if (state.production) health.append(healthItem("Production", state.production.ready ? "Ready :" + state.production.port : "Unavailable :" + state.production.port));
    if (state.shadow) health.append(healthItem("Shadow", state.shadow.ready ? "Ready :" + state.shadow.port : "Stopped :" + state.shadow.port));
    if (state.endpoint) {
      let endpointValue = "Stopped :" + state.endpoint.port;
      if (state.endpoint.ready && typeof state.endpoint.pads === "number") endpointValue = state.endpoint.pads + " controller(s) :" + state.endpoint.port;
      else if (state.endpoint.ready && typeof state.endpoint.details?.enabled === "boolean") endpointValue = (state.endpoint.details.enabled ? "Enabled" : "Disabled") + " :" + state.endpoint.port;
      else if (state.endpoint.ready && typeof state.endpoint.configured === "boolean") endpointValue = (state.endpoint.configured ? "Configured" : "Needs configuration") + " :" + state.endpoint.port;
      else if (state.endpoint.ready) endpointValue = "Ready :" + state.endpoint.port;
      health.append(healthItem("Endpoint", endpointValue));
    }
    health.append(healthItem("Process", state.pid ? "PID " + state.pid : "None"));
    const meta = card.querySelector(".service-meta");
    const capabilityText = (manifest.provides || []).join(", ") || "none";
    meta.textContent = "Provides: " + capabilityText;
    meta.textContent += " | Required: " + (service.dependencies.required.join(", ") || "none");
    meta.textContent += " | Optional: " + (service.dependencies.optional.join(", ") || "none");
    if (!service.dependencies.ready) meta.textContent += " | Missing: " + service.dependencies.missingRequired.join(", ");
    if (service.dependencies.missingOptional.length) meta.textContent += " | Optional unavailable: " + service.dependencies.missingOptional.join(", ");
    const automatic = card.querySelector(".autostart input");
    automatic.checked = service.autoStart;
    automatic.onchange = async () => {
      automatic.disabled = true;
      try {
        renderServices(await window.companion.setServiceAutoStart(manifest.id, automatic.checked));
        feedback(manifest.name + (automatic.checked ? " will start automatically." : " will no longer start automatically."));
      } catch (error) { feedback(error.message, true); await refreshServices(); }
    };
    const actions = card.querySelector(".actions");
    const run = async (name) => {
      try { renderServices(await window.companion.serviceAction(manifest.id, name)); feedback(manifest.name + " " + name + " completed."); }
      catch (error) { feedback(error.message, true); await refreshServices(); }
    };
    const start = action("Start", () => run("start"));
    const stop = action("Stop", () => run("stop"), true);
    const restart = action("Restart", () => run("restart"), true);
    start.disabled = Boolean(state.pid) || state.status === "running" || !service.dependencies.ready;
    stop.disabled = !state.pid;
    restart.disabled = !state.pid;
    actions.append(start, stop, restart);
    if (manifest.supportsLegacyImport && window.companion.importServiceSettings) {
      actions.append(action("Import existing settings", async () => {
        const result = await window.companion.importServiceSettings(manifest.id);
        renderServices(result.services);
        if (!result.canceled) feedback("Existing settings imported into " + manifest.name + ".");
      }, true));
    }
    if (manifest.settingsPath) {
      const settings = action("Settings", () => window.companion.openServiceSettings(manifest.id), true);
      settings.disabled = !state.endpoint || !state.endpoint.ready;
      actions.append(settings);
    }
    const logs = state.logs || [];
    const detailsElement = card.querySelector("details");
    const logElement = card.querySelector("pre");
    detailsElement.open = view.logsOpen;
    detailsElement.addEventListener("toggle", () => {
      const current = serviceViewState.get(manifest.id) || {};
      serviceViewState.set(manifest.id, { ...current, logsOpen: detailsElement.open });
    });
    logElement.textContent = logs.length ? logs.map((entry) => new Date(entry.atMs).toLocaleTimeString() + " [" + entry.stream + "] " + entry.line).join("\n") : "No logs yet.";
    list.append(card);
    requestAnimationFrame(() => {
      logElement.scrollTop = view.followLogs ? logElement.scrollHeight : Math.min(view.logScrollTop, logElement.scrollHeight);
    });
  }
}

async function refreshServices() {
  renderServices(await window.companion.services());
}

async function refresh(message = "") {
  if (message) feedback(message);
  const [modules] = await Promise.all([window.companion.refresh(), refreshServices()]);
  render(modules);
  renderCatalog(await window.companion.catalog());
}

$("#refresh").onclick = () => refresh("Module health refreshed.").catch((error) => feedback(error.message, true));
$("#install").onclick = async () => {
  try {
    const result = await window.companion.install();
    if (result) {
      render(result);
      await refreshServices();
      feedback("Module package installed and checked.");
    }
  } catch (error) {
    feedback(error.message, true);
  }
};
$("#start-all").onclick = async () => {
  const button = $("#start-all");
  button.disabled = true;
  try { renderServices(await window.companion.startAllServices()); feedback("All available services started."); }
  catch (error) { feedback(error.message, true); await refreshServices(); }
  finally { button.disabled = false; }
};
$("#stop-all").onclick = async () => {
  const button = $("#stop-all");
  button.disabled = true;
  try { renderServices(await window.companion.stopAllServices()); feedback("All services stopped."); }
  catch (error) { feedback(error.message, true); await refreshServices(); }
  finally { button.disabled = false; }
};
$("#autostart-all").onchange = async () => {
  const checkbox = $("#autostart-all");
  checkbox.disabled = true;
  try {
    renderServices(await window.companion.setAllServicesAutoStart(checkbox.checked));
    feedback(checkbox.checked ? "All services will start with Companion." : "Automatic service startup disabled.");
  } catch (error) { feedback(error.message, true); await refreshServices(); }
  finally { checkbox.disabled = false; }
};
$("#copy-api-token").onclick = async () => { await window.companion.copyApiToken(); feedback("Companion API token copied."); };
$("#rotate-api-token").onclick = async () => {
  if (!window.confirm("Rotate the Companion API token? Existing local automation will stop working until updated.")) return;
  await window.companion.rotateApiToken();
  feedback("Companion API token rotated.");
};
window.companion.apiState().then((state) => { $("#api-status").textContent = `Listening on 127.0.0.1:${state.port} · token stored privately`; }).catch(() => {});
$("#catalog-check").onclick = async () => {
  $("#catalog-check").disabled = true;
  try { renderCatalog(await window.companion.checkCatalog()); }
  catch (error) { feedback(error.message, true); }
  finally { $("#catalog-check").disabled = false; }
};
refresh().catch((error) => feedback(error.message, true));
window.setInterval(() => refreshServices().catch(() => {}), 2000);
