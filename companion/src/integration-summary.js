const semver = require('semver');
const idPattern = /^[a-z0-9][a-z0-9-]{0,127}$/;
const validId = value => typeof value === 'string' && idPattern.test(value);
const label = value => typeof value === 'string' && value.trim() && value.length <= 120 && !/[\x00-\x1f]/.test(value);
const friendlyNames = {
  'streamerbot-websocket': 'Streamer.bot connection', 'obs-websocket': 'OBS connection', 'obs-scenes': 'OBS scenes',
  'windows': 'Windows', 'powershell': 'PowerShell', 'windows-powershell': 'Windows PowerShell', 'embedded-node': 'Companion runtime',
  'spotify-account': 'Spotify account', 'twitch-broadcaster-token': 'Twitch broadcaster account',
  'pokeapi': 'PokeAPI artwork', 'reactive-image-provider': 'Reactive image provider', 'private-followup-action': 'Optional follow-up action'
};
const friendly = id => friendlyNames[id] || String(id).replaceAll('-', ' ').replace(/^./, c => c.toUpperCase());

// Additive catalogue information, containing only public labels and declarations.
// No dispatch definitions, private state, endpoints, action IDs or credentials.
function summarize(manifest) {
  const declaration = manifest.ui?.phoneDeck;
  const phoneDeck = declaration?.schemaVersion === 1 && ['service', 'streamerbot'].includes(declaration.owner?.transport) && Array.isArray(declaration.controls)
    ? { transport: declaration.owner.transport, controls: declaration.controls.filter(c => !c.compatibilityOnly).map(c => ({ id: c.id, name: c.name, kind: c.kind })) }
    : null;
  const summary = {
    schemaVersion: 1, phoneDeck,
    setup: (manifest.ui?.externalSetup || []).map(e => ({ id: e.id, name: e.name, required: e.required })),
    legacyRequired: manifest.ui?.dependencies || [], legacyOptional: manifest.ui?.optionalDependencies || []
  };
  validateSummary(summary);
  return summary;
}

function validateSummary(summary) {
  const fail = () => { throw new Error('Invalid integration summary.'); };
  if (!summary || summary.schemaVersion !== 1) fail();
  for (const key of ['legacyRequired', 'legacyOptional']) if (!Array.isArray(summary[key]) || summary[key].length > 100 || summary[key].some(id => !validId(id))) fail();
  if (!Array.isArray(summary.setup) || summary.setup.length > 100 || summary.setup.some(e => !e || !validId(e.id) || !label(e.name) || typeof e.required !== 'boolean')) fail();
  if (summary.phoneDeck !== null) {
    const p = summary.phoneDeck;
    if (!p || !['service', 'streamerbot'].includes(p.transport) || !Array.isArray(p.controls) || p.controls.length > 100) fail();
    if (p.controls.some(c => !c || !validId(c.id) || !label(c.name) || !['button', 'form', 'widget'].includes(c.kind))) fail();
    if (new Set(p.controls.map(c => c.id)).size !== p.controls.length) fail();
  }
  return summary;
}

function describe(manifest = {}, context = {}, fromCatalog = false) {
  const installed = new Map((context.installed || []).map(item => [item.manifest.id, item]));
  const catalog = new Map((context.catalog || []).map(item => [item.id, item]));
  const states = context.states || new Map();
  let summary = fromCatalog ? manifest.integrations : null;
  if (!fromCatalog) { try { summary = summarize(manifest); } catch (_) { /* Legacy UI hints may be incomplete; keep ordinary dependency information. */ } }
  const required = new Map(Object.entries(manifest.dependencies?.modules || {}));
  const optional = new Map(Object.entries(manifest.dependencies?.optionalModules || {}));
  const external = new Map();
  const addSetup = (id, required, name, hint = false) => {
    if (id === 'streaming-companion') return;
    const old = external.get(id);
    external.set(id, { id, name: name || old?.name || friendly(id), required: required || old?.required || false, hint: hint && !old,
      status: id === 'streamerbot-websocket' ? context.capabilities?.has(id) ? 'Connected' : 'Disconnected'
        : ['windows', 'powershell', 'embedded-node'].includes(id) ? context.capabilities ? context.capabilities.has(id) ? 'Available' : 'Unavailable' : 'Not checked' : 'Check in module controls' });
  };
  for (const [id, requirement] of Object.entries(manifest.dependencies?.capabilities || {})) addSetup(id, requirement === 'required');
  if (manifest.streamerbot?.requiredActions?.length) addSetup('streamerbot-websocket', true);
  for (const [field, needed] of [['legacyRequired', true], ['legacyOptional', false]]) for (const id of summary?.[field] || []) {
    if (required.has(id) || optional.has(id)) continue;
    if (installed.has(id) || catalog.has(id)) { if (id !== manifest.id) optional.set(id, null); }
    else addSetup(id, needed, null, true);
  }
  for (const e of summary?.setup || []) addSetup(e.id, e.required, e.name);
  const relation = (id, range, source = '') => {
    const old = installed.get(id), available = catalog.get(id), m = old?.manifest;
    const compatible = !m ? null : Boolean(semver.valid(m.version) && (!range || semver.satisfies(m.version, range)) && (!m.dependencies?.companion || semver.satisfies(context.version, m.dependencies.companion)) && !['broken', 'incompatible'].includes(states.get(id)?.state));
    return { id, name: m?.name || available?.name || friendly(id), range, installedVersion: m?.version || null, compatible,
      state: states.get(id)?.state || (m ? 'unknown' : 'not-installed'), hasService: Boolean(m?.service), source };
  };
  const optionalRows = new Map([...optional].filter(([id]) => !required.has(id)).map(([id, range]) => [id, relation(id, range)]));
  let unknownPhoneDeck = 0;
  if (manifest.id === 'phone-deck') {
    for (const id of new Set([...installed.keys(), ...catalog.keys()])) {
      if (id === 'phone-deck' || required.has(id)) continue;
      const old = installed.get(id), entry = catalog.get(id);
      let contribution;
      try { contribution = old && !old.error ? summarize(old.manifest).phoneDeck : null; } catch (_) {}
      const offered = entry?.integrations?.phoneDeck;
      if (!contribution && !offered) { if (!old && entry?.integrations === undefined) unknownPhoneDeck++; continue; }
      const row = optionalRows.get(id) || relation(id, null);
      row.phoneDeck = contribution || offered;
      row.source = contribution ? 'Installed declaration' : old ? 'Catalogue declaration; update needed' : 'Catalogue declaration';
      row.catalogueOnly = !contribution;
      optionalRows.set(id, row);
    }
  }
  if (summary?.phoneDeck && manifest.id !== 'phone-deck' && !required.has('phone-deck')) {
    const row = optionalRows.get('phone-deck') || relation('phone-deck', null);
    row.phoneDeck = summary.phoneDeck; row.source = 'Optional handset controls'; optionalRows.set('phone-deck', row);
  }
  return {
    host: { range: manifest.dependencies?.companion || 'Not specified', compatible: manifest.dependencies?.companion ? semver.satisfies(context.version, manifest.dependencies.companion) : null },
    required: [...required].map(([id, range]) => relation(id, range)), optional: [...optionalRows.values()].sort((a, b) => a.name.localeCompare(b.name)),
    external: [...external.values()].sort((a, b) => a.name.localeCompare(b.name)),
    phoneDeck: summary?.phoneDeck || null, summaryKnown: Boolean(summary), unknownPhoneDeck,
    phoneDeckBase: manifest.id === 'phone-deck'
  };
}

module.exports = { summarize, validateSummary, describe };
