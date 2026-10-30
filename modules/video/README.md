# Video Player

Provides reusable local-video playback in the shared overlay, including an optional title bar, a registered video library, volume and fit controls, positioning, and guarded playback completion.

## Requirements

- Companion 1.2.0, Universal Dock 1.x, Universal Overlay 1.x and Source Modules 1.x. The catalogue installs the required browser modules together.
- Streamer.bot with its local WebSocket enabled. Browser transport currently supports unauthenticated loopback WebSockets.

Companion must stay running to host the packaged editor, overlay and privately copied media. The old static tree and monolithic server are not required for newly registered media.

## Install

1. Back up Streamer.bot through its normal backup process, then install Video through Companion's catalogue.
2. Explicitly import Source Modules and all six Video actions. Existing names and IDs are preserved. Import the new exports even if old action names already show as verified: name checks cannot establish imported code/version.
3. Run `Module Routing - Initialize` and `Video - Initialize` once. Their startup triggers handle later starts; Source Modules also includes OBS Scene Changed.
4. Choose **Add media** on Video's Companion card. In Video controls, press **Refresh media** and Save to register the selected copies.
5. Copy Universal Overlay's overlay URL from Companion into a separate OBS browser source. Enable Video in Source Modules for the intended scenes. Unconfigured overlays stay hidden.
6. Use Universal Dock's Tests link. Verify health, a short video, title, scene change, natural completion, disconnect and restart before cutting over production. Play/Stop tests ask for confirmation.

Do not run old and new Video overlays simultaneously at cutover. Packages do not automatically change OBS sources, live actions or saved globals.

## Behaviour

`Video - Play` accepts a registered `id`, optional `title`/`src`, fit, volume, muted, loop and legacy pixel geometry. An empty ID has no personal fallback; an empty title displays no title bar. `Video - Stop` hides playback. Completion uses the active start timestamp so an older completion cannot stop a newer video.

Disconnect hides playback; reconnect reads globals without issuing Play. Leaving an allowed scene removes the renderer frame. Returning recreates it from saved current state and may restart an active clip from the beginning. Avoid opening multiple copies of the playback overlay.

The module does not own birthday matching, walk-on selection, or shoutout clip lookup. Those are separate modules which may depend on Video Player.

## Settings and media

The library and presentation remain in `portable.video.state`. Installing package files does not overwrite that global; Initialize preserves valid library entries and presentation. Legacy `/streaming/videos/` and port 7474 URLs remain supported, requiring their original host until intentionally migrated.

To remove that dependency, add copies through Companion, refresh media, then choose a replacement in the existing library row's **Replace media** selector and Save. The row retains its ID so existing actions keep working. New copies receive independent IDs; disable duplicates you no longer want. Keep original files/settings for rollback.

Copied media and its index live privately in `module-data/video/media`, outside installed package code. Original absolute paths and media bytes never enter releases. Export/import settings stages changes until Save. No original files are moved or deleted, and missing legacy files are not silently scanned or copied.

## Uninstall and rollback

Keep backups of Streamer.bot and the preview data profile. Restore compatible browser packages, imported actions and intentionally changed settings together: code rollback alone cannot revert globals. Code upgrades preserve private media/preferences. Static packages have no child service or auto-start setting.

No automatic uninstall/data deletion is provided. Intentional removal must affect only Video's own actions/global, preserving other modules and shared media. Keep the original production applications available until a controlled cutover passes.
