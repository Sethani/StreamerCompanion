# MVP usability polish — plan and checkpoint checklist

Agreed November 15, 2026. This document is the working plan for the polish phase after the required modern switchover. Update it at every bounded checkpoint so another session can continue without reconstructing the conversation.

## Resume here

**Shutdown interruption resolved in live regression:** Private native startup launcher now explicitly prevents child handle inheritance. Normal shutdown with HTTP enabled and Companion/OBS still running exited within20seconds and released both native ports. Reopened native API answers, all29 modules Ready, original HTTP/WebSocket/Widgets preferences restored. No public app/module release needed. See the latest November18 checkpoint; extended everyday operator verification remains useful.

**Current phase:** Publication complete November20: Companion v1.4.1-preview.1 and all29 independent module releases published from merged source f6e80c64d5354ccbebfa53aa1e7270a365865514. Main Windows/Linux CI and app release acceptance passed; all actual downloads/checksums and final catalogue entries verified. See polish-release-candidate.md. Production adoption was not performed; the running local previews and settings remain unchanged.

**Active publication checkpoint:** Operator accepted corrected BRB playback/return test and explicitly authorized publishing all accumulated changes November21. Preparing source review/CI and independent Shoutout Clips2.2.1, Video2.5.0, Self Clips1.0.1 and BRB Rotation1.0.1 releases. Companion host remains1.4.1; no new app build needed. See clip-rotation-release.md for scope, native imports/timer setup, evidence and limitations. Preserve the running setup and native launcher; publication itself requires no restart.

**Official adoption complete November20:** Operator requested the cutover and confirmed OBS and all views closed. Published app installed at the existing Streamer.bot launch path using the same profile; Dock1.1.4 adopted, other28 modules already matched official bytes. Full stopped-profile/app and consistent Archive backups retained. All29 modules Ready, all29 official payloads verified,146 protected settings/media files and243 Archive messages preserved, phone pairing/TLS/cards and native actions/startup retained. OBS reopened with16 browser sources unchanged and one active Widgets owner; streaming/recording stopped. Backlog prioritization remains undecided.

**Current walkthrough checkpoint:** Head a366b73a83edbd06780279c0b48925561d21d8a3 passed Windows/Linux CI. November20 clean-profile packaged setup passed with actual candidate packages and simulated catalogue/native transport. Operator then confirmed all requested OBS Custom Browser Docks and Browser Source property labels. This acceptance does not claim live Twitch redemptions, actual fresh-profile native imports or real playback tests; the scoped automated/native/operator evidence remains distinguished.

**Last completed work:** Published and download-verified the app and all29 module releases from approved merged source. Release workflow and final catalogue checks passed. No production app/module replacement, restart or native import was performed during publication.

**Source provenance:** reviewed implementation88d7eae3028e30f5fe86c8e42599ab0ad620db7d plus documentation checkpoints were merged through PR #1. All releases use full CI-passed merge SHA f6e80c64d5354ccbebfa53aa1e7270a365865514. Published app ZIP SHA256 ec0aff841953cedff02fe32f62a1962c3f15fa6cc532ec419c7dbba1f4f0905f; published ASAR c85a1216d5236e494fd5122ab8e4d2ece2da812fa3c943b76a2f05dff1a261fd. Local preview ASAR b6f4ccaf092ed67350b6e957ba5d9d9cf8cdc201fe451eea68241e24552b13f9 remains installed; all25 published host source files match approved source after line-ending normalization. No production replacement performed.

**Known limitations:** native restart was separate environment recovery, not a guide-update requirement. Normal startup normalized missing optional pool IDs to empty strings; no saved assignment values changed. Widgets was paused only while stopped and then recovered through its scoped API. A manual walkthrough of every Streamer.bot/OBS menu is not claimed complete by the browser/source checks.

Before continuing:

- [x] Read this section and the latest checkpoint entry at the bottom.
- [x] Inspect the public worktree and existing changes before editing; preserve unrelated work.
- [x] Confirm which pass/subtask is active and choose one bounded implementation session.
- [x] Use disposable profiles and isolated ports for automated mutations.
- [x] Update this section, checkboxes and checkpoint log before stopping.

At each checkpoint, record exact source commits, artifacts, checks, incomplete work and whether anything was installed in production. A local build, published release and installed release are different states. Do not mark an entire pass complete from partial tests.

## Goal and locked decisions

Normal users should be able to understand, configure and operate each module without knowing the original personal setup or reading engineering handovers.

- [x] Inventory all 28 current source packages and their documentation entry points.
- [x] Use **focused display-name changes**, preserving familiar names elsewhere.
- [x] Add a searchable **Help tab in Companion** and a **Help view in Universal Dock**.
- [x] Separate developer tools/material from normal setup; Developer tools defaults off.
- [x] Agreed scope: build a **full visual Live Chatbox editor**, with independent normal/ticker configurations, previews and copyable OBS URLs. Implemented and source/browser verified in Pass 4; operator review pending.
- [x] Make command filtering **independent between each live chatbox and Chat Archive**.
- [x] Preserve existing archive commands and hide them from normal results/exports when exclusion is enabled; do not delete them.
- [x] Audit optional-module metadata and make optional integrations understandable, particularly for Phone Deck.
- [x] Add a dedicated Sound Player extraction before final guide review: reusable sound playback, with Walk Ons delegating to optional sound/video owners.

Preserve package IDs, action names/IDs, native argument contracts, saved configuration, phone cards, favorites and existing OBS URLs/sources. A display-name change is not an action rename or data migration. Do not restore public legacy-settings import buttons.

## Pass 1 — Help foundation and integration presentation

### Built-in documentation

- [x] Replace the current desktop Documentation action's `shell.openPath` behaviour with built-in Help navigation.
- [x] Add a searchable Help tab containing installed module guides and shared first-run guidance.
- [x] Add Controls / Help views to Universal Dock; preserve the selected controls iframe and its state while reading Help.
- [x] Provide readable headings, contents navigation, code-block copy buttons, internal links and back navigation.
- [x] Read packaged documentation even when its module service is stopped or Streamer.bot is disconnected.
- [x] Implement a shared guide resolver for desktop IPC and narrowly scoped, read-only loopback HTTP help routes.
- [x] Restrict reading to packaged user guides. Reject arbitrary paths, traversal and symlink escapes; never expose module data, credentials or native exports as documentation.
- [x] Render sanitized Markdown without executable HTML/scripts, unsafe links or automatically fetched remote content.
- [x] Handle missing/uninstalled guide targets clearly; do not install/start modules from documentation navigation.

Historical implementation anchors before Pass 1: `companion/src/desktop.js` opened documents through the OS; `module-registry.js` resolves the manifest's documentation file; the renderer provides the Documentation button. Preserve the current manifest documentation entry point where possible. Extend packaging only for explicitly allowed user-guide assets; do not publish developer notes accidentally.

### User versus developer material

- [x] Add a local Developer tools preference, off by default.
- [x] Keep Update Probe, engineering documentation and developer diagnostics behind that preference.
- [x] Preserve useful connection checks, safe previews and normal user-facing module tests.
- [x] Ensure changing this preference performs no service action, installation, uninstallation or module dispatch.
- [x] Move migration/compiler/publication/internal-preservation material outside the default user Help index. All 28 guides reviewed; 26 engineering appendices are declared separately. See `docs/pass1-guide-separation-review.md`.
- [x] Keep user-relevant limitations, third-party notices, troubleshooting and ordinary backup advice accessible.

### Required modules and optional integrations

Audit findings as of November 15:

- `dependencies.optionalModules` is validated and displayed as raw JSON, but does not drive automatic installation or Phone Deck discovery.
- Eleven manifests have nonempty optional-module maps.
- Phone Deck has an empty optional-module map while supporting 23 external module contributors. Its discovery uses providers' `ui.phoneDeck` declarations.
- `ui.optionalDependencies` mixes module IDs with external services/accounts.
- Source inventory has 28 packages, 24 Phone Deck contributors including Phone Deck itself, and four explicit non-provider exclusions.

Implementation checklist:

- [x] Replace raw dependency JSON with readable Required modules, Optional integrations and External setup sections.
- [x] Resolve IDs to user-facing names and distinguish installed, compatible and currently available states.
- [x] Keep absent/stopped optional integrations nonblocking and separate from required installation problems.
- [x] Derive Phone Deck integrations from contribution declarations rather than maintaining a second exhaustive dependency list.
- [x] Generate backward-compatible catalogue integration summaries so users can discover integrations before installing providers.
- [x] Support older catalogue entries without summaries; do not claim an unknown integration is verified.
- [x] Preserve legacy metadata for compatibility without treating accounts/external services as installable modules.
- [x] Ensure discovery never installs modules, starts services, creates cards or dispatches actions.

### Pass 1 acceptance

- [x] Test Help with offline/stopped modules, missing guides, cross-links and malicious Markdown/paths.
- [x] Test keyboard navigation, focus, search, back navigation and readable layouts at the minimum desktop size and narrow dock widths.
- [x] Verify selected module, iframe, drafts and scrolling survive Help navigation and refresh.
- [x] Test optional integrations absent, incompatible, stopped and unconfigured, including basic Phone Deck OBS operation without providers.
- [x] Check existing catalogue/install/import/lifecycle regressions relevant to host changes.
- [x] Record a tested checkpoint and update Resume here before proceeding to Pass 2.

## Pass 2 — Reusable Sound Player and Walk Ons handoff

This is an explicit feature-boundary change, separate from documentation/label polish. Complete it before the final Sound Player, Walk Ons and Video Player guides so those guides describe the settled setup. Pass 1 is now source-tested; start this pass with the ownership/import-contract audit. Split this pass into audit/contract, isolated implementation and backed-up adoption checkpoints; do not attempt an unreviewed live handoff as part of a wording change.

Confirmed baseline: Walk Ons 2.1.2 currently includes four Walk-on Sound actions, audio media ownership and its sound renderer. Its manifest already lists Video as **optional**. The user was describing the relationship conversationally, not reporting an incorrectly required dependency. Do not add a dependency-bug investigation for that remark.

Source checkmarks below describe the tested candidate. Production migration and human listening acceptance remain separate unchecked gates.

### Ownership and independent controls

- [x] Trace existing audio actions, renderer, request acknowledgements, media registration/URLs, assignments, weights, volume, reset paths and Phone Deck controls before choosing the extraction details.
- [x] Create a reusable **Sound Player** package (intended ID `sound-player`) with sound upload/selection, volume, reusable weighted sound pools, Play/Stop controls and playback status.
- [x] Expose declared Streamer.bot actions for user-created commands, chat-message rules, raids, redeems, subscriptions and other triggers. Do not create or enable personal triggers automatically.
- [x] Add an optional Phone Deck contribution for sound selection, Play/Stop and status; never add cards automatically.
- [x] Keep sound playback usable independently of Walk Ons and Video Player, without another aggregate OBS source.
- [x] Keep Walk Ons responsible for viewer assignments, entrance selection, once-per-stream eligibility, Test and session reset; delegate actual audio/video playback to the corresponding owner.
- [x] Define the weighted-selection boundary explicitly so existing probabilities are preserved and delegation does not randomly select twice.
- [x] Keep Sound Player and Video Player optional for Walk Ons. Sound-only entrances must not require Video Player; video-only entrances must not require Sound Player.
- [x] Report a missing/unavailable selected playback owner against the affected entrance/control, rather than claiming all optional integrations are required.
- [x] Define and document busy/queue/rejection behaviour from the existing playback implementation; preserve current Walk Ons behaviour during extraction rather than inventing a new playback policy.
- [x] Retain matching durable playback acceptance. Record normal Walk Ons eligibility only after its playback request is accepted; rejected/busy playback remains eligible, and Test never consumes eligibility.

### Compatibility and guarded adoption

- [ ] Preserve private media, sound assignments/pool weights, volume, current video assignments, reset behaviour and once-per-stream state. Do not reset the ledger merely by refreshing controls, importing or updating.
- [x] Inventory callers of all existing sound action IDs/names and media references. Preserve them through explicit compatibility entry points where needed, with exactly one playback owner.
- [x] Define action/import ownership before publishing: transferring existing IDs between packages must not create competing copies or make one package's later import overwrite the other owner.
- [x] Use a backed-up private data/media handoff; add no public legacy Import settings button and bundle no personal sounds.
- [x] Preserve existing overlay scene rules and phone cards through an explicit compatibility/migration mapping. Do not silently replay saved requests during migration or reconnect.
- [x] Record the independent sound and updated Walk Ons package versions, dependency minimums, required native imports and rollback before adopting.
- [x] Announce any necessary off-stream Streamer.bot import/restart. Keep the existing production Walk Ons working until the replacement is verified and the handoff is backed up.

### Pass 2 acceptance

- [ ] Test standalone Sound Player without Walk Ons/Video, and Walk Ons with sound-only, video-only, both owners and neither owner installed.
- [x] Regress actual separate parent/child argument dictionaries, matching/mismatched acknowledgements, immediate completion, failed persistence, concurrent requests, busy/rejected playback and reconnect without replay.
- [x] Regress first entrance, repeated chat silence, explicit/startup/going-live reset semantics, Test, weighted pools and volume.
- [ ] Verify existing media/assignments/weights/scene rules/phone cards survive upgrade and rollback, with no duplicate audio/renderers or competing owner.
- [x] Exercise custom-trigger recipes using synthetic events and disposable profiles; do not send real chat, raids, redeems or production sound as build tests.
- [x] Update optional-integration discovery/coverage tests and the module inventory for the new package.
- [x] Record a tested checkpoint and update Resume here before proceeding to Pass 3.

