# First public GitHub update validation

Validated on 2026-10-30 against the public `Sethani/StreamerCompanion` repository.

## Current layout: independent app and module distribution

The initial combined previews below are historical compatibility archives. Starting with [app 1.1.1 preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.1-preview.1), application releases contain exactly the portable Windows app and `SHA256SUMS`.

All editable module source remains in this repository. Live module metadata now lives in [`catalog/modules.json` in StreamerCompanion-Modules](https://github.com/Sethani/StreamerCompanion-Modules/tree/main/catalog); that repository hosts per-module releases and its own Publish module workflow. The client reads the catalogue folder using the GitHub Contents API, without enumerating either repository's releases.

Verified separation:

- Migrated Spotify 2.0.1, Video 2.1.1 and Update Probe 1.0.1 without changing any package bytes/hashes. Video was published by the distribution repository's workflow, using its own token and building only Video.
- Published only Update Probe 1.0.2 through that workflow. The before/after catalogue comparison showed that only Update Probe's entry changed: Spotify and Video's versions, URLs, hashes and source metadata were identical.
- Installed Update Probe 1.0.1 from the real distribution catalogue, then used the rebuilt app's embedded runtime to update the running service to 1.0.2. Health, synthetic private data, automatic-start preference and offline cache behavior passed. The assertions verified 1.0.2; an obsolete hard-coded success-message version was subsequently corrected.
- Both module publication workflows passed. The app-only release workflow also passed, including its hidden desktop acceptance test, and its published asset list was verified to contain only the app ZIP and checksum.
- Selected-module build tests verify that one module produces only one `.streammodule`. Catalogue merge tests preserve unrelated entries, reject downgrade/version reuse, and make a same-version retry a no-op.
- Old combined-repository caches are ignored after switching sources, while installed modules and their private data remain intact. The isolated network-test state was removed and its service stopped.

Module publications require neither an app release nor rebuilding/re-uploading unrelated modules. The original combined release assets remain available so older preview clients are not broken by this migration.

## Published releases

- [Preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.0-preview.1): host 1.1.0, Video 2.1.1, Spotify 2.0.1 and Update Probe 1.0.0.
- [Preview 2](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.0-preview.2): the same host binary, Video and Spotify packages; Update Probe advances independently to 1.0.1.

Both releases contain a portable Windows app, versioned module packages, `modules.json` and SHA-256 sums. Unchanged Video/Spotify versions retain identical package hashes across the two releases. First-party code, generated import metadata and modules are attributed to Sethani under MIT. Third-party runtime notices are retained separately.

## Real network proof

`companion/scripts/test-github-updates.js baseline` used the public GitHub Releases API, fetched the first release catalogue, downloaded Update Probe 1.0.0, verified its hash, installed it and started it. The test saved a synthetic private marker and enabled automatic startup in an isolated temporary profile.

After Preview 2 was published, the `upgrade` phase ran using the actual packaged Electron executable in embedded-Node mode. It discovered version 1.0.1 through the real GitHub API, verified/downloaded the release asset, upgraded the running service and verified the new health version. The private marker and automatic-start setting survived. A subsequent simulated network failure retained the last valid catalogue without stopping the service.

The isolated service and API were stopped, and the test profile/state file was removed. The user's open preview, live Streamer.bot/OBS data, OAuth state, chat and playback were not changed.

## Other verification

- Windows and Linux CI passed for the initial source. The second module-only source update runs the same check group.
- Deterministic archive tests compile readable action JSON/C# into `.sb`, verify action inventories and attribution, and assert that public Video defaults contain no personal media library.
- Source tests cover capability blocking, explicit version comparison, cached/offline catalogue behavior, package identity, invalid hashes and URLs/redirects, size limits, dependency cycles/conflicts/order, traversal through installed dependencies, missing-dependency repair and multi-module rollback after a parent fails.
- Hidden Electron tests load the built ASAR, exercise the sandboxed preload, catalogue comparison and confirmed update, generic settings, dependency display, Start/Stop/Restart, automatic-start preferences, picker hot-upgrade rendering, expanded logs and quit cleanup. All integrations/data are synthetic.

## Remaining retirement gates

Independent module distribution and updates are proven; full legacy retirement still requires per-feature cutovers. The browser foundation implementation and isolated evidence are recorded below. Streamer.bot imports remain explicit, and real clean-machine compilation/import has not been claimed.

Pokemon imagery and Chat Core's bundled helper remain outside the public batch pending their redistribution notices. Host self-update, production data migration and full legacy shutdown are later gates. See [the migration batches](MIGRATION.md).

## Archipelago 1.0.0 and host 1.2.2

The module is an independent core-Node service consuming only Controller Room API 2.2. It has no personal-server dependency, AP connection, tracker scraping or local analysis worker. Configured broker addresses are loopback-only, redirects are refused and action keys remain in private module data. Its stable overlay URL contains no key or room-specific arguments. Installation starts with no chosen room, slots or enabled overlay.

Packaged service tests cover overlapping slot numbers across teams, per-room choices, save/restart persistence, no historical activity on startup, cursor pagination/dedup/reset, generation changes, fresh/stale/wrong-generation logic, explicitly unsupported analysis features, independent goals/progress options, lock/unknown-state filtering, outages, local URL validation, private management endpoints and authenticated actions targeting only selected reported slots. Events are not persisted. Synthetic keys never appear in the public projection.

Hidden Electron acceptance loads the built package and tests dropdown discovery, checkbox selection, Select all, switching/restoring rooms, the same OBS URL across changes, explicit confirmed/cancelled actions, safe text rendering for hostile event text, lock/outage hiding and compact rotating pages for large selections. All data/action responses are synthetic. Preview captures under ignored `companion/out` contain synthetic data only.

A separate temporary-profile passive check against the actual running broker discovered its saved rooms and rendered both reported Guru Test slots with fresh Ready logic. No broker action, live OBS source or running Companion profile was changed. The earlier Guru Test authenticated API review is documented in the personal handover; exhaustive real SlotLock/restart/event-provider acceptance remains separate from these synthetic checks.

Host 1.2.2 gates `ui.packagedOverlay` service URLs in the legacy cross-origin registry projection. Package tests confirm the old aggregate receives no replacement Archipelago overlay URL while modern clients receive the stable service URL. Existing service overlay behavior is retained unless explicitly opted into this gate. Runtime/settings/cutover instructions are in the module README.

[Archipelago 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/archipelago-v1.0.0) and [host 1.2.2 preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.2-preview.1) passed their independent publication workflows. The host release includes hidden Archipelago UI acceptance. `test-github-archipelago.js` then used the packaged host's embedded runtime to install the real catalogue package plus its Dock dependency with hash verification, start the published runtime on an isolated test port, passively discover/select Guru Test slots, save the display and restart while preserving choices and automatic-start preference. The real broker was read only; no actual key or broker action was used. Test processes were stopped and temporary profiles removed. Initial discovery is asynchronous, so the acceptance check waits for it before asserting readiness.

## Host 1.2.1: icon and guided imports

The existing personal Companion PNG/ICO assets are carried over unchanged. The standalone payload explicitly includes both; the window uses the PNG and the Windows packager embeds the ICO. The packaged desktop test decodes the included PNG and confirms the executable's Windows icon differs from the default Electron executable.

The module import button now opens an instructional dialog offering Copy import code, Show import file and Cancel. It never invokes the `.sb` file association. Hidden packaged tests use synthetic export data and mocked clipboard/shell/dialog calls to verify exact copied content, file reveal, cancel without side effects, continued availability for Ready modules, and rejection of absent imports. No real clipboard contents or Streamer.bot actions are altered by the tests.

The full host/module checks and hidden desktop/browser acceptance passed locally with temporary profiles and isolated ports. Existing service lifecycle, updates, saved preferences, browser playback and routing checks remain passing. No module source or release is changed by this app-only update. A real user import remains a manual operation inside Streamer.bot.

[App 1.2.1 preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.1-preview.1) also passed the GitHub release workflow, including full checks, C# engine checks, Windows packaging and hidden packaged desktop/browser acceptance. The local verified build is available without replacing or launching the user's running preview. Installed data, live applications and clipboard contents were not altered by these checks.

## Browser foundation 1.2.0

The host now serves reviewed assets from installed package web roots and explicitly selected private media. Universal Dock 1.0.0 (including Tests), Universal Overlay 1.0.0 and Source Modules 1.0.0 are separate packages. Video 2.2.0 includes its own editor/renderer and requires all three. New modules start with no personal library or scene rules. Existing action IDs, globals, valid library sources, unknown routing rules and presentation settings are preserved.

Verified locally with temporary data and isolated loopback ports:

- Full existing check suite plus actual four-package dependency installation, top-level capability/identity validation, incompatible ranges/cycles, missing-dependency propagation and repair, missing imports, offline states and broken-manifest handling.
- Only declared web roots are served; imports/package metadata and unindexed media are excluded. Traversal, GET/HEAD, partial/suffix byte ranges, invalid ranges and methods were checked. Explicit copies store generated filenames without original absolute paths. Invalid selections cannot partially alter the index.
- Browser package upgrades preserve synthetic private files, media URLs and stored preferences. A package missing a declared page is rejected before replacement, leaving the previous version/data intact. Installation/verification invokes no Streamer.bot action.
- Actual Video and Source Modules C# source compiles in PowerShell's compiler against a synthetic CPH adapter. Tests execute Initialize/Configure/Play/Stop and routing Save: empty defaults, legacy/new media URLs, rejected remote URLs, preserved configuration, merged unknown routing rules, invalid-save atomicity, scene updates and stale-completion guards pass. This does not substitute for Streamer.bot's own compiler/import test.
- The built ASAR passed existing hidden desktop acceptance and a new hidden browser acceptance. A tiny synthetic WebM is generated locally and copied through the real media implementation. The test opens packaged Dock/Tests, registers and saves media, relinks an existing ID, checks cancelled/explicit tests, plays the real generated clip, verifies title/volume, duplicate-state handling, natural completion, scene routing and disconnect/reconnect. No live integrations or personal media are used. All spawned test processes/listeners are stopped and temporary profiles removed.

Unchecked/remaining: real Streamer.bot import and startup/OBS triggers, real OBS browser behavior/audio/codec support and production cutover. Existing action-name verification cannot establish installed action code/version; reimport exports explicitly. Shared WebSocket transport currently requires unauthenticated loopback access. Spotify's service controls remain its operational test surface: its older service does not enable cross-origin fetch responses for the new shared Tests page's localRequest buttons. Shared Tests checks the service's read-only health endpoint first and reports an unsupported/unavailable service before sending the requested command. A synthetic service verifies that local query/body/method handling works and that blocked cross-origin requests cannot send a mutating command. No real Spotify/OAuth/playback calls were made. This does not prove every legacy test registration works.

Full legacy retirement is not claimed. Original legacy video URLs retain their original host dependency until the operator explicitly copies/relinks them. Pokemon and other legacy feature renderers are not copied into Universal Overlay.

### Published browser-module proof

All four independent module publication workflows succeeded: [Universal Dock 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/universal-dock-v1.0.0), [Universal Overlay 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/universal-overlay-v1.0.0), [Source Modules 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/source-modules-v1.0.0), and [Video 2.2.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/video-v2.2.0). Spotify 2.0.1 and Update Probe 1.0.2 retained identical package bytes/hashes. Module source provenance points to the exact tested source commit.

The app-only 1.2.0 preview release passed Windows build, C# checks and hidden desktop/browser checks. Its release contains exactly the app ZIP and SHA256SUMS. The ZIP was downloaded and its checksum verified locally. `test-github-browser-foundation.js` then ran inside that released app's embedded runtime, fetched the real GitHub catalogue/assets, upgraded an isolated Video 2.1.1 to 2.2.0, installed its three dependencies, verified hashes and preserved a synthetic private marker and stored preference. It checked pending-import states, then synthetic verified-action states and actual served browser pages. No Streamer.bot action was invoked. Temporary profiles/listeners were removed.

The first app release attempt was correctly stopped when its desktop test began a second install before the first completed. The test now waits for completed-operation feedback and the released installation lock; rerun passed. An additional migration regression verifies that a Ready module still exposes its import button, allowing users to replace old action code with matching names. The app-only follow-up includes this button fix; module releases are unchanged.

The final compatibility guard normalizes required legacy UI arrays/ownership and omits packaged overlay URLs for cross-origin readers unless they explicitly opt in. The actual old overlay fetches this endpoint from its own origin and otherwise automatically embeds every extension, including the new aggregate. Tests now verify that the legacy projection cannot add those duplicate frames, while same-host and explicitly opted-in clients still receive them. This is an adapter in the generic host; no personal browser source/configuration was edited. Preview 3 includes this guard and the import-button fix without republishing modules.

[Final app preview 3](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.0-preview.3) passed its release workflow. Its published ZIP was downloaded, checksum-verified and used to repeat the real GitHub four-package upgrade test successfully. The final binary preserved synthetic private data/preferences, exposed the expected pending-import states and served installed pages after synthetic action verification. Temporary test data/listeners were removed; the downloaded portable app remains available locally without being launched against the user's profile. Real OBS/Streamer.bot cutover remains an explicit next step.


### Archipelago 1.0.1 presentation regression

Restores the legacy cyan summary strips, translucent box, bottom-left placement and colored fading event stack. All selected permitted slots share the same strips; timed card pagination is removed. Existing summary/event nodes survive polling, and the HTML canvas is transparent. Short failed local reads retain the frame for at most ten seconds. Pending SlotLock and broker outages show neutral waiting text without player identities; lock filters remain enabled and unchanged. Activity endpoint errors no longer suppress otherwise available progress/logic.

The full local check suite passed. Packaged hidden Electron acceptance verified legacy CSS/transparency, retained nodes/animation timelines, seven selected slots without rotation, brief failed reads, safe message text, pending locks and broker outage, plus room/slot controls. The isolated service regression also verifies activity-only failure/recovery. Tests use temporary profiles and ports, stop their processes and remove their data. Existing live settings and OBS sources were not edited.

Real OBS visual acceptance remains unchecked. Controller reporting SlotLock as loading still prevents filtered player details; this update does not claim to repair upstream readiness. The old monolithic overlay is not automatically bridged or replaced.

Archipelago 1.0.1 was published by the independent module workflow from source commit `3389063`. Real GitHub catalogue/package acceptance under the existing 1.2.2 packaged host passed: package/dependency hashes, isolated service start/restart, passive Guru Test room/slot discovery, saved selections and automatic-start preference. No broker actions, real credentials or live profile changes were used. Release: https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/archipelago-v1.0.1 .


### Archipelago 1.0.2 display controls and item preview

Adds per-room, per-slot percentage/logic visibility, optional hiding of logic for reported 100% check completion, and a BK visibility toggle. Existing selections and defaults remain compatible; missing per-slot settings enable both trackers. These are display controls, not Controller job cancellation. Percentage strips sort high to low with stable ties. The existing Player names setting is unchanged.

A separate synthetic incoming-item preview uses the real renderer and a replay button without reading rooms, changing the live overlay or invoking broker actions. It validates presentation only, not actual event delivery.

Full source checks and hidden packaged desktop acceptance passed. New coverage checks independent slot visibility, 100% versus goal-status semantics, BK versus glitched/go-mode/unavailable results, saved preferences across restart, percentage ordering, settings save and preview replay. All tests use temporary data and stop their services/processes. Live settings and OBS sources are untouched.

Archipelago 1.0.2 publication succeeded from source `031a2bb`. Released GitHub package acceptance passed under the unchanged packaged 1.2.2 host: verified catalogue/package/dependency hashes, isolated install/start/restart, passive room/slot discovery and saved selections/automatic-start. No real credentials, broker actions or live profile changes were used.


### Archipelago 1.0.3 live overlay test

Adds an explicit CSRF-protected live synthetic item test and clear button. The notification reaches the unchanged public OBS overlay URL, is labeled TEST ITEM with sample identities, expires after 15 seconds and is not persisted. It requires the saved overlay to be enabled. Test notifications bypass normal activity/SlotLock filtering only for the synthetic sample, preserving filters and room data. Separate preview remains available. No broker request, game item or action is sent.

Full source checks and hidden packaged desktop acceptance passed. Regressions verify CSRF rejection, no broker requests/config changes, clock-based expiry, clearing, no replay after restart, and settings-button delivery/removal in a second browser at the normal overlay URL. No user live test was triggered during verification.


### Archipelago 1.0.4 item notification formatting

Read-only broker inspection confirmed a protocol item event with numeric message text, no structured item/location, generic player roles and empty participant games. No real event contents or identifiers are recorded here. The broker handover in the personal repository now requests game-aware item/location resolution, explicit sender/receiver roles, unresolved-state semantics and cross-game fixtures. This upstream work remains outstanding.

Companion now composes typed colored segments from explicit sender/receiver and item/location names when supplied, and substitutes a readable details-unavailable message for numeric-only protocol item messages. It does not guess names or roles. The full isolated source check suite passed, including synthetic numeric-ID suppression and named cross-team notification assertions. Live sources/settings were unchanged and no item was sent. Existing synthetic live tests do not establish upstream real-event enrichment.


### Archipelago 1.0.5 operational activity filtering

Read-only updated OpenAPI inspection confirms structured item/location resolution and enrichment status, explicit sender/receiver roles, immutable retained events and brief pre-delivery enrichment. Bounded retained-event inspection still showed old-shaped events; this does not verify a fresh enriched real delivery or prove the updated producer failed. The save-restoration line was classified as item_send with no participants or item metadata. Companion now excludes save-file restoration text regardless of event type, plus unstructured unattributed item summaries. Resolved/partial enriched notifications and receiver-only cheat notifications have synthetic regression coverage. This is presentation filtering, not a claim that upstream event classification is fixed. No production action/item was triggered.


### Archipelago 1.0.6 Controller eligibility flags

Read-only live recheck on 2026-11-05 confirmed five retained item events with resolved item/location names and explicit sender/receiver roles. A bounded 50-event sample contained 35 operations records marked displayEligible false, including save-restoration records. No identities/content were logged and no event was triggered. Companion now suppresses audience operations or displayEligible false independently of event type, while preserving older API compatibility and legacy text guards. Regression fixtures cover each flag independently and eligible participant events.


### Pokemon Encounters 1.7.0 extraction

The module owns its core parser, runtime, settings, unchanged encounter renderer, editable bridge C# and clean two-action export. Package/UI/health identities remain pokemon-encounters/pokemon/pokemon, with loopback port 3128 and legacy /api/pokemon routes. Universal Dock is a dependency; Universal Overlay/Source Modules are optional for shared scene routing. The packaged-overlay flag prevents automatic duplicate embedding by the old monolith. No new app build is needed.

The user identified PokeAPI as the source of the 18 type and 27 ball icons. Every existing PNG matched byte-for-byte against PokeAPI/sprites commit 1b3b7c0a538dd2226ae08d0d2f8955125075bbd4 (small Sword/Shield type symbols and item sprites). reviewed-assets.json records pinned source URLs and SHA-256 hashes. Packages contain ASSET-PROVENANCE.json and the unchanged upstream licence, which identifies Pokemon Company image copyright separately from its CC0 repository terms. First-party code remains Sethani/MIT. The builder only permits reviewed, hash-matching PNGs; it does not broadly allow arbitrary binary assets. Release notes distinguish code licensing from third-party notices. This supersedes the earlier unresolved-provenance finding for this exact asset set.

Full source checks passed with deterministic eight-module builds, package asset/hash/notice checks, two-action import metadata/triggers, strict sender matching, aliases/gender/shiny/regional forms, disabled behavior, cached metadata/artwork, mystery encounters, one throw per viewer, test/clear endpoints, preserved synthetic config/cache across upgrade and isolated installed-service start/stop. Actual bridge C# compiled against the test CPH adapter. That check found and fixed a legacy JObject attachment-order bug that lost a newly added Pokemon routing rule. Fresh disabled routing and preservation of existing/unknown routing rules pass; no live bridge HTTP/chat call was made.

Packaged hidden Electron acceptance passed for the original transparent green card, type and ball asset decoding, synthetic cached artwork, settings, live test encounter/throw/clear and mystery rendering. Temporary profiles, ports and spawned processes were cleaned. No legacy settings, installed applications, OBS sources or real Streamer.bot configuration were changed. Startup defaults stay disabled; no viewer/throw history is persisted or migrated. Module data and automatic-start preferences are preserved by the existing host during upgrades; cross-profile legacy migration remains explicit.

Remaining acceptance: real Streamer.bot import/compiler/Twitch forwarding and controlled OBS cutover. The synthetic CPH compiler is not a claim of real Streamer.bot import acceptance. No real PCG catch/chat action or Pokemon network lookup was executed by tests.

Pokemon Encounters 1.7.0 publication succeeded from source def9bf0. The actual GitHub package passed acceptance inside the unchanged packaged 1.2.2 host: catalogue/package/dependency hashes, all asset hashes/notices, initial missing-import and synthetic Ready states, isolated service start/restart, mystery encounter/throw/served pages, saved settings/automatic-start and the legacy duplicate-overlay guard. No live Streamer.bot/OBS/profile was used, and no external Pokemon lookup occurred. Release: https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/pokemon-encounters-v1.7.0 .


### Archipelago 1.0.7 combined-overlay bridge

Read-only OBS configuration inspection established that the existing combined source still uses the personal legacy shell on port 7474. A targeted private bridge now embeds only the packaged Archipelago overlay on 3141. The old Archipelago renderer is suppressed explicitly; other personal features stay with their current owner and the full public aggregate is not nested. Scene rules and modules URL exclusions apply to the frame. Health polling preserves frame identity, hides it while offline and restores it after recovery. No automatic fallback to old Archipelago room data occurs.

The module adds HTTP-loopback CORS for public GET /health and /api/public/state only. Regressions verify allowed loopback reads, rejected remote-origin access and unchanged private settings restrictions. Full source checks passed. A hidden acceptance in the personal repository exercised the actual combined source page with synthetic monolith state and the actual modern module renderer: one visible stable frame, real progress inside it, old renderer hidden, scene/URL filtering, service outage/recovery and no duplicates/fallback. All test traffic used isolated ports and synthetic fixtures; no live OBS refresh, source switch, Controller action or settings change occurred. Public module source remains independent of the personal monolith.

Archipelago 1.0.7 publication succeeded from ea6316f. The released catalogue/package SHA-256, installed runtime version and allowed combined-overlay health response were verified using a downloaded package in a temporary synthetic fixture. Read-only GETs also confirmed the existing server on 7474 serves the updated combined HTML and bridge file. OBS was not refreshed and no browser-source URL was changed; user activation requires module update/service start and a source refresh.


### Pokemon integrated into the existing combined OBS source

The private targeted overlay bridge is now shared by Archipelago and Pokemon. The existing combined browser-source URL embeds the modern Pokemon renderer and suppresses both its old Pokemon implementation and generic-extension duplicate path. Each feature retains independent health/scene/module routing and a stable frame. No public module/app update is needed; Pokemon 1.7.0 already provides the required public health read. Standalone pages remain internal/diagnostic renderer surfaces; the intended user flow is one combined OBS source.

Hidden acceptance uses the actual legacy shell, both actual modern renderers and isolated synthetic services. It verifies Pokemon encounter display, original ball artwork/animation and viewer label, animation completion, Clear, independent routing, stable frames, module URL exclusion, outage/recovery and no legacy fallback. A strict network guard rejects all non-fixture requests, preventing accidental live integration or external access. Production encounters, private settings and OBS source URLs were not modified. Activation requires refreshing the existing combined source and hiding a redundant separate Pokemon source if present.


### Controller 1.1.0 extraction and combined overlay

Controller Input is now an independent installed Node service that owns its hidden PowerShell/XInput provider, settings and the original local CSS drawing. It preserves package/service ID controller-input, UI/routing key controller, port 3126 and read-only /state compatibility. Native button mapping, trigger thresholds, axis dead zones and stick directions are taken from the existing first-party bridge. No external skins/drivers/Streamer.bot imports are bundled. The builder now admits first-party PowerShell source files alongside existing service source types.

Layout defaults preserve the inspected legacy position/size: X 1420, Y 850, width 260, height 190, scale 1. New installations start disabled. Settings import only layout fields from an explicitly chosen legacy JSON; other widget URLs/data are excluded. Existing module data and automatic-start preferences remain owned by the host. The module adds selected-controller controls and an explicit ten-second live simulation/clear which never sends OS/game/chat input. Tests and inputs are not persisted. Stale snapshots clear button/axis state.

Full source checks passed with deterministic nine-module builds. Package tests cover input/config normalization, CSRF boundaries, loopback read-only CORS, legacy state shape, live simulation/expiry and selected index, private layout preservation across synthetic upgrade, and real native helper startup. Forced installed-service stop was verified to leave no running native helper. PowerShell monitors its parent process, and normal stop explicitly terminates it; Windows forced termination may leave a stale private PID marker, which is replaced next start. The cleanup assertion checks the actual process rather than assuming finally always runs.

The packaged hidden desktop suite passed the actual controller renderer/settings: original transparent CSS design, default layout, selected inputs/buttons/sticks, live simulation/clear and stale-state clearing. A separate guarded hidden test exercised the real personal combined source with Archipelago, Pokemon and Controller renderers simultaneously. It verified one stable frame per feature, old Controller renderer suppression, no legacy native-input polling, live controller simulation/clear, and existing scene/module filtering/outage behavior. Fixtures use isolated ports/profiles, reject non-fixture network traffic and clean up their processes/data. Live OBS, controller input settings, games and installed service ownership were not changed.

No new OBS source is required: install/start Controller, enable/save display and refresh the existing combined source. If port 3126 has an old built-in owner, stop only that Controller Input service first. Real physical-button response and user OBS placement remain final acceptance; synthetic tests and read-only native sampling do not replace that check.

Controller 1.1.0 publication succeeded from 3fee82b. The released GitHub package passed inside the unchanged packaged 1.2.2 app: catalogue/package/dependency hashes, no-import Ready, real native helper start/restart/cleanup, explicit synthetic test on the selected index, layout/automatic-start retention and legacy duplicate-overlay guard. All data/ports were isolated and cleaned. Final read-only checks found no listeners on the live combined-overlay/Companion ports 7474/3135 (or controller 3126); live on-stream acceptance therefore remains unperformed. Start the usual streaming/Companion setup before refreshing the combined source.


### Archipelago 1.0.8 immediate visibility and transparency

Adds a prominent immediate Enable/Disable overlay button at the top of Settings. A CSRF-protected local-only write persists only the global enabled preference, does not poll Controller, retains room/profile selections and unsaved form edits, and clears synthetic test state when disabled. Disabled renderers hide waiting messages as well as player/activity content. Source Modules scene rules remain independent and are explained in the UI. The existing save-form checkbox remains compatible.

The renderer is separated from the settings stylesheet (including its dark color scheme); canvas and panel background are transparent, with no outer panel shadow/blur. Hidden browser acceptance verifies actual captured scene pixels through a real iframe over a colored background, both outside the panel and in its padding. It also verifies disabling while Controller is unavailable, zero new broker calls, retained profiles/unsaved edits and hidden waiting output. Service regression confirms switch persistence across restart and cleared synthetic test state. Full source/package checks passed. The guarded actual combined-page acceptance also passes with Archipelago/Pokemon/Controller using isolated data and ports. No production preferences, Source Modules rules or OBS sources were changed.

Archipelago 1.0.8 publication succeeded from a22c1af. Downloaded release acceptance verified catalogue/package SHA-256, immediate disable with the synthetic Controller unavailable, zero broker requests from the switch, retained profiles, persistence across restart and absence of the dark settings stylesheet from the renderer. No real Controller/OBS/settings action was performed.


### Remaining-feature audit and Countdown 1.1.0

legacy-migration-status.md inventories the remaining declarations separately from verified source boundaries. Countdown's timer engine already owns portable.countdown.config/state; its old dock also invokes legacy stream launch/Spotify routes. Reminders requires Chat - All Platforms and private-backlog checks; named timers modify shared Timer_* actions/queues and scan timer_end_* globals. Those are explicitly deferred boundaries, not silently treated as portable. The old server remains required. Current project README/migration and notices were corrected where they still described already-published Pokemon/Controller as excluded.

Countdown 1.1.0 packages editable C#, eight clean actions and owned dock/renderer assets. Six original action IDs and both global keys are preserved; Configure/Health are added. Initialization preserves active timers/configuration and enriches the envelope with saved preset data. No live state, commands, queues, stream-start trigger, chat action, personal presets or credentials are exported. The startup trigger only initializes state. The original transparent centered gradient text and multiline finish are preserved, using system font preferences without redistributing a font. No Node child service is introduced.

Actual Countdown C# compiled against the synthetic CPH adapter and passed initialize/active-state/config preservation, preset without restart, start/pause/resume/clear/zero-duration finish and invalid-input atomicity. Package checks passed contained action references, startup trigger, no monolith/chat/launch dependency, no service, pending import/Ready states and renderer registration. Hidden browser tests under the existing packaged host passed load-saved-state, preset/start/pause/resume/clear and the original renderer. No timer starts on page load; all fixture action calls are limited to Countdown. Full source checks pass with ten deterministic module packages.

The private combined bridge now supports targeted static modules discovered through explicit public-registry opt-in. Countdown claims rendering only after its exact module/URL is Ready; the old drawing remains available before installation and is suppressed after cutover without fallback on disconnection/missing actions. Guarded acceptance passed the actual legacy shell with Archipelago/Pokemon/Controller/Countdown simultaneously, including timer state, pause/clear and missing-action recovery. All tests used synthetic globals/Streamer.bot and isolated services; no live timer, stream, chat, OBS or Spotify operation was invoked. Existing launch code already forwards Countdown - Start while retaining a separate Node Spotify-fade clock, which remains a retirement blocker.

Real Streamer.bot import/physical OBS acceptance remains a user step. Use the new module's manual timer controls after cutover; keep the existing launch tools until their own module is tested.

Countdown 1.1.0 publication succeeded from aff3de7. Released-package acceptance passed inside the unchanged 1.2.2 app: real GitHub catalogue/package/dependency hashes, initial import-required and synthetic Ready states, zero child services, served dock/renderer and targeted cross-origin combined-overlay discovery while generic legacy discovery remains guarded. No live timer/stream/OBS/chat action was invoked.

### Chat Routing 1.0.0

An independent four-action package preserves both existing public entry-point identities and caller arguments. The contained engine validates resolved/nonempty messages and available targets, normalizes missing reply IDs to plain sends, and delegates to native Twitch message/reply subactions. Native useBot/fallback preferences are preserved. No command, timer, startup trigger, service, account secret, personal message or automatic send is bundled. The compatibility name All Platforms currently selects the Twitch adapter only; unsupported targets are rejected without logging message contents.

The actual C# compiles and passes against a recording FakeCPH sink: plain/reply/missing-ID behavior, empty/unresolved input and unsupported targets. Package tests decode the generated export and verify stable entry-point IDs, contained action references, native bot/reply preferences, embedded editable engine and no automatic execution. Full existing source checks pass with eleven deterministic packages. All service checks use temporary data and isolated ports, and clean up their spawned children. Production actions/accounts and chat were not changed. Controlled live account/reply acceptance remains unperformed.

The incoming live chatbox remains a separate migration. The legacy Chat Core currently publishes messages through its SQLite archive path, so that path cannot simply be removed without replacing live publication. The existing renderer is based on Izzy's MIT stream-chat with local enrichment changes; preserving its design/query options and resolving the bundled PluralMind provenance are prerequisites for a standalone live-only package. No archive data was exported or modified.

Chat Routing 1.0.0 publication succeeded from c1ab58d (distribution workflow 42000505296). The released package passed inside the unchanged packaged 1.2.2 app: actual GitHub catalogue/package hash installation, import-required/Ready/missing-adapter states, no child service and no outgoing action invocation. The fixture accepted only GetActions requests and removed its temporary data/listeners on completion. No app rebuild is needed for this module.

PluralMind provenance is resolved for the forthcoming live-chat extraction: the existing chat-archive/pluralmind.cjs matches official npm pluralmind 2.1.1 package/dist/index.cjs after CRLF normalization. Upstream SHA-256 is 82d30bffcc2ea2e2c2d4bab3372ee3fd9e9a503b94d58d2fb89c9fbcae274a7b. The official tarball includes MIT License, Copyright (c) 2026 leahinmoonlight; its notice must accompany redistribution. Source: https://registry.npmjs.org/pluralmind/-/pluralmind-2.1.1.tgz and https://github.com/leahinmoonlight/pluralmind . The renderer's upstream Izzy MIT notice must also be retained. These findings do not constitute implementation/acceptance of the new live-only service; the archive and existing chatbox remain untouched.

### Chat Routing 1.0.1 import-format correction

The operator reported that Streamer.bot did not recognize the 1.0.0 import and action verification remained incomplete. The export omitted the top-level Streamer.bot format metadata (version 24, exportedFrom, minimumVersion) and empty websocketServers/websocketClients collections present in the working exports. Prior tests checked decoding/content but did not check that envelope; their successful result did not establish Streamer.bot import acceptance.

Version 1.0.1 restores the same envelope as the existing working modules without changing action IDs or routing behavior. The builder now rejects missing format metadata/collections for every generated export. A regression reproduces the malformed shape in memory and verifies rejection; all built imports are checked for the required envelope. Full source checks and actual C# recording-sink tests pass. No production chat action, import, account or setting was changed. Actual Streamer.bot UI acceptance must still be confirmed after installing/importing the corrected package.

Chat Routing 1.0.1 publication succeeded from 559f1de (workflow 42001505202). Downloaded-release acceptance passed in the unchanged packaged host with temporary data and synthetic Streamer.bot: catalogue/hash installation and required-action states, with no sends. This checks package installation and action inventory, not the actual Streamer.bot import UI. Update to 1.0.1, copy the new import code, review/import the four actions, then refresh Companion.
