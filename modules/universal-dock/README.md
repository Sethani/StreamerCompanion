# Universal Dock

Use installed module controls and Help together inside OBS. Search by module name/category and keep favorites synchronized with Companion.

## What you need

Companion must be running to host the dock. Install Universal Dock through the catalogue. It has no native actions, separate service or audience overlay. Individual modules may need Streamer.bot, a running service or other setup.

The shared Streamer.bot browser transport currently uses an unauthenticated local WebSocket. Follow **Help → Getting started** for that connection before using modules that require it.

## Add the dock to OBS

1. In Companion **Installed**, find Universal Dock and choose **Open controls**.
2. Copy the URL from the browser address bar.
3. In OBS, open **Docks → Custom Browser Docks…**.
4. Enter **Companion** as the Dock Name, paste the URL and press **Apply**.
5. Move/dock the resulting panel where you want it.

The default address is:

```text
http://127.0.0.1:3135/api/public/assets/universal-dock/dock/index.html
```

Use the actual Open controls address if different. This is an operator dock, not an OBS audience browser source. For shared audience output, use [Universal Overlay](../universal-overlay/README.md).

## Choose and keep controls

Choose a module explicitly in the picker. Search names, descriptions or categories, use the favorites filter, and star modules you want to find quickly. Favorites are shared with Companion and other docks; each browser remembers its own selected module.

Filtering, status refreshes and category changes keep the selected controls document intact. If a module is temporarily unavailable, the dock keeps the selection so it can recover when the module returns.

Shared favorites are saved privately by Companion. The dock page contains no installation API token.

## Help and tests

Choose **Help** to read installed guides or Getting started. Use search, contents links and Back to navigate. **Controls** returns without closing the selected controls or discarding unsaved input.

Guides can be read while a module is stopped or Streamer.bot is disconnected. Universal Dock 1.1.4 requires Companion 1.4.1 or later for built-in Help. Update Companion first; older hosts reject this Dock update.

**Tests** is a separate link on Universal Dock's Companion row. Tests run only on explicit clicks; state-changing tests ask for confirmation. Some affect real OBS/audio outputs, so use them deliberately off-stream. Normal picker/help/favorite use does not run feature tests.

## Troubleshooting

- Dock will not load: keep Companion running and check the copied URL.
- Empty picker: install a module with controls and clear search/favorites filters.
- Streamer.bot disconnected: check the server in Getting started; do not look for a backend/password selector that is not provided by this shared transport.
- Shared favorites unavailable: update/reconnect Companion; controls can remain usable.
- Need to refresh an editor after an update: save any draft first, then refresh/reopen that controls page. Do not recreate OBS audience sources to update an operator dock.

Reference: [OBS custom browser-dock setup](https://docs.streamer.bot/guide/extra-features/chat#obs-browser-dock). No phone controls, custom chat trigger or native import is needed for the dock itself.