## Pass 3 — Module wording and practical guides

### Category review

- [x] Review all module categories together so the groupings are useful, consistently named and easy to browse in Companion and Universal Dock.
- [x] Review the new **Media** category introduced by Sound Player. Consider placing **Video Player** alongside it; check related playback modules before settling the grouping.
- [x] Record the agreed module-to-category mapping before applying changes. Update manifest/UI metadata and guide wording together, preserving package/action IDs, favorites, phone cards and saved configuration.
- [x] Verify category filters, navigation and module discovery after the changes, including Phone Deck's provider groupings where those use module categories. Keep the user's Phone Deck pages/layout unchanged.

The approved grouping and installed patch versions are recorded in [module-category-review.md](module-category-review.md). Source and local preview are updated; no release was published.

Every module's packaged README should lead with:

1. What it does.
2. What you need.
3. How to configure — numbered steps from a fresh installation.
4. How to use.
5. Connect commands, redeems or other triggers, where supported.
6. Optional integrations.
7. Troubleshooting.

Explicitly state when no native import, overlay or custom trigger is needed. Distinguish included actions from user-created automation. Move engineering history into contributor documentation instead of deleting it or making it the first thing a user reads.

The table records the 29 current packages, and their intended display names and guide coverage. **Copy** means manifest/UI names and descriptions agree and use human language. **Guide** means the configuration guide is complete. **Verified** means its instructions have been checked against code and a fresh/disposable setup where applicable, not merely proofread.

| Intended display name | Purpose and configuration coverage | Copy | Guide | Verified |
| --- | --- | :---: | :---: | :---: |
| Archipelago | Controller connection, room/slots, progress/activity, filters and scene visibility | [x] | [x] | [x] |
| Audio Routing | OBS live/VOD classifications, Save versus Apply and game-audio toggle | [x] | [x] | [x] |
| Bouncing Avatar | Image upload, motion, optional colour changes and selected scenes | [x] | [x] | [x] |
| Cameras | OBS source mappings, camera modes and optional guest assignment | [x] | [x] | [x] |
| Chat Archive | Capture, retention, moderation, command filtering, search and exports | [x] | [x] | [x] |
| Live Chatbox | Twitch/YouTube connection, appearance, normal/ticker setup and OBS URLs | [x] | [x] | [x] |
| Bot Chat Routing | Bot account setup and calling the supplied send/reply actions | [x] | [x] | [x] |
| Controller Display | Controller selection, placement, testing and visibility | [x] | [x] | [x] |
| Countdown | Start/pause/resume/clear, presentation and optional Stream Launch integration | [x] | [x] | [x] |
| Embedded Widgets | External widget URLs, layout, scene rules and recovery | [x] | [x] | [x] |
| Local AI | Ollama model/connection setup, supported integrations and fallback text | [x] | [x] | [x] |
| Named Timers | Labelled timers, commands and optional queued language/redemption routing | [x] | [x] | [x] |
| Phone Deck | OBS connection, LAN/HTTPS/pairing, editing, optional controls and confirmations | [x] | [x] | [x] |
| Pokemon Encounters | Pokémon Community Game prerequisites, events, encounters/throws and visibility | [x] | [x] | [x] |
| Reactive Guests | Provider URLs, guest order/visibility and optional Cameras integration | [x] | [x] | [x] |
| Redeem Checklist | Reward/action wiring, pending requests, complete/refund and timer integration | [x] | [x] | [x] |
| Reminders | Dock/chat reminder management; explicitly no audience overlay | [x] | [x] | [x] |
| Scene Links | Scene/category/window bindings, separate tests and automatic scene handling | [x] | [x] | [x] |
| Shoutout Clips | Clip player setup versus separate shoutout command/caller wiring | [x] | [x] | [x] |
| Overlay Visibility | Hidden, All scenes and Selected scenes for each overlay | [x] | [x] | [x] |
| Sound Player | Sound uploads/pools, volume, Play/Stop, custom triggers, optional Phone Deck and Walk Ons integration | [x] | [x] | [x] |
| Spotify Music | Credentials, device/playlist, playback and optional startup/countdown automation | [x] | [x] | [x] |
| Stream Launch | Guided launch, scene/countdown, optional music/follow-up and raw OBS Start distinction | [x] | [x] | [x] |
| Universal Dock | Adding an OBS Custom Browser Dock, module selection and Help | [x] | [x] | [x] |
| Universal Overlay | One combined browser source, URL/dimensions and scene visibility | [x] | [x] | [x] |
| Video Player | Media setup, presentation and custom Streamer.bot triggers | [x] | [x] | [x] |
| Walk Ons | Viewer assignments, optional Sound/Video Player integration, tests and once-per-stream resets | [x] | [x] | [x] |
| Wheel | Profiles/weights, command/reward/subscription recipes and verified immediate native caller result propagation | [x] | [x] | [x] |
| Update Probe — developer only | Installation/update test utility; excluded from normal setup | [x] | [x] | [x] |

Additional Pass 3 tasks:

- [x] Write shared first-run instructions for Companion, Streamer.bot connection/imports, Universal Dock and Universal Overlay.
- [x] Update descriptions to explain benefits rather than migration history; retain privacy/function distinctions where useful.
- [x] Propagate focused display renames through module/UI metadata, guides and generated catalogue entries while retaining stable IDs and action names.
- [x] Verify Streamer.bot menu instructions against the installed 1.0.7 interface and applicable official documentation. Operator confirmed command/reward/subscription paths November20; subscription menu screenshot recorded in the checkpoint below. No real triggers fired.
- [x] Document Wheel's supplied Trigger Adapter/profile/three trigger recipes and where its selected result is recorded; record the separate immediate native caller-result propagation proof (November17).
- [x] Provide source/official-documentation-checked command/reward/subscription recipes and equivalent supported module callers; human menu/native caller boundary checks remain separate.
- [x] Do not create, enable or fire real commands/rewards/subscriptions as documentation tests.
- [x] Verify documentation links and packaging; review complete public files for private content before publication. November20 bounded source/content/decoded-export audit and exact-package review passed; see polish-release-candidate.md. Recheck any later changes before publishing.
- [x] Record a tested checkpoint and update Resume here before proceeding to Pass4 (subsequently completed and operator accepted).

## Pass 4 — Live Chatbox editor and command filters

### Full visual setup and URL builder

- [x] Organize settings into Connection, Chatboxes and Checks, with collapsible appearance groups.
- [x] Bring supported appearance options from the existing generator into the module; preserve renderer design and third-party notices.
- [x] Cover normal/horizontal ticker layout, fonts/sizes, colours/transparency, bubbles/borders, badges/timestamps, highlights/announcements, fading/message limits, hidden accounts and commands.
- [x] Include platform and enrichment display options supported by the renderer.
- [x] Support separately saved normal/ticker configurations, editable names and copyable OBS URLs.
- [x] Generate self-contained URLs using supported query options. Editing/deleting a saved configuration must not silently alter a previously copied URL.
- [x] Preserve all existing URLs and global appearance defaults. Provide an explicit Edit an existing URL path without rewriting OBS sources.
- [x] Exclude obsolete direct-connection, CDN, update-check and development options from the appearance editor.
- [x] Build an isolated synthetic preview that never broadcasts to connected OBS renderers, writes archive records or sends chat.
- [x] Preserve drafts, focus, active configuration and polling stability; use conflict protection for newly shared saved configuration data.

### Independent command filtering

- [x] Add Hide commands independently to each Live Chatbox configuration/URL.
- [x] Add Exclude commands independently to Chat Archive.
- [x] Default the new switches off when absent so upgrades retain existing behaviour.
- [x] Provide an editable prefix, default `!`; compare against the original message after leading whitespace, without regex.
- [x] Preserve existing explicit `cmdprefix` URLs and expose their meaning in the editor.
- [x] Ensure PluralMind/enrichment updates cannot accidentally change command classification or reveal a filtered command.
- [x] Do not filter the shared event feed: one chatbox's display setting must not affect another chatbox or archive capture.
- [x] When archive exclusion is enabled, skip new matching messages and hide matching existing records from normal search, pagination totals and exports.
- [x] Preserve existing matching records; turning exclusion off reveals them again. Do not add automatic historical deletion.
- [x] Explain that messages skipped during capture exclusion cannot be recovered later.
- [x] Preserve moderation, deduplication, retention, restart and late-enrichment protections.

### Pass 4 acceptance

- [x] Test existing normal/ticker URLs unchanged and generator round-trips of supported options.
- [x] Test two independent appearances and saved configuration edits/deletion without source changes.
- [x] Test isolated previews against active synthetic renderer/archive clients: no effects escape the preview.
- [x] Test `!commands`, leading whitespace, custom prefixes, ordinary messages containing `!`, enriched messages and synthetic events.
- [x] Test independently hidden/shown commands across two chatboxes and the archive.
- [x] Test archive capture versus stored-history filtering, pagination/counts, both exports, prefix changes, restart and retention.
- [x] Run relevant existing chat/service/package/browser regressions with temporary data and isolated ports.
- [x] Record a tested checkpoint and update Resume here before proceeding to Pass 5.

- [x] Read the original HTML/JavaScript generator and rework control types, optional overrides, help and automatic preview against that reference.
- [x] Operator visual review of the installed chatbox editor, imported normal chatbox and ribbon passed November18 (no OBS URL adoption implied).
- [x] Separate operator review of Archive controls passed November18 (automated acceptance also passed).

## Pass 5 — Release and adoption

- [x] Run required source, host, native-contract and hidden-browser checks appropriate to the changes; terminate all test processes (November18 release candidate; source sequence resumed after stale-fixture fixes).
- [x] Finish the planned fresh-user walkthrough without personal settings or legacy actions: isolated packaged flow plus operator-confirmed Streamer.bot/OBS menus, November20. Catalogue/native-import outcomes were simulated in the isolated flow; no live account or viewer effects are claimed.
- [x] Verify empty-profile Help discovery and actual candidate installation/import-copy/dependency/status/URL controls without production settings or actions. November20 packaged walkthrough passed; catalogue delivery/native import results were simulated, not live platform acceptance.
- [x] Operator confirms OBS Docks → Custom Browser Docks dialog and Browser Source property labels match the Getting Started guide. Confirmed all requested labels November20; no saved source/URL changes requested.
- [x] Release Companion1.4.1 as v1.4.1-preview.1, November20, after main CI and packaged desktop acceptance.
- [x] Release Universal Dock1.1.4 with Companion>=1.4.1 minimum and verified catalogue/source/checksum.
- [x] Publish all29 independently versioned module releases, including Chatbox1.4.1, Archive1.2.1, Sound Player1.1.1 and Walk Ons3.0.2. Existing compatibility/import contracts remain documented.
- [x] Preserve native data for guide/label-only updates; no blanket reimport requirement. Sound/Walk Ons functional adoption retains its separate reviewed backup/import plan. Private native shutdown repair is separate from public packages.
- [x] Review complete public files and generated packages for private content, correct links and third-party notices. November20 audit/rebuild comparison passed; no claim that automated patterns detect every possible secret.
- [x] Verify actual app/module downloads, official checksums, all29 catalogue versions/source refs and existing entry preservation; record exact source/publication provenance, November20.
- [x] Verify the official installed app tree/ASAR and all29 module payloads; November20 cutover passed.
- [x] Back up the old app, full stopped profile and consistent Archive snapshot before replacement; WAL/integrity/table-content checks passed.
- [x] Announce Companion/service restart and complete acknowledged Widgets owner release under fresh closed-view confirmation; restore original enabled preference.
- [x] Preserve private settings, all232 native actions/startup code, phone pairing/TLS/cards, favorites, automatic-start choices and existing OBS source settings; November20 verification passed.
- [x] Leave all16 existing OBS browser-source settings/URLs untouched; no generated chatbox URL adopted.
- [x] Verify post-adoption29Ready, original services restored, OBS connected/off-stream/not recording and one active Widgets owner without real viewer-effect tests or repeated hardware acceptance.
- [x] Record publication completion, provenance, limitations and existing rollback/adoption requirements in this checklist, module checklist and private handover. Production adoption gates above remain open.

## Follow-up — Restore normalized Archive profiles

- [x] Restore the earlier shared `users` and `pluralmind_members` storage design in the standalone Archive. The current v1 database repeats identity/pronouns in each message and does not retroactively show later-known pronouns on old messages. Operator explicitly accepts current pronouns changing on historical log entries.
- [x] Keep stable platform/user identity and per-message PluralMind-member identity distinct; join current shared profile fields for search/display/exports without changing original message text, moderation, timestamps or which member authored a message. A chatbox memory cache is not a persistent Archive users table.
- [x] Prepare and test a backed-up transactional migration using disposable copies before touching the installed archive. Preserve existing rows/IDs, command exclusion, deduplication, moderation, retention, paging/export and ordinary/member pronoun isolation; measure storage savings rather than promising a fixed reduction. Migration subsequently rehearsed and installed November18; see archive-profile-repair-review.md.
- [x] Operator confirms older and later Archive entries show the same current pronouns. Accepted November20,2026.

