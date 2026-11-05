# Remaining legacy migration status

Reviewed 2026-11-05. The old personal registry still lists both migrated and unmigrated features; its presence alone is not evidence that a legacy implementation is still required. This is a source/dependency audit, not proof that every installed action or live trigger works.

## Verified boundaries and next extraction

| Feature | Confirmed source/ownership | Remaining dependency | Disposition |
| --- | --- | --- | --- |
| Countdown timer | Personal install-streamerbot-countdown.js owns portable.countdown.config/state; source.js renders it; countdown/app.js provides controls | Current dock mixes timer controls with launch APIs | Published Countdown 1.1.0: owned engine/export/controls/drawing and combined integration; controlled user import/visual acceptance remains |
| Stream launch | Personal countdown/app.js calls Stream - Configure Launch, Stream - Launch, /api/stream/config and legacy /api/state; install-streamerbot-stream-launch.js owns orchestration | OBS/Spotify/startup integration and legacy fallback paths; server startStreamCountdownAutomation already forwards Countdown - Start and retains a Node Spotify-fade clock | Keep current launch tools; separately audit/test/package before retiring old server |
| Reminders | install-streamerbot-reminders.js, public/reminders, portable.reminders.state | Add/List Mine explicitly call Chat - All Platforms; state holds private viewer backlogs | Next candidate after a defined chat-routing boundary and privacy tests; do not publish/export stored reminder content |
| Named/language timers | install-streamerbot-named-timers-overlay.js publishes timer_end_* globals into portable.timers.state | Reads broad existing globals; mutates existing Timer_Add/Timer_Check/Timer_Command and queue wiring | Defer until timer ownership/trigger/queue contract is documented; publisher alone is not a complete module |
| Controller, Archipelago, Pokemon, Video | Already independently published modules; targeted combined-source integration for service modules and existing Video compatibility | Live import/visual acceptance as applicable | Preserve accepted behavior; do not re-extract stale registry entries |
| Spotify | Published service module | Legacy Send Chat action still calls Chat - All Platforms; legacy launch flow depends on Spotify | Verify remaining chat/launch adapter instead of claiming all Spotify-related automation retired |

## Registry-level inventory requiring further source audit

The following entries were inventoried from personal public/modules/registry.json and its referenced manifests. Ownership/dependencies here are declarations, not verified complete extraction boundaries.

| Entry | Declared owner/dependencies | Next verification |
| --- | --- | --- |
| Wheel | Streamer.bot state and WebSocket; public/wheel and installer | Persistence/presentation, assets, commands and action references |
| Writing | Streamer.bot; public/writing and installer | Prompt sources, suggestions/moderation, saved state and renderer |
| Reactive guests / Stream Together | Streamer.bot; external browser/guest URLs | URL/privacy handling and scene integration |
| Walk-ons / shoutout clips | Streamer.bot; media/chat/clip integrations | Media portability, chat API and trigger/action references |
| Cameras / audio routing / TTRPG | Streamer.bot plus OBS WebSocket | Device/scene mapping, credentials and live mutation tests |
| Scene bindings | Streamer.bot, OBS and PowerShell | Window/app bindings, identifiers and process ownership |
| Phone deck | Node, HTTPS and OBS WebSocket | Pairing/authentication, TLS keys and local endpoints |
| Chat archive / Chat Core helper | Legacy service/core source; previously excluded helper | Helper provenance, private data, runtime/SQLite and publication boundary |
| Backends / Modules / Tests | Shared transport/registry adapters | Replace remaining personal routing assumptions as each feature migrates; shared public equivalents already exist |

## Ordered cleanup and retirement gates

1. Package the complete countdown timer and integrate it into the same combined OBS source. Keep legacy stream-launch controls intact and do not invoke them during tests.
2. Resolve chat routing as a reusable module contract, then extract Reminders with explicit own-list/moderator visibility and no backlog export.
3. Audit Wheel/Writing as independent candidates; preserve appearance/assets and globals, including combined-overlay integration in the same change.
4. Package stream launch with isolated OBS/Spotify adapters and explicit user actions. This remains a blocker to switching off the legacy server even after Countdown migration.
5. Work through media/guest/device/phone/chat modules with feature-specific privacy and compatibility checks. Never infer retirement from a catalogue entry alone.
6. Finally audit actual startup/routes/OBS sources and test a reversible session with the old server stopped. Do not shut it down merely because the small timer package passed tests.

No production actions, streams, games, chat messages or settings were changed by this audit. Test evidence and published module results are recorded in VALIDATION.md. The public repository contains no personal state, reminders, globals dump, credential or history export.
