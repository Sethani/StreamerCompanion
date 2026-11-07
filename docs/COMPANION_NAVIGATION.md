# Companion navigation

Companion 1.3.0 provides Installed, Catalogue and Settings tabs. Installed rows join services strictly by package ID; standalone services remain accessible. Existing manifest categories are retained, with Other as the fallback. Categories and names use case-insensitive natural A–Z order, with ID tie-breaking. Ready/running changes never reorder rows.

Rows and category groups fold independently. Searches match every term against names, package IDs, descriptions and categories, ignoring case and accents. Search temporarily reveals matching groups without changing their saved folds. Filters combine with search; attention/update tab counts always describe the entire inventory. Intentionally stopped services do not need attention. The All services menu always targets the complete service inventory regardless of search/filter.

Search text stays in memory only. Selected tab, filters, folds and window scroll are stored locally in desktop localStorage. Universal Dock 1.1.0 remembers the selected package and favorites-only filter locally, while each browser/dock can maintain independent navigation. No controls are selected automatically. Missing selections are retained through outages and recovered when available again.

## Shared favorites interface

Favorites are stored privately in ui-preferences.json (schemaVersion 1, favorites: array of package IDs) under the existing application-data directory. Atomic saves update memory only after a successful rename. Unknown but syntactically valid package IDs are preserved so removed/unavailable modules can return without losing their star. Desktop IPC reads/writes the same store. One favorite operation cannot overwrite unrelated favorites from another client.

GET /api/ui/preferences returns schemaVersion, favorites and a session CSRF token. PUT /api/ui/favorites/:packageId accepts exactly { favorite: boolean } and returns the updated preference snapshot. Reads and writes validate the loopback Host and any supplied Origin. Writes require exact same-origin Origin and X-Companion-CSRF. No CORS access is granted, and installation API bearer authentication is unchanged. The browser never receives the installation token. Request bodies are capped at 1 KB.

Favorite writes do not install modules, alter runtime state or start services. Clients refresh shared favorites with their existing three-second polling cycle; failures preserve the last known selection/favorites and show feedback. Service configuration, installed module data, automatic-start state and OBS sources are not migrated.

## Upgrade

Install Companion 1.3.1 before Universal Dock 1.1.1 (minimum host >=1.3.1). Version 1.1.1 retains the 1.1.0 navigation and adds support for modules with multiple Streamer.bot state/action transports. Keep the full application directory; close the previous Companion before launching the new executable. The same preview profile is reused. Update only Universal Dock through the catalogue and refresh its existing OBS dock; its URL and other module packages are unchanged. The dock update itself requires no Streamer.bot reimport.
