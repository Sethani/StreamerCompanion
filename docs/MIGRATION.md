# Legacy migration and retirement

Latest production-tool slice, November 8: Reactive Guests 2.1.0 and Cameras 2.0.1 are independently published, installed, imported and Ready in Companion 1.3.1. The copied lineup uses the existing shared overlay; Cameras operates existing OBS scenes and has no overlay/service. The bounded, backed-up handoff retains all 21 live guests, remembered selection, camera settings, preferences and OBS layouts while disabling competing legacy camera routing. Native inventory and incoming Twitch chat were verified after restart. Camera 2 Off preserves its remembered guest; use Cameras 2.0.1 rather than the initial 2.0.0. Actual guest-provider/camera-mode visual acceptance remains. See [the audit and boundary](reactive-cameras-boundary.md) and VALIDATION.md for the release-asset HTTP 504 limitation and verified local-archive installation evidence. No app rebuild is required.

Latest extraction, November 8: Shoutout Clips 2.1.0 is published, installed, imported and Ready, with native initialization verified after a user-authorized backed-up restart. The six stable actions, private settings, dock and shared-overlay appearance are preserved. Its private caller now dispatches clips natively; optional AI text stays with the legacy warm service until the Ollama slice. Source/C#/hidden-browser/actual combined-page/released-package checks pass. The user confirmed overlay playback and the chat shoutout flow after restoring broadcaster EventSub; its terminal post-restart connection failure had prevented incoming commands. Verify incoming Twitch events after future restarts. See [the boundary and acceptance record](shoutout-clips-boundary.md); this is not a whole-system retirement gate.

The [user-approved switchover checklist](switchover-feature-checklist.md) now defines the retirement scope: all listed features are vital except Chat Archive/TTRPG (later), Stream Together (drop), and the separately parked Writing Challenge. Keep live chat/enrichment and Reactive/camera controls in scope.


Current status (2026-11-07): Archipelago, Pokemon, Controller, Video, Spotify, Chat Routing and Live Chatbox are published and user-accepted. Countdown, Stream Launch and the retained private going-live follow-up passed an operator-intended real stream. Reminders 1.0.1, Wheel 2.1.1, Named Timers 1.0.0 and Redeem Checklist 1.0.0 are published, imported and accepted for their documented flows. Walk Ons 2.1.0 is published, installed and locally tested with preserved roster/IDs, privately imported audio and the transparent renderer integrated into the existing combined overlay. A real viewer first-chat observation remains separate from the successful controlled Test playback. The Phone Deck interruption was traced to the phone not being on Wi-Fi; extraction is still pending. Other vital features keep the legacy backend necessary. The [current source/dependency inventory](legacy-migration-status.md) supersedes old roadmap status below.


Walk Ons 2.1.0, Universal Dock 1.1.1 and Companion 1.3.1 preview 1 were published on 2026-11-07. Released-package installation and checksum/dependency acceptance passed in disposable packaged-host profiles. The local preview already has these versions; refresh the existing combined OBS source and Universal Dock to load the new browser assets. Shoutout Clips is the next extraction.

November 8 corrective update: installed Walk Ons 2.1.1 fixes repeated entrances caused by child-action argument isolation; its backed-up Streamer.bot action update and coordinated restart are complete. Installed Archipelago 1.0.9 uses scoped Controller reads/actions, respects unavailable counts, and permits explicit synchronized `not_governed` targets. Both modules are published and Ready; Companion remains 1.3.1. Source/C#/hidden UI/released-package checks pass, and the Controller handover records the new API. Observe once-per-stream behavior during normal chat; Shoutout Clips remains the next extraction.

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
| Already portable feature cores | Reactive, Stream Together, Cameras, Audio Routing, Scene Links, TTRPG, Walk Ons, Shoutout Clips | Independent clean exports, dependencies, operator tests, saved state, upgrade/rollback and install documentation pass for each feature. Strip personal seeds/adapters from builders. Wheel and Reminders now have canonical packages and are tracked above. |
| Broker-backed Archipelago | Room/slot picker and independent overlay implemented; controlled live cutover pending | Controller owns room parsing/analysis. Verify selected-room display, events, lock filtering and restart before disabling the old renderer. |
| Published controller / remaining Node services | Controller 1.1 is extracted; Phone Deck and optional Ollama remain | Separate packages preserve required runtimes, APIs and private pairing/room/config data. |
| Separate notice review | Pokemon icon provenance/notices are recorded; Chat Core's bundled helper remains | Establish redistributable sources/notices before publishing their assets. |

