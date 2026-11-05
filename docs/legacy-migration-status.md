# Remaining legacy migration status

Reviewed 2026-11-05. The old personal registry still lists both migrated and unmigrated features; its presence alone is not evidence that a legacy implementation is still required. This is a source/dependency audit, not proof that every installed action or live trigger works.

Writing Challenge is explicitly parked at the user's request: it was experimental and is not a switchover requirement. It is omitted from the priority candidates below; its code and data are not removed.

## User switchover priorities

The authoritative [feature checklist](switchover-feature-checklist.md) records 24 vital features. Chat Archive (#11) and TTRPG (#22) are later; Stream Together (#18) is dropped. Writing Challenge remains parked. Live chatbox/enrichment and Reactive/camera tools stay vital; deferring the archive/TTRPG does not defer these dependencies. Ollama is now vital despite earlier “optional” wording. The source audit below does not override these priorities.

## Verified boundaries and next extraction

| Feature | Confirmed source/ownership | Remaining dependency | Disposition |
| --- | --- | --- | --- |
| Countdown timer | Personal install-streamerbot-countdown.js owns portable.countdown.config/state; source.js renders it; countdown/app.js provides controls | Current dock mixes timer controls with launch APIs | Published Countdown 1.1.0: owned engine/export/controls/drawing and combined integration; controlled user import/visual acceptance remains |
| Stream launch | Published Stream Launch 1.0.0 owns portable.streamLaunch.config/configState/state/handledAtMs and preserves the four established action IDs; six-action export and dock controls contain the standalone implementation | Explicit Streamer.bot import, review of existing saved configuration, and one operator-intended live acceptance remain | New launches use Countdown directly, wait for confirmed OBS streaming, give Spotify its remaining-duration fade clock and call only the configured private follow-up; no personal HTTP/Node clock dependency |
| Reminders | Published Reminders 1.0.0 packages the established ten actions/three commands, private dock and combined-overlay renderer; `portable.reminders.state` is migrated into private storage plus a selected public projection | Explicit reimport/initialization and controlled real command acceptance remain | Chat Routing is required; package/C#/hidden/released tests use only synthetic records and include no stored reminder content or old-server dependency |
| Named/language timers | install-streamerbot-named-timers-overlay.js publishes timer_end_* globals into portable.timers.state | Reads broad existing globals; mutates existing Timer_Add/Timer_Check/Timer_Command and queue wiring | Defer until timer ownership/trigger/queue contract is documented; publisher alone is not a complete module |
| Controller, Archipelago, Pokemon, Video | Already independently published modules; targeted combined-source integration for service modules and existing Video compatibility | Live import/visual acceptance as applicable | Preserve accepted behavior; do not re-extract stale registry entries |
| Spotify | Published service module; Stream Launch calls its loopback /api/spotify/stream-start endpoint only after OBS confirmation | Legacy Send Chat action still calls Chat - All Platforms; controlled Spotify account acceptance remains | Isolated test mode confirms autonomous fade and shared scene/countdown session ownership without the old server; verify remaining chat adapter separately |
| Bot chat routing | Chat Routing 1.0.1 owns the existing Chat - All Platforms / Chat - Twitch identities and arguments, validation engine and native Twitch adapter | Account authentication remains in Streamer.bot; import/live account/reply acceptance remains | Actual C# passes against recording sinks; no automatic send or old-server dependency. All Platforms currently means the available Twitch adapter, not a YouTube implementation |

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
| Live chat / Chat Core (vital); archive (later) | Legacy service/core source; previously excluded helper | Live Chatbox (chat-core) 1.0.0 owns live-only ingestion/enrichment and the preserved renderer on port 3136, with both MIT upstream notices. No database/old-server dependency. User tested and accepted ticker and normal chatboxes on 2026-11-05; appearance remains independent in each source URL. |
| Backends / Modules / Tests | Shared transport/registry adapters | Replace remaining personal routing assumptions as each feature migrates; shared public equivalents already exist |

## Ordered cleanup and retirement gates

1. Follow the dependency order in the switchover checklist: shared chat routing and live chat enrichment first, without requiring the deferred archive.
2. Import/review the published Stream Launch package, retain the audited native announcement/bookkeeping hook privately, and perform one operator-intended launch acceptance. Do not treat synthetic dispatch as proof of remote webhook/reward delivery.
3. Migrate all other vital viewer/production tools, integrating each into the same modern overlay and retaining private settings/data.
4. Keep Chat Archive/TTRPG out of the cutover critical path, and do not migrate Stream Together or the parked Writing Challenge for this switch.
5. Rehearse the full selected workflow with the old server stopped and a rollback available; only then retire its startup/routes.

No production actions, streams, games, chat messages or settings were changed by this audit. Test evidence and published module results are recorded in VALIDATION.md. The public repository contains no personal state, reminders, globals dump, credential or history export.
