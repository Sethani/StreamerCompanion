# Switchover feature checklist

User priorities recorded 2026-11-05. Numbers match the feature list shown in chat. All listed features are vital except 11/22 (later) and 18 (drop). Writing Challenge remains separately parked and is excluded from this list.

There are 24 vital features: ten have independent module implementations, and 14 remaining feature areas need migration or verification. Published does not by itself prove the old server can stop. This checklist is the acceptance scope; the dependency/source audit remains in legacy-migration-status.md.

| # | Feature | Priority | Acceptance / current work |
| --- | --- | --- | --- |
| 1 | Archipelago | Vital | Published; retain accepted behavior and verify the final modern overlay without the legacy server. |
| 2 | Pokemon encounters | Vital | Published; user accepted. Preserve encounter/throw behavior and settings. |
| 3 | Controller display | Vital | Published; user accepted. Preserve native lifecycle and layout. |
| 4 | Video player | Vital | Published; verify actual media links, playback and layout in final cutover. |
| 5 | Spotify controls | Vital | Core published. Its autonomous fade and shared scene/countdown session behavior pass isolated test mode; chat adapter and controlled account acceptance remain. |
| 6 | Countdown | Vital | Published and integrated with Stream Launch; controlled Streamer.bot import/visual acceptance remains. |
| 7 | Stream-launch automation | Vital | Stream Launch 1.0.0 is published and independently owns launch configuration, guarded OBS startup, Countdown handoff, Spotify startup/fade timing and online-event deduplication. Actual C#, hidden packaged controls and released-package installation pass; explicit import/review and an intentional real-stream acceptance remain. |
| 8 | Going-live announcements and bookkeeping | Vital | The new launch module invokes an explicitly configured existing private follow-up only after OBS confirms streaming. The installed native broadcaster/webhook/session/reward action and Walk Ons reset were audited as having no old HTTP-server dependency and are deliberately not exported. Controlled live delivery acceptance remains; never automate it in tests. |
| 9 | Bot chat routing | Vital | Chat Routing 1.0.1 implements the compatible Twitch bot-message/reply contract; actual C# and package tests pass with synthetic sinks. Import and controlled live account/reply acceptance remain. |
| 10 | On-stream chatbox | Vital | Live Chatbox (chat-core) 1.0.0 preserves the existing renderer and appearance URL options with live pronouns/PluralMind, moderation and synthetic tests, without the archive or old server. Isolated service/browser checks pass. User accepted the two-chatbox setup (ticker and normal) on 2026-11-05. Each source retains its own appearance query with the shared Appearance field empty; this feature no longer awaits visual acceptance. |
| 11 | Chat archive | Later | Private history, search, retention and export do not block switchover. Preserve existing data; do not delete or publicly bundle it. |
| 12 | Reminders | Vital | Corrected Reminders 1.0.1 preserves the eight dock/chat action and two command identities, uses Chat Routing and keeps all list management inside Universal Dock. It has no OBS or combined-overlay renderer. Source/package/released tests pass; the user imported and initialized it and accepted add/delete/completed-history management on 2026-11-06. Read-only verification confirms private schema 1.0.1 and content-free public readiness. Explicit owner-only list-command acceptance and removal of obsolete Show/Hide/`!remshow` entries remain. Do not import the rejected 1.0.0 package. |
| 13 | Wheel | Vital | Wheel 2.1.0 is published and installed as a fidelity extraction: the six installed core action IDs, schema-2 profiles/state, two defaults, editor, canvas design, animation, timings, placement, palette and exact result sound are preserved. Existing Sub Spin/Selfcare adapter modes remain compatible; an inert generic trigger template makes commands/redeems/subscriptions easier without creating triggers. Source/package/C#/hidden-desktop/released-package tests pass. Explicit Streamer.bot import, visual combined-overlay acceptance and controlled trigger acceptance remain. |
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
2. Publish/import/review the completed Stream Launch package, then perform one operator-intended stream acceptance of Countdown, Spotify and the retained private follow-up. The implementation preserves action identities and no longer uses the old Node fade clock. Synthetic coverage is complete; starting a real stream or sending public messages is never a build test.
3. Publish/import/review corrected Reminders 1.0.1 as a dock-only feature, then continue viewer interactions with Wheel, named/language timers, redeem checklist, walk-ons and shoutout clips. Each migration includes private-data compatibility; only features that actually render to the audience receive combined-overlay integration.
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
