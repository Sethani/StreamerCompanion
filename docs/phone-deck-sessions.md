# Phone Deck implementation checkpoints

Updated November 8, 2026. Implement **one bounded session per implementation turn**, then stop with a tested checkpoint. Target Companion **1.3.1**, without an app rebuild. The existing Phone Deck stays in production until the dedicated Session 6 cutover.

## Progress

| Session | Status | Deliverable |
| --- | --- | --- |
| 1 | Complete locally; unpublished | Independent OBS foundation and copied grid/editor |
| 2 | Complete locally; unpublished | Volume, item/group visibility, recording pause/resume, Studio Mode, preview/transition, replay buffer, virtual camera |
| 3 | Complete; Chat Routing provider published | Optional-provider discovery/dispatch, optional native helper imports, resource pickers, Streamer.bot forms and Chat Routing |
| 4 | Complete; both providers published | Stream Launch and Countdown contributions |
| 5 | Complete; provider publication recorded below | Audio Routing, Wheel, Video and legacy-card/widget compatibility |
| 6 | Pending; off-stream | Publish 2.0.0 and verified providers; backed-up production HTTPS/pairing/layout handoff |
| 7 | Pending | Spotify and scoped Source Modules controls |
| 8 | Pending | Cameras, Reactive and explicit Scene Links application; no repeat physical-camera acceptance |
| 9 | Pending | Named Timers, Reminders and confirmed Redeem Checklist operations |
| 10 | Pending | Walk Ons and Shoutout Clips |
| 11 | Pending | Archipelago, Controller and Pokemon |
| 12 | Pending | Live Chatbox status, provider coverage and stabilization |

## Current local artifact

Source is `modules/phone-deck/`. The local artifact is `dist/modules/phone-deck-2.0.0.streammodule`; rebuild with `node scripts/build-modules.js phone-deck`. It is a development checkpoint carrying the intended final version, **not a released or production-installed package**. It is absent from the published catalogue. Companion remains 1.3.1.

The archive now contains Sessions 1–5; SHA-256 `ebf863392e838d52e33e77ad967b3210485c1242a08cb35b3175d88f1fe99523`, also in `dist/modules/SHA256SUMS`. Phone Deck remains unpublished/not installed in production. Session 5 provider candidates are Audio Routing 2.0.1, Wheel 2.1.2 and Video 2.2.1; publication proof follows below. Their full native export bodies match the preceding releases. Earlier checkpoint hashes/source records below are historical and no longer identify the current artifact.

## Session 1 checkpoint

The session sections below retain their historical boundaries; the current checkpoint and next action are in Progress and the Session 5 section.

The existing dark grid, appearance, editor structure, page/card identities, ordering, duplication, icon/colour/size controls and wake-lock option are copied. Save is explicit; polling preserves nodes, focus, caret, scroll, unsaved editor drafts and scene selections. Configuration and execution carry revisions. Conflicts retain the losing draft instead of overwriting it. New defaults contain only OBS controls. Unknown legacy cards and their fields remain intact and unavailable; guided `stream.launch` never becomes raw OBS Start.

Direct OBS WebSocket v5 authentication and authoritative inventory support scene switching, raw streaming start/stop, recording start/stop/toggle and audio-input mute toggle. Streaming requires a 1.2-second pointer hold or accessible keyboard confirmation. The widget reports scene/stream/record state; disconnected or failed inventory shows unknown status. No Streamer.bot, feature module, Node monolith, overlay or additional native import is required.

Mutations are serialized and read back. Request IDs and the latest 256 operation records persist privately; duplicate IDs return their original result without another write, including after newer operations or restart. Interrupted/unconfirmed outcomes block new dispatch until explicit successful read-only Refresh. Requests are never automatically retried. This is OBS readback confirmation, not proof that viewers received a broadcast.

Management uses loopback 3142. HTTPS 3125 starts only with private TLS files. Credentials and pairing administration are local-only; paired phones may edit the layout. Exact Host/Origin and CSRF checks guard writes; no installation bearer token is used or exposed. Tests create disposable TLS identities and isolated ports. No production cards, pairings, certificate, expiry, OBS setting, startup preference or listener ownership was changed.

## Verification

