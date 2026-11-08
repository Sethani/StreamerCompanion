# Scene Links extraction boundary

Use 2.0.2; the initial 2.0.0 and 2.0.1 releases are superseded. Live acceptance exposed missed broadcast completions and an incorrect Concurrent flag on Scene Changed. Streamer.bot's Concurrent option parallelizes sub-actions; mode-setting must finish before engine dispatch. Version 2.0.1 restores sequential sub-actions and blocks editor mutations during inventory refresh. Version 2.0.2 freezes per-invocation arguments and retains the latest 32 terminal request results with their associated execution details, so a later read/event cannot erase proof of completion. The private bridge serializes commands, consumes raw/wrapped broadcasts and reads authoritative persisted state; it never retries mutations. Every diagnostic acceptance attempt was followed by independent restoration/preservation checks.

Scene Links 2.0.2 (`scene-bindings`) retains the existing editor and nine installed action identities, version-1 `portable.sceneBindings.config` and `portable.sceneBindings.state`. It has no overlay/service/port and works with Companion 1.3.1 plus Universal Dock. Sethani/MIT first-party metadata applies. The disabled Monitor action/queue remain inert compatibility records.

The active native configuration has 13 bindings. The inactive Node copy has the same 13 plus one additional entry. The user selected the active native map as authoritative; the Node copy is archived, not merged. Public defaults contain no mappings. The embedded private seed and absolute personal helper path are excluded.

The existing PowerShell helper is embedded in C#, launched hidden with encoded arguments and bounded output/process waits. It lists current windows and restores/focuses a matching existing window, preserving case-insensitive process/title-fragment matching. It does not launch applications or reposition/resize them. Windows can refuse foreground activation. Inventory/titles stay in private local state and are never included in exports or diagnostics.

Save only persists validated links. Actual program-scene changes use the existing 350 ms debounce, exact scene names, current-scene confirmation and cancellation of superseded work before remaining effects. Category and focus results are independent. Initialize owns startup and OBS connection/disconnection registrations; startup, Refresh and reconnect establish inventory/baselines without category or focus effects. Twitch API acceptance is reported as accepted, rather than independent remote confirmation. Read-only category metadata is available through Streamer.bot for acceptance/restoration checks.

Optional unique request IDs correlate persisted running/terminal operation states. Unknown outcomes require refresh or a late acknowledgement; no client automatically retries mutations. Malformed configuration cannot replace saved mappings. The editor preserves drafts, rows, focus/caret and scroll while polling, and displays saved unavailable targets without substituting another process window.

## Private compatibility and rollback

The private native bridge multiplexes Audio Routing and Scene Links over one loopback WebSocket. Existing Scene Links state/status/configuration/test routes delegate to native operations after handoff. An ownership marker guards legacy writes, automatic scheduling and already-pending callbacks; the old backend selector cannot reactivate Node while marked native-owned. Native unavailability never falls back to Node.

Before import, back up Streamer.bot's action/settings/command files and globals database plus the original Node JSON. Preserve the existing native map, backend selections, phone cards/pairings/TLS, favorites and service preferences. Replace only the nine actions and the duplicate private shared-initializer call. Restart only the repository Node server; HTTP and Phone Deck HTTPS share that process and reconnect together. Track the actual listener PID after Streamer.bot's startup wrapper settles.

For rollback, close Streamer.bot before restoring backed-up actions and the original Node JSON. Restore the old shared initializer as part of that action backup. Restart only the repository server and Streamer.bot; use the legacy dock with the old engine. Keep private globals/media. Recorded OBS scene/category/foreground snapshots support restoration; never restore a globals database over a running application.

## Verification

Actual C# tests cover fresh/preserved mappings, inert initialization/Save/Refresh/reconnect, exact names, independent tests, malformed data, failed persistence, rejected inventory/category requests, helper failure, partial completion, rapid/duplicate/superseded events and concurrent Save/Apply. The real embedded helper also passes read-only List and nonexistent-target checks. Local compilation against the installed Streamer.bot interface passes.

Hidden dock acceptance covers 43 rows, unavailable target preservation, drafts, caret/focus/scroll, Save/removal, independent tests and matching/late acknowledgements. Private bridge tests verify one shared socket, independent feature state, late/partial/disconnected results, read-only reconnect refresh, no replay and actual legacy ownership/pending-callback guards. Fixtures use disposable profiles and isolated ports and are stopped afterward. Release and production acceptance evidence is recorded in VALIDATION.md after rollout.

The completed 2.0.2 cutover preserved all 13 active bindings, the archived 14-entry Node map, Audio Routing settings, 54 readable OBS masks and protected phone/preferences. Real off-stream focus, automatic scene/category readback and original scene/category/foreground restoration passed. Native routes report the final version, two Phone Deck clients agree, and incoming Twitch events passed after the last restart. Actual anonymous GitHub installation/upgrades worked. The complete evidence is in [VALIDATION.md](VALIDATION.md).

Full Phone Deck extraction and the final integrated old-server-off rehearsal remain separate. Reactive/Cameras live acceptance is already complete and must not be repeated.
