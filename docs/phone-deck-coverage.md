# Phone Deck contribution coverage

Session 12 source audit, November 14, 2026. All **24 source packages** have an explicit disposition: **21 contributors, 69 visible controls and 2 hidden compatibility controls**. This inventory is separate from the whole-system feature checklist, which remains **21/24**.

| Package / version | Owner transport | Visible controls | Completion |
| --- | --- | --- | --- |
| archipelago 1.0.10 | service | show, hide, refresh, wake, status | Requested |
| audio-routing 2.0.1 | streamerbot | toggle, status | matching acknowledgement |
| cameras 2.0.2 | streamerbot | main-mode, secondary-mode, secondary-video, assign-guest, status | Requested |
| chat-core 1.0.1 | service | status | read-only |
| chat-routing 1.0.2 | streamerbot | bot-message | Requested |
| controller-input 1.1.1 | service | show, hide, status | Requested |
| countdown 1.1.1 | streamerbot | start, preset-3, preset-5, custom, configure, pause, resume, clear, status | Requested |
| named-timers 1.0.1 | streamerbot | create, status | matching acknowledgement |
| phone-deck 2.0.3 | streamerbot | title, category, custom-action | Requested |
| pokemon-encounters 1.7.2 | service | clear, status | Requested |
| reactive 2.1.1 | streamerbot | show-guest, hide-guest | matching acknowledgement |
| redeem-checklist 1.0.1 | streamerbot | complete, refund, status | matching acknowledgement |
| reminders 1.0.2 | streamerbot | add, complete, status | matching acknowledgement |
| scene-bindings 2.0.3 | streamerbot | apply-link, status | matching acknowledgement |
| shoutout-clips 2.1.1 | streamerbot | play, play-input, stop, status | Requested |
| source-modules 1.0.1 | streamerbot | set-mode | matching acknowledgement |
| spotify 2.0.4 | service | resume, pause, toggle, next, previous, volume, volume-preset, status | Requested |
| stream-launch 1.0.1 | streamerbot | go-live, progress | Requested |
| universal-dock 1.1.2 | none | Desktop/OBS navigation foundation; no additional phone action. | none |
| universal-overlay 1.0.1 | none | Shared renderer foundation; individual owners expose their controls. | none |
| update-probe 1.0.2 | none | Installation/update test utility; no stream operation. | none |
| video 2.2.1 | streamerbot | play, stop, status | Requested |
| walk-ons 2.1.2 | streamerbot | test, test-picker, stop, reset, status | Requested |
| wheel 2.1.2 | streamerbot | spin, clear, status | Requested |

## Current source addition — unpublished Widgets foundation

The subsequent local embedded-widgets 1.0.0 candidate adds one read-only setup widget (master-enabled flag, saved count and configured-URL count). It does not expose URLs/identities, dispatch actions or claim renderer/event readiness. Current source inventory is **25 packages, 22 contributors, 70 visible controls**, including this unpublished package; the Session 12 published baseline above remains historical. Static and real missing/stopped/removed-owner tests include the new declaration, and its actual owner projection is exercised by test-embedded-widgets.js. No production package/cards changed.

## Availability and ownership

Phone Deck's basic OBS controls require only its private OBS connection. No feature module or Streamer.bot is a required dependency. Optional discovery never installs, starts or executes an owner, nor does it add cards to saved layouts. Missing, stopped, unconfigured, incompatible and removed providers remain unavailable with their saved references intact. A slow or disconnected optional owner cannot block direct OBS controls.

Native declarations retain existing action IDs and private state owners. Initial optional Phone Deck helpers require their own import; Source Modules 1.0.1 and Session 9's Named Timers 1.0.1, Reminders 1.0.2 and Redeem Checklist 1.0.1 require updated imports/initialization. Their version prerequisites reject older engines. Later metadata-only updates do not require reimport. The user reports completing the Session 9 imports/restart; this is operator evidence, not a new production Initialize test.

