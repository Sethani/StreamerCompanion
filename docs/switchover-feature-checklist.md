# Switchover feature checklist

User priorities recorded 2026-11-05. Numbers match the feature list shown in chat. All listed features are vital except 11/22 (later) and 18 (drop). Writing Challenge remains separately parked and is excluded from this list.

There are 24 vital features: six already have published modules, and 18 remaining feature areas need migration or verification. Published does not by itself prove the old server can stop. This checklist is the acceptance scope; the dependency/source audit remains in legacy-migration-status.md.

| # | Feature | Priority | Acceptance / current work |
| --- | --- | --- | --- |
| 1 | Archipelago | Vital | Published; retain accepted behavior and verify the final modern overlay without the legacy server. |
| 2 | Pokemon encounters | Vital | Published; user accepted. Preserve encounter/throw behavior and settings. |
| 3 | Controller display | Vital | Published; user accepted. Preserve native lifecycle and layout. |
| 4 | Video player | Vital | Published; verify actual media links, playback and layout in final cutover. |
| 5 | Spotify controls | Vital | Core published; chat adapter, scene/session behavior and launch/fade integration still need verification. |
| 6 | Countdown | Vital | Published; controlled import/visual acceptance and launch integration remain. |
| 7 | Stream-launch automation | Vital | Migrate launch/countdown/Spotify startup and fades; replace remaining old-server clock/API dependency. |
| 8 | Going-live announcements and bookkeeping | Vital | Retain existing follow-up actions and identities; audit all dependencies. No automatic live announcement test. |
| 9 | Bot chat routing | Vital | Chat Routing 1.0.1 implements the compatible Twitch bot-message/reply contract; actual C# and package tests pass with synthetic sinks. Import and controlled live account/reply acceptance remain. |
| 10 | On-stream chatbox | Vital | Preserve live chat display, pronouns and PluralMind enrichment. Must work without the deferred history/search archive. |
| 11 | Chat archive | Later | Private history, search, retention and export do not block switchover. Preserve existing data; do not delete or publicly bundle it. |
| 12 | Reminders | Vital | Extract backlog commands/controls and selected on-stream display after chat routing; preserve own-list/moderator privacy and existing data. |
| 13 | Wheel | Vital | Extract profiles, entries, spins/results and appearance; include combined-overlay integration. |
| 14 | Named/language timers | Vital | Own timer commands, state publishing and queue wiring as a complete module; preserve timer_end_* compatibility. |
| 15 | Walk-ons | Vital | Preserve per-person sounds, weights, volume and once-per-stream rules; migrate private media explicitly. |
| 16 | Shoutout clips | Vital | Preserve clip lookup/playback, titles, duration/mute and chat/API dependencies. |
| 17 | Reactive guests | Vital | Preserve PNG/avatar guest layouts, order and camera assignment. This remains vital despite dropping Stream Together. |
| 18 | Stream Together | Drop | Exclude from required migration and retirement gates. Do not delete current code/settings or change live OBS sources as part of recording the decision. |
| 19 | Camera controls | Vital | Preserve main/secondary modes and source/guest assignments; verify against isolated OBS fixtures first. |
| 20 | Audio routing | Vital | Preserve source routes and game-audio/VOD-safe controls; private device/source mappings stay local. |
| 21 | Scene Links | Vital | Preserve scene-linked application focus and category configuration; keep process/OBS operations explicit. |
| 22 | TTRPG tools | Later | Player cards, video slots and layouts do not block switchover. Do not defer ordinary camera/reactive tools with them. |
| 23 | Phone Deck | Vital | Migrate paired phone controls, HTTPS and OBS actions with explicit private pairing/certificate handling. |
| 24 | Redeem checklist | Vital | Preserve pending channel-point request tracking and resolution; no private backlog in packages. |
| 25 | Tangia and other embedded widgets | Vital | Preserve configured browser widgets/layouts and scene routing; authenticated widget URLs stay private. |
| 26 | Bouncing avatar | Vital | Preserve the existing visual and appearance/layout rules in the combined overlay. |
| 27 | Local AI / Ollama integration | Vital | Previously optional, now required by the user selection. Audit actual service/consumers and package the used functionality. |

## Boundaries that must remain separate

- Live chat ingestion/display, pronouns and PluralMind enrichment (#10) are vital. Persistent history/search/export (#11) is deferred. If the current Chat Core bundles these, split or disable the archive path rather than dropping live enrichment or making history migration a cutover prerequisite.
- Reactive guests (#17), ordinary camera controls (#19) and embedded widgets (#25) remain vital. Stream Together (#18) is dropped; TTRPG-specific layouts/cards (#22) are deferred.
- Local AI/Ollama (#27) is vital under “all other,” even though earlier roadmaps called it optional.
- Dropping/deferring features means excluding them from new cutover requirements, not deleting old data, uninstalling production tools or changing live scene rules without a specific implementation/cutover instruction.

## Dependency order

1. Establish the shared bot chat-routing contract and the live chatbox/enrichment boundary without requiring the deferred archive. These underpin reminders and announcements and may be consumed by walk-ons/shoutouts/Spotify.
2. Migrate the complete stream-launch workflow, announcements/bookkeeping and Spotify startup/fades around the already-published countdown/music modules. Preserve action identities and remove the old Node fade-clock dependency. Use isolated/dry-run adapters; starting a real stream or sending public messages is not a build test.
3. Migrate viewer interactions: Reminders, Wheel, named/language timers, redeem checklist, walk-ons and shoutout clips. Each migration includes private-data compatibility and combined-overlay integration.
4. Migrate production tools: Reactive guests, cameras, audio routing, Scene Links, phone controls, widgets/bouncing avatar and the used local-AI integration. Adjust source-level ordering if dependency tracing reveals further shared prerequisites.
5. Rehearse all 24 vital features through the modern host/dock/overlay with the legacy server stopped. Resolve every remaining old URL, caller, service process or action dependency before the production switch. OBS/Streamer.bot and external applications remain separate dependencies as needed.

## Required completion checks

- [ ] Every vital feature has an owned implementation, explicit dependencies and saved-data compatibility.
- [ ] Existing accepted modules still work in the complete setup; no required media/settings were lost.
- [ ] Modern Universal Overlay and live chat display have no dependency on the old personal HTTP/static server.
- [ ] Scene visibility, module enable/disable, restarts and service automatic-start work without duplicate renderers or stale fallback.
- [ ] Legacy launch/Spotify fades, bot messages and viewer interactions work through their new owners.
- [ ] Synthetic tests run without live chat, stream, hardware or production-state mutations; controlled live effects are separately authorized.
- [ ] User acceptance/rehearsal passes with the old server stopped, with a documented rollback.

Infrastructure is part of the baseline: module catalogue/updates, Universal Dock/Overlay, Source Modules and test/operator controls are retained without needing an additional priority vote. External OBS services can remain independent; inspect their URLs at cutover rather than unnecessarily rebuilding them.
