# Switchover feature checklist

User priorities recorded 2026-11-05. Numbers match the feature list shown in chat. All listed features are vital except 11/22 (later) and 18 (drop). Writing Challenge remains separately parked and is excluded from this list.

There are 24 vital features: 15 now have independent or deliberately retained implementations, and nine feature areas still need public extraction. Published does not by itself prove the old server can stop. This checklist is the acceptance scope; the dependency/source audit remains in legacy-migration-status.md.

| # | Feature | Priority | Acceptance / current work |
| --- | --- | --- | --- |
| 1 | Archipelago | Vital | Published; retain accepted behavior and verify the final modern overlay without the legacy server. |
| 2 | Pokemon encounters | Vital | Published; user accepted. Preserve encounter/throw behavior and settings. |
| 3 | Controller display | Vital | Published; user accepted. Preserve native lifecycle and layout. |
| 4 | Video player | Vital | Published and accepted by the user with actual media/playback/layout on 2026-11-06. Preserve accepted links and behavior in the final old-server-off rehearsal. |
| 5 | Spotify controls | Vital | Published and accepted by the user on 2026-11-06. A real pre-stream manual pause exposed a stale ownership assumption; Spotify 2.0.2 observes actual playback and restarts it at stream handoff. Version 2.0.2 is installed, Ready and preserved the private account/configuration files; its autonomous fade, shared ownership and restart-after-pause behavior pass isolated test mode. Preserve the accepted account behavior in the final rehearsal. |
| 6 | Countdown | Vital | Published, imported and integrated with Stream Launch. The user confirmed its visual/runtime behavior during an operator-intended real stream on 2026-11-06. |
| 7 | Stream-launch automation | Vital | Stream Launch 1.0.0 is published, imported, Ready and accepted in an operator-intended real stream. It selected the launch flow, ran Countdown, started OBS and completed its guarded handoffs; source, actual C#, hidden packaged controls and released-package installation also pass. |
| 8 | Going-live announcements and bookkeeping | Vital | The new launch module invokes an explicitly configured existing private follow-up only after OBS confirms streaming. The user confirmed the public going-live announcement during the 2026-11-06 real-stream acceptance. The installed native broadcaster/webhook/session/reward action and Walk Ons reset remain deliberately private and have no old HTTP-server dependency. |
| 9 | Bot chat routing | Vital | Chat Routing 1.0.1 implements the compatible Twitch bot-message/reply contract; actual C#, package tests and controlled live acceptance pass. The user confirmed the bot response through `!remlist` on 2026-11-06. |
| 10 | On-stream chatbox | Vital | Live Chatbox (chat-core) 1.0.0 preserves the existing renderer and appearance URL options with live pronouns/PluralMind, moderation and synthetic tests, without the archive or old server. Isolated service/browser checks pass. User accepted the two-chatbox setup (ticker and normal) on 2026-11-05. Each source retains its own appearance query with the shared Appearance field empty; this feature no longer awaits visual acceptance. |
| 11 | Chat archive | Later | Private history, search, retention and export do not block switchover. Preserve existing data; do not delete or publicly bundle it. |
| 12 | Reminders | Vital | Corrected Reminders 1.0.1 preserves the eight dock/chat action and two command identities, uses Chat Routing and keeps all list management inside Universal Dock. It has no OBS or combined-overlay renderer. The user accepted add/delete/completed-history management and the owner-only `!remlist` response on 2026-11-06. Read-only verification confirms private schema 1.0.1, content-free public readiness and no obsolete Show/Hide/`!remshow` entries. Do not import the rejected 1.0.0 package. |
| 13 | Wheel | Vital | Corrected Wheel 2.1.1 is published, imported, initialized and accepted by the user on 2026-11-06. The six installed core action IDs, schema-2 profiles/state, two defaults, editor, canvas design, animation, timings, placement, palette and exact result sound are preserved. Existing Sub Spin/Selfcare adapter modes remain compatible; an inert generic trigger template makes commands/redeems/subscriptions easier without creating triggers. Unimported 2.1.0 is superseded. |
| 14 | Named/language timers | Vital | Named Timers 1.0.0 is published, imported, Ready and accepted for ordinary and delegated language flows. The stable generic actions/command/schedule/state and copied renderer are preserved. A controlled German redemption routed through #24, appeared on the overlay, fulfilled automatically, cleared its queue/active marker and disappeared. Source, actual C#, released-package and hidden/combined checks also pass. |
| 15 | Walk-ons | Vital | Walk Ons 2.1.0 is published, installed and locally accepted. It preserves all 16 action IDs, four moderator command IDs, the blocking queue, roster/weights/volume and once-per-stream state. Two existing sounds were copied to Companion's private media store and relinked without packaging their names or bytes. Real packaged-renderer playback completed through 3135 without consuming eligibility, and the existing combined overlay embedded exactly one autoplay owner while its legacy player remained inert. Actual C# first-chat/busy/retry tests and released-package installation pass. Include it in the final old-server-off rehearsal; a real viewer first-chat observation remains distinct from agent Test playback. |
| 16 | Shoutout clips | Vital | Preserve clip lookup/playback, titles, duration/mute and chat/API dependencies. |
| 17 | Reactive guests | Vital | Preserve PNG/avatar guest layouts, order and camera assignment. This remains vital despite dropping Stream Together. |
| 18 | Stream Together | Drop | Exclude from required migration and retirement gates. Do not delete current code/settings or change live OBS sources as part of recording the decision. |
| 19 | Camera controls | Vital | Preserve main/secondary modes and source/guest assignments; verify against isolated OBS fixtures first. |
| 20 | Audio routing | Vital | Preserve source routes and game-audio/VOD-safe controls; private device/source mappings stay local. |
| 21 | Scene Links | Vital | Preserve scene-linked application focus and category configuration; keep process/OBS operations explicit. |
| 22 | TTRPG tools | Later | Player cards, video slots and layouts do not block switchover. Do not defer ordinary camera/reactive tools with them. |
| 23 | Phone Deck | Vital | Migrate paired phone controls, HTTPS and OBS actions with explicit private pairing/certificate handling. A 2026-11-06 failure was operational: the phone was not on Wi-Fi. The legacy server, LAN address, TLS identity, pairing lifetime, dock bootstrap and Phone Deck listener were healthy; this does not replace the pending extraction. |
| 24 | Redeem checklist | Vital | Redeem Checklist 1.0.0 is published, imported, Ready and accepted. The private dock/history was confirmed; one live and one writing redemption routed exactly once; one completed and one refunded; history advanced from 14 to 16; and the legacy backlog stayed empty. The coordinated German test for #14 also passed. Stable identities, no port-3124 callback, source/C#/released-package/hidden checks and private-value exclusions are confirmed. Only the eventual whole-system old-server-off rehearsal remains. |
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
2. Completed 2026-11-06: Stream Launch, Countdown and the retained private follow-up passed one operator-intended real stream. Keep this as a regression requirement; starting a real stream or sending public messages is never a build test.
3. Reminders, Wheel, Named Timers, Redeem Checklist and Walk Ons have completed their feature-level migration/acceptance. Continue with shoutout clips. Each migration includes private-data compatibility; only features that actually render to the audience receive combined-overlay integration.
4. Migrate production tools: Reactive guests, cameras, audio routing, Scene Links, phone controls, widgets/bouncing avatar and the used local-AI integration. Adjust source-level ordering if dependency tracing reveals further shared prerequisites.
5. Rehearse all 24 vital features through the modern host/dock/overlay with the legacy server stopped. Resolve every remaining old URL, caller, service process or action dependency before the production switch. OBS/Streamer.bot and external applications remain separate dependencies as needed.

## Required completion checks

- [ ] Every vital feature has an owned implementation, explicit dependencies and saved-data compatibility.
- [ ] Existing accepted modules still work in the complete setup; no required media/settings were lost.
- [ ] Modern Universal Overlay and live chat display have no dependency on the old personal HTTP/static server.
- [ ] Scene visibility, module enable/disable, restarts and service automatic-start work without duplicate renderers or stale fallback.
- [x] Launch, Countdown, Spotify handoff, going-live messaging and controlled viewer interactions work through their new owners. Spotify 2.0.2 adds the regression fix for a manual pre-stream pause.
- [ ] Synthetic tests run without live chat, stream, hardware or production-state mutations; controlled live effects are separately authorized.
- [ ] User acceptance/rehearsal passes with the old server stopped, with a documented rollback.

Infrastructure is part of the baseline: module catalogue/updates, Universal Dock/Overlay, Source Modules and test/operator controls are retained without needing an additional priority vote. External OBS services can remain independent; inspect their URLs at cutover rather than unnecessarily rebuilding them.
