(function(root) {
  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });
  const fold = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const category = item => String(item.category || '').trim() || 'Other';
  const compare = (a, b) => collator.compare(category(a), category(b)) || collator.compare(a.name, b.name) || String(a.id).localeCompare(String(b.id));
  function merge(modules, services) {
    const map = new Map(modules.map(item => [item.id, { ...item }]));
    for (const service of services) {
      const id = service.manifest.id;
      if (map.has(id)) map.get(id).service = service;
      else map.set(id, { id, name: service.manifest.name, version: service.manifest.version, description: service.manifest.description, category: service.manifest.category || 'Other', state: 'ready', service, standalone: true });
    }
    return [...map.values()].sort(compare);
  }
  function attention(item) {
    const s = item.service;
    return Boolean((item.state && item.state !== 'ready') || item.error || item.problem || s?.state?.error || ['error', 'conflict'].includes(s?.state?.status) || (s?.dependencies && !s.dependencies.ready) || s?.state?.endpoint?.configured === false || (s?.state?.status === 'running' && s.state.endpoint?.ready === false));
  }
  function matches(item, query) { const haystack = fold([item.name, item.id, item.description, category(item)].join(' ')); return fold(query).split(/\s+/).filter(Boolean).every(term => haystack.includes(term)); }
  function filter(items, query, mode, favorites, catalog = false) {
    return items.filter(item => matches(item, query) && (mode === 'favorites' ? favorites.has(item.id) : catalog ? mode === 'updates' ? item.updateAvailable : mode === 'not-installed' ? !item.installedVersion : true : mode === 'attention' ? attention(item) : mode === 'running' ? item.service?.state.status === 'running' : mode === 'stopped' ? item.service && !item.service.state.pid && item.service.state.status !== 'running' : true)).sort(compare);
  }
  const api = { category, compare, merge, attention, matches, filter };
  if (typeof module !== 'undefined') module.exports = api; else root.CompanionNavigation = api;
})(typeof window !== 'undefined' ? window : globalThis);
