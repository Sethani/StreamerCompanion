# Phone Deck implementation checkpoints

Updated November 9, 2026. Implement **one bounded session per implementation turn**, then stop with a tested checkpoint. Target Companion **1.3.1**, without an app rebuild. The modern Phone Deck is installed/running after the accepted Session 6 handoff. **21/24** required feature areas are implemented; Session 7 is the next separate pass.

## Progress

| Session | Status | Deliverable |
| --- | --- | --- |
| 1 | Complete locally; unpublished | Independent OBS foundation and copied grid/editor |
| 2 | Complete locally; unpublished | Volume, item/group visibility, recording pause/resume, Studio Mode, preview/transition, replay buffer, virtual camera |
| 3 | Complete; Chat Routing provider published | Optional-provider discovery/dispatch, optional native helper imports, resource pickers, Streamer.bot forms and Chat Routing |
| 4 | Complete; both providers published | Stream Launch and Countdown contributions |
| 5 | Complete; all three providers published | Audio Routing, Wheel, Video and legacy-card/widget compatibility |
| 6 | Complete; handset accepted, 2.0.2 editor repair installed | Backed-up production HTTPS/pairing/layout handoff and usability corrections |
| 7 | Pending | Spotify and scoped Source Modules controls |
| 8 | Pending | Cameras, Reactive and explicit Scene Links application; no repeat physical-camera acceptance |
| 9 | Pending | Named Timers, Reminders and confirmed Redeem Checklist operations |
| 10 | Pending | Walk Ons and Shoutout Clips |
| 11 | Pending | Archipelago, Controller and Pokemon |
| 12 | Pending | Live Chatbox status, provider coverage and stabilization |

## Current local artifact

Source is `modules/phone-deck/`. The current artifact is `dist/modules/phone-deck-2.0.2.streammodule`; rebuild with `node scripts/build-modules.js phone-deck`. This version is published in the module catalogue and installed/running in production. Companion remains 1.3.1.

The archive contains Sessions 1–6 plus the editor/status repair; SHA-256 `074f26de07020dd22adb522d2785915370a0823bcb15497848053aa8a7117b82`, also in `dist/modules/SHA256SUMS`. Existing data/pairing/TLS and optional native action data are preserved. Earlier checkpoint hashes and boundaries below are historical. Sessions 7–12 remain later, optional passes.

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

## Historical boundaries and outstanding acceptance

This checkpoint does not provision/trust production TLS, select a LAN hostname, generate QR enrollment, copy private layout/pairing data, install optional helpers, implement providers, publish releases or hand off production ports. Numeric HTTPS pairing is verified using temporary certificates. Service-worker upgrades, broader offline acceptance, 100 synthetic contributions/cards, old-package upgrades and handset identity preservation remain explicit pre-Session-6 work. The current service worker never caches credentials, private API responses or mutations.

The Session 6 transfer and verification are recorded below; do not repeat the private migration. The next implementation turn after Session 6 acceptance implements **Session 7 only**: optional Spotify and scoped Source Modules contributions.

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

Session 5 publication completed from source `a9a9092962ce5e630f3db8862047c11ff97dca9b`, after Windows/Linux Check `42526045372`. Audio Routing 2.0.1 workflow `42526164242`, SHA-256 `420c17ac311b583cfd790a7ae8036f7ed1cc6e85c08e39aa1ad171c356c28a34`; Wheel 2.1.2 workflow `42526281829`, SHA-256 `cff7e61d2994495789de41f18eda6f9c75cc2d5e6030f8aa3269509d1192e207`; Video 2.2.1 workflow `42526169180`, SHA-256 `d0a5e73d8ee002ea8a5d63aeb11c14c8a265fcb3539e598f117ec275da11a544`. The first pending Wheel run was superseded by GitHub and requeued after the slot cleared. All final workflows and catalogue hashes are verified.

Actual anonymous GitHub upgrades in packaged Companion 1.3.1 passed: preinstalled/imported dependencies, old Ready state, package hashes, complete native-data equality, retained private data/favorites/import readiness, provider declarations and served dock/overlay. The fixture received only GetActions and all test processes were stopped. No HTTP 504/fallback was needed. The release fixture was corrected to import Source Modules before asserting Ready; this changed no runtime package. Phone Deck remains absent from the published catalogue.

## Session 6 release/cutover checkpoint

The verified candidate adds private hostname persistence/local settings, exact Host validation, old shell-cache cleanup and offline/restart session-token handling. Full source/runtime/hidden checks cover 120 synthetic contributions/cards, an existing HTTPS cookie and certificate, old worker replacement, offline navigation, independent live/parked controls, drafts/focus/page preservation, no replay, revocation and clean shutdown. Packaged Companion 1.3.1 runtime checks pass. The private legacy ownership guard is tested fail-closed. Existing optional native helper IDs are present; no native import/restart or app rebuild is required.

