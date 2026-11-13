'use strict';
// Navigation is restored from private screen preferences; Chromium must not
// race that restoration with its own reload scroll position.
history.scrollRestoration = 'manual';
const $ = selector => document.querySelector(selector), N = CompanionNavigation;
const labels = { ready: 'Ready', broken: 'Broken', incompatible: 'Incompatible Companion version', 'missing-dependency': 'Missing dependency', 'dependency-unavailable': 'Waiting for dependency', 'streamerbot-required': 'Streamer.bot confirmation needed', 'verification-unavailable': 'Verification unavailable', 'configuration-required': 'Configuration needed' };
let saved = {}; try { saved = JSON.parse(localStorage.getItem('companion-navigation-v1')) || {}; } catch (_) {}
const view = { tab: ['installed','catalogue','settings'].includes(saved.tab) ? saved.tab : 'installed', filters: saved.filters || {}, groups: saved.groups || {}, rows: saved.rows || {}, scroll: saved.scroll || {} };
let initialized = false;
let modules = [], services = [], catalog = { modules: [] }, favorites = new Set();
const rowMaps = { installed: new Map(), catalogue: new Map() }, groupMaps = { installed: new Map(), catalogue: new Map() };
function persist() { try { localStorage.setItem('companion-navigation-v1', JSON.stringify(view)); } catch (_) {} }
function el(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }
function text(node, value) { value = String(value || ''); if (node.textContent !== value) node.textContent = value; }
function feedback(message, error = false) { text($('#feedback'), message); $('#feedback').classList.toggle('error', error); }
function button(label, handler, secondary = false) { const node = el('button', secondary ? 'secondary' : '', label); node.onclick = async () => { if (node.dataset.busy) return; node.dataset.busy = '1'; node.disabled = true; try { await handler(); } catch (error) { feedback(error.message, true); } finally { delete node.dataset.busy; node.disabled = false; renderLists(); } }; return node; }
function slot(parent, key, label, handler, visible = true, disabled = false) { let node = [...parent.children].find(n => n.dataset.action === key); if (!node) { node = button(label, () => node.handler()); node.dataset.action = key; parent.append(node); } text(node, label); node.handler = handler; node.hidden = !visible; node.disabled = disabled || Boolean(node.dataset.busy); return node; }
function selectTab(tab, focus = false) { if (initialized) view.scroll[view.tab] = window.scrollY; view.tab = tab; for (const name of ['installed','catalogue','settings']) { const active = name === tab; $('#panel-' + name).hidden = !active; const node = $('#tab-' + name); node.setAttribute('aria-selected', String(active)); node.tabIndex = active ? 0 : -1; } persist(); if (initialized) requestAnimationFrame(() => window.scrollTo(0, view.scroll[tab] || 0)); if (focus) $('#tab-' + tab).focus(); }
for (const name of ['installed','catalogue','settings']) { $('#tab-' + name).onclick = () => selectTab(name); $('#tab-' + name).onkeydown = event => { const tabs = ['installed','catalogue','settings'], index = tabs.indexOf(name); let next; if (event.key === 'ArrowRight') next = tabs[(index + 1) % 3]; if (event.key === 'ArrowLeft') next = tabs[(index + 2) % 3]; if (event.key === 'Home') next = tabs[0]; if (event.key === 'End') next = tabs[2]; if (next) { event.preventDefault(); selectTab(next, true); } }; }
function createRow(kind, id) {
  const row = el('article', 'module'); row.dataset.moduleId = id;
  const heading = el('div', 'module-heading'), star = button('☆', async () => { const result = await window.companion.setFavorite(id, !favorites.has(id)); favorites = new Set(result.favorites); }); star.classList.add('favorite');
  const disclosure = button('', () => { details.open = !details.open; }); disclosure.classList.add('row-toggle');
  const badges = el('div', 'badges'), quick = el('div', 'actions quick'), problem = el('p', 'problem');
  const details = el('details', 'row-details'), summary = el('summary', '', 'Details'); details.id = kind + '-details-' + id;
  disclosure.setAttribute('aria-controls', details.id); details.append(summary);
  details.open = Boolean(view.rows[kind + ':' + id]); details.addEventListener('toggle', () => { view.rows[kind + ':' + id] = details.open; disclosure.setAttribute('aria-expanded', String(details.open)); persist(); });
  disclosure.setAttribute('aria-expanded', String(details.open));
  const description = el('p', 'description'), info = el('div', 'details'), actions = el('div', 'actions'); details.append(description, info, actions);
  heading.append(star, disclosure, badges, quick); row.append(heading, problem, details);
  const entry = { row, star, disclosure, badges, quick, problem, details, description, info, actions }; rowMaps[kind].set(id, entry); return entry;
}
async function serviceAction(id, operation) { services = await window.companion.serviceAction(id, operation); feedback(operation + ' completed.'); }
function updateInstalled(entry, item) {
  const { row, quick, actions } = entry; const s = item.service, state = s?.state;
  row.classList.toggle('service', Boolean(s)); if (s) row.dataset.serviceId = s.manifest.id;
  text(entry.badges, (labels[item.state] || item.state || '') + (state ? ' · ' + state.status : ''));
  entry.badges.classList.toggle('warning', N.attention(item));
  const problem = item.error || item.problem || (item.missingActions?.length ? 'Missing Streamer.bot actions: ' + item.missingActions.join(', ') : '') || state?.error || (s && !s.dependencies.ready ? s.dependencies.missingRequired.length ? 'Missing: ' + s.dependencies.missingRequired.join(', ') : 'Waiting for: ' + (s.dependencies.waitingRequired || []).join(', ') : '') || (state?.endpoint?.configured === false ? 'Service configuration needed.' : '') || (state?.status === 'running' && state.endpoint?.ready === false ? 'Service endpoint unavailable.' : '') || (item.state === 'configuration-required' ? 'Configuration needed.' : '') || (item.state === 'verification-unavailable' ? 'Start Streamer.bot to verify this module.' : '');
  text(entry.problem, problem); entry.problem.hidden = !problem;
  slot(quick, 'controls', 'Open controls', () => window.companion.moduleLink(item.id, 'controls'), Boolean(item.ui?.nodeUrl));
  slot(quick, 'start', 'Start', () => serviceAction(s.manifest.id, 'start'), Boolean(s), Boolean(state?.pid) || state?.status === 'running' || !s?.dependencies.ready);
  slot(quick, 'stop', 'Stop', () => serviceAction(s.manifest.id, 'stop'), Boolean(s), !state?.pid);
  text(entry.info, (item.requiredActions || []).length + ' required Streamer.bot actions' + (item.missingActions?.length ? '; import needed.' : ' verified.') + '\nDependencies: ' + JSON.stringify(item.dependencies || {}));
  if (item.standalone) text(entry.info, 'Standalone service; not attached to an installed package.');
  slot(actions, 'import', 'Import into Streamer.bot…', async () => { const result = await window.companion.openImport(item.id); feedback(result.operation === 'copied' ? 'Import code copied. In Streamer.bot click Import, paste into Import String, review and import the actions, then refresh Companion.' : 'Drag the selected file into Streamer.bot’s Import String box, review and import, then refresh Companion.'); }, Boolean(item.hasImport));
  slot(actions, 'docs', 'Documentation', () => window.companion.openDocs(item.id), Boolean(item.hasDocumentation));
  slot(actions, 'overlay', 'Copy overlay URL', () => window.companion.moduleLink(item.id, 'overlay', true), Boolean(item.ui?.extensionOverlayUrl));
  slot(actions, 'media', item.mediaKind === 'audio' ? 'Import audio' : 'Add media', async () => { const result = await window.companion.importMedia(item.id); if (!result.canceled) feedback('Media copied privately. Refresh media in the module controls.'); }, Boolean(item.hasMedia));
  const links = item.ui?.links || [];
  for (const [index, link] of links.entries()) slot(actions, 'link-' + index, link.name, () => window.companion.moduleLink(item.id, 'link-' + index));
  for (const node of actions.children) if (node.dataset.action?.startsWith('link-')) node.hidden = Number(node.dataset.action.slice(5)) >= links.length;
  slot(actions, 'restart', 'Restart', () => serviceAction(s.manifest.id, 'restart'), Boolean(s), !state?.pid);
  slot(actions, 'settings', 'Settings', () => window.companion.openServiceSettings(s.manifest.id), Boolean(s?.manifest.settingsPath), !state?.endpoint?.ready);
  slot(actions, 'legacy', 'Import existing settings', async () => { const result = await window.companion.importServiceSettings(s.manifest.id); services = result.services; }, Boolean(s?.manifest.supportsLegacyImport && window.companion.importServiceSettings));
  if (s && !entry.serviceBody) {
    const body = el('div', 'service-body'), health = el('div', 'service-health'), meta = el('div', 'service-meta');
    const automatic = el('label', 'autostart'), checkbox = el('input'); checkbox.type = 'checkbox'; automatic.append(checkbox, document.createTextNode(' Start automatically with Companion'));
    checkbox.onchange = async () => { checkbox.disabled = true; try { services = await window.companion.setServiceAutoStart(item.id, checkbox.checked); } catch (error) { feedback(error.message, true); } finally { checkbox.disabled = false; renderLists(); } };
    const logs = el('details', 'logs'), summary = el('summary', '', 'Recent logs'), pre = el('pre'); logs.append(summary, pre);
    logs.open = Boolean(view.rows['logs:' + item.id]); logs.ontoggle = () => { view.rows['logs:' + item.id] = logs.open; persist(); };
    body.append(health, meta, automatic, logs); entry.details.append(body); Object.assign(entry, { serviceBody: body, health, meta, checkbox, pre });
  }
  if (entry.serviceBody) entry.serviceBody.hidden = !s;
  if (s) {
    entry.checkbox.checked = s.autoStart;
    const health = [];
    for (const name of ['production', 'shadow', 'endpoint']) if (state[name]) health.push(name + ': ' + (state[name].ready ? 'Ready' : 'Unavailable') + ' :' + state[name].port);
    health.push('Process: ' + (state.pid || 'None')); text(entry.health, health.join(' · '));
    text(entry.meta, 'Provides: ' + (s.manifest.provides || []).join(', ') + ' | Required: ' + s.dependencies.required.join(', ') + ' | Optional: ' + s.dependencies.optional.join(', ') + (s.dependencies.missingOptional.length ? ' | Optional unavailable: ' + s.dependencies.missingOptional.join(', ') : ''));
    const follow = entry.pre.scrollHeight - entry.pre.clientHeight - entry.pre.scrollTop < 12, top = entry.pre.scrollTop;
    text(entry.pre, (state.logs || []).map(log => new Date(log.atMs).toLocaleTimeString() + ' [' + log.stream + '] ' + log.line).join('\n') || 'No logs yet.');
    entry.pre.scrollTop = follow ? entry.pre.scrollHeight : top;
  }
}
function updateCatalog(entry, item) {
  text(entry.badges, item.state); text(entry.problem, item.problem || ''); entry.problem.hidden = !item.problem;
  text(entry.info, 'By ' + item.author + ' · Installed: ' + (item.installedVersion || 'none') + '\nCompanion: ' + item.dependencies.companion + '\nRequired modules: ' + JSON.stringify(item.dependencies.modules) + '\nOptional modules: ' + JSON.stringify(item.dependencies.optionalModules) + '\nFacilities: ' + JSON.stringify(item.dependencies.capabilities) + '\nStreamer.bot: ' + (item.streamerbot.minimumVersion || 'Not specified') + '\nActions: ' + item.streamerbot.requiredActions.join(', '));
  slot(entry.quick, 'install', item.installedVersion ? item.updateAvailable ? 'Update' : 'Install dependencies' : 'Install', async () => {
    if (!window.confirm('Download, verify and install: ' + item.installationPlan.map(i => i.name + ' ' + i.version).join(', ') + '? Required dependencies are included.')) return;
    const result = await window.companion.installCatalog(item.id); catalog = result.catalog; await refresh(); feedback('Installed ' + result.installed.map(i => i.name + ' ' + i.version).join(', ') + '.');
  }, Boolean(item.installationPlan?.length), Boolean(item.problem));
}
function renderList(kind, items) {
  const list = kind === 'installed' ? $('#modules') : $('#catalog'), query = $('#' + kind + '-search').value;
  const filtered = N.filter(items, query, $('#' + kind + '-filter').value, favorites, kind === 'catalogue');
  text($('#' + kind + '-count'), filtered.length + ' of ' + items.length + ' modules');
  const activeGroups = new Set(), activeRows = new Set(filtered.map(i => i.id));
  for (const entry of rowMaps[kind].values()) entry.row.hidden = !activeRows.has(entry.row.dataset.moduleId);
  for (const item of filtered) {
    const category = N.category(item); activeGroups.add(category);
    let group = groupMaps[kind].get(category);
    if (!group) { const node = el('details', 'category'), summary = el('summary'), body = el('div', 'category-body'); node.append(summary, body); group = { node, summary, body }; groupMaps[kind].set(category, group); node.addEventListener('toggle', () => { if (!$('#' + kind + '-search').value) { view.groups[kind + ':' + category] = node.open; persist(); } }); }
    group.node.hidden = false; group.node.open = query.trim() ? true : view.groups[kind + ':' + category] !== false;
    const entry = rowMaps[kind].get(item.id) || createRow(kind, item.id);
    text(entry.disclosure, item.name + (item.version ? ' · ' + item.version : '')); text(entry.description, item.description);
    text(entry.star, favorites.has(item.id) ? '★' : '☆'); entry.star.setAttribute('aria-pressed', String(favorites.has(item.id))); entry.star.setAttribute('aria-label', (favorites.has(item.id) ? 'Unfavorite ' : 'Favorite ') + item.name);
    if (kind === 'installed') updateInstalled(entry, item); else updateCatalog(entry, item);
    entry.row.hidden = false;
    // Only move nodes if their actual ordering changed; polling must not steal focus.
    const index = filtered.filter(i => N.category(i) === category).findIndex(i => i.id === item.id);
    const current = [...group.body.children].filter(n => !n.hidden)[index];
    if (current !== entry.row) group.body.insertBefore(entry.row, current || null);
  }
  const groups = [...activeGroups].sort((a,b) => N.compare({category:a,name:'',id:''},{category:b,name:'',id:''}));
  for (const [category, group] of groupMaps[kind]) { group.node.hidden = !activeGroups.has(category); text(group.summary, category + ' (' + filtered.filter(i => N.category(i) === category).length + ')'); }
  groups.forEach((category,index) => { const node = groupMaps[kind].get(category).node, current = [...list.children].filter(n => !n.hidden && n.classList.contains('category'))[index]; if (node !== current) list.insertBefore(node, current || null); });
  let empty = list.querySelector('.empty'); if (!empty) { empty = el('p', 'empty'); list.append(empty); } empty.hidden = Boolean(filtered.length); text(empty, items.length ? 'No matching modules. Clear search or change the filter.' : kind === 'installed' ? 'No modules installed. Browse the Catalogue to get started.' : 'No catalogue modules available. Check for updates.');
}
function renderLists() {
  const installed = N.merge(modules, services); renderList('installed', installed); renderList('catalogue', catalog.modules || []);
  text($('#attention-count'), installed.filter(N.attention).length ? '(' + installed.filter(N.attention).length + ' need attention)' : '');
  const updates = (catalog.modules || []).filter(i => i.updateAvailable).length; text($('#update-count'), updates ? '(' + updates + ' updates)' : '');
  $('#autostart-all').checked = services.length > 0 && services.every(s => s.autoStart); $('#autostart-all').indeterminate = services.some(s => s.autoStart) && !services.every(s => s.autoStart);
  text($('#catalog-status'), (catalog.checkedAt ? 'Last checked ' + new Date(catalog.checkedAt).toLocaleString() + '. ' : 'Not checked yet. ') + (catalog.error || 'Updates install only when you choose them.'));
}
let refreshing;
async function refresh() {
  if (refreshing) return refreshing;
  refreshing = (async () => { const [inventory, serviceList, catalogue, preferences] = await Promise.all([window.companion.refresh(), window.companion.services(), window.companion.catalog(), window.companion.uiPreferences()]); modules = inventory.modules; services = serviceList; catalog = catalogue; favorites = new Set(preferences.favorites); text($('#streamerbot'), inventory.streamerBot.connected ? 'Streamer.bot connected' : 'Streamer.bot unavailable'); $('#streamerbot').className = 'connection ' + (inventory.streamerBot.connected ? 'ok' : 'error'); renderLists(); })().finally(() => { refreshing = null; }); return refreshing;
}
for (const kind of ['installed','catalogue']) { const filter = $('#' + kind + '-filter'); if ([...filter.options].some(o => o.value === view.filters[kind])) filter.value = view.filters[kind]; filter.onchange = () => { view.filters[kind] = filter.value; persist(); renderLists(); }; $('#' + kind + '-search').oninput = renderLists; $('#' + kind + '-clear').onclick = () => { $('#' + kind + '-search').value = ''; renderLists(); $('#' + kind + '-search').focus(); }; }
$('#refresh').onclick = () => refresh().catch(error => feedback(error.message, true));
$('#install').onclick = async () => { try { if (await window.companion.install()) { await refresh(); feedback('Module package installed and checked.'); } } catch (error) { feedback(error.message, true); } };
$('#catalog-check').onclick = async () => { $('#catalog-check').disabled = true; try { catalog = await window.companion.checkCatalog(); renderLists(); } catch (error) { feedback(error.message, true); } finally { $('#catalog-check').disabled = false; } };
for (const [id, method] of [['start-all','startAllServices'],['stop-all','stopAllServices']]) $('#' + id).onclick = async () => { const node = $('#' + id); node.disabled = true; try { services = await window.companion[method](); feedback('All-services operation completed.'); renderLists(); } catch (error) { feedback(error.message, true); } finally { node.disabled = false; } };
$('#autostart-all').onchange = async () => { try { services = await window.companion.setAllServicesAutoStart($('#autostart-all').checked); renderLists(); } catch (error) { feedback(error.message, true); } };
$('#copy-api-token').onclick = async () => { await window.companion.copyApiToken(); feedback('Companion API token copied.'); };
$('#rotate-api-token').onclick = async () => { if (window.confirm('Rotate the Companion API token? Existing local automation will stop working until updated.')) { await window.companion.rotateApiToken(); feedback('Companion API token rotated.'); } };
window.companion.apiState().then(state => text($('#api-status'), 'Listening on 127.0.0.1:' + state.port + ' · token stored privately')).catch(() => {});
selectTab(view.tab); window.addEventListener('scroll', () => { if (initialized) { view.scroll[view.tab] = window.scrollY; persist(); } }, {passive:true});
window.addEventListener('beforeunload', () => { if(initialized){view.scroll[view.tab]=window.scrollY;persist();initialized=false;} });
refresh().then(() => requestAnimationFrame(() => { window.scrollTo(0, view.scroll[view.tab] || 0); initialized = true; })).catch(error => feedback(error.message, true));
window.setInterval(() => refresh().catch(error => feedback(error.message, true)), 3000);
