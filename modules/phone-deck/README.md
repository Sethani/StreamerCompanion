# Phone Deck

Build an editable phone deck for OBS and optional Companion modules. Basic OBS controls work independently of Streamer.bot or feature modules. Installing a module makes its supported controls available to choose; it never adds cards automatically.

## Connect OBS locally

1. Install Phone Deck from **Catalogue**. Expand its **Installed** row, **Start** the service and open **Settings** or **Open controls**. It is also in [Universal Dock](../universal-dock/README.md). Requires Companion 1.3.1 or newer.
2. In the deck's **Settings → Connections**, expand **OBS connection**. Enter your OBS WebSocket v5 address, normally `ws://127.0.0.1:4455`, and password, then **Save connection**. A blank password preserves the saved password; use Clear saved password only when intended.
3. Check OBS status before using controls. OBS must be open and its WebSocket server enabled. Local management uses loopback port **3142**; passwords stay server-side.

For optional module cards, expand **Module connections**. Enable **Discover installed Companion modules** with the Companion loopback address, normally `http://127.0.0.1:3135`. Enable **optional Streamer.bot controls** and enter its WebSocket address/password if the chosen providers require them. Press **Save optional connections**. Missing/stopped modules, missing imports and unavailable resources disable only their affected controls.

## Pair a phone

Handset access uses HTTPS on port **3125**. Prepare a certificate covering your computer's hostname or LAN IP and its private key as `tls/phone-deck-cert.pem` and `tls/phone-deck-key.pem` inside the private Phone Deck module-data directory, then restart the service. HTTPS stays disabled until both exist. Trust the issuing certificate authority on the handset as appropriate; keep the private key private.

In local **Settings → Phones → Phone address**, enter the matching hostname/IP without a scheme, port or path, then **Save phone address**. Under **Pairing**, use **Generate code**. Open the displayed HTTPS link or QR code on your phone, enter a Device name and Pairing code, then **Pair device**.

Paired phones can use and edit the deck, but cannot change backend credentials or pairing administration. Revoke a device from the local Phones settings when needed. Pairings expire after 180 days; restarts and upgrades preserve their identity/expiry. The Companion installation API bearer token is never requested on the handset.

## Add and edit cards

1. Choose **Edit deck**. Select a Page or use **+ Page**. Card and Page have separate tabs.
2. Use **+ Button**, **+ Widget** or **+ Input**. Choose a Label and Action/input/widget type. For module controls, choose its Module action and any required saved resource; Search module controls can narrow the list.
3. Adjust appearance, size, colour and icon as desired. Existing cards can be selected, duplicated and reordered; pages can also be reordered.
4. Press **Save deck** to apply the draft, or **Discard draft** to reload the saved deck. Closing the editor retains the draft and blocks execution until it is saved or discarded. Search never changes configuration.

Wide windows show the deck beside the editor; phones/narrow docks use a dedicated editor view. Settings for Connections and Phones are separate from card editing. Deck, connection and phone-address saves are independent operations.

## Choose the right control

| Control area | Behavior |
| --- | --- |
| OBS base/common controls | Scenes, input mute/volume, scene/group visibility, recording, Studio/preview transitions, replay buffer and virtual camera where supported |
| Raw OBS Start/Stop | Direct streaming controls; no countdown, music or launch automation |
| Stream Launch | Guided Go Live with configured automation and progress |
| Countdown | Saved/custom/preset timing and status; existing Start cards resume paused timers and leave an already running timer alone |
| Module actions/widgets | Each installed owner's declared controls, saved resources and status, including Sound/Video, Audio Routing, Cameras and Reactive Guests |
| Optional Streamer.bot controls | Title/category helpers and a custom-action picker; Bot Chat Routing supplies a separate bot-message form |

Streaming controls require a 1.2-second hold or keyboard confirmation. Unsupported OBS features explain their prerequisites. Actions can change the real stream, recordings, audio, overlays or chat; use each module's guide to understand its scope.

## Status, uncertain outcomes and updates

OBS and Streamer.bot status are independent. Status updates automatically. **Refresh** rereads OBS. **Check module status** appears only when a module needs read-only recovery after stale/unavailable state or an unconfirmed operation; it never retries the original action.

Execution never retries automatically. OBS changes use readback where available. **Requested** means owner dispatch/acceptance unless a matching persisted terminal acknowledgement proves completion. Audio Routing can report partial completion; Wheel and Video report Requested. Unknown outcomes block that owner until an explicit read-only status check succeeds. Inspect the real outcome before sending another action.

The latest 256 operation records persist across restarts. Updates preserve card identities, layout, targets, pairings and TLS identity. Open pages are not automatically reloaded during upgrades; save/discard any older editor draft before refreshing when a new interface is installed. A service restart briefly disconnects phones; reconnects never replay actions or clear pairings/layout and refresh the session token.

## Troubleshooting and private backups

If a phone cannot connect, check that the service/HTTPS listener is running, the saved address matches its certificate, the phone trusts its issuer and the computer is reachable on your network. If OBS controls are unavailable, check OBS and the saved WebSocket connection. If only module controls fail, check discovery/native connection settings, the module service/import and its selected saved resources. Missing resources are never substituted.

Exact Host/Origin/CSRF checks protect private writes. Pairing administration stays local. Offline navigation shows a reconnect message; the service worker never caches credentials, API responses or mutations and removes old shell caches.

Back up private `config.json`, `connection.json`, `providers.json`, `phone.json`, `auth.json`, `operations.json` and `tls/` together; never distribute them. Stop the service before a consistent filesystem backup. Stopping closes both listeners and owner connections; the service also exits if its Companion parent disappears. Optional integrations need no app rebuild.

First-party code: Sethani, MIT. Lucide retains its ISC notice in `third-party/lucide.txt`.
