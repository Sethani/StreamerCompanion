const semver = require("semver");

const provides = (manifest) => [...new Set([...(manifest.provides || []), ...(manifest.service?.provides || [])])];

function moduleStates(items, version, systemCapabilities, actions, connected) {
  const entries = new Map(items.map((item) => [item.manifest.id, item]));
  const states = new Map();
  const visiting = [];
  const visited = new Set();
  const cycles = new Set();
  function visit(id) {
    if (visiting.includes(id)) { visiting.slice(visiting.indexOf(id)).forEach((value) => cycles.add(value)); return; }
    if (visited.has(id)) return;
    visiting.push(id);
    for (const dependency of Object.keys(entries.get(id)?.manifest.dependencies?.modules || {})) if (entries.has(dependency)) visit(dependency);
    visiting.pop(); visited.add(id);
  }
  for (const id of entries.keys()) visit(id);
  for (const [id, { manifest, error }] of entries) {
    let state = "ready", problem = "";
    const required = manifest.streamerbot.requiredActions;
    if (error) { state = "broken"; problem = error; }
    else if (cycles.has(id)) { state = "missing-dependency"; problem = "Module dependency cycle."; }
    else if (manifest.dependencies?.companion && !semver.satisfies(version, manifest.dependencies.companion)) { state = "incompatible"; problem = "Requires Companion " + manifest.dependencies.companion + "."; }
    else if (required.length && !connected) { state = "verification-unavailable"; problem = "Streamer.bot is disconnected."; }
    else if (required.some((name) => !actions.includes(name))) { state = "streamerbot-required"; problem = "Streamer.bot action import required."; }
    else if (manifest.configurationRequired) { state = "configuration-required"; problem = "Configuration required."; }
    states.set(id, { id, state, problem });
  }
  for (let pass = 0; pass <= entries.size; pass++) {
    const capabilities = new Set(systemCapabilities);
    for (const [id, { manifest }] of entries) if (states.get(id).state === "ready") for (const capability of provides(manifest)) capabilities.add(capability);
    let changed = false;
    for (const [id, { manifest }] of entries) {
      const current = states.get(id);
      if (["broken", "incompatible", "missing-dependency"].includes(current.state)) continue;
      const missing = Object.entries(manifest.dependencies?.modules || {}).filter(([dependency, range]) => {
        const installed = entries.get(dependency)?.manifest;
        return !installed || !semver.satisfies(installed.version, range) || states.get(dependency).state !== "ready";
      }).map(([dependency, range]) => dependency + " " + range);
      const facilities = Object.entries(manifest.dependencies?.capabilities || {}).filter(([capability, requirement]) => requirement === "required" && !capabilities.has(capability)).map(([capability]) => capability);
      if (missing.length || facilities.length) {
        states.set(id, { id, state: "missing-dependency", problem: "Missing dependencies: " + [...missing, ...facilities].join(", ") + "." });
        changed = true;
      }
    }
    if (!changed) break;
  }
  const capabilities = new Set(systemCapabilities);
  for (const [id, { manifest }] of entries) if (states.get(id).state === "ready") for (const capability of provides(manifest)) capabilities.add(capability);
  return { states, capabilities };
}

module.exports = { moduleStates, provides };