## Follow-up — Pokémon gender display label

- [x] Correct the display label for gender-qualified encounters: Shinx (F) should display Shinx while retaining female artwork/gender metadata. November18 read-only check confirmed female parsing and cached female artwork are correct, but metadata displayName reuses the original label. Preserve shiny/regional/form descriptors and Nidoran species distinctions; account for existing cached metadata. Fixed and installed in Pokémon1.7.6, including old cached labels.
- [x] Operator confirms the clean encounter name and correct female artwork. Accepted November20,2026.

## Feature backlog review — November 20, 2026

Reassessment requested after publication. This is a planning proposal; no new priority order or feature implementation is approved by this review alone. Official-download adoption is maintenance and remains separate from choosing new feature work.

| Workstream | Features | Suggested implementation boundary |
| --- | --- | --- |
| Media / BRB | Self clip shoutouts, then weighted BRB rotation | Add clip selection and persistent cycle history while reusing the existing Shoutout Clips player; BRB consumes that selector plus selected Video items and followed-channel clips. Share self-clip history across manual and BRB requests. |
| Checklist workflow | Personal non-Twitch items, then optional Wheel-result additions | Extend Redeem Checklist with explicit local item kinds and local completion before connecting Wheel events. Preserve real Twitch completion/refund semantics. |
| Audience participation | Daily check-in; Named Raffles | Independent features. Daily check-in is a contained cumulative day-count feature; raffles can start with named manual rounds, then optional timer/auto-draw integration. Neither depends on the media workstream. |

Proposed next choice if improving BRB is the priority: build self-clip selection/history first, then BRB mixing. For a smaller independent addition, daily check-in is a candidate; for immediate operator workflow improvements, personal checklist items are a candidate. Named Raffles is still active, with no automatic priority based on request age. Ask the operator which workstream matters most before fixing the order.

Scope questions stay with their feature design: check-in command/day boundary; raffle eligibility/entries/draw policy; local item/Wheel mapping; clip eligibility/when playback counts as used; BRB duration, stop/scene behavior, percentage by clip count versus duration and empty-source fallback. Phone Deck remains part of each relevant feature's design and acceptance.

Older deferred ideas: TTRPG tools remain later, voice commands remain lowest priority, Writing Challenge stays parked, and Stream Together stays dropped. Do not silently reactivate them. Existing migration documents' deferred Chat Archive wording is historical: Archive has since been implemented, repaired and published.

## Additional feature backlog — Named Raffles

Added at the operator's request November 17, 2026. The polish releases are now published; feature implementation order is under review.

- [ ] Add **Named Raffles** with reusable named raffle configurations and independently identifiable running rounds. Support opening/closing entry collection, reviewing entry/status and drawing manually; keep eligibility/deduplication and winner selection explicit.
- [ ] Keep basic raffles usable independently of timers. Add **optional Named Timers integration** for a timed raffle: associate the exact raffle round with a timer/deadline, close entries when it expires, and optionally draw automatically. Auto draw must be an explicit saved choice, not an effect of ordinary status refresh or loading controls.
- [ ] Define ownership/completion contracts before implementation. An expired, cancelled, replaced or stale timer must not draw a different/newer round; duplicate delivery must not draw twice. Persist enough state for restart recovery, with an explicit missed-deadline/catch-up policy and clear interrupted/unknown outcomes.
- [ ] Include optional **Phone Deck** controls/status for selecting a named raffle and the supported open/close/manual draw/cancel operations. Preserve existing cards; never add cards automatically. Manual draw/destructive operations need clear confirmation where appropriate; keep viewer data narrowly scoped.
- [ ] Review category placement with the established category plan; Activities is the initial candidate. Keep audience display, result announcements and caller/trigger automation explicit and optional rather than side effects of setup.
- [ ] At design time settle entry source/command, eligibility and repeat-entry rules, winner count/repeat-winner handling, multiple simultaneous rounds, announcement behavior and what should happen when Companion was offline at the deadline. These are open design questions, not implemented defaults.
- [ ] Test manual and timed modes with synthetic entrants, independent named rounds, timer isolation, cancellation/rescheduling, concurrent close/draw, duplicate expiry, restart/missed deadlines, failed persistence, phone scope and matching operation acknowledgements. Do not run real viewer raffles as automated tests.

## Additional feature backlog — Personal checklist items and Wheel results

Added at the operator's request November 17, 2026: allow personal, non-Twitch redeems in the existing Redeem Checklist, including entries created from Wheel results. Planning only; priority alongside Named Raffles is still to be scheduled.

- [ ] Allow operator-created personal items and items submitted by other modules/actions into the same pending checklist. Each item has its own local ID, title, optional details/target and live/writing category; Twitch reward/redemption IDs are not required for local items.
- [ ] Preserve an explicit item source/kind. Completing a personal item changes only its local checklist state/history; Twitch completion/refund calls apply only to actual Twitch redemptions. Local items must not masquerade as Twitch rewards, and Refund must be unavailable/not applicable for them.
- [ ] Add an optional **Wheel → Redeem Checklist** integration: a configured profile/caller can turn its selected result into a pending personal item. Retain useful result/profile/user context without requiring a Twitch redemption. Merely previewing, reading status or refreshing must not silently create an item.
- [ ] Correlate automatic additions with the exact spin ID/event, not just its label. Duplicate notifications, retries, reconnects and restart recovery must not add the same spin twice; repeated legitimate spins with the same result may create separate items. Define failure/unknown acknowledgements before enabling cross-module writes.
- [ ] Make result-to-item behavior explicit and optional per profile/caller, with a title/details/category mapping. Keep result announcements and real reward fulfilment separate from local checklist creation.
- [ ] Include manual creation and scoped create/complete/status support in **Phone Deck** where appropriate. Clearly identify local versus Twitch items and preserve confirmations/permissions for real Twitch operations. Do not add cards automatically or broaden history/viewer-input projections unnecessarily.
- [ ] Preserve all existing Twitch pending/history records, routing/language queues, native action identities and phone cards through migration. Treat old records as their original kind; never reinterpret missing platform IDs as permission to contact Twitch.
- [ ] Test synthetic manual items, actual-redeem-shaped fixtures, multiple equal Wheel results, exact-spin deduplication, failed persistence, concurrent completion, cancellation, restart/unknown outcomes and zero Twitch calls for every local-only operation.

## Additional feature backlog — Daily check-in

Added at the operator's request November 20, 2026. Planning only; implementation priority remains to be scheduled alongside the other feature backlog.

- [ ] Add a daily check-in that records each person's total number of days checked in, similar to the First counter. Multiple check-ins on the same day count once; retain totals across streams and application restarts.
- [ ] Settle the check-in command/trigger, day boundary/timezone, account identity and response format during design. A consecutive-day streak is a separate possible feature, not a replacement for the requested cumulative daily count.
- [ ] Register suitable check-in status/operator controls with Phone Deck, preserving existing cards. Test duplicate events, day rollover, restart recovery and separate users with synthetic data.

## Additional feature backlog — Self clip shoutouts

Added at the operator's request November 20, 2026. Local candidate installed; real lookup and operator playback acceptance passed November21. Supplies the self-clip source for future BRB rotations below. Publication remains open.

- [x] Add a module that gives the operator a clip shoutout on request. Maintain persistent tracking of which eligible clips have and have not been shouted out in the current cycle; select an unused clip until all eligible clips are done, then start a new cycle. Synthetic full-cycle/restart checks and operator single-playback acceptance passed.
- [ ] Share the same selection/history contract with BRB playback so manual self shoutouts and BRB self clips do not independently repeat already-used clips. Define when a clip counts as used, failure/cancellation handling, concurrent requests, newly discovered/deleted clips and restart recovery before implementation.
- [x] Reuse existing Shoutout Clips playback with explicit requests and no chat announcement. Register Phone Deck request/recovery controls and cycle/status information without automatically adding cards. Native adoption and operator playback accepted; phone-specific human operation remains unverified.
- [x] Test complete cycles, cycle reset, changing eligibility, duplicate requests, playback failures and persisted history using synthetic clips.

## Additional feature backlog — BRB promotional clip rotation

Added at the operator's request November 20, 2026. These are promotional clip/video breaks during BRB; Twitch advertising API calls are not part of this request.

- [x] Implement an operator-controlled BRB playback session mixing selected Video items, followed-channel clips and the operator's own clips through Self Clip Shoutouts. Local candidate installed; native imports and real playback acceptance pending.
- [x] Implement configurable percentages by clip selections, validation, zero disables and redistribution among eligible sources. Reuse follows/exclusions; explicit staged refresh caches up to20 clips/channel. Full-cache refresh failure preserves previous cache. Native imports/human checks remain pending.
- [x] Agree mix units: number of clips. Clip duration does not alter the source's selection weight. Show configured mix separately from actual completed playback counts; failures must not be reported as completed plays.
- [x] Identify the existing followed-channel owner: reuse the Auto Shoutouts followed list and respect its exclusions. Operator explicitly requested this November21. Do not fetch/store a second follow list or run the chat-sending watcher for BRB. Keep manual additions separate from the followed-only pool unless explicitly enabled, and keep BRB playback history separate from first-chat/session shoutout suppression.
- [x] Agree session control: operator confirmed November21 that BRB playback is an explicit on/off session, independent of the current screen/OBS scene. `!brb` starts; `!back` stops. Phone Deck provides the same controls plus a toggle and shared status. No automatic start/stop or scene switching when changing scenes, no fixed session duration. Repeated Start while active and Stop while inactive are harmless.
- [x] Implement guarded Video/Shoutout Clips ownership, interruption handling, saved player presentation/audio and stopping only session-owned media. Scene state is never read or changed. Restart disarms the session and retains uncertain intents without replay. Synthetic verification passed; real acceptance pending.
- [x] Register Phone Deck start/stop/toggle/status and refresh/recovery controls using the same native state as commands and the saved mix. No automatic cards or existing command changes. Existing command JSON conflict inspection found no !brb/!back entries; inspect native import preview as well. Actual phone operation remains pending imports/operator review.
- [x] Test weighted selection, missing sources, shared self cycles, concurrent requests/ticks, duplicate Start/Stop/Toggle, guarded media takeover, command authorization, UI acknowledgement/confirmation, source refresh failures and inert restart with synthetic media. Separate real command/Phone Deck and audio/visual checks remain pending.
- [ ] Complete native imports and controlled real BRB command/Phone Deck/player acceptance before marking the feature ready for publication.

## Checkpoint log

### November 15, 2026 — plan recorded

- Completed: repository inventory, agreed scope and user decisions saved in this document.
- Implementation: not started; no module/app/native/production changes for this polish phase.
- Next: Pass 1, shared guide resolver and safe built-in Help reader, in a bounded session.
- Tests/publications: none for this documentation checkpoint; no runtime verification is claimed from writing the plan.

### November 15, 2026 — Sound Player added to agreed scope

- Completed: added Pass 2 for reusable sound playback and Walk Ons delegation, before final module guide review. Later passes are now module guides (3), chat usability (4), and final release/adoption (5).
- Confirmed by manifest inspection: Video is already optional in Walk Ons 2.1.2; audio is currently embedded in Walk Ons. The user subsequently clarified that no incorrect-required-dependency bug was reported; that investigation is out of scope.
- Inventory: 28 current packages plus planned Sound Player; do not claim 29 implemented packages yet.
- Implementation/tests/publication/production changes: none; this checkpoint changes the plan only.
- Next bounded session remains Pass 1: shared guide resolver and safe built-in Help reader.

### November 15, 2026 — fresh-agent handover and scope clarification

- User clarification: “depends on Video” was conversational wording, not a dependency/readiness bug report. Removed the proposed investigation; Sound Player extraction and general optional-integration presentation remain agreed.
- Fresh-agent context/build/test/working agreements are recorded privately in `docs/streamer-companion-polish-agent-handover.md` in the personal integration repository. Start with that document, then check this checklist.
- Implementation/publication/production changes: none. Next session remains the bounded Help foundation work in Pass 1.

### November 15, 2026 - Pass 1 Help foundation checkpoint

