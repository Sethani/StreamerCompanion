const fs = require('node:fs');
const path = require('node:path');

const ID = /^[a-z0-9][a-z0-9-]{0,127}$/;
function unavailable() { return Object.assign(new Error('This guide is unavailable. Its module may be uninstalled or its packaged guide missing.'), { statusCode: 404 }); }

// Only manifest entry points are readable. Neither caller paths nor linked files
// become filesystem read requests. Resolve every path component before reading.
class HelpGuides {
  constructor(registry, developerTools = () => false) { this.registry = registry; this.developerTools = developerTools; }
  file(root, relative) {
    if (typeof relative !== 'string' || !/\.md$/i.test(relative) || /[\\:\x00-\x1f]/.test(relative) || relative.split('/').some(p => !p || p === '.' || p === '..' || /[. ]$/.test(p))) throw unavailable();
    const base = fs.realpathSync(root);
    let current = root;
    for (const part of relative.split('/')) {
      current = path.join(current, part);
      if (fs.lstatSync(current).isSymbolicLink()) throw unavailable();
      const resolved = fs.realpathSync(current), rel = path.relative(base, resolved);
      if (rel.startsWith('..') || path.isAbsolute(rel)) throw unavailable();
    }
    const stat = fs.statSync(current);
    if (!stat.isFile() || stat.size > 1024 * 1024) throw unavailable();
    return current;
  }
  module(id, engineering = false) {
    if (typeof id !== 'string' || !ID.test(id) || ((id === 'update-probe' || engineering) && !this.developerTools())) throw unavailable();
    const directory = path.join(this.registry.dataDirectory, id);
    if (fs.lstatSync(directory).isSymbolicLink() || fs.lstatSync(path.join(directory, 'module.json')).isSymbolicLink()) throw unavailable();
    const manifest = this.registry.readManifest(id);
    if (!manifest || manifest.id !== id) throw unavailable();
    return { manifest, directory, file: this.file(directory, engineering ? manifest.developerDocumentation : manifest.documentation) };
  }
  index() {
    const entries = [{ id: 'getting-started', name: 'Getting started' }];
    for (const id of fs.readdirSync(this.registry.dataDirectory)) {
      try {
        const { manifest } = this.module(id);
        entries.push({ id, name: manifest.name, description: manifest.description });
        if (this.developerTools() && manifest.developerDocumentation) {
          this.module(id, true);
          entries.push({ id: 'developer:' + id, name: manifest.name + ' — Developer notes', developer: true });
        }
      } catch (_) { /* Broken/absent guides do not break Help. */ }
    }
    return entries.sort((a, b) => a.id === 'getting-started' ? -1 : b.id === 'getting-started' ? 1 : a.name.localeCompare(b.name));
  }
  read(id) {
    try {
      if (id === 'getting-started') {
        const links = {};
        for (const entry of this.index()) {
          if (entry.id === 'getting-started' || entry.id === 'update-probe' || entry.developer) continue;
          try { const { manifest } = this.module(entry.id); links['modules/' + entry.id + '/' + manifest.documentation] = entry.id; }
          catch (_) { /* Concurrently removed guides remain plain text. */ }
        }
        return { id, name: 'Getting started', markdown: fs.readFileSync(path.join(__dirname, 'guides/getting-started.md'), 'utf8'), links };
      }
      const engineering = typeof id === 'string' && id.startsWith('developer:');
      const moduleId = engineering ? id.slice('developer:'.length) : id;
      const { manifest, file } = this.module(moduleId, engineering);
      const links = {};
      // Link only to other declared guide entry points; all other local links
      // remain visible text, never links to exports or private data. Engineering
      // entry points are resolved only while the local preference enables them.
      for (const entry of this.index()) {
        if (entry.id === 'getting-started') continue;
        try {
          const dev = entry.id.startsWith('developer:');
          const target = this.module(dev ? entry.id.slice('developer:'.length) : entry.id, dev);
          const relative = path.relative(path.dirname(file), target.file).split(path.sep).join('/');
          links[relative] = entry.id;
          if (!relative.startsWith('.')) links['./' + relative] = entry.id;
        } catch (_) { /* A concurrently removed guide is simply unavailable. */ }
      }
      return { id, name: manifest.name + (engineering ? ' — Developer notes' : ''), markdown: fs.readFileSync(file, 'utf8'), links };
    } catch (_) { throw unavailable(); }
  }
}
module.exports = { HelpGuides };
