# Phone Deck

Phone Deck 2.0.2 provides independent OBS controls and an editable HTTPS handset deck for Companion 1.3.1. Basic OBS operation needs no feature module or Streamer.bot connection. Optional controls come from installed packages; installing a module never adds cards automatically.

2.0.1 fixes opening the public page from a link or embedded settings. Private API requests still require the configured Host, same origin and CSRF token; unrelated origins cannot read or mutate private state. Existing layout, pairing and TLS identity are preserved.

## Setup

Install Phone Deck from Catalogue, start its service and open settings. Management uses loopback **3142**. Configure OBS WebSocket v5 there. Passwords stay server-side; phones cannot change connection credentials or pairing administration.

For handset access, use a certificate covering the computer hostname or LAN IP. Put `phone-deck-cert.pem` and `phone-deck-key.pem` in the private module data directory's `tls/` folder, then restart the service. Trust the issuing certificate authority on the handset as appropriate. Save the matching hostname/IP in local settings. HTTPS uses **3125** and remains disabled until a certificate/key exists. Enter a hostname/IP without a scheme, port or path. Keep certificate keys private.

Generate a pairing code locally, open the displayed HTTPS address on the phone and enter the code. Paired phones can use and edit the deck. Revoke devices in local settings. Pairings expire after 180 days; service restarts and module upgrades preserve identity and expiry. The installation API bearer token is never requested or sent to phones.

## Controls

| Area | Controls |
| --- | --- |
| OBS base | Exact scene selection, raw streaming Start/Stop, recording Start/Stop/Toggle and input mute |
| Common OBS | Volume presets/sliders, scene/group visibility, recording pause/resume, Studio Mode, preview/program transitions, replay buffer and virtual camera |
| Stream Launch | Guided Go Live with saved automation and independent progress |
| Countdown | Saved/custom/preset timers, save settings, pause/resume/clear and clock-based status |
| Audio Routing | Native game-VOD toggle and status |
| Wheel | Existing-profile spin, clear and status |
| Video | Enabled registered-video ID, optional title, stop and status |
| Streamer.bot | Optional title/category helpers and custom-action picker |
| Chat Routing | Bot-message form |

Enable optional Companion discovery and Streamer.bot connections in local settings as needed. Missing/stopped modules, missing imports and unavailable resources disable their own controls. Unsupported OBS features show prerequisites. Raw OBS Start invokes no countdown/music/launch automation. Streaming controls require a 1.2-second hold or keyboard confirmation.

## Editing and completion

**Edit deck** has separate **Card** and **Page** tabs. Select a card or add one; its module/action picker appears directly under Action. Appearance is folded separately. Phones and narrow docks switch to a dedicated editing view, while wide windows show the deck alongside the editor. Save and Discard stay visible. Closing edit mode retains the draft and shows a clear reminder before controls can run; incomplete new cards explain what to choose without replacing saved configuration. Search never changes configuration.

The separate **Settings** button opens **Connections** and **Phones**, with connection/address details folded by default. These private forms are not part of the card editor. Existing paired phones keep editing access but cannot access local-only connection or pairing administration. Deck, connection and phone-address saves remain separate operations.

OBS and Streamer.bot status are shown independently. Healthy module cards have no refresh button. **Check module status** appears only when the affected module needs read-only recovery after a stale/unavailable status or unconfirmed operation; it never retries the original action. An unsaved deck is identified as a draft rather than a connection failure. Open pages are not reloaded automatically during an upgrade: save or discard an older editor's draft before refreshing to load the new UI.

The established grid/editor supports pages, ordering, duplication, colours, icons, sizes and widgets. Save is explicit. Polling preserves drafts, focus, sliders, selected pages and card nodes. Revisions reject stale edits and execution. The module picker supports groups/search; missing saved resources are never substituted.

Execution never retries automatically. OBS changes use readback where available. Owner acceptance reports **Requested** unless a matching persisted terminal acknowledgement proves completion. Audio Routing partial errors remain explicit; Wheel/Video report Requested. Unknown outcomes block that owner until its explicit read-only Refresh succeeds. The latest 256 operation records persist across restarts and later owner state.

Reviewed legacy mappings retain card identities/layout/targets. Guided launch stays guided; legacy countdown Start resumes paused timers and leaves running timers alone. Combined widgets show independent Video/Wheel status and available launch progress. Writing cards remain parked. There is no public legacy Import settings option.

## Network and private data

Exact Host/Origin and CSRF checks protect writes; pairing administration is local-only. The service worker removes old Phone Deck shell caches and never caches credentials, API responses or mutations. Host outages disable controls; offline navigation shows a reconnect message. Reconnection never replays commands and refreshes the session token after host restart.

Private files: `config.json`, `connection.json`, `providers.json`, `phone.json`, `auth.json`, `operations.json` and `tls/`. Back them up together; never distribute them. Stop closes both listeners and owner connections. The service exits when its Companion parent disappears. Optional integrations need no app rebuild.

First-party code: Sethani, MIT. Lucide retains its ISC notice in `third-party/lucide.txt`.