- Completed: manifest-entry-only shared resolver, shared first-run guide, desktop IPC/Help tab replacing OS document opening, same-origin read-only `/api/help/` routes, and shared text-node Markdown reader. Supported: headings/contents, paragraphs, lists, tables, inline/code blocks, code copy, safe HTTPS links, declared-guide cross-links, guide metadata search, back and remembered guide/search. Raw HTML/images stay inert; unsupported local links show as unavailable. Update Probe is excluded from normal Help pending Developer tools work.
- Universal Dock: lazy Controls / Help views retain the controls iframe/document and drafts across Help navigation and polling. Documentation lookup does not start services or dispatch actions.
- Source: local/uncommitted on `main` over `2b9889c443c5568b8ca9ea18ee5a461e7109d062`. Changed host/desktop/preload/control API/navigation, added `companion/src/help-guides.js`, `src/guides/`, `src/renderer/help*`, updated the explicit package allowlist and Universal Dock page/script/guide. Added `test-help.js`, `electron-help-smoke.js`, `test-help-browser.js` and check registrations. No commit; pre-existing documentation edits preserved.
- Checks: `node companion/scripts/test-help.js`, `test-navigation.js`, `test-control-api.js`, `test-browser-foundation.js` each exit 0; full `npm run check` exits 0; `npm run package` exits 0 with every ASAR member byte-verified; complete `npm --prefix companion run check:desktop -- <built-directory>` exits 0, including actual desktop IPC, disconnected-module Help, inert malicious Markdown, tables/code copy, links/back/search, remembered guide after reload, keyboard/minimum widths and dock draft/document preservation. `git diff --check` passes. Sandbox initially denied child processes/Electron IPC; approved isolated execution passed. Windows file-symlink case skips on EPERM here; actual junction and nested-junction escape tests pass.
- Artifact: `companion/out/build-zo2xaa/packages/Streamer Companion Preview-win32-x64`, 150 ASAR files. SHA256 of `resources/app.asar`: `886689e940c7a9dbcc5c8f4728f9dc86fbbe4efa9934d93fd1843486c4a7940e`. Reports: `companion/out/build-zo2xaa/build-report.json` and `companion/out/latest-build.json`. Unreleased local development build retaining 1.3.3; not a publishable replacement for that immutable release. Module packages in fixtures were temporary.
- Publication/production/backup: none. No adoption, native imports, production settings, OBS changes or live media. No production backup needed; review/revert only the intended local source changes for rollback, preserving unrelated work.
- Remaining: default-off Developer tools preference and guide-content separation, integration presentation, and remaining Pass 1 acceptance. Search matches names/IDs/descriptions rather than body text. Markdown uses a safe subset; arbitrary repository files and images are not fetched. Full first-run walkthrough remains in Pass 3. Before publishing, assign new host/Dock versions and Dock minimum host requirement together.
- Exact next action: inspect developer diagnostic links and guide engineering sections, implement the local preference without service/action effects, then continue the remaining Pass 1 tasks. Pass 1 is not complete; do not begin Pass 2 yet.
- Cleanup: isolated test windows/hosts/services/listeners exited and temporary profiles removed; production applications were not stopped or replaced.

### November 15, 2026 - Developer tools checkpoint

- Completed: local default-off `developerTools` preference with atomic saves/failure preservation and favorites compatibility. Settings switch exposes Update Probe in Installed/Catalogue, API token controls, service logs and technical metadata. Ordinary health, connection messages, previews and the existing Universal Dock Tests link remain available. Switching visibility does not install/import/start/stop/dispatch or alter auto-start configuration.
- Help: optional manifest `developerDocumentation` declares a separate Markdown guide. Registry validates safe paths/Markdown and requires its packaged file; builder copies only the explicitly declared extra guide, rejecting symlink components and asset-root collisions. Shared resolver gates both the engineering index and direct `developer:<id>` reads using the saved preference, not request parameters. Disabling clears an open engineering guide in desktop and dock. Unchanged dock Help polling preserves focus; controls document/drafts remain mounted.
- Guide separation: Archipelago, Controller, Countdown, Embedded Widgets, Named Timers, Redeem Checklist and Wheel now have declared `DEVELOPMENT.md` files containing moved fixture/compiler/migration sections. Widget recovery, notices, ordinary backup advice and useful limitations remain in user guides. This is a bounded first split, not completion of all 28 guide reviews. Contributor contract added at `docs/help-guides.md`.
- Source: uncommitted `main`, base `2b9889c443c5568b8ca9ea18ee5a461e7109d062`; previous Help changes and unrelated documentation edits preserved. No native C#/exports, action IDs, versions or dependency minimums changed.
- Tests: focused `test-developer-tools.js`, `test-help.js`, `test-navigation.js` exit 0; full `npm run check` exits 0. `npm run package` exits 0 with ASAR member byte verification. Full `npm --prefix companion run check:desktop -- <build-directory>` exits 0. Expanded `node companion/scripts/test-help-browser.js` exits 0, including real preference IPC, inventory/catalogue/API/guides visibility, direct HTTP denial, clearing desktop/dock engineering pages, retained controls/draft, and unchanged stopped Update Probe/auto-start. Fixtures install all seven engineering-guide packages. `git diff --check` passes.
- Test harness correction: the new Help Electron smoke now explicitly exits with the assertion status after cleanup. An initial synthetic-catalogue timing error exposed that Electron shutdown could otherwise report exit 0 after logging an assertion failure. The fixture now waits for its refreshed catalogue; the corrected complete suite passes. No production behavior was involved.
- Artifact: `companion/out/build-ZLT1Lm/packages/Streamer Companion Preview-win32-x64`; 150 ASAR payload files. ASAR SHA256 `874be9dd5d09d62d215e227976f48874bfe0fdf05c07edfe312785d1c29f86fa`. Reports: `companion/out/build-ZLT1Lm/build-report.json`, `companion/out/latest-build.json`. Unreleased development build retaining 1.3.3; never publish it as replacement bytes for that immutable version. Module guide archives were tested only in disposable fixtures.
- Publication/production: none by the agent. Operator manually opened the previous `build-zo2xaa` app after closing the original; executable path verified read-only. That app was left running. The new developer build and guide changes have not been adopted, and installed module files, preferences, OBS, Streamer.bot and private data were not modified by this checkpoint. No production backup/restart/import was performed.
- Rollback: review/revert only the intended local source changes, preserving prior work; no production rollback is needed for agent actions.
- Remaining/next: implement readable required/optional/external integrations using installed metadata and backward-compatible catalogue summaries; finish engineering-content separation across remaining guides and outstanding Pass 1 acceptance. Coordinate host/Dock/package versions before release. Do not begin Pass 2 yet.
- Cleanup: all isolated fixture processes/windows/services/listeners exited and temporary profiles removed. Operator's earlier Help build remains open.

### November 15, 2026 - Integration presentation checkpoint

- Completed: Installed/Catalogue details now show Required modules, Optional integrations and External setup instead of raw dependency JSON. Package rows separate installed version, version/host compatibility and module readiness; existing service inventory supplies stopped/unavailable/unconfigured/ready status. Stable disclosure/list nodes retain focus and open state. Normal readiness remains separate from individual phone-control prerequisite checks.
- Phone Deck: all integrations derive from installed `ui.phoneDeck` contributions or optional catalogue summaries, with installed declarations preferred. Source inventory still has 28 packages, 24 providers/72 visible controls, and 23 external contributors. No exhaustive provider list, automatic installation/start, card creation, action dispatch or new dependency edge. Phone Deck's base still has no required feature-module packages and remains OBS-only.
- Catalogue/metadata: additive validated schema-1 `integrations` summaries carry public labels/kinds/transport and setup hints, never dispatch definitions/endpoints/resources/private values. Old entries without summaries remain valid, with unknown integration support clearly stated. Download preparation checks summaries against the hashed package manifest when present. Optional `ui.externalSetup` labels were added to Archipelago, Live Chatbox, Embedded Widgets, Local AI, Phone Deck and Pokemon Encounters. Legacy UI metadata stays intact and accounts are not converted to installable modules. Canonical dependency maps/native action files are unchanged.
- Source: uncommitted `main` over `2b9889c443c5568b8ca9ea18ee5a461e7109d062`. New files `companion/src/integration-summary.js`, `src/renderer/integrations.js`, focused source/browser tests and `docs/integration-presentation.md`; host/catalogue/registry/builder/allowlist and renderer updated. Earlier Help/Developer tools and unrelated documentation changes retained. No commit/release version changes.
- Tests: `node companion/scripts/test-integrations.js` exits 0 (28 summaries, provider/control coverage, old catalogue fallback, malformed legacy hints, strict IDs, dependency preservation, summary mismatch rejection, effect-free inventory). Full `npm run check` exits 0, including independent Phone Deck OBS controls without providers and all provider-availability regressions. Complete `npm --prefix companion run check:desktop -- <build-52X5Qu-directory>` exits 0, including new integration UI checks. Afterwards, final strict-ID/malformed-hint fallback hardening was rebuilt as `build-eCM9Qn`; focused source integration and `node companion/scripts/test-integrations-browser.js` against this final bundle both exit 0. It verifies absent/incompatible/stopped/unconfigured/ready owners, friendly setup separation, old unknown summaries, preserved focus/disclosures, no horizontal overflow at minimum width, unchanged auto-start and no install/start/native dispatch. Byte-verifying package build and `git diff --check` pass. Initial sandbox-only catalogue test hit spawn EPERM; approved full execution passed. No extra unchanged-suite reruns were needed after focused hardening checks.
- Final artifact: `companion/out/build-eCM9Qn/packages/Streamer Companion Preview-win32-x64`, 152 ASAR payload files. SHA256 of `resources/app.asar`: `8344b410dd035e183eee178108475432291bc1657798adb33ae3bec513ba1f2f`. Reports: `companion/out/build-eCM9Qn/build-report.json` and `companion/out/latest-build.json`. Development build retains 1.3.3; not a publishable replacement for that immutable version. Synthetic UI preview: `companion/out/integrations-preview.png`. Test module archives were temporary.
- Publication/production/backup: none by the agent. Read-only process inspection still shows operator's `build-zo2xaa`; it was left open. No installed app/modules/catalogue/settings, OBS sources, native actions, phone layout/pairing or private data changed. No production backup or rollback required for agent actions; revert only intended local source changes if needed, preserving prior work.
- Remaining/next: finish engineering guide-content separation and outstanding Pass 1 Help/dock acceptance, then review the pass before the Pass 2 audit. Actual individual Phone Deck control prerequisites and external-account readiness are intentionally checked in their module/editor, not claimed from package metadata. Publishing summaries for existing immutable packages requires reviewed version/catalogue provenance at the release gate. No Sound Player implementation has started.
- Cleanup: isolated source/browser fixture hosts/windows/services/listeners exited and temporary profiles removed. Only the operator's earlier app remains open.

### November 15, 2026 - Pass 1 complete in local source

- Completed: reviewed all 28 module guide entry points and separated remaining migration/compiler/protocol/fixture/internal-preservation material into declared developer guides. There are 26 `DEVELOPMENT.md` files; Universal Dock has a user-only guide and Update Probe is developer-only. Original paragraphs are retained, not discarded. Useful action arguments, compatibility/backup advice, widget ownership recovery, archive privacy/WAL advice, provider limitations, isolated/live test distinctions and third-party rights remain in user Help. Audit: `docs/pass1-guide-separation-review.md`. Complete practical guide rewrites/recipes remain Pass 3.
- Acceptance fixes: Help no longer focuses the dock module picker when activated. Previously, setting the controls iframe to display:none retained its document/draft but lost scroll; controls and Help now share a fixed workspace and the inactive controls iframe stays invisible/inert with the same viewport. This preserves scroll without accessing cross-origin frame contents. Normal unavailable/removed module handling remains unchanged.
- Expanded hidden-browser acceptance: native Return-key Help/guide activation, search focus through polling, deep-guide/tab/back scroll, guide selection/reload with a delayed response, minimum 760x520 desktop/320px dock layouts, selected module identity, controls document/draft and 220px internal scroll across Help/polling, and cleared developer-only content. The test's stopped Update Probe uses a dynamically allocated port; disconnected Streamer.bot is an isolated closed fixture port. Registry installation promises are now awaited in guide tests so cleanup cannot race refreshes.
- Source: all changes uncommitted on `main` over `2b9889c443c5568b8ca9ea18ee5a461e7109d062`; earlier Help/integration changes and unrelated documentation edits preserved. No native action/C# export or third-party notice files changed. Guide changes and the dock viewport/focus fix are package-source changes, not production updates.
- Tests: new `node companion/scripts/test-guide-packages.js` exits 0 after building/installing all 28 packages in temporary registry data and checking all 26 guide gates/links plus retained safety/notices. `node companion/scripts/test-help-browser.js` exits 0 with expanded acceptance. Final full `npm run check` and complete `npm --prefix companion run check:desktop -- <build-EwLnaK-directory>` both exit 0. `npm run package`, byte-verification and final `git diff --check` pass. Initial acceptance failures identified the real focus/scroll defects; fixture-only lexical-variable/await/keyboard-event sequencing issues were corrected before the final passing runs. No unchanged suites were rerun after final success.
- Host artifact: `companion/out/build-EwLnaK/packages/Streamer Companion Preview-win32-x64`, 152 ASAR payload files; ASAR SHA256 `8344b410dd035e183eee178108475432291bc1657798adb33ae3bec513ba1f2f`. Host runtime bytes are identical to the prior integration build: this checkpoint's behavior changes are in Universal Dock, and engineering separation is in independent module packages. No user app switch is needed for source/audit work.
- Module artifacts: 27 selected local development packages (26 guide-bearing packages plus Universal Dock) in `companion/out/polish-pass1-modules/`; per-package hashes in `SHA256SUMS`, SHA256 of that file `24dddae7a48453bf28658f3b8fb97999e7f0dd340420848e7500873a068d0173`; `module-entries.json` SHA256 `aa01d6f00b7014f645108604b9673d9c5aa378a4c6776974a4f290db00b22be2`. Universal Dock archive SHA256 `f9a37996a4d923a8cc4559ef66a8562a93c5c10bffeaefe8cc9497cb089855fa`. Current version labels are unchanged local development labels, not publishable replacements for immutable releases. Assign coordinated new host/Dock/module versions/minimums at release preparation.
- Publication/production/backup: none by the agent. Operator's `build-zo2xaa` path remains the only real Companion path after test cleanup. No installed app/module/profile/catalogue, OBS source/audio, Streamer.bot actions/globals, phone layout/pairing or production media was changed. No production backup/restart/import required. Rollback concerns only the intended local source changes; preserve unrelated work.
- Exact next action: bounded Pass 2 audit of sound ownership, existing callers and action-ID/import compatibility, with a concrete migration/rollback contract before implementation. No new Sound Player package exists yet and no live handoff is authorized by these synthetic tests.
- Cleanup: all fixture windows/hosts/services/listeners exited and temporary profiles removed. Operator's earlier Help build was left running.

