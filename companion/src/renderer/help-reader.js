(function(root) {
  'use strict';
  const node = (tag, text) => { const n = document.createElement(tag); if (text !== undefined) n.textContent = text; return n; };
  const slug = text => text.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/\s+/g, '-');
  function mount(container, api) {
    container.classList.add('help-reader');
    const tools = node('div'), label = node('label', 'Search Help'), search = node('input'), back = node('button', 'Back'), status = node('p'), list = node('div'), contents = node('nav'), article = node('article');
    search.type = 'search'; search.placeholder = 'Find an installed guide…'; label.append(search); tools.append(back, label); contents.setAttribute('aria-label', 'Guide contents'); status.setAttribute('role', 'status'); article.tabIndex = -1;
    container.append(tools, status, list, contents, article);
    let entries = [], history = [], current = '', sequence = 0;
    let saved = {}; try { saved = JSON.parse(localStorage.getItem('companion-help-v1')) || {}; } catch (_) {}
    search.value = typeof saved.search === 'string' ? saved.search : '';
    function persist() { try { localStorage.setItem('companion-help-v1', JSON.stringify({ id: current, search: search.value })); } catch (_) {} }
    function draw() {
      list.replaceChildren();
      const terms = search.value.toLowerCase().split(/\s+/).filter(Boolean);
      const matches = entries.filter(e => terms.every(t => [e.name, e.id, e.description].join(' ').toLowerCase().includes(t)));
      for (const e of matches) { const b = node('button', e.name); b.onclick = () => open(e.id); list.append(b); }
      status.textContent = matches.length ? '' : 'No matching guides.';
    }
    function anchor(hash) {
      let decoded; try { decoded = decodeURIComponent(hash); } catch (_) { return; }
      const target = [...article.querySelectorAll('[id]')].find(n => n.id === decoded);
      if (target) { target.scrollIntoView(); target.tabIndex = -1; target.focus({ preventScroll: true }); }
    }
    // Build an intentionally small Markdown vocabulary using text nodes only.
    // Raw HTML, images and unsupported local links are inert visible text.
    function inline(parent, value, guide) {
      const pattern = /(!?\[([^\]]*)\]\(([^\s)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*)/g;
      let start = 0;
      for (const match of value.matchAll(pattern)) {
        parent.append(document.createTextNode(value.slice(start, match.index))); start = match.index + match[0].length;
        if (match[4]) { parent.append(node('code', match[4])); continue; }
        if (match[5]) { parent.append(node('strong', match[5])); continue; }
        const href = match[3], parts = href.split('#'), key = parts[0];
        if (match[0].startsWith('!')) { parent.append(document.createTextNode(match[2])); continue; }
        const id = key ? Object.hasOwn(guide.links, key) ? guide.links[key] : '' : guide.id;
        if (id) { const a = node('a', match[2]); a.href = '#' + (parts[1] || ''); a.onclick = event => { event.preventDefault(); if (id === current) anchor(parts[1] || ''); else open(id, parts[1]); }; parent.append(a); }
        else if (/^https:\/\/[^\s<>"']+$/i.test(href)) { const a = node('a', match[2]); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; if (api.external) a.onclick = event => { event.preventDefault(); api.external(href); }; parent.append(a); }
        else parent.append(document.createTextNode(match[2] + ' (link unavailable in Help)'));
      }
      parent.append(document.createTextNode(value.slice(start)));
    }
    function render(guide) {
      article.replaceChildren(); contents.replaceChildren();
      let code = null, lines = [], listNode = null, table = null; const used = new Map();
      function flushCode() {
        const pre = node('pre'), text = node('code', lines.join('\n')), copy = node('button', 'Copy code');
        copy.onclick = async () => { try { await navigator.clipboard.writeText(text.textContent); copy.textContent = 'Copied'; } catch (_) { copy.textContent = 'Copy unavailable'; } };
        pre.append(text); article.append(copy, pre); lines = []; code = null;
      }
      const source = guide.markdown.replace(/\r/g, '').split('\n');
      const cells = line => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
      for (let index = 0; index < source.length; index++) {
        const line = source[index];
        if (/^\s*```/.test(line)) { listNode = null; if (code !== null) flushCode(); else code = true; continue; }
        if (code !== null) { lines.push(line); continue; }
        if (line.includes('|') && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(source[index + 1] || '')) {
          table = node('table'); const head = node('thead'), row = node('tr');
          for (const value of cells(line)) { const th = node('th'); inline(th, value, guide); row.append(th); }
          head.append(row); table.append(head, node('tbody')); article.append(table); listNode = null; index++; continue;
        }
        if (table && line.includes('|') && line.trim()) { const row = node('tr'); for (const value of cells(line)) { const td = node('td'); inline(td, value, guide); row.append(td); } table.lastChild.append(row); continue; }
        table = null;
        const heading = /^(#{1,6})\s+(.+)$/.exec(line), li = /^\s*(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
        if (heading) {
          listNode = null; const h = node('h' + heading[1].length); inline(h, heading[2], guide);
          const base = slug(h.textContent) || 'section', count = used.get(base) || 0; used.set(base, count + 1); h.id = base + (count ? '-' + count : ''); article.append(h);
          const a = node('a', h.textContent); a.href = '#' + h.id; a.onclick = e => { e.preventDefault(); anchor(h.id); }; contents.append(a);
        } else if (li) { const type = /^\s*\d/.test(line) ? 'ol' : 'ul'; if (!listNode || listNode.localName !== type) { listNode = node(type); article.append(listNode); } const item = node('li'); inline(item, li[1], guide); listNode.append(item); }
        else { listNode = null; if (line.trim()) { const p = node('p'); inline(p, line, guide); article.append(p); } }
      }
      if (code !== null) flushCode();
    }
    async function open(id, hash, record = true) {
      const request = ++sequence; status.textContent = 'Loading guide…';
      try {
        const guide = await api.read(id); if (request !== sequence) return;
        if (record && current) history.push({ id: current, scroll: window.scrollY });
        current = id; persist(); back.disabled = !history.length; render(guide); status.textContent = ''; article.focus(); if (hash) anchor(hash);
      } catch (error) { if (request === sequence) { status.textContent = error.message; } }
    }
    back.disabled = true;
    back.onclick = async () => { const previous = history.pop(); if (previous) { await open(previous.id, '', false); window.scrollTo(0, previous.scroll); } back.disabled = !history.length; };
    search.oninput = () => { persist(); draw(); };
    let indexSignature = '';
    async function refresh() {
      try {
        const next = await api.index(), signature = JSON.stringify(next);
        if (signature !== indexSignature) {
          indexSignature = signature; entries = next;
          if (current && !entries.some(e => e.id === current)) {
            ++sequence; current = ''; article.replaceChildren(); contents.replaceChildren(); persist();
          }
          history = history.filter(h => entries.some(e => e.id === h.id)); back.disabled = !history.length;
          draw();
        }
      } catch (_) { status.textContent = 'Help is unavailable. Update or reconnect Companion and try again.'; }
    }
    refresh();
    if (typeof saved.id === 'string' && saved.id) open(saved.id);
    return { open, refresh };
  }
  root.CompanionHelp = { mount };
})(window);
