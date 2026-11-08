# Module migration checklist

Updated November 8, 2026. **20 of 24 required feature areas implemented; 4 still to migrate.**

Checked means the replacement is implemented and published/installed/imported as applicable. Remaining acceptance and retirement work is listed separately below. This counts feature areas, not package files; going-live bookkeeping is deliberately retained as a private native hook.

## Done: replacement implemented

- [x] Archipelago
- [x] Audio Routing
- [x] Cameras — user completed live acceptance; no further camera checks needed
- [x] Chat Routing — bot messages and replies
- [x] Controller display
- [x] Countdown
- [x] Going-live announcements and bookkeeping — retained private native hook
- [x] Live Chatbox — normal and ticker, including live enrichment
- [x] Named / language timers
- [x] Pokemon Encounters
- [x] Reactive Guests — user completed live acceptance
- [x] Redeem Checklist
- [x] Reminders — dock list and chat lookup
- [x] Scene Links — use 2.0.2
- [x] Shoutout Clips — core player/command accepted; optional AI text belongs to the Ollama migration below
- [x] Spotify Music
- [x] Stream Launch
- [x] Video
- [x] Walk Ons — use 2.1.1; one live observation remains below
- [x] Wheel

## To do: remaining migration

- [ ] **Phone Deck — Sessions 1–5 implemented; Session 6 next.** OBS foundation, optional framework, launch/countdown, Audio Routing/Wheel/Video and legacy-card/combined-widget compatibility pass isolated checks. Only verified provider metadata updates are published; Phone Deck has no production install or handoff yet. Follow the [12-session checkpoints](phone-deck-sessions.md); the existing deck still needs the old server until Session 6. Preserve cards, pairing, TLS, action types and active-state indicators.
- [ ] **Embedded widgets, including Tangia.** Preserve existing widgets, private URLs, layouts and scene routing in the modern setup.
- [ ] **Bouncing avatar.** Copy the existing appearance, animation and layout into the combined overlay.
- [ ] **Local AI / Ollama integration.** Extract the functionality actually used, including the remaining Shoutout Clips warm-text dependency.

## Remaining acceptance and final switch

- [ ] Observe one normal viewer first-chat/repeated-chat sequence with Walk Ons 2.1.1: one entrance per stream, with reset permitting the next entrance. Synthetic and controlled playback checks already pass.
- [ ] After the four migrations above, audit remaining local URLs/callers and rehearse the complete workflow with the old repository server stopped, with rollback available.
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