- `cd companion; npm run check:phone-deck`: synthetic authenticated OBS server, all foundation controls/readback, exact-name and missing-target handling, rejected writes, mismatched readback, dropped responses, sequential and concurrent toggles, stale revisions, simultaneous editors, failed persistence, saved acknowledgements and interrupted-operation recovery.
- The same command exercises disposable HTTPS pairing, paired editing, revocation, private connection masking, rejected Host/Origin/CSRF requests, actual Companion registry installation and child-service/listener cleanup on an isolated port with no Streamer.bot/OBS connection.
- Hidden Electron desktop and phone-sized windows verify copied presentation, two clients, no discovery mutations, stable nodes/focus/caret/scroll/drafts, explicit saves/conflicts, preserved legacy actions, blank target selection, scene submission, keyboard confirmation, short/full holds and disconnect/reconnect.
- `cd companion; node scripts/test-build.js`: deterministic archives and existing metadata/action-export requirements across all 24 source packages. Source-package count is separate from the 24 required feature areas.
- Runtime and disposable installed-service checks also pass under the existing packaged Companion 1.3.1 executable in Node-only mode, using temporary data and isolated ports. No second production-profile host was opened. The module-publishing regression passes; no catalogue/release was changed. Final process inspection found no remaining Phone Deck test processes.
- Runtime assets include Lucide's ISC notice, first-party MIT licence, PWA manifest/icon and an offline navigation response. Private data/TLS files are excluded. No real stream, recording or mute action is used by these tests.

## Boundaries and outstanding acceptance

This checkpoint does not provision/trust production TLS, select a LAN hostname, generate QR enrollment, copy private layout/pairing data, install optional helpers, implement providers, publish releases or hand off production ports. Numeric HTTPS pairing is verified using temporary certificates. Service-worker upgrades, broader offline acceptance, 100 synthetic contributions/cards, old-package upgrades and handset identity preservation remain explicit pre-Session-6 work. The current service worker never caches credentials, private API responses or mutations.

Next turn implements **Session 6 only**, the dedicated off-stream cutover. Complete the 100-card/HTTPS/revocation/service-worker/offline/released-upgrade acceptance first, then snapshot and transfer the existing handset identity, layout and TLS with rollback. Do not advertise the local 2.0.0 checkpoint as production-installed before that handoff.

Session 6 must snapshot pages/cards, pairing, TLS, host/preferences and relevant OBS state; retain IDs and expiry; guard the legacy owner and restart only its repository server to release HTTPS. Native import/restart is needed only if helper actions change. Confirm the existing phone reconnects without re-pairing. Any real scene/mute acceptance records and restores its original state.

The whole-system checklist remains **20 of 24**. Record **21 of 24** only after Session 6 succeeds. Widgets, bouncing avatar and Ollama remain separate migrations, so keep the old server available. Removing migration-only Import settings controls is final-overall-switch cleanup. Parked Writing cards stay preserved without executing legacy code.

## Session 2 checkpoint

Implemented the common OBS set in `service/obs-controls.js`, with model validation, revisioned dispatch and editor resource pickers. Buttons support volume presets; scene/group item show/hide/toggle; recording pause/resume; Studio Mode toggle; preview scene selection; transition selection and explicit preview-to-program transition; replay start/stop/save; and virtual-camera start/stop/toggle. A volume form provides an accessible 0–100% slider and explicit submission. Its draft remains stable through polling while the actual OBS volume is displayed separately. Existing defaults, layout identities and legacy cards are preserved; no cards were automatically added and no OBS setup/output settings were changed.

Capability discovery uses advertised requests and feature-scoped reads. Unsupported/missing status disables only the affected controls with visible reasons. Scene/group targets retain the exact container, numeric item ID and case-sensitive source name, preventing fallback to a different occurrence. Missing selected targets remain labelled unavailable; picker inventory updates through polling/SSE without replacing editors or slider drafts. Recording, Studio Mode and replay prerequisites are checked again before dispatch. Reconnect performs no mutations. Existing transition duration/settings stay unchanged. Replay saves and transitions without an observable new program scene report Requested; other writes require bounded readback. Rejected, lost or mismatched operations are never automatically retried.

Focused Session 2 synthetic tests cover every action, exact/reused/missing group targets, independent duplicate source names, 0–100% validation, mute preservation, recording prerequisites, independent Studio read/write capability, preview/program separation, transition choice, replay deduplication across newer state, rejected writes, failed/timed-out feature reads, readback mismatch, dropped output responses and mutation-free reconnect. Session 1 security/pairing/revision/durable-result checks remain in the focused suite. Hidden two-client desktop/mobile tests cover explicit slider submission/readback, focus/scroll/caret/drafts, resource editor creation, visible prerequisites, unsupported capabilities and Requested outcomes. A discovered stale-picker defect has a browser regression. All fixtures use disposable data and isolated ports; no real OBS, stream, recording, camera or viewer effect is used.

