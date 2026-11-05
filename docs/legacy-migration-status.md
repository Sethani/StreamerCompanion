# Remaining legacy migration status

Reviewed 2026-11-05. The old personal registry still lists both migrated and unmigrated features; its presence alone is not evidence that a legacy implementation is still required. This is a source/dependency audit, not proof that every installed action or live trigger works.

Writing Challenge is explicitly parked at the user's request: it was experimental and is not a switchover requirement. It is omitted from the priority candidates below; its code and data are not removed.

## User switchover priorities

The authoritative [feature checklist](switchover-feature-checklist.md) records 24 vital features. Chat Archive (#11) and TTRPG (#22) are later; Stream Together (#18) is dropped. Writing Challenge remains parked. Live chatbox/enrichment and Reactive/camera tools stay vital; deferring the archive/TTRPG does not defer these dependencies. Ollama is now vital despite earlier “optional” wording. The source audit below does not override these priorities.

## Verified boundaries and next extraction

| Feature | Confirmed source/ownership | Remaining dependency | Disposition |
| --- | --- | --- | --- |
| Countdown timer | Personal install-streamerbot-countdown.js owns portable.countdown.config/state; source.js renders it; countdown/app.js provides controls | Current dock mixes timer controls with launch APIs | Published Countdown 1.1.0: owned engine/export/controls/drawing and combined integration; controlled user import/visual acceptance remains |
| Stream launch | Personal countdown/app.js calls Stream - Configure Launch, Stream - Launch, /api/stream/config and legacy /api/state; install-streamerbot-stream-launch.js owns orchestration | OBS/Spotify/startup integration and legacy fallback paths; server startStreamCountdownAutomation already forwards Countdown - Start and retains a Node Spotify-fade clock | Keep current launch tools; separately audit/test/package before retiring old server |
| Reminders | install-streamerbot-reminders.js, public/reminders, portable.reminders.state | Add/List Mine explicitly call Chat - All Platforms; state holds private viewer backlogs | Next candidate after a defined chat-routing boundary and privacy tests; do not publish/export stored reminder content |
| Named/language timers | install-streamerbot-named-timers-overlay.js publishes timer_end_* globals into portable.timers.state | Reads broad existing globals; mutates existing Timer_Add/Timer_Check/Timer_Command and queue wiring | Defer until timer ownership/trigger/queue contract is documented; publisher alone is not a complete module |
| Controller, Archipelago, Pokemon, Video | Already independently published modules; targeted combined-source integration for service modules and existing Video compatibility | Live import/visual acceptance as applicable | Preserve accepted behavior; do not re-extract stale registry entries |
| Spotify | Published service module | Legacy Send Chat action still calls Chat - All Platforms; legacy launch flow depends on Spotify | Verify remaining chat/launch adapter instead of claiming all Spotify-related automation retired |
| Bot chat routing | Chat Routing 1.0.0 owns the existing Chat - All Platforms / Chat - Twitch identities and arguments, validation engine and native Twitch adapter | Account authentication remains in Streamer.bot; import/live account/reply acceptance remains | Actual C# passes against recording sinks; no automatic send or old-server dependency. All Platforms currently means the available Twitch adapter, not a YouTube implementation |

## Registry-level inventory requiring further source audit

The following entries were inventoried from personal public/modules/registry.json and its referenced manifests. Ownership/dependencies here are declarations, not verified complete extraction boundaries.

| Entry | Declared owner/dependencies | Next verification |
| --- | --- | --- |
| Wheel | Streamer.bot state and WebSocket; public/wheel and installer | Persistence/presentation, assets, commands and action references |
| Reactive guests (vital) / Stream Together (dropped) | Streamer.bot; external browser/guest URLs | Migrate Reactive only; preserve old Stream Together data without treating it as a cutover requirement |
| Walk-ons / shoutout clips | Streamer.bot; media/chat/clip integrations | Media portability, chat API and trigger/action references |
| Cameras / audio routing (vital); TTRPG (later) | Streamer.bot plus OBS WebSocket | Complete camera/audio migration; defer TTRPG-specific cards/layouts |
| Scene bindings | Streamer.bot, OBS and PowerShell | Window/app bindings, identifiers and process ownership |
| Phone deck | Node, HTTPS and OBS WebSocket | Pairing/authentication, TLS keys and local endpoints |
| Live chat / Chat Core (vital); archive (later) | Legacy service/core source; previously excluded helper | Preserve live enrichment; helper matches official PluralMind 2.1.1 (MIT, notice required). Split optional persistent history/search |
| Backends / Modules / Tests | Shared transport/registry adapters | Replace remaining personal routing assumptions as each feature migrates; shared public equivalents already exist |

## Ordered cleanup and retirement gates

1. Follow the dependency order in the switchover checklist: shared chat routing and live chat enrichment first, without requiring the deferred archive.
2. Complete launch/announcements/Spotify fades around the published Countdown; remove the remaining old-server fade clock.
3. Migrate all other vital viewer/production tools, integrating each into the same modern overlay and retaining private settings/data.
4. Keep Chat Archive/TTRPG out of the cutover critical path, and do not migrate Stream Together or the parked Writing Challenge for this switch.
5. Rehearse the full selected workflow with the old server stopped and a rollback available; only then retire its startup/routes.

No production actions, streams, games, chat messages or settings were changed by this audit. Test evidence and published module results are recorded in VALIDATION.md. The public repository contains no personal state, reminders, globals dump, credential or history export.