Rollback data and target private configuration are staged without transferring listeners. Candidate package SHA-256: `ff01412da0152619586ca08f1c19f4b388011365706ee898005ce8b1d13ebdae`. Release and production acceptance remain pending until the records below. The first Phone Deck release has no older public predecessor: released-package upgrade acceptance explicitly uses a synthetic 1.9.9 package before the actual 2.0.0 archive. Do not record 21/24 until the dedicated handoff and handset checks pass.

## Session 6 release and production transfer record

Phone Deck 2.0.0 source `233e5b17fe7527196ffcd8a9786ae793b032c975` passed Windows/Linux Check `42529309333` and publication `42529452016`, hash `ff01412da0152619586ca08f1c19f4b388011365706ee898005ce8b1d13ebdae`. Its actual released package passed isolated Companion 1.3.1 install/upgrade checks before the private layout/pairing/TLS transfer and server-only restart.

The first production check exposed blocked linked/embedded public-page navigation. Phone Deck 2.0.1 fixes that distinction without relaxing private API Host/Origin/CSRF checks. Source `f68c477b03d91f89ab738c843a318368ec7fc366` passed Windows/Linux Check `42602250059`; publication `42602681852`, hash `e931c2447b7df1d58fc4a4b39bec3e13e5ef2f0f34668051d72b59449287b71a`. Real GitHub 2.0.0-to-2.0.1 upgrades passed native-data equality and preserved data, cookies, TLS, favorites/automatic-start in packaged 1.3.1. No download fallback was needed. The patch is installed through the running host and only Phone Deck restarted. HTTP and file-origin embedded settings both pass hidden acceptance; production public navigation is 200 while cross-site private API access stays 403.

Production verification confirms all four pages/38 cards and their identities/appearance, the one existing pairing/expiry, TLS, original OBS scene/mutes/54 readable masks and other host preferences preserved. Automatic start is enabled. A recorded off-stream saved-card mute/unmute passed and restored the initial state. Native helpers are unchanged/present; no Streamer.bot import/restart, app rebuild or unchanged-provider publication was needed. Initial stale native inventory was corrected using the existing read-only Audio Routing Refresh, without routing Apply/Toggle. OBS/native connections are healthy after re-saving the same connection settings.

The Ethernet profile required a Windows-approved application/port/local-subnet rule limited to Private LAN HTTPS; the existing certificate/address are unchanged. Legacy deck APIs now refuse fallback and the repository server retains server-only PID tracking. The old server remains needed by the other vital migrations. Handset confirmation and the 21/24 feature count are still pending until the final record below; no later provider session is started here.

### Session 6 final acceptance — November 9

The operator confirmed the original handset connects with its existing pairing. Session 6 is complete at **21/24** required feature areas. Phone Deck 2.0.1 is running with automatic start, original pages/cards/pairing/TLS/preferences preserved, and legacy ownership blocked. Production off-stream mute acceptance is restored; no stream/recording/chat/routing Apply was started. All isolated processes/listeners are stopped. Stop at this checkpoint. **Next separate turn: Session 7**, optional Spotify playback/volume/status and scoped Source Modules controls preserving saved scene lists. Keep the repository server for widgets, bouncing avatar and Ollama; leave final-switch Import settings cleanup deferred.

### Session 6 usability repair — Phone Deck 2.0.2

The crowded-editor/status report was a frontend issue: connections were healthy, recovery buttons were always visible and draft gating had poor feedback. The repair separates Card/Page editing and Connections/Phones settings, puts module selection beside Action, folds details, replaces the overlay with responsive workspaces, preserves labels/drafts and shows recovery only when genuinely needed. Search/Enter/navigation cannot write connection settings or run actions.

Source `470f4b0991c84be64ebe57eeebf9ca619fed3e0d` passed Windows/Linux Check `42608461071`; publication `42608706677`, SHA-256 `074f26de07020dd22adb522d2785915370a0823bcb15497848053aa8a7117b82`. Full source/hidden checks and actual released 2.0.1-to-2.0.2 upgrades passed in packaged Companion 1.3.1. The idle/off-stream production update restarted only Phone Deck and preserved exact protected-data hashes, host preferences and OBS state; both connections remain healthy. No real effect or connection reset was used. Open pages were not reloaded; save/discard an older draft before refreshing. This is an installed Session 6 repair; Session 7 is not started and the count stays 21/24.