### November 15, 2026 - Local preview installed for human verification

- User requested a backed-up real-setup checkpoint before more feature work. This supersedes earlier instructions to proceed directly to the Pass 2 audit: human verification is now the gate. No public release was requested or created.
- Preparation: exact local host ASAR `8344b410dd035e183eee178108475432291bc1657798adb33ae3bec513ba1f2f` and all 27 local module hashes verified. Candidate manifests differed only in declared developer guides/external setup metadata; runtime changes were confined to Universal Dock's reviewed web files. Native Streamer.bot action data was checked unchanged; no import/restart of Streamer.bot needed.
- Actual handoff: running and canonical startup applications backed up. Initial normal widget disable did not obtain release because its persisted owner was unconfirmed; Companion was left running and enabled preference restored. Operator explicitly confirmed all widget/aggregate views closed; OBS exit was independently verified. The scoped request-release/confirm-closed API completed with idle ownership. No owner file was edited or timeout treated as release. After graceful Companion shutdown and child-process exit, the entire stopped profile was backed up, including chat SQLite/WAL/SHM and private media/settings/pairing/TLS. The backup database passed read-only SQLite quick_check.
- Installed: 27 exact local module archives offline, preserving private module data; restored original Widgets enabled preference with the normal revision increment. Copied tested host payload into the existing startup/firewall executable location. Cleared inherited Electron Node mode and reopened the real GUI. OBS was reopened normally without streaming/recording flags. Executable pointer/firewall rule and OBS URLs/settings were not rewritten.
- Read-only verification: all 28 module states ready, 28 normal Help entries with Update Probe/engineering guides absent by default; installed module members match candidate hashes and installed ASAR matches tested payload. Protected settings/favorites/automatic starts/API credentials/phone pairing/TLS preserved (only documented volatile phone last-seen values and widget revision normalized). Phone OBS/native connections and enabled Chat Archive feed connected; one active Widgets owner; OBS off-stream/not recording, original browser source settings, current scene and audio mute/track masks preserved.
- Source/build/publication: still local/uncommitted; no public tag, workflow, catalogue update or published release. Installed local version labels are unchanged development labels and must not be reused as public immutable release bytes. Private adoption helpers/backups/checksums/rollback evidence are outside public module/app packaging.
- Remaining: human walkthrough/feedback. Confirm readability/search/navigation, actual dock selection/draft/scroll preservation after refreshing that existing dock, Developer tools on/off visibility, and the required/optional/external setup presentation. Do not mark human acceptance from readiness checks. No Sound Player work should start before this checkpoint is reviewed.
- Cleanup: temporary probes exited. Updated Companion and restored OBS are visible normal windows; Streamer.bot was left running. No viewer chat, test media, ads, redeems, scene changes or stream/record commands were issued by the verification.

### November 15, 2026 - Operator accepts local preview

- Following a power outage, reopened the installed preview at the existing startup path, confirmed one visible GUI and a ready local host.
- Operator feedback: “Seems good, thank you.” Record this as general hands-on acceptance of the Pass 1 preview, not a claim that each individual walkthrough step was separately reported.
- Next: bounded Pass 2 ownership/import-compatibility audit. No Sound Player implementation, publication or additional production configuration changes performed in this acceptance checkpoint.

### November 15, 2026 - Sound Player ownership/import-contract audit

- User requested the next module, Sound Player, explicitly including Phone Deck registration. Completed the bounded audit required before the functional extraction. Public contract: `docs/sound-player-extraction-contract.md`; reserved IDs/proposed Phone Deck metadata: `docs/contracts/sound-player-extraction.json`. These are design artifacts, not a registered/implemented module.
- Traced actual Walk Ons/Sound C#, export IDs/triggers/queues/assembly references, renderer/dock code, media registry and aggregate/routing editor, Video acceptance and actual Phone Deck revision calculation. Direct audio Play replaces current audio; Walk Ons rejects when Video/Shoutout/audio is busy. Old weighted selection includes positive entries without filtering by library enabled state; defaultVolumePercent is stored but unused by Trigger. Initialize resets eligibility, so migration must not call it as an import shortcut. Video has no matching persisted acceptance field; existing Video-walk-on tests use a stub and do not establish rejected-child behavior.
- Decisions: keep all four legacy sound UUIDs in Walk Ons as forwarders; new Sound Player exports eleven distinct IDs and owns the existing playback global/feature. Preserve old media URLs with a validated media-owner alias and verified data copy, scene/card keys with an explicit routing ID, and exact legacy pool semantics with one owner-side draw. Per-request renderer claim is required before audio starts; saved state/reconnect must not replay. A minimal Video request-ack extension is part of the isolated compatibility work, not a dependency metadata fix.
- Phone Deck: proposed six-control contribution (sound Play/selection form, pool Play, Stop, master volume, playback status) passes the real provider schema. It exposes labels/IDs/status, not source URLs/roster. All five existing Walk Ons control IDs/declarations/revisions remain unchanged; old Stop forwards through its existing UUID. No cards were created and no live declaration was installed.
- Read-only private inventory: expected four sound actions, no external sound dispatchers, one external sound-state reader, two private media files, live state available and no missing/disabled referenced sounds in this profile. Private action labels/media hashes/state checks stay outside public source. Current production audio was idle; no action/reset/configuration request was sent. Historical personal server/overlay/installer references were identified but not rerun. The private JSON reader now strips BOMs and guards error output; an initial parser error was too verbose and was corrected without repeating private values.
- Validation: contract schema/ID-collision/provider-revision check exits 0 (`companion/out/sound-player-contract-check.json`); `node companion/scripts/test-walk-ons.js`, `test-phone-deck-coverage.js`, `test-phone-deck-coverage-availability.js` each exit 0. `pwsh -NoProfile -ExecutionPolicy Bypass -File companion/scripts/test-action-engines.ps1` exits 0 with actual C# engines against synthetic adapters, including separate parent/child dictionaries. Existing 28-package/24-provider/72-visible-control inventory is unchanged. No new app/module build, publication, native import or production mutation for this checkpoint.
- Source: local/uncommitted on existing `main`; no runtime source or installed files changed by the audit. Proposed future versions/minimums are recorded only in the contract and must be coordinated before release. No Sound Player module directory exists yet.
- Next action: implement the isolated module, compatibility forwarding/routing/media changes and focused acceptance suite from the contract, including actual Phone Deck declaration/discovery. Do not count it as implemented or adopt it before those checks and the backed-up human checkpoint.
- Cleanup: read-only WebSocket audit connection and all synthetic test processes exited. Installed Companion/OBS/Streamer.bot, private state/eligibility, media and phone cards remain untouched.

### Template for the next checkpoint

Copy this structure into a dated entry and replace every placeholder:

- Pass/subtasks completed:
- Work still in progress, including exact files/branch:
- Source commit(s):
- Tests run and actual results:
- Build/package artifact locations and hashes:
- Publication workflow/release IDs, or explicitly not published:
- Production changes, or explicitly none:
- Private backup location and rollback:
- Known failures/limitations and unresolved decisions:
- Exact next action:
- Temporary processes stopped / required applications left running:

Update Resume here and the relevant checkboxes at the same time. Preserve historical evidence; correct stale status explicitly rather than leaving competing “next step” instructions.

## Checkpoint — Sound Player isolated implementation, November 15, 2026

Implemented and tested the source candidate and optional Phone Deck contribution. See sound-player-preview-handoff.md for exact versions/artifacts/digests, completed checks and remaining adoption/rollback steps. The full regression suite, C# owner suites, and complete packaged desktop/browser suite passed; synthetic silent audio only. The public source inventory is now 29/25/78. No production change or release was made. Off-stream renderer closure, backed-up native/media handoff and operator listening/phone acceptance are the next gate.

## Checkpoint — Sound Player local adoption, November 15, 2026

Fresh off-stream/all-views-closed acknowledgement obtained. Widgets released through scoped recovery, never by ownership-file edit. Installed the verified candidate and coordinated 22 existing native actions plus 11 distinct Sound actions. A private triggerless restoration helper preserved the exact authoritative roster/session across restart, then was disabled after resuming the original watcher. Real native Sound Configure confirmed idempotent library/pool migration. App/package/native/media/phone/OBS preservation checks passed; 29 modules Ready, six Sound controls discovered, one Widgets owner, no stream/record. Sound controls were opened and Companion shown. Human listening/card acceptance remains pending; saved Sound visibility stays Hidden until the operator changes it.

## Checkpoint — Operator Sound acceptance and category review

Operator reported "It worked" after the requested Sound listening checkpoint. Recorded general local-preview acceptance and advanced to Pass 3 category review. Do not infer detailed per-control/card results from that short confirmation. Existing incomplete automated matrix/rollback checklist items remain visible. A complete proposed 29-module category mapping is documented separately for review; installed metadata and phone layouts remain unchanged.

## Checkpoint — Approved categories installed

Operator approved the complete category proposal with "Looks good". Applied Media (Sound, Video, Spotify, Shoutout Clips), Games (Archipelago, Pokemon, Controller) and System including Local AI, with the other groups unchanged. Six independent metadata patch packages installed without restarting apps/services or importing native actions. Full npm check and real browser navigation/live regrouping passed. Running registry and Phone Deck provider categories verified; card revisions/layout, favorites, service PIDs and auto-start unchanged. Backups remain private; artifacts in companion/out/category-polish-preview. Continue Pass 3 module wording and guides next.

## Checkpoint — Three media/entrance practical guides installed

Completed Sound Player, Walk Ons and Video Player guide/copy rows, with verification scope recorded in pass3-media-guide-review.md. Added read-only IDs to support concrete user-created trigger recipes; actual browser checks confirm no action dispatch from ID selection. Source/native overlays and imported action data are unchanged. Three independent module updates installed without app/service restarts or native imports. Running Help, package bytes, phone control revisions/layout, favorites and service PIDs preserved. Shared first-run instructions and remaining module guides are next; broader manual menu acceptance is still open.

## Checkpoint — First-run walkthrough recovered after usage interruption, November 17, 2026

Resumed interrupted build/tests. Full regression and packaged browser suites pass; completed source/copy/guide checks for Universal Dock, Universal Overlay and Overlay Visibility with evidence in pass3-first-run-review.md. Installed offline while Companion/OBS were already closed after full backups. User closure/reopening confirmation and live verification pending. Found separate existing Streamer.bot background-only process/no API and asked user whether it opens normally; no native restart/import/state reset performed.

## Checkpoint — First-run preview reopened and native blockage recovered, November 17, 2026

Operator confirmed closed views and reported Streamer.bot would not reopen because its old process blocked it. Saved readable current database/native files; final action/command differences were timestamps only. Ended exactly the blocked process, reopened the same profile and verified empty eligibility, roster values, sound/video settings and routing unchanged (normal optional empty pool-ID normalization only). No native import/file edit. Scoped Widgets recovery restored original preference; one active owner. Companion1.4.1 Help/links/six package payloads verified, 29 Ready, phone/settings preserved, OBS off-stream/not recording. Getting Started opened for the operator. Remaining module guides are next.

## Checkpoint — November 17, 2026: next three guides rewritten in source

Archipelago, Audio Routing and Cameras now have practical setup/use/recovery guides checked against their actual controls and Phone Deck declarations. All 29 disposable guide package checks passed; diff whitespace checks passed. No live install/version bump/release/app restart. Detailed matrix verification boxes remain open until the display rename, versioned candidate and relevant human checks are complete. See pass3-controller-camera-guide-review.md. Operator requested independent work only and a stop if user actions or questions are required.

## Checkpoint — November 17, 2026: three guides adopted through API

User authorized running API updates. Installed Archipelago1.0.11, Audio Routing2.0.2, Cameras2.0.3 after full regression and hidden module-browser checks; updated stale Archipelago browser fixture filename. All29 Ready; exact Help/package bytes verified. Audio Routing display label live in dock/phone; phone cards/revisions/layout/private settings preserved. Only Archipelago service restarted. No native import/app restart/publication/live output test. Cameras Copy remains open for its old browser title. Evidence and hashes: pass3-controller-camera-guide-review.md.

## Checkpoint — November 17, 2026: Avatar/chat guides adopted through API

Bouncing Avatar1.0.2, Chat Archive1.0.1, Live Chatbox1.0.2 and Cameras2.0.4 installed through API after full regression and hidden Avatar/Archive/Chatbox browsers. Fixed Avatar browser transient-status wait/failure exit handling and reran successfully. Guide/package bytes, Cameras title, all29 Ready, archive content, avatar images, private settings and Phone Deck cards/revisions preserved. Only updated module services restarted; OBS stream/record off. No host restart/native import/public release. Existing chat controls documented accurately; visual normal/ticker editor and independent command filters remain Pass4 work, so the two chat Guide/Verified matrix boxes remain open. Evidence: pass3-avatar-chat-guide-review.md.

## Checkpoint — November 17, 2026: bot/controller/countdown guides adopted

