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