For each production cutover, record browser refresh, application restart, duplicate-command/disconnect behavior, safe tests, controlled stream observations, timestamped backups and a rollback point. Preserve old state until intentionally migrated or archived. Remove a legacy endpoint only after no remaining caller depends on it. Do not publish a shadow copy of the personal monolith as a shortcut.

The source catalogue is generated from module manifests; installed UI registrations continue to be projected from those manifests. Do not keep manually synchronizing public source changes back into the old project.

## Browser foundation implementation

Archipelago 1.0.0 adds broker-populated room selection and per-room team/slot checkboxes, explicit authenticated room actions and a stable overlay URL. Host 1.2.2 prevents this service-backed replacement from being auto-embedded by legacy cross-origin overlay readers. Installation/startup do not configure or replace the active OBS source, adopt old credentials or run room actions. See its README for key-file selection and cutover.

Companion 1.2.0, Universal Dock/Overlay/Source Modules 1.0.0 and Video 2.2.0 implement the shared browser slice. New media and browser assets require no personal server. The [browser contract](BROWSER_MODULES.md) documents ownership and paths; the [Video guide](../modules/video/README.md) documents explicit imports, backups, media relinking and rollback. Isolated checks are recorded in [validation](VALIDATION.md).

Use [app preview 3](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.0-preview.3), which includes visible reimport controls and the guard against automatic duplicate embedding by the old overlay. All four module packages are independently published; unrelated Spotify and Update Probe catalogue entries are unchanged.

Next is an operator-controlled Video cutover: close the old preview before opening 1.2.0, install Video/dependencies, back up and explicitly import both action exports, initialize, copy/relink a short test video, configure scene routing and verify an OBS test source before replacing the old source. Preserve original globals/media until that test and a restart pass. Installing packages does not version-verify or overwrite imported actions. Remaining legacy renderers/features continue on the old system until migrated separately.


Live Chatbox (chat-core) 1.0.0 provides the existing chat design on port 3136, independent of the old personal server and deferred archive on 3129. Install/start it in Companion 1.3.0 or later; no Streamer.bot import is required. Paste the existing Chatbox URL into its private Appearance field, save, and use the explicit test/preview controls. Only after visual acceptance replace the URL of the existing Chatbox OBS source with http://127.0.0.1:3136/chat/chat.html, retaining dimensions/placement/filters. No extra OBS source or aggregate registration is created. The old archive/database is untouched and can remain available during testing. The new service has its own host-managed automatic-start preference. Roll back by restoring the old source URL. See the module README.

Stream Launch 1.0.0 installs into Companion 1.3.0 or later and requires Countdown 1.1.0 plus Universal Dock. Back up the six existing Stream Launch actions and `portable.streamLaunch.*` globals before importing. The four established action IDs are intentionally replaced in place; Initialize and Health are new. Existing `GoingLive` and the private announcement/bookkeeping action are not exported or replaced. After import, open Stream Launch controls, load/review the saved scene/duration/switches/private follow-up, save, and use **Check readiness**. That check is read-only. Do not press **Go Live** merely as an installation test: it intentionally selects the configured scene, starts Countdown and OBS, then starts Spotify and the private follow-up only after OBS confirms streaming. Roll back by restoring the action backup and previous package; retain the old server until every other vital feature has migrated.