Re-run with `cd companion; npm run check:phone-deck`. The Session 2 runtime suite is `scripts/test-phone-deck-obs-controls.js`. Deterministic archive and existing packaged Companion 1.3.1 Node-only compatibility checks also apply. Session 2 added no provider contract, native import, release publication, production installation, handoff or app rebuild. Session 3 subsequently added the optional framework below.

Final compatibility checks passed under the existing packaged Companion 1.3.1 executable in Node-only mode, including the new common-controls suite and disposable installed-service lifecycle. Core reads/dispatch are separated from optional status scans; a regression confirms a basic action completes while a background replay-status request is still pending. Mutations remain serialized. Deterministic builds across all source modules pass. No production-profile Companion instance was launched.

Final process inspection found no Phone Deck test processes remaining. Test fixtures removed their temporary profiles/certificates. Production apps, Phone Deck pairing/layout/TLS, OBS state and listener ownership were not changed.

## Session 3 checkpoint

Implemented [contribution contract v1](phone-deck-provider-contract.md): installed-module discovery by package ID; native action/state and scoped loopback-service transports; text/number/boolean/resource fields; list/map/static/action resources and filtering; selected scalar state projections; prerequisites; and matching owner acknowledgements. An installed module can add future controls through metadata without a Phone Deck update. Missing/malformed/newer-version declarations and absent/stopped/unconfigured owners disable their own controls. Discovery never executes actions, starts/installs services or adds cards.

The editor has naturally sorted module groups, local accent/case-insensitive all-term search, explicit resource selection and empty states. Polling preserves configured resources, form drafts, focus/caret, scroll and selected pages. Unknown resources remain selected/unavailable. A post-save configuration-reference bug and a stale picker discovered during browser acceptance have regressions. Notifications are batched so 100 contributions do not flood the browser.

Optional local setup enables Companion discovery and an authenticated Streamer.bot connection, both off by default. Credentials are private/server-side; paired clients cannot administer them, and no installation bearer token is read. Native reads use only GetActions and declared GetGlobal variables. The four original helper UUIDs/arguments are preserved through additive `streamerbot.optionalActions`; the OBS base still has no required imports/modules. Title/category forms and custom-action/resource selection use those optional owners. Legacy chat helper identities remain hidden compatibility records. Chat Routing 1.0.2 contributes the active bot-message form using its existing action/arguments, with no native code/ID/behavior change or additional import/restart for existing installations.

Provider commands have separate queues and durable request scopes from OBS. Matching terminal owner results confirm completion; dispatch without that contract reports Requested. Wrong/late/overwritten results, dropped responses, failed persistence, stale deck/definition revisions and restart uncertainty are covered. Unknown provider outcomes block only that provider until explicit read-only Refresh status; old requests never replay. Unrelated new controls/projections/static choices preserve existing control revisions.

Verification: full source suite and synthetic C# engines; focused Sessions 1–3 package/runtime/browser suites; provider/service lifecycle checks under the existing packaged Companion 1.3.1 executable; 100 synthetic contributions; two clients; authenticated native and CSRF service owners; resource/definition loss; missing optional actions; disconnected/reconnected/stopped owners; independent OBS while an owner waits; retained settings/drafts; matching acknowledgement and Requested presentation; and no synthetic discovery mutation. Test profiles, credentials, certificates and ports are disposable. No real chat/title/category/custom-action, OBS change, native import, production install or app rebuild occurred.

[Chat Routing 1.0.2](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/chat-routing-v1.0.2) is published; SHA-256 `b612a3694b8846b3c087b9a3579527fc310e346c100d57f389cb10f8faa470cb`. Source Windows/Linux Check `42516541954` and publication workflow `42516718984` passed. Released-package acceptance in Companion 1.3.1 used actual anonymous GitHub catalogue/assets: 1.0.1-to-1.0.2 upgrade, hashes, retained private data/favorites/import readiness and public provider metadata passed, with only GetActions sent to a synthetic backend. No HTTP 504 fallback was needed. The Phone Deck archive remains local until Session 6; its absence from the published catalogue is verified. Final process inspection found no test processes remaining. See VALIDATION.md for the final publication record. Session 4 (Launch/Countdown contributions) is next; it is not implemented in this turn.

