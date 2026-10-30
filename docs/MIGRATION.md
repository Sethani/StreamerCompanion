# Legacy migration and retirement

The new repository is canonical for the generic host, Video and Spotify source. Existing personal applications/configuration stay intact until each replacement is proven. Never migrate `.env`, OAuth tokens, chat databases, OBS profiles, widget authentication URLs, private media or viewer data through Git or release packages.

## First release/update gate

1. Install Update Probe from the GitHub catalogue, start it explicitly, then update it from a second versioned prerelease.
2. Verify health, installed/latest version changes, private-data preservation and restart preferences.
3. Keep Video/Spotify action names, stable action IDs, data migration aliases, API shapes and personal adapters compatible.
4. Import actions through Streamer.bot only after a backup and explicit user confirmation. A file update does not silently import actions or overwrite globals.

## Migration batches

| Batch | Work | Retirement condition |
| --- | --- | --- |
| Published foundation | Generic host, Update Probe, Video/Spotify package source | GitHub update path, hash verification, rollback and data preservation pass. |
| Shared browser foundation | Clean Universal Dock, shared overlay, Tests and Source Modules packaging | Refresh, disconnect and restart tests pass without the personal static tree; external dependency states are accurate. |
| Already portable feature cores | Wheel, Reactive, Stream Together, Cameras, Audio Routing, Scene Links, TTRPG, Countdown, Writing, Walk Ons, Shoutout Clips, Reminders | Independent clean exports, dependencies, operator tests, saved state, upgrade/rollback and install documentation pass for each feature. Strip personal seeds/adapters from builders. |
| Remaining Node services | Controller bridge, Archipelago, Phone Deck, optional Ollama | Separate packages preserve required runtimes, APIs and private pairing/room/config data. |
| Separate notice review | Pokemon icons and Chat Core's bundled helper | Establish redistributable sources/notices before publishing their assets. |

For each production cutover, record browser refresh, application restart, duplicate-command/disconnect behavior, safe tests, controlled stream observations, timestamped backups and a rollback point. Preserve old state until intentionally migrated or archived. Remove a legacy endpoint only after no remaining caller depends on it. Do not publish a shadow copy of the personal monolith as a shortcut.

The source catalogue is generated from module manifests; installed UI registrations continue to be projected from those manifests. Do not keep manually synchronizing public source changes back into the old project.

## Browser foundation implementation

Companion 1.2.0, Universal Dock/Overlay/Source Modules 1.0.0 and Video 2.2.0 implement the shared browser slice. New media and browser assets require no personal server. The [browser contract](BROWSER_MODULES.md) documents ownership and paths; the [Video guide](../modules/video/README.md) documents explicit imports, backups, media relinking and rollback. Isolated checks are recorded in [validation](VALIDATION.md).

Use [app preview 3](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.0-preview.3), which includes visible reimport controls and the guard against automatic duplicate embedding by the old overlay. All four module packages are independently published; unrelated Spotify and Update Probe catalogue entries are unchanged.

Next is an operator-controlled Video cutover: close the old preview before opening 1.2.0, install Video/dependencies, back up and explicitly import both action exports, initialize, copy/relink a short test video, configure scene routing and verify an OBS test source before replacing the old source. Preserve original globals/media until that test and a restart pass. Installing packages does not version-verify or overwrite imported actions. Remaining legacy renderers/features continue on the old system until migrated separately.