Matching terminal acknowledgements are used only where declared. Other mutations say Requested; independently visible state is not invented proof of request completion. Late, overwritten, missing or lost responses never trigger automatic retries. Widget-only contributions have no dispatch path.

Audio Routing retains authoritative masks and Toggle semantics. Scene Links applies only an explicit saved binding with confirmation. Camera/Reactive mappings remain native-owned; physical acceptance is already complete. Source Modules changes a specific visibility mode while preserving scene lists. Stream Launch remains guided and confirmed/held, distinct from raw OBS Start. Reminder history deletion and language routing are excluded. Checklist refunds/completion and Walk Ons reset require confirmation. Walk Ons Test preserves entrance eligibility; its Stop owns only walk-on sound, while Video Stop handles Video. Shoutout playback accepts clip IDs without lookup or AI. Archipelago exposes visibility/Refresh/Wake/status without calculation management. Pokemon Clear affects only the reported local encounter. Service contributions expose scoped operations, not arbitrary settings.

Live Chatbox 1.0.1 adds only a read-only connection widget: Streamer.bot feed socket, subscription and enabled-platform flags. Subscription does **not** prove Twitch/YouTube authentication, EventSub readiness or message delivery. The state excludes messages, viewer identities, counters, history, configuration, connection addresses, credentials and tokens. It creates no additional feed or renderer subscription. Stopped service means unavailable; disabled/no-platforms/rejected subscription remain distinct status.

## Verification map

- Static inventory, source exports, scoped endpoints, safe scalar projections, optional dependencies, confirmations and exact control sets: companion/scripts/test-phone-deck-coverage.js. Every new module must add a contribution or an explicit exclusion.
- All real declarations with missing state, stopped and removed owners, no writes/starts/layout changes and independent OBS: companion/scripts/test-phone-deck-coverage-availability.js.
- Owner privacy, exact Host/Origin/no-CORS/read-only boundary, connection lifecycle and no polling subscriptions/writes: companion/scripts/test-chat-phone-status.js.
- Actual Chatbox plus Phone Deck, optional-native independence, disabled/stopped handling and no widget execution: companion/scripts/test-phone-deck-chat-status.js.
- Hidden desktop/mobile clients with stable drafts/focus/caret/scroll and status transitions: companion/scripts/test-phone-deck-chat-status-browser.js.
- Packaged Companion 1.3.1 prior-release and actual released upgrades, hashes/private data/stopped-auto-start/favorites and isolated installed runtime: companion/scripts/test-github-phone-chat-status.js.
- Full runtime/browser/security suite: npm --prefix companion run check:phone-deck. Includes 100 synthetic contributions, 120-card layout, multiple clients/revisions/durable outcomes, HTTPS pairing/revocation, service-worker upgrades/offline behavior and clean listener/process shutdown.
- Provider-specific regressions are test-phone-deck-{launch-countdown,media,music-source,camera-links,backlogs,entrances,games}.js and their browser counterparts; game/Spotify service security and existing actual C# engines retain separate tests. Full source gate: npm run check. Existing Chatbox renderer/settings browser acceptance verifies normal/ticker design and unchanged ingestion.

All automated effects use synthetic owners, temporary data/certificates and isolated ports. Published-package availability does not assert production installation or new handset acceptance. No new cards, real stream/recording/chat/refund/camera tests, pairing changes or native reset are performed during Session 12.

## Remaining whole-system work

The twelve Phone Deck sessions complete optional control coverage, not retirement of the personal server. Widgets/Tangia, bouncing avatar (image selection/upload and optional colour change on bounce) and Ollama remain separate migrations. Voice commands remain the lowest-priority future idea. Final switch cleanup removes legacy Import settings controls only after adoption; existing private data must survive. See phone-deck-sessions.md for release evidence and MODULE_CHECKLIST.md for feature/acceptance status.
