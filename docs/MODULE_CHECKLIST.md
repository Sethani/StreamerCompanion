# Module migration checklist

Updated November 14, 2026. **24 of 24 required feature areas implemented; final integrated switch remains.**

Checked means the replacement is implemented and published/installed/imported as applicable. Remaining acceptance and retirement work is listed separately below. This counts feature areas, not package files; going-live bookkeeping is deliberately retained as a private native hook.

## Done: replacement implemented

- [x] Archipelago
- [x] Audio Routing
- [x] Bouncing Avatar — 1.0.1; guarded handoff accepted with the original image, motion and colour changes
- [x] Cameras — user completed live acceptance; no further camera checks needed
- [x] Chat Routing — bot messages and replies
- [x] Controller display
- [x] Countdown
- [x] Embedded Widgets / Tangia — backed-up handoff accepted in the existing combined overlay; cadence fix verified
- [x] Going-live announcements and bookkeeping — retained private native hook
- [x] Local AI / Ollama - 1.0.0; published, running and backed-up caller handoff verified
- [x] Live Chatbox — normal and ticker, including live enrichment
- [x] Named / language timers
- [x] Phone Deck — 2.0.4; accepted handoff/editor/startup repair and installed OBS traffic reduction
- [x] Pokemon Encounters
- [x] Reactive Guests — user completed live acceptance
- [x] Redeem Checklist
- [x] Reminders — dock list and chat lookup
- [x] Scene Links — native cutover accepted; 2.0.3 optional Phone Deck controls published
- [x] Shoutout Clips — core player/command accepted; AI text now uses independent Local AI
- [x] Spotify Music
- [x] Stream Launch
- [x] Video
- [x] Walk Ons — use 2.1.1; one live observation remains below
- [x] Wheel

## Feature migration complete

[Local AI release and private caller handoff](local-ai-extraction.md) passed. Remaining work concerns integrated ownership, startup and retirement.

## Remaining acceptance and final switch

- [x] [Recover Embedded Widgets ownership](final-switch-audit.md): confirmed closed extra views, controlled OBS document unload, scoped durable recovery and exact enabled/settings restoration; one active owner verified without repeating Tangia acceptance.

- [x] [Reduce OBS request traffic](obs-websocket-traffic.md): event-driven Phone Deck state with slower reconciliation; preserve safe dispatch/readback. Widgets itself makes no direct OBS requests.

Phone Deck Sessions 1–12 are complete. The backed-up ownership handoff preserved pairing/TLS/layout/preferences, passed restored off-stream mute acceptance, and the operator confirmed the existing handset connects. Phone Deck 2.0.3 includes the installed startup/connection repair. Session 7 providers are published/upgrade-verified; Spotify is now installed at 2.0.4, while Source Modules 1.0.1 still requires a backed-up native reimport/Initialize if not adopted. Session 8 publishes Cameras 2.0.2, Reactive 2.1.1 and Scene Links 2.0.3 contributions with unchanged native data; adopt via explicit Catalogue updates and add cards manually. Session 9 publishes Named Timers 1.0.1, Reminders 1.0.2 and Redeem Checklist 1.0.1; their phone controls require backed-up native imports/restart and Initialize; the user reports completing that import/restart. Session 10 publishes Walk Ons 2.1.2 and Shoutout Clips 2.1.1 with unchanged native data, so Catalogue updates suffice for those additions. Session 11 publishes Archipelago 1.0.10, Controller 1.1.1 and Pokemon 1.7.2 with scoped service controls; no new native imports are needed. Session 12 adds Live Chatbox 1.0.1 read-only connection status and the all-package coverage/stabilization audit; no new native import, app rebuild or Phone Deck update is needed. See the [12-session checkpoints](phone-deck-sessions.md). Keep the old server until the integrated retirement rehearsal; do not repeat accepted Cameras/Reactive live checks.

- [ ] Observe one normal viewer first-chat/repeated-chat sequence with Walk Ons 2.1.1: one entrance per stream, with reset permitting the next entrance. Synthetic and controlled playback checks already pass.
- [x] [Audit remaining URLs and callers](final-switch-audit.md): existing aggregate source, retained ad timing, startup/shutdown and deferred source dependencies identified.
- [ ] Replace the retained ad scheduler Countdown HTTP read; verify the video-entrance native branch and adopt the modern aggregate source with rollback.
- [ ] Rehearse the complete workflow with the old repository server stopped, with rollback available.
- [ ] Cold-start the complete modern setup and verify retained preferences, automatic-start settings, private media and phone pairing.
- [ ] Retire the old server's startup/routes only after that rehearsal passes; preserve private data and rollback backups.
- [ ] **Final cleanup: remove legacy Import settings options.** Once the final switch is complete and existing settings are confirmed migrated, remove migration-only buttons/readers from the desktop and all affected modules. Preserve saved settings, ordinary backup/restore, Streamer.bot action imports and media imports. Verify fresh installations work from defaults/manual setup without legacy files.

Previously accepted individual checks stay complete. Reopen them only for a new defect or a relevant integration change.

## Shared foundation already done

These support the features above and are not additional items in the 24-feature count.

- [x] Companion host and Installed / Catalogue / Settings navigation
- [x] GitHub module installation and updates
- [x] Universal Dock
- [x] Universal Overlay
- [x] Source Modules / scene routing
- [x] Update Probe — installation/update test utility

## Later / excluded

- **Later:** Chat Archive; TTRPG-specific tools/layouts.
- **Dropped from this switchover:** Stream Together.

The old server must remain available until the remaining migrations and final switch pass. Detailed priorities and acceptance evidence are in the [feature checklist](switchover-feature-checklist.md), [migration audit](legacy-migration-status.md) and [validation record](VALIDATION.md). Update this page and the detailed checklist together when a slice changes status.

November 13 reliability repairs are published/installed in Companion 1.3.2, with Spotify 2.0.4, Dock 1.1.2, Overlay 1.0.1 and Phone Deck 2.0.3. [Repair and verification record](startup-reliability-repair.md). The current feature count is 24/24; all twelve Phone Deck sessions, Avatar and Local AI handoffs are complete.

Phone Deck 2.0.4 is published and installed with event-fed OBS state, scoped structural reads and slower reconciliation; [release/adoption verification](obs-websocket-traffic.md). Pairing/TLS/layout/preferences and OBS state were preserved, with no new native import or app rebuild. Feature count is 24/24; Avatar is operator-accepted and Local AI handoff is verified. Integrated retirement remains.