Installed Bot Chat Routing1.0.3, Controller Display1.1.4 and Countdown1.1.2 through API. Full npm check, actual C# recording-sink checks, hidden Controller/Countdown browsers and whitespace checks passed. Exact Help/package bytes and renamed labels verified; all29 Ready. Stable native data/IDs/Phone Deck declarations, cards/layout/revisions, private settings and Countdown config/state preserved. Only Controller service restarted. OBS stream/record off. No live chat/timer action, native import, host restart or publication. Evidence: pass3-bot-controller-countdown-guide-review.md.

## Checkpoint — November 17, 2026: Widgets/AI/timer candidates; adoption stopped

Widgets1.0.1, Local AI1.0.2 and Named Timers1.0.2 candidates built after practical guide rewrites and Named Timers dock copy cleanup. Full npm check, hidden three-module browsers, unchanged runtime/native/Phone Deck declaration comparison and diff checks passed. No live install or restart. Read-only Widgets status has an unconfirmed owner; safe recovery needs fresh operator closed-view evidence. Per user instruction stopped before all live adoption, left settings/ownership untouched, did not request confirmation. Matrix Verified remains open until adoption. See pass3-widgets-ai-timers-guide-review.md.

## Checkpoint — November 17, 2026: Widgets/AI/timers adopted after closure

Operator confirmed OBS closed/no outside renderers; rechecked zero OBS processes. Backed up and used scoped Widgets disable/save → request-release → confirm-closed API recovery. Installed Widgets1.0.1/LocalAI1.0.2/NamedTimers1.0.2 through API; restored original enabled preference. All29 Ready, exact package/normalized Help bytes, idle owner, preserved URLs/layout/private settings/timer globals/phone cards/revisions and unrelated processes verified. Corrected read-only Help verifier to account for CRLF normalization. Only updated services restarted. OBS remains closed; no native import/host restart/publication. See pass3-widgets-ai-timers-guide-review.md.

## Checkpoint — November 17, 2026: Phone/Pokemon/Reactive guides adopted

Installed Phone Deck2.0.5, Pokemon1.7.4 and Reactive Guests2.1.2 through API. Full regression and four hidden browser checks passed, plus corrected true-forward Pokemon upgrade test. All29 Ready; exact packages/Help and Reactive Guests dock/phone name verified. Full guest native state, phone pairing/auth/TLS/cards/layout/all provider revisions, Pokemon config/artwork and unrelated PIDs preserved. Only updated services restarted; service.log changes verified append-only. No encounter/pending phone operation before adoption; OBS closed. No native import/host restart/publication/live effects test. Evidence: pass3-phone-pokemon-reactive-guide-review.md.

## Checkpoint — November 17, 2026: redeem/reminder/scene guides adopted

Installed Redeem Checklist1.0.2, Reminders1.0.3 and Scene Links2.0.4 through API after full regression and hidden three-module browsers. Current controls/real-effect boundaries documented, Scene title/description cleaned. Exact packages/Help, all29 Ready, nine native redemption/history/reminder/language/routing globals, phone cards/revisions/settings/TLS and all service PIDs preserved. No service or app restart/native import/Twitch resolution/chat/category/focus action/publication. Evidence: pass3-redeem-reminder-scene-guide-review.md.

## Checkpoint — November 17, 2026: Clips/Spotify/Launch guides adopted

Installed Shoutout Clips2.1.3, Spotify2.0.6 and Stream Launch1.0.2 through API. Full regression plus isolated Spotify ownership/fade and hidden Clips/Launch checks passed. Actual control labels, callback/Premium primary sources and real-effect boundaries reviewed. Guards confirmed idle Spotify/no launch/clip/pending phone action and OBS closed. Exact packages/Help, all29Ready, eight native state globals, Spotify credential/settings/ledger data, phone cards/revisions/private prefs and unrelated PIDs preserved. Only Spotify restarted, logs append-only. No live playback/chat/stream/native import/host restart/publication. Evidence: pass3-clips-spotify-launch-guide-review.md.

## Checkpoint — November 17, 2026: Wheel and consistency adopted

Ten versioned guide/copy candidates installed via API; Wheel practical setup/three trigger recipes and developer-only Probe guide complete, descriptions/labels consistent. Corrected old result-return overclaim; separate native caller propagation remains unverified. Final full npm check, complete21-script hidden suite, actual C# engine checks, 29-guide/88-link audit and diff checks passed. Exact packages/Help, all29Ready, nine native globals/all affected data/phone revisions/private prefs preserved. Logs append-only; only six updated services restarted. Guards: OBS closed, Widgets idle, Spotify idle, no encounter/pending phone action. No native import/live effects/host rebuild/publication. Evidence: pass3-wheel-consistency-review.md. Human menu/caller-result and prepublication review remain open; Pass4 not implemented.

## Checkpoint — November 17, 2026: restart readiness and native caller inspection

After operator reopened Streamer.bot/Companion: all29Ready; OBS absent, Widgets unconfirmed/inactive and untouched. Static native binary inspection distinguishes immediate same-input dispatch from queued dictionary copy; end-to-end Wheel caller result still unproven. Corrected only a misleading fixture comment; no product/package version/native profile/live action changes. Next a manual harmless triggerless caller/log check or isolated native profile, then menu acceptance. See native-wheel-caller-review.md.

## Checkpoint — November 17, 2026: immediate native caller result confirmed

Recovered stale8080 listener without ending the current native process or editing settings, then user started server and Companion reopened. Exact two synthetic triggerless actions validated; Parent dispatched once, new log child-ok proves immediate visual RunAction argument propagation in1.0.7. No actual Wheel/chat/OBS/global write. Wheel guide2.1.4 installed after focused package+all29 guide checks; exact bytes/profiles/state/phone cards/private prefs/all service PIDs preserved. Wheel Verified checked; broader menus/prepublication/Pass4 open. Temporary two actions await operator deletion. Evidence: native-wheel-caller-review.md.

## Checkpoint — November 17, 2026: Named Raffles added to backlog

Operator confirmed the temporary caller-test actions were removed and requested named raffles, optionally integrated with timers for timed auto draw. Added an explicit feature backlog covering independent named rounds, optional Named Timers deadlines/auto draw, scoped persistence/restart/deduplication, Phone Deck and open design choices. No runtime/package/settings changes; active menu acceptance and Pass4 work remain open.

## Checkpoint — November 17, 2026: personal checklist items added to backlog

Operator requested personal non-Twitch redeems in the Redeem list, including optional Wheel-result additions. Added a separate feature backlog with local identities/source kinds, local-only completion, no Twitch refund for local items, exact-spin deduplication, optional per-profile/caller mapping, Phone Deck and existing-data preservation. Named Raffles remains recorded immediately above. No runtime/package/settings changes.

### November 17, 2026 — Pass4 chat editor and independent command filters installed locally

Live Chatbox/Chat Archive1.1.0: named normal/ticker editor, standalone URL snapshots, revision conflicts, isolated draft preview, independent original-text command filters and archive capture/history/export behavior. Full source suite and focused/hidden-browser acceptance passed, including original CSS/notices, two renderers plus active synthetic archive, legacy URLs, enrichment and polling drafts. API installation preserved private settings/archive table hashes/phone card revisions and all unrelated service PIDs; all29Ready. No host rebuild/native import/public release. Operator review is the next gate. Evidence/artifact hashes: pass4-chatbox-editor-review.md.

### November 17, 2026 — Original HTML generator referenced; visual editor reworked

Operator correctly challenged the initial generic editor. Read original generator.html/generator.js, then reworked real color pickers/optional overrides, numeric inputs, font suggestions, contextual help, prominent URL/import controls, responsive normal/ticker preview and automatic isolated updates. Live Chatbox1.2.0 installed after full npm check and final hidden-browser acceptance. Saved designs/private config/archive/phone controls/Widgets/unrelated services preserved; all29Ready, only chatbox restarted. Archive1.1.0 and host1.4.1 unchanged. Original editor completeness claim superseded; operator visual review still pending. Evidence/hash: pass4-chatbox-generator-review.md.

### November 18, 2026 — Thin ribbon preview sizing and contrast

Operator imported/saved two designs and reported the ribbon appearance looked wrong. Read-only inspection found a thin OBS ribbon versus a taller default preview, and white text on a light preview backing. Live Chatbox1.2.1 accepts preview height down to1px, defaults horizontal preview height to30px, refreshes synthetic samples after resize and selects dark backing for light message text when loading a design. No renderer CSS, saved design, appearance URL or OBS source was modified. Focused package/ingestion and final hidden-browser tests passed, including30px sizing, resize URL isolation and white-text contrast. API install followed backups and verified OBS connected/off-stream/not recording. Exact package/Help, two saved designs/private config, archive hashes, phone cards/revisions, Widgets and unrelated service PIDs preserved; all29Ready, only chatbox restarted. No public release. Artifact companion/out/chatbox-ribbon-preview-fix SHA256fa98de7b4a464aa8008f563e4b7bc60be60866b2d09e268b3e77a555f46c5dc1. Operator visual confirmation still pending.

### November 18, 2026 — Operator chatbox visual inspection passed

Operator confirmed: “Perfect. Visual inspection passed.” Record acceptance of the imported normal chatbox/ribbon and corrected preview. No further runtime change or test repetition needed. Separate Archive control acceptance and remaining final walkthrough/prepublication work stay open. No OBS URL adoption, commit or publication is implied.

### November 18, 2026 — Operator Archive review passed

Operator confirmed the Archive review looks good and explicitly requested checking it off. Archive control acceptance is complete alongside the previously accepted chatbox visuals. Pass4 acceptance is complete; remaining broader walkthrough/prepublication tasks stay open. Documentation only: no runtime/settings/history change, test repetition, commit or publication.

### November 18, 2026 — Release candidate and independent checks prepared

Prepared proposal docs/polish-release-candidate.md and release notes. Proposed app tag v1.4.1-preview.1 and29 module tags checked unused on GitHub;28 public modules advance versions, Sound Player is new. Dock1.1.4 now requires Companion>=1.4.1; compatible-host fixtures updated and old-host rejection tested. All source-suite commands passed across resumed segments, native engine plus separate Sound suite passed, standalone app packaged and all21 hidden browser scenarios passed. No remaining test processes. Automated audit scanned573 text files/all29 packages with no tested private-content findings and no unresolved relative Help links. Final exact-source manual review/native-menu human acceptance remain open, so not ready to publish. No commit/push/publication/production install/restart/settings mutation.

App ASAR b6f4ccaf092ed67350b6e957ba5d9d9cf8cdc201fe451eea68241e24552b13f9, build-SpSU14. Local appZIP SHA2563aa51b14fc34a962473b9070eb27bade7a871c0d2e49f9f81062c9174933ea59; module artifacts/checksums companion/out/polish-release-candidate/modules. Existing baseHEAD2b9889c443c5568b8ca9ea18ee5a461e7109d062 is NOT the candidate source ref (uncommitted work). Source CI and full approved sourceSHA required before publishing. Dock1.1.4 remains uninstalled; running host/modules/private setup unchanged.

### November 18, 2026 — Emote preservation and cache-first profiles

Operator reported enrichment turning emotes into text and requested reuse of known pronouns with fewer replacements/buffer dependence. Found proxy resolution clearing emotes; now uses pinned plugin fragment cleanup and remapped positions. Known profile data is included in initial delivery; fresh profiles skip enrichment delay, stale values revalidate, errors retain known values, confirmed removal clears and unchanged lookups emit no replacement. Pronoun-only DOM updates preserve existing images. Full npm check and final focused browser/Archive tests passed. Live Chatbox1.3.0 installed via API after backups/off-stream check; exact bytes/settings/designs/archive/phone/Widgets/unrelated service processes preserved; all29Ready. Sourcecache remains bounded/memory-only, not exact stream-boundary storage. No production test message, native import, host rebuild or publication. Hash/evidence: chatbox-enrichment-review.md. Human emote confirmation pending; operator refresh of current chatbox pages required to load renderer change.

### November 18, 2026 — Native emote endpoint diagnosis and1.3.1

Operator asked why the first repeated emote became text and explicitly authorized off-stream chat messages. Archive text matched but lacks historical emote metadata. Scoped native capture exposed exclusive endIndex versus inclusive replacement-renderer contract. Reproduced cold first-message failure in isolated browser; normalized rich parts/named native ranges, preserving legacy inclusive ranges. Node chat/package/enrichment/Archive and final browser regressions passed. Sent exactly3 controlled messages total (2 diagnostic,1 final confirmation); final cold lookup retained emote metadata before/after pronouns. Installed1.3.1 via API with preserved settings/designs/archiveexistingrows/phone/Widgets/unrelatedprocesses; all29Ready, onlychatboxrestarted. No publicrelease/URLedit. Evidence/hash chatbox-enrichment-review.md; current release module set fresh r3.

### November 18, 2026 — Shinx female encounter checked

Read-only Archive/cache/code review confirmed the gender-qualified Shinx spawn was recognized as female and selected a female artwork source. Found separate display-label defect: displayName retains the original gender suffix. Recorded follow-up; no service/config/cache/encounter mutation, chat send or package change was performed for this check.

### November 18, 2026 — Normalized Archive regression confirmed

