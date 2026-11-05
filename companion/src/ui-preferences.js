const fs = require('node:fs'), path = require('node:path');
const validId = id => typeof id === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(id) && id.length <= 128;
class UiPreferences {
  constructor(directory) {
    this.file = path.join(directory, 'ui-preferences.json'); this.favorites = new Set();
    try { const data = JSON.parse(fs.readFileSync(this.file)); if (data.schemaVersion === 1 && Array.isArray(data.favorites)) this.favorites = new Set(data.favorites.filter(validId)); } catch (_) {}
  }
  read() { return { schemaVersion: 1, favorites: [...this.favorites].sort() }; }
  setFavorite(id, favorite) {
    if (!validId(id) || typeof favorite !== 'boolean') throw Object.assign(new Error('Invalid favorite.'), { statusCode: 400 });
    const next = new Set(this.favorites); if (favorite) next.add(id); else next.delete(id);
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    const temporary = this.file + '.tmp';
    fs.writeFileSync(temporary, JSON.stringify({ schemaVersion: 1, favorites: [...next].sort() }, null, 2));
    fs.renameSync(temporary, this.file); this.favorites = next;
    return this.read();
  }
}
module.exports = { UiPreferences };
