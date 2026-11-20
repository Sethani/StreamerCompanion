const fs = require('node:fs'), path = require('node:path');
const validId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(id) && id.length <= 128;
class UiPreferences {
  constructor(directory) {
    this.file = path.join(directory, 'ui-preferences.json'); this.favorites = new Set(); this.developerTools = false;
    try { const data = JSON.parse(fs.readFileSync(this.file)); if (data.schemaVersion === 1) { if (Array.isArray(data.favorites)) this.favorites = new Set(data.favorites.filter(validId)); this.developerTools = data.developerTools === true; } } catch (_) {}
  }
  read() { return { schemaVersion: 1, favorites: [...this.favorites].sort(), developerTools: this.developerTools }; }
  save(next) {
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = this.file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2));
    fs.renameSync(temporary, this.file);
  }
  setDeveloperTools(enabled) {
    if (typeof enabled !== 'boolean') throw Object.assign(new Error('Expected a Developer tools boolean.'), { statusCode: 400 });
    this.save({ ...this.read(), developerTools: enabled }); this.developerTools = enabled;
    return this.read();
  }
  setFavorite(id, favorite) {
    if (!validId(id) || typeof favorite !== 'boolean') throw Object.assign(new Error('Invalid favorite.'), { statusCode: 400 });
    const next = new Set(this.favorites); if (favorite) next.add(id); else next.delete(id);
    this.save({ ...this.read(), favorites: [...next].sort() }); this.favorites = next;
    return this.read();
  }
}
module.exports = { UiPreferences };