Read-only investigation confirmed the earlier private Archive implementation/documentation used users and pluralmind_members tables with message foreign keys. Current standalone Archive schema v1 has only messages/moderation and stores identity/pronouns per message. Operator-reported same-user early blank versus later known-pronoun rows are present. Record restoration requirement with explicit acceptance of retroactive current pronouns; no database/schema/settings/runtime change was made by this check.

### November18,2026 — Shared Archive profiles and Pokémon repair installed

Normalized Archive schema2 restores users/member tables, joined current profile values, stable future member identities, explicit confirmed-removal metadata and unchanged-text deduplication. Backed-up transactional migration rehearsed on actual snapshot then adopted: all158 historical immutable messages preserved, six users, reported blank/later-known pronoun pair corrected, activeDB84→76KiB; private rollback backups retained. Pokémon1.7.6 removes gender annotation from display names while preserving female/shiny/form artwork and old caches. Final Chatbox1.4.1/Archive1.2.1 safeguard prevents unknown/disabled member pronouns clearing known history. Full initial source suite and final focused node/hidden browser checks passed; exact installed bytes/settings/history/cache/phone/Widgets/unrelated services preserved, all29Ready. No native import/publication/URL edit/live test message. Current release modules r5; evidence/hashes archive-profile-repair-review.md. Operator confirmation pending.

### November18,2026 — Native shutdown hang confirmed; cause unresolved

Operator confirms the window disappears while the native process remains. Read-only managed snapshots show the sole foreground managed thread waiting synchronously for shutdown completion; a background shutdown worker waits in Task.WaitAll. The native process still owns its API listener but does not answer GetActions. Logs show service cleanup began and OBS reconnect attempts continue afterward. This identifies incomplete shutdown, not the responsible component; no evidence yet warrants blaming or disabling a Companion module. Companion itself is closed. Private diagnostics retained outside the public repository. No native termination, settings/action changes, restart or release performed. Next: agree recovery and a controlled shutdown reproduction; preserve saved configuration before any forced recovery. Prior repair acceptance/release gates remain pending.

### November18,2026 — Shutdown reproduced; HTTP listener and retained-handle investigation

Authorized native recovery/restarts. Backed up saved data before ending the original stuck instance. Normal shutdown reproduced the hang with HTTP autostart enabled; inline-code cleanup completed, but one of43 tasks remained unfinished. Read-only type/task inspection traced it through native HTTP shutdown into Kestrel transport UnbindAsync. Temporarily disabling HTTP autostart allowed a normal shutdown within20seconds; the original HTTP configuration/mappings were then restored. Subsequent restart hit retained native listener ports attributed to an already exited instance, so API readiness is currently unavailable despite a visible native window. Startup also reopened Companion and OBS automatically. Do not claim the running setup is Ready.

Private startup launch investigation prepared an uninstalled candidate using CreateProcess with handle inheritance disabled, preserving the same hidden, nonwaiting script launch and all other action records. Exact .NET Framework reference compilation passed. An isolated explicitly inheritable socket regression reproduced retained binding with ordinary Process.Start and released binding with the isolated launch. This supports an inheritance hypothesis; live native resolution is not proven. Default test sockets were noninheritable and did not reproduce the problem, so do not overstate this as a confirmed vendor socket property. Next prerequisite: operator confirms off-stream/not recording and closes OBS plus all external overlay/widget views; then gracefully hand off Widgets/close Companion, clear retained handles, test candidate and normal shutdown with HTTP enabled. Native restart permission persists. No release/commit/publication or startup action adoption yet.

### November18,2026 — Startup handle inheritance repair installed and live shutdown passed

Operator freshly confirmed off-stream, recording stopped, OBS/external views closed. Disabled Widgets through revisioned API, released unconfirmed owner through scoped recovery, then closed Companion gracefully. Both listener ports attributed to the exited native instance disappeared immediately, supporting retained child handles as the cause. Native then closed normally. Compiled and functionally exercised the exact candidate launcher with native .NET Framework references: explicitly inheritable isolated listener remained retained by ordinary Process.Start but released with CreateProcess inheritHandles=false; candidate hidden child/quoting verified, owned test child cleaned up.

Backed up native action data, adopted only the selected startup inline source while stopped, preserving IDs/references/other action records. Kept existing script, arguments, working directory, hidden/nonwaiting behavior. Started native with original HTTP enabled; API answered232actions and both ports belonged to that instance. Normal WM_CLOSE exited within20seconds with Companion and OBS still running; both listeners disappeared. Reopened native, verified API232actions/all29modulesReady/one active Widgets owner, restored exact Widgets settings except revision, original HTTP/WebSocket configuration unchanged. No app/module rebuild, release, import, commit or push. Private evidence/rollback retained outside public repository. This is a successful controlled regression; long-term everyday shutdown acceptance remains an operator check. Do not rerun historical startup-generator/adoption helpers that would restore the older launch source.

### November20,2026 — Daily check-in and BRB clip features added to backlog

Recorded three operator requests: cumulative daily check-in count with one counted check-in per person/day; self clip shoutout module with persistent unused-clip cycles that reset after exhaustion; BRB promotional rotation mixing selected Video items, followed-channel clips and self shoutouts at configurable percentages. Plan includes shared self-clip history, Phone Deck registration, playback/session coordination, synthetic tests and open design choices (including percentage by clip count versus duration). Planning only; no runtime/settings/package changes or feature implementation. Existing acceptance/release work remains the next active step.

### November20,2026 — Archive and Pokémon human checks accepted

Operator explicitly requested marking both proposed human checks complete: current shared pronouns across earlier/later Archive entries, and clean Pokémon encounter name with correct female artwork. Added checked acceptance items and updated Resume here plus repair review. Next: remaining native menu walkthrough, source/privacy review, Windows/Linux CI and publication approval. Documentation only; no new runtime test, install, restart or publication.

### November20,2026 — Installed Streamer.bot trigger menus accepted

Operator confirmed all three documented paths in the installed interface: Core → Commands → Command Triggered; Twitch → Channel Reward → Reward Redemption; Twitch → Subscriptions. Supplied screenshot shows subscription triggers: Gift Bomb, Gift Paid Upgrade, Gift Subscription, Pay It Forward, Prime Paid Upgrade, Resubscription, Sub Counter Rollover, Subscription. Existing Wheel guide uses Subscription for new subscriptions and explicitly distinguishes Resubscription/Gift Subscription and gift-bomb overlap; no wording correction needed from this evidence. Marked the scoped menu walkthrough complete. This does not certify every fresh-user walkthrough or publication gate. No real trigger creation/firing or runtime mutation performed by the agent. Next: final exact-source/privacy/packaging review, then approved source provenance and Windows/Linux CI before publication approval.

### November20,2026 — Final publication review and local checks passed

Reviewed accumulated public scope (246 intended modified/new files over recorded base) with focus on Help filesystem/HTTP/IPC boundaries, integration summaries, media migration/ownership, Archive/enrichment and package allowlists/provenance; prior per-module guide reviews remain supporting evidence. Public text audit579files/29packages: zero tested private-content findings/unresolved relative links. Isolated rebuild matched all29r5package hashes; native export JSON plus23decoded inline sources passed content scans; licences/declared engineering guides present. All25packaged first-party host source files and recorded ASAR/appZIP hashes match. No product/app/module bytes changed during review.

Fixed one CI coverage gap by adding the separate Sound Player native test to test-action-engines.ps1, the Windows CI entry point. Full entry point passed with synthetic sinks; full current npm run check also passed locally Windows/Node24.13.1. Remote Windows/Linux Node22CI has not run for these uncommitted changes. Private per-file scope/hashes and logs retained outside public repo. No production mutation, commit, push, draft release or publication. Next gate requires approval of the concrete public source commit/push scope, then record full new SHA and obtain CI. Broader fresh-user setup acceptance remains unchecked; installed menu and Archive/Pokémon operator checks stay accepted.

### November20,2026 — Reviewed source committed and draft CI pull request opened

Operator approved the concrete source commit/push. Verified all246proposed file hashes and staged blobs against the reviewed inventory; committed only that scope as88d7eae3028e30f5fe86c8e42599ab0ad620db7d on review/usability-polish-2026-11-20. Newly staged files exposed13extra-final-blank-line diagnostics only; recorded as nonblocking without changing tested package bytes. All other staged whitespace checks passed. Working tree was clean after implementation commit. Pushed branch and opened draft PR #1; Windows/Linux Node22Check run44725308660 started. This documentation checkpoint updates source provenance; consult latest PR checks for any subsequent commit's outcome. No merge, release or production change authorized/performed. Broader fresh-user setup acceptance and publication approval remain open.

### November20,2026 — Empty-profile packaged first-run flow passed; OBS inspection pending

Used the actual reviewed app/candidate modules with a newly created isolated profile, synthetic catalogue delivery and read-only synthetic native GetActions. Verified Help before installation, Sound installation with required Dock only, optional integrations not implicitly installed, explicit missing native-import status, real package import-copy dialogs/decoded action inventories, simulated import status transition, Dock/overlay URLs on the isolated host, and installed-but-stopped Phone Deck with no automatic-start choices. No production profile, clipboard, browser renderer, account or native effect was used; clipboard/external launch/dialog adapters were isolated. Native initialization/audio and real OBS dialogs were not automated. Screenshots and report retained privately; owned test processes stopped. An initial harness import error displayed a JavaScript error dialog; corrected and that exact test process closed. A separate harness serialization/paint issue was corrected; final run and screenshot inspection passed. No shipped source/package changes or extra release/merge. Next operator step: inspect OBS dock and Browser Source property labels without saving changes. Main fresh-user checkbox remains open pending that evidence; this documentation checkpoint is local/uncommitted.

### November20,2026 — OBS menu confirmation completes planned fresh-user walkthrough

Operator confirmed all requested OBS labels: Docks → Custom Browser Docks with Dock Name, URL and Apply; Browser Source properties with Local file, URL, Width, Height, Shutdown source when not visible and Refresh browser when scene becomes active. Combined with the completed isolated packaged first-run flow and prior native-menu/operator acceptance, marked the planned fresh-user walkthrough complete. Scope remains bounded: synthetic catalogue/native-import outcomes are not live Twitch or real playback verification. No runtime/source/package change, saved source/URL edit or new production test performed. Documentation checkpoint goes to the existing review branch; latest-head CI must pass before requesting merge/publication approval.

### November20,2026 — App and all29 module releases published and verified

Operator explicitly approved publication after confirming the merge. Main Check44729107636 passed Windows/Linux; source tree exactly matches the reviewed PR. App release workflow44729580575 passed source/native/packaging/full desktop acceptance and published v1.4.1-preview.1. Actual app ZIP/official checksum and25first-party host source files verified. Published ZIPec0aff841953cedff02fe32f62a1962c3f15fa6cc532ec419c7dbba1f4f0905f; ASARc85a1216d5236e494fd5122ab8e4d2ece2da812fa3c943b76a2f05dff1a261fd. These are CI-built release hashes, not historical local candidate hashes.

Published29modules serially through the existing independent workflow/global catalogue lock. Each used full source_reff6e80c64d5354ccbebfa53aa1e7270a365865514 and succeeded; actual package plus official checksum matched the prepared candidate, and catalogue version/hash/source ref matched. Final catalogue contains29entries and preserves all existing entries. Private release/run/download receipts retained outside public repository. No production app/module install, native import, restart, OBS URL/settings edit or phone/Widgets change performed. Publication gates complete; production adoption remains separate. Recorded status/provenance in release record, module checklist and private handover.

### November20,2026 — New-feature backlog reassessment proposed

Reviewed the five active requests and older deferred ideas after release publication. Grouped them into Media/BRB (self-clip selector/history before BRB mix), checklist workflow (local items before optional Wheel additions), and audience participation (independent daily check-in and named/manual raffles before timer automation). Existing Shoutout Clips only plays supplied clip IDs; reuse that playback boundary while designing the requested selection/history module. No implementation priority chosen yet; operator value preference should determine the next workstream. Phone Deck retained in feature scopes. TTRPG later/voice lowest/Writing parked/Stream Together dropped stay unchanged. No runtime/package/release change. This planning edit remains local pending the operator's prioritization discussion.

### November20,2026 — Official published build adopted with existing settings

Operator requested the official-build cutover and confirmed OBS closed with no other windows open; that confirmation sufficiently establishes streaming/recording stopped and external views closed. Existing app/profile backups, consistent live Archive snapshot and full stopped-profile backup were retained. Used scoped Widgets disable/release/closed-owner recovery, gracefully closed the exact Companion owner, then replaced the app at its existing launch path. Streamer.bot pointer, startup script and repaired noninheriting native launcher were unchanged. Only Dock1.1.3→1.1.4 required package replacement; other28 already matched official bytes, and no native import was needed.

Published app tree/ASAR and all29 official module payloads verified. All29Ready,146 protected settings/media files unchanged, all243 Archive messages plus user/member/moderation tables preserved, phone pairing/TLS/cards/layout and automatic starts preserved, all232 native actions unchanged. Original Widgets preference restored; OBS reopened normally,16 browser-source settings/URLs unchanged, exactly one active owner, stream/record false. Private receipts/paired rollback app/profile backups retained; no real playback/chat/redeem tests. Adoption checkpoint updates remain local alongside the uncommitted backlog review; no new product source/release change.

### November 20, 2026 — Self Clip Shoutouts candidate installed; native imports pending

