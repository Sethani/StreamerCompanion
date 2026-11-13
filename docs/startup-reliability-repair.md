# Live-stream reliability repair — November 13, 2026

The five reported issues are handled in the operator's requested order. Voice commands were first recorded in [future ideas](future-ideas.md), at the lowest priority.

| Priority | Finding | Repair and verification |
| --- | --- | --- |
| 1. Starting Soon music | Scene entry and stream launch independently start playback. | Spotify 2.0.4 adds per-binding `autoplayOnEnter`, defaulting to true for compatibility. Disable it only on the private Starting Soon binding. Synthetic Spotify tests prove silent entry, preserved existing music and guided launch still starting music. Playlist, device and all other automation settings stay intact. |
| 2. Countdown/avatar remain visible | The legacy aggregate overwrites native scene information from a possibly stale Node OBS cache. The modern aggregate lacks periodic routing reconciliation and can lose a scene event. | Native routing owns the legacy scene; revision fencing protects newer OBS events from stale snapshots. Disconnect hides scene-scoped layers until fresh state. Universal Overlay 1.0.1 reconciles scoped `GetGlobal` reads through Universal Dock 1.1.2. Synthetic tests exercise stale Node/native snapshots, missed events, reconnect and retained routing. No scene-list rewrite is needed. |
| 3. Misleading missing dependencies; skipped automatic starts | Readiness is folded into package presence, and automatic startup tries only once. | Companion 1.3.2 separates missing/incompatible packages from installed dependencies awaiting verification. Deferred automatic services start when native availability returns. Background reconciliation is serialized; manual Stop and Stop all are respected. Tests cover offline Chat Routing/Named Timers/Spotify, real missing packages, late readiness, independent Phone Deck, duplicate refreshes and manual stopping. |
| 4. Phone Deck needs restart | Failed initial bootstrap never retries. A running production service also reports OBS inventory unavailable/native disconnected while fresh read-only clients immediately connect to both. | Phone Deck 2.0.3 retries initial bootstrap/offline navigation. Two consecutive transport read failures replace stalled sockets; explicit backend rejections do not reconnect. Only status reads are retried, never commands. Tests cover absent/late/restarted backends, open sockets that stop answering, initial page failures, durable mutation results and no action replay. |
| 5. Startup race with OBS | OBS can load a browser page before its owning HTTP server is listening. Changing which app the operator clicks first does not fix that. | The existing private Streamer.bot stack launcher starts/reuses Companion and waits for its asset-server health before OBS. It does not wait for Streamer.bot's WebSocket from inside that same startup action. The launcher fails clearly before launching OBS if the server never appears. A mocked PowerShell test verifies order/reuse with no real application launch. |

Companion's browser assets now remain accessible while installed native dependencies await verification. The module transport reconnects and the aggregate reconciles routing as readiness changes. The private launcher is the solution for a completely absent HTTP server: browser JavaScript cannot repair a document it never downloaded. Existing browser/phone URLs, pairing, TLS, cards, scene lists, native IDs/imports and automatic-start preferences are retained.

Source and hidden Phone Deck suites pass, including C# synthetic regressions. The app passed packaged desktop acceptance; publication and production rollout are recorded below. No real stream, music, scene, mute or chat action is used as a test. A fresh read-only OBS check confirms streaming/recording stopped before any rollout; transient connection errors alone are never treated as proof of that.

The private Starting Soon preference has a rollback copy and changes only its entry-autoplay flag. Production replacement and protected-data verification are complete. These changes require no Streamer.bot reimport/restart. Keep the old repository server for the three remaining migrations; Phone Deck Session 8 is not part of this repair.

## Release and rollout record

Source 8857143918ad7c5f8e00822539e38c6c9b5d814c passed Windows/Linux Check 43445122358. The first Linux run exposed an error-without-close reconnect path; cb4906e fixed it, and both platforms passed again. Source, C#, complete hidden Phone Deck and packaged desktop acceptance all pass. The shared browser fixtures now support scoped GetGlobal reads. Background desktop scroll persistence is explicitly saved before reload, with manual history restoration.

Companion v1.3.2-preview.1 publication 43445275487 passed every source/C#/packaged desktop gate. Windows ZIP SHA-256: 4f2cd411e9925de789a84f287a8d8ec59bf188be8d01519a4e64598981cac630. The preceding app run was cancelled before publication while the reconnect correction was made.

| Package | Publication workflow | SHA-256 |
| --- | --- | --- |
| Spotify 2.0.4 | 43445510564 | 6341614d8b7ab49ba852c17e839c07e857fa789610f98677e9859212f7ddc862 |
| Universal Dock 1.1.2 | 43445762499 | 6a646d9db93bf176526097caf673e2d4107f9ee882153256e3aa80910e1bd13b |
| Universal Overlay 1.0.1 | 43445947271 | 04144da72c77566f78a8055e5a7f77987405afe8f479e7721b7062330f86e3b5 |
| Phone Deck 2.0.3 | 43446168686 | 8856bef06d57f37c58593353e8c63e3053d1e47ef649a7edfe0c9b248cf44816 |

Actual anonymous GitHub upgrades of all four prior packages passed in packaged Companion 1.3.2. Complete native export data is unchanged. The test preserves private sentinel data, favorites, stopped/automatic-start choices, real temporary TLS, an existing pairing cookie and the layout. No GitHub 504/fallback was needed; no owner action was dispatched.

All four releases are installed. Companion 1.3.2 replaced the old application after normal shutdown, with the old application and affected private files backed up. It uses the same installed executable path so the approved Private-LAN firewall rule remains valid. The private stack launcher now points to that installed application. Protected-file hashes and fresh OBS scene/mute/stream/record comparisons are unchanged. Phone Deck OBS and native connections are healthy, with no pending operation. OBS and Streamer.bot were left running and no native reimport/restart was needed.

The actual aggregate is served by the existing loopback static host. Its served JavaScript was hash-compared with the repaired local file, then that one exact browser source was refreshed off-stream without changing its URL or any OBS setting. No scene, music, streaming, recording, mute or chat action was used as a test. All isolated processes are stopped. An already-open phone page may be refreshed once to load new frontend code without clearing cookies or drafts. Subsequent startup/outage recovery is automatic. The next normal stream/cold start is operator observation; no live stream was started for acceptance.