## Session 4 checkpoint

Stream Launch 1.0.1 declares optional guided Go Live and owner-progress widgets. Guided Go Live dispatches only the existing Stream - Launch action and its saved settings. Mandatory 1.2-second holds and keyboard confirmation remain enforced even on cards saved with hold disabled. Raw OBS Start stays independent and invokes no launch/countdown/music/follow-up action. Progress reports starting/complete/partial/error/interrupted and the owner's optional-step outcomes; no percentage or request completion is invented.

Countdown 1.1.1 declares start-saved, 3/5-minute presets, custom whole-second duration/finished text, save-settings, pause/resume/clear and a live clock widget. Native Start retains its existing saved-duration behavior; Configure does not restart a timer. The widget uses host time with monotonic elapsed time, freezes paused values, shows unavailable values as Unknown and draws expiry locally without sending a timer action. Both owners lack matching request-ID acknowledgements, so commands report Requested while progress remains independently observable state.

The framework corrections are generic hold/integer validation, labelled/time-based widget presentation and optional-settings initialization/refresh synchronization. A missed Session 3 admin setup binding was found and fixed, with a hidden-browser regression. Existing provider references/layouts/drafts remain intact; no automatic cards, imports, services or production effects occur. New contribution metadata introduces no Phone Deck dependency to either module.

Verification covers exact action IDs/arguments, raw/guided separation, missing confirmation, duplicate/stale requests, missing state/actions, reconnect, preserved configuration, pause/resume and custom/preset/zero durations. Hidden desktop/mobile two-client checks cover settings initialization/save, pointer holds/keyboard confirmation, live/paused/unknown/finished widgets, handset clock skew, partial-launch details and stable drafts/focus/caret/scroll/pages. Full source and actual synthetic C# checks pass. Hash-verified prior GitHub archives prove the entire native export data is identical, so existing imports require no restart/reimport. All effects are synthetic; no real stream, timer, music, announcement or follow-up is used. Released-package upgrade results are recorded after the two single-module workflows complete.

Session 5 is next. The production Phone Deck handoff remains Session 6, and the overall count remains 20/24. Do not repeat physical camera acceptance or remove final-switch Import settings options here.

Publication is complete from source `0e48d7891a6b2ddaeafbd7963cffd47896b1fe10`, after Windows/Linux Check `42521808448`. Countdown workflow `42521958630` published 1.1.1, SHA-256 `b3c22ea079731f08f5e9f121656b448b36ac95178f1f025afaf6c84884d2b617`; Stream Launch workflow `42521961580` published 1.0.1, SHA-256 `f8284fb33ff8677f5e0920d26c1e5dfcc4dbf1b09fb8b557b409035d69c1700e`. Actual anonymous GitHub catalogue/assets passed both upgrades in the existing Companion 1.3.1 runtime: dependency installation, hashes, identical native bodies, retained private data/favorites/import readiness, provider metadata and served dock/overlay. The synthetic Streamer.bot received only GetActions. No HTTP 504 fallback was needed. Phone Deck's absence from the public catalogue is verified; final process inspection found no test processes remaining. Production apps/data/listener ownership are untouched.

## Session 5 checkpoint

Audio Routing 2.0.1 adds native toggle/status with matching acknowledgements and explicit partial errors. Wheel 2.1.2 adds existing-profile spin/clear/status. Video 2.2.1 adds enabled registered-ID play/title/stop/status, without exposing source URLs. Wheel/Video dispatch remains Requested. None becomes required or automatically adds cards.

Legacy action/form compatibility preserves saved identities, pages, appearance, targets and optional helper IDs. Startup translates only in memory; explicit Save persists reviewed pinned references. Guided launch stays guided, raw Stop stays raw, and legacy countdown Start continues paused/running timers without restarting. Media widgets combine independent Video/Wheel status; OBS widgets show available launch progress. Writing stays parked. Removed resources stay selected and unavailable, without defaults or Node fallback. Future incompatible provider contracts require explicit review/edit.

Full source/C# synthetic checks, all hidden desktop/mobile browser suites and packaged 1.3.1 Node-only runtime acceptance pass. Prior published hashes prove complete native export equality for all three patches. Production configuration/apps/TLS/pairing/listeners remain untouched. Session 6 is next, off-stream, including its remaining 100-card/HTTPS/revocation/service-worker/offline/released-upgrade checks before the backed-up handset handoff. The overall count remains 20/24.
