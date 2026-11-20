(function(root) {
  'use strict';
  const make = (tag, text) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; return node; };
  const stateLabels = {
    ready: 'Module ready', broken: 'Package needs repair', incompatible: 'Companion update required',
    'missing-dependency': 'Required module missing', 'dependency-unavailable': 'Waiting for required modules',
    'streamerbot-required': 'Import actions into Streamer.bot', 'verification-unavailable': 'Connect Streamer.bot to check actions',
    'configuration-required': 'Configuration needed', unknown: 'Module readiness not checked'
  };
  function availability(row, services) {
    if (!row.installedVersion) return 'Not installed';
    if (row.compatible === false) return 'Not compatible';
    if (row.state !== 'ready') return stateLabels[row.state] || 'Module readiness not checked';
    if (row.hasService) {
      const service = services.find(s => s.manifest.id === row.id);
      if (!service) return 'Service readiness not checked';
      if (service.state.status !== 'running' || !service.state.pid) return service.state.status === 'error' ? 'Service error' : 'Service stopped';
      if (service.state.endpoint?.ready !== true) return 'Service unavailable';
      if (service.state.endpoint.configured === false) return 'Configuration needed';
      return 'Module service ready';
    }
    return 'Module ready';
  }
  function render(entry, item, services, developerTools, catalogue = false) {
    let ui = entry.integrations;
    if (!ui) {
      ui = { intro: make('p'), host: make('p'), note: make('p'), groups: new Map() };
      entry.info.replaceChildren(ui.intro, ui.host, ui.note); entry.info.classList.add('integration-info');
      for (const [id, title] of [['required', 'Required modules'], ['optional', 'Optional integrations'], ['external', 'External setup']]) {
        const details = make('details'), summary = make('summary', title), message = make('p'), list = make('ul');
        details.className = 'integration-group'; details.dataset.group = id; details.open = id === 'required';
        details.append(summary, message, list); entry.info.append(details); ui.groups.set(id, { details, summary, message, list, rows: new Map() });
      }
      entry.integrations = ui;
    }
    const model = item.integrationDetails;
    ui.intro.textContent = catalogue ? 'By ' + item.author + ' · Installed: ' + (item.installedVersion || 'none')
      : item.standalone ? 'Standalone service; see its controls for setup.'
      : (item.requiredActions || []).length ? item.state === 'verification-unavailable' ? 'Connect Streamer.bot to check imported actions.' : item.missingActions?.length ? 'Import the supplied actions into Streamer.bot.' : 'Supplied Streamer.bot actions are present.' : 'No required Streamer.bot actions.';
    ui.host.textContent = model ? 'Companion: ' + model.host.range + (model.host.compatible === null ? '' : model.host.compatible ? ' · Compatible' : ' · Update required') : 'Refresh Companion for integration details.';
    const notes = [];
    if (model?.phoneDeckBase) notes.push('Phone Deck works with OBS on its own. These optional controls do not install or start modules, or add cards. Open Phone Deck to check individual controls, resources and connections.');
    if (model?.phoneDeck && !model.phoneDeckBase) notes.push('Optional Phone Deck controls are declared. Add cards yourself in Phone Deck; control readiness is checked there.');
    if (catalogue && model && !model.summaryKnown) notes.push('This older catalogue entry has no integration summary. Additional integrations and setup are unknown; see the module guide.');
    if (!catalogue && model && !model.summaryKnown) notes.push('Some integration metadata is unavailable. See the module guide for setup.');
    if (model?.unknownPhoneDeck) notes.push(model.unknownPhoneDeck + ' older catalogue entries have no Phone Deck integration summary; support is unknown.');
    ui.note.textContent = notes.join(' '); ui.note.hidden = !notes.length;
    for (const [id, group] of ui.groups) {
      const rows = (model?.[id] || []).filter(row => developerTools || row.id !== 'update-probe');
      group.summary.textContent = ({ required: 'Required modules', optional: 'Optional integrations', external: 'External setup' })[id] + ' (' + rows.length + ')';
      group.message.textContent = rows.length ? id === 'optional' ? 'Optional integrations do not block this module’s installation or base operation.' : id === 'external' ? 'Accounts, connections and software are configured separately; no module installation is implied.' : 'Required packages are included when you choose Install.' : id === 'required' ? 'No required module packages.' : id === 'optional' ? 'No optional module integrations declared.' : 'No additional external setup declared.';
      const active = new Set(rows.map(row => row.id));
      for (const [key, li] of group.rows) if (!active.has(key)) { li.remove(); group.rows.delete(key); }
      rows.forEach((row, index) => {
        let li = group.rows.get(row.id);
        if (!li) { li = make('li'); li.dataset.integrationId = row.id; group.rows.set(row.id, li); group.list.append(li); }
        let value;
        if (id === 'external') value = row.name + ' · ' + (row.required ? 'Required setup' : 'Optional setup') + ' · ' + row.status + (row.hint ? ' · Legacy setup hint; see guide' : '');
        else {
          const installed = row.installedVersion ? 'Installed ' + row.installedVersion : 'Not installed';
          const compatibility = row.compatible === null ? 'Compatibility not checked' : row.compatible ? 'Version compatible' : 'Version incompatible';
          value = row.name + (row.range ? ' (' + row.range + ')' : '') + ' · ' + installed + ' · ' + compatibility + ' · ' + availability(row, services);
          if (row.source) value += ' · ' + row.source;
          if (row.phoneDeck) value += ' · Declared phone controls: ' + row.phoneDeck.controls.map(c => c.name).join(', ') + (row.catalogueOnly ? ' · Not verified in the installed package' : '');
        }
        if (li.textContent !== value) li.textContent = value;
        const current = group.list.children[index]; if (current !== li) group.list.insertBefore(li, current || null);
      });
    }
  }
  root.CompanionIntegrations = { render, availability };
})(window);