Operator selected Self Clip Shoutouts as the next backlog module. Local feature/self-clip-shoutouts source adds per-broadcaster private catalogue/used-ID cycles, explicit refresh, existing-player delegation, persistent pre-dispatch intent, correlated acceptance, no automatic retry, guarded Stop, return-last and pending recovery. Shoutout Clips2.2.0 adds an optional backward-compatible request protocol without changing its web player or existing action IDs. Seven optional Phone Deck controls declared; no cards automatically added. BRB automation is not implemented.

Full npm run check and the complete test-action-engines.ps1 entry point passed. Both engines compile against the installed native interface/model DLLs via Roslyn; synthetic runtime tests cover cycle reset, account/restart preservation, concurrent/duplicate/busy calls, saturated catalogue splits and failures before/after player acceptance. Isolated new-selector and existing-player Electron tests passed; external media requests intercepted. Real Twitch lookup, actual native imports and audible OBS playback are NOT verified by these tests. No host rebuild is required.

Installed only the two tested candidate packages through the existing authorized Companion API after checking OBS absent, no pending phone operation and player idle. Backed up the prior player package, native actions/globals and protected settings privately. Exact installed package payloads, unchanged native actions/player state, protected settings and Phone Deck card config verified. Self Clips reports streamerbot-required; Shoutout Clips reports Ready by existing names but still requires its updated import. No Initialize/play/chat effect, host/service restart, native modification, commit/push/publication or OBS URL change performed.

Artifacts: companion/out/self-clips-candidate/modules. SHA256 self-clips1.0.0 4efc942a287e80dc6d90b69b1ed220b746437050cdb3a2e36690a9c670a2e188; shoutout-clips2.2.0 1ea0a472d65e01b798dfca0ab71fa375cf9871b2d94f5ce7c61c776ec863ef85. Private source/native logs, backups and verification are outside the public repo. Next: operator imports BOTH sets using Companion's import controls, then stopped-player initialization and controlled own-catalogue/playback review. Publication remains separately gated.

### November 21, 2026 — Native imports confirmed; real catalogue refresh passed

Operator confirmed both imports. Native GetActions verified expected IDs/names/enabled entries. Initialized the idle existing player and selector; actual player reports protocol1/version2.2.0 and saved player config is unchanged. First verification sampled before the queued actions completed; corrected the private verification helper to await persisted completion rather than DoAction queue acknowledgement. Completed real native Twitch catalogue refresh for connected broadcaster:81 eligible,0 used,81 remaining,cycle1, no error. No Play/Stop/chat or OBS mutation was sent. Private before/after globals receipts retained outside public repo. Next: operator opens Media → Self Clip Shoutouts, checks catalogue, deliberately plays one clip off-stream and verifies visual/audio behavior plus count change. Real media acceptance remains pending; source candidate remains unpublished.

### November 21, 2026 — Operator playback acceptance passed

Operator responded 'Looks like it worked perfectly' to the requested single-clip visual/audio and 1-used/80-remaining count check. Marked the scoped local playback acceptance and core module implementation complete. Full-cycle/restart guarantees retain synthetic evidence; phone-specific human use, BRB integration and public release are not claimed complete. Documentation only; no further playback, settings changes or publication.


### November21, 2026 — BRB followed-channel source clarified

Operator pointed out that Auto Shoutouts already maintains the followed-channel list. Confirmed actual native data/actions.json includes Sync auto shoutout follows, administration actions and watcher using autoShoutoutFollowedLogins / autoShoutoutExcludedLogins; manual and session lists are separate. BRB will reuse this source read-only, respect exclusions and avoid invoking chat effects or changing first-chat session suppression. No native/global/list mutation or playback performed. Existing Video renderer reports guarded ended/error Stop; clip renderer uses guarded expiry, so completion/timeout and cross-player ownership must be explicitly coordinated before queue implementation. Asked whether mix percentages mean item selections or playback time; implementation of selection policy waits for that preference. Existing self-clip release remains unpublished.

### November21, 2026 — BRB mix counts clip selections

Operator confirmed percentages refer to number of clips. Recorded the decision; no duration weighting. Source weights apply to selection opportunities and zero disables a source. Actual playback/completion counts remain separate from configured selection mix. Remaining session controls and player coordination must be settled before live adoption. No runtime or production changes in this checkpoint.


### November21, 2026 — BRB command and Phone Deck session controls agreed

Operator requested a toggle controlled with !brb / !back or Phone Deck, unrelated to the screen currently shown. Locked Start/Stop semantics for those commands and shared Phone Deck start/stop/toggle/status controls. Session remains active across scene changes until explicitly stopped; no automatic scene switching or duration cutoff. Repeated Start/Stop must not create duplicate sessions or replay media. Queue/player ownership and restart guards remain implementation work. Documentation and read-only command conflict inspection only; no native trigger, command, phone card or playback mutation.


### November21, 2026 — BRB Rotation implemented and candidate installed; native imports pending

Implemented independent native BRB Rotation1.0.0 with explicit Start/Stop/Toggle, broadcaster/moderator !brb/!back commands, two-second native timer, saved whole-number clip-count mix and selected registered video IDs. No scene read/change, chat message, ad API, host rebuild, renderer or service. Uses Auto Shoutouts followed/exclusion globals read-only; explicit staged refresh caches up to20 clips per channel/2,000 channels and replaces the prior cache only after successful completion. Source selection redistributes weights among eligible sources. Own clips delegate to Self Clips and share its existing account-scoped no-repeat history.

Video Player2.5.0 adds an optional correlated busy-reject/dedup acceptance protocol, serialized state and monotonically increasing start IDs; existing action IDs/settings/manual calls preserved. BRB saves dispatch intent before effects, waits on guarded player state/expiry, stops only its saved start identity, halts on manual takeover and never retries unknown acceptance. Ten-minute video watchdog bounds stalled items. Restart/Initialize disarms sessions; Stop resolves saved known ownership, and explicit confirmed clear handles uncertainty without media effects. Six Phone Deck controls registered, including status, with existing cards preserved. One saved mix is shared by all callers.

Full npm run check and test-action-engines.ps1 passed. Additional four-engine tests passed100 selections at50/30/20, redistributed50/20 across70 selections with missing followed source, zero weights, shared self cycles, exclusions, concurrent duplicate toggle/ticks, player takeover/guarded Stop, denied command behavior, invalid config, failed refresh/private saves, post-effect unknown intent, inert restart and watchdog. Roslyn compiled final BRB/Video sources against installed native interface/model DLLs. New BRB browser passed real controls/transport validation, unsaved edit preservation, safe labels, correlated save/start/toggle, pending confirmation, double-click guard and inert reload. Existing Video packaged hidden browser passed actual synthetic media completion, state duplication, routing and reconnect. These tests do not certify real Twitch cache queries, native import/command permission menus, phone operation or audible OBS playback.

After confirming OBS absent, phone idle and both players idle, installed only BRB Rotation1.0.0 and Video2.5.0 packages through authorized Companion API. Exact payloads, unchanged native actions/player states/protected settings/Phone Deck cards verified. Backups/receipts/logs private under output/brb-candidate; actual data/actions.json and available native commands/timers JSON were copied, plus before globals and prior Video package. No BRB native import, Initialize, Start/Stop/playback/chat or phone card mutation was sent. BRB reports streamerbot-required; Video may appear Ready by old action names but still needs its updated native import. Private adopt-brb-candidate.cjs completed: do not rerun blindly.

Artifacts companion/out/brb-candidate/modules. BRB SHA256994550aa59a4fd69178b54bc96c75c112041525c4cc46957fda51365ccfc6ad9; Video SHA25688059ddc9d773946329ef2245cefc935fbbb53d555e5822d2b183677b2cc0319. Source remains local/uncommitted on feature/self-clip-shoutouts alongside accepted Self Clips work and prior documentation changes. No push/PR/public release. Next operator step: import BOTH Video Player and BRB Rotation through Companion, inspect command conflicts in the native preview, then verify compiled versions, initialize idle players and configure/refresh before deliberate playback. Preserve the noninheriting launcher and all Widgets/OBS URLs.

### November21, 2026 — Imports verified; native timer needs enabling

Operator confirmed both imports. GetActions checked IDs/names/enabled state. Video Initialize reports2.5.0/protocol1 and preserves config; BRB initialized stopped with no pending ownership. Self history and Shoutout Clips state unchanged. Native GetCommands shows one enabled !brb and one !back; all six Phone Deck controls have no unavailable reason. Current saved mix34/33/33, no selected videos; three registered videos available. Followed metadata refresh accepted but did not advance within40seconds. Native settings confirms BRB rotation tick imported enabled=false, repeat=true, interval2, lines0. Cancelled stalled refresh through BRB Stop with completed acknowledgement; no media effects. Next operator action: Services → Timers → enable BRB rotation tick. Real refresh/command/phone/playback acceptance remains open. Private receipts output/brb-candidate; do not rerun initialization helper blindly.


### November21, 2026 — Enabled BRB timer advances real metadata refresh

Operator enabled BRB rotation tick. Started a fresh metadata-only followed refresh; native timer advanced from112 to111 queued channels with active=false and no error. This confirms actual timer dispatch/native clip lookup; full cache refresh is still running and must be checked on resume. No playback started. Next user preference: percentages for selected videos/followed clips/self clips and which registered videos to include (40Today, DiviWalkon, HydrateOrDiedrate). Do not start or silently choose these settings. Phone/native playback acceptance remains pending.


### November21, 2026 — Operator BRB mix saved

Operator requested only HydrateOrDiedrate10%, mostly other-channel clips and occasional self clips. Readback initially showed20/70/10 with correct sole video. Adjusted through native Configure to10% selected video /80% followed clips /10% self, preserving the selected HydrateOrDiedrate ID. Correlated completion and exact saved config verified; active=false. Native refresh continues with65 queued channels at last read, no error; old cache remains empty until staged refresh completes. Do not test playback until refreshRemaining=0 and cache availability is checked, or source redistribution would change the effective mix. No playback sent. Actual command/phone/audio/visual acceptance still pending.


### November21, 2026 — Real followed refresh completed

User asked whether progress was real/visible. Two read-only snapshots five seconds apart confirm refreshRemaining=0,112 cached channels,1,929 cached clips, status Followed clips refreshed, no error and active=false. The prior40 remaining was a genuine intermediate snapshot, not a completed cache. Controls show cache status in Media → BRB Rotation → Followed clips and recovery. Saved mix10/80/10 and selected HydrateOrDiedrate remain unchanged; no playback was dispatched. Metadata/native timer acceptance complete; real command/Phone Deck/player acceptance remains pending.


### November21, 2026 — Confirmed fractional-duration black waits; timing fix installed

Operator observed clip1 and clip3 ending to prolonged black while clip2 advanced correctly. Read-only native state/cache and log correlation show clip1 metadata9399.999618530273ms ran from14:06:31 to14:07:31 (60seconds); clip2 metadata25000ms ran25seconds; clip3 metadata32599.998474121094ms had the same fractional parsing issue. Native Int32.TryParse rejected fractional arguments and fell back to configured60s maximum. Stopped BRB through its guarded Stop before changes.

Shoutout Clips2.2.1 now reads numeric duration values without locale string conversion, accepts invariant decimal strings, rounds up and clamps to saved bounds; finite validation added. Self Clips1.0.1 stores actual durations on refresh and forwards them, addressing separate maximum-duration waits on own clips. Its Initialize/history remain preserving. BRB1.0.1 only tightens dependencies to the corrected owners; native BRB code/actions unchanged.

Regression tests reproduce exact9.4s/32.6s values, integral25s, Dutch culture, native hide deadlines, own-clip duration forwarding and full BRB followed dispatch. Full npm run check and complete native entrypoint passed; final sources compile against installed native interface. Corrected packages installed through API with backups and exact payload checks. Existing10/80/10 config, followed cache, self history, native actions/player states and phone settings/cards unchanged; no automatic restart or playback. Private receipts output/brb-duration-fix/adoption; completed adoption helper must not be rerun blindly. Package source is local/uncommitted/unpublished. Operator must reimport Shoutout Clips and Self Clip Shoutouts, then initialize player and refresh own timing metadata before deliberate retest. Public/later phone acceptance remains incomplete.


### November21, 2026 — Timing-fix native imports verified; ready for controlled retest

Operator confirmed Shoutout Clips/Self Clip Shoutouts reimports. Verified expected action IDs/names/enabled state, initialized idle player and confirmed module2.2.1/durationProtocol1. Real own-clip refresh completed: all81 catalogue clips now carry positive whole-millisecond durations. Compared every account's used IDs and cycle unchanged; player config and complete BRB private mix/cache/session unchanged. BRB remains active=false. No playback was sent. Private before/after receipts output/brb-duration-fix and native-timing-verification.json. Next: operator deliberately uses !brb, inspects several transitions for removal of60-second fallback black waits, then !back; command stop/Phone Deck and real audio/visual acceptance still need confirmation. Source remains unpublished.

### November21, 2026 — Corrected playback accepted; publication authorized

Operator reports 'Works perfectly' after the requested timing-fix transitions/return retest, then explicitly requests publication of everything updated. Recorded scoped real acceptance and release scope: new Self Clip Shoutouts/BRB Rotation, updated Shoutout Clips/Video Player. Phone-specific full manual acceptance remains distinguished from discovery/native synthetic tests. Preparing exact source review and remote Windows/Linux CI before independent module publication; no host rebuild, production restart or extra playback implied.
