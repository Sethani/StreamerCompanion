# Final integrated switch audit

## November 14 checkpoint

All 24 required feature areas have implementations; this is not evidence that the personal repository can be shut down. This pass inspected current OBS browser inputs, installed public inventory, saved native action bodies and launcher ownership. No real stream, scene, mute, track, ad, redeem or viewer playback was triggered.

## Confirmed residual dependencies

| Component | Current source / evidence | Required handling |
| --- | --- | --- |
| Combined OBS overlay | Existing browser input loads `/streaming/obs/source.html` from loopback port 7474. The private `public/obs/source.js` still reads port 3124 `/api/obs/state` and retains legacy fallback calls. | Replace the URL on the existing source with Companion's Universal Overlay URL, preserving browser size, audio, transform, routing and source identity. First verify all installed layers and safely release Widgets ownership. Keep a source-settings rollback. Port 7474 and the repository API on 3124 are distinct servers. |
| Installed audience layers | Public inventory reports ready independent Archipelago, Avatar, Controller, Countdown, Widgets, Named Timers, Pokemon, Reactive, Shoutout Clips, Video, Walk Ons and Wheel overlay entries. | Test one modern aggregate against synthetic module states before live adoption. Inventory readiness alone does not establish visual equivalence or rendering. Do not run two aggregate sources with active viewer effects. |
| Retained ad scheduler | Enabled native C# contains `GetCountdownRemainingSeconds()` reading `http://127.0.0.1:3124/api/state`; no native Countdown-global read is present. Installer source: private `scripts/install-streamerbot-ads.js`. | Replace this read with the published Countdown state envelope, preserving remaining-time rounding, running/paused behavior, unavailable fallback and all scheduling decisions. Use synthetic C# checks; do not run real ads. Back up and replace only the relevant native body off-stream. This is an integration blocker even though Countdown itself is migrated. |
| Legacy video entrance compatibility | An enabled private video-entrance action contains Video state/play and clip-state HTTP fallback URLs. Its implementation branches on `streamingFeatureBackends`. Read-only live state selects `streamerbot` for Video and Shoutout Clips. | URLs are conditional compatibility branches, not proof of a current HTTP call. Verify the exact native busy/play branch with recorded state and no media playback, then remove or guard fallback for the final switch. Preserve the private assignment and session behavior. |
| Application launcher | Private `scripts/start-streaming.ps1` explicitly starts the old server before Companion/OBS; readiness checks port 3124. It separately starts Ollama, Spotify and Ghost Chat. | Preserve independently needed application startup and Companion-before-OBS ordering; remove the server readiness dependency only after source/caller adoption. Do not remove Ollama daemon startup with the legacy AI routes. |
| Shutdown ownership | `scripts/watch-streamerbot-shutdown.ps1` invokes the broad old stop script and stops Ghost Chat. | Replace legacy-server cleanup without accidentally stopping independent module/Phone Deck services. Preserve intended Ghost Chat lifecycle. Do not use the broad stop script for the rehearsal. |
| Live Chatbox | Two current browser inputs use independent service port 3136 `/chat/chat.html`. | Preserve the two normal/ticker configurations and include both in the rehearsal. No source replacement is implied by the aggregate overlay switch. |
| Deferred / parked data | Current native references include Writing classifier/suggestion and TTRPG card URLs. Existing OBS inputs include two TTRPG views on 7474 and six blank TTRPG sources on 3124. | These are excluded from vital-feature retirement acceptance. Preserve data and explicitly park obsolete execution/URLs instead of deleting sources or claiming full independence for deferred tools. Audit how blank sources should behave before disabling the old server. |
| External browser inputs | Five browser inputs have external URLs. Their queries, hosts, names and private settings were not copied into this report. | Preserve unrelated external sources and identities. Do not migrate their providers or redistribute authenticated URLs. |

## Widgets ownership recovery

Widgets recovery completed through the existing service API. The operator confirmed no overlay tabs were open outside OBS. Exact private configuration and ownership were backed up, master rendering was saved disabled and a unique persisted release request was submitted once. Because the previous renderer could not acknowledge, the one known OBS aggregate document was temporarily navigated to blank and refreshed after checking the complete browser-input inventory and settings. A fresh scoped `confirm-closed` operation reached its durable completed result. Original source settings and the exact master-enabled preference were restored. No owner file was deleted or directly rewritten.

Readback confirmed one active responding renderer, completed recovery and identical saved configuration apart from the expected revision increments. Tangia is eligible under its existing native rule; the other widget group is not currently eligible. No scene, source identity, transform, audio, routing, private URL/layout/group rule or application process was changed. The previous Tangia delivery and Avatar/Cameras/Reactive acceptance remain accepted; no real widget test was repeated. Ownership stability is checked separately without OBS polling or viewer actions.

## Ordered completion backlog

1. Completed: Widgets ownership recovered with preserved settings and prior acceptance.
2. Replace the retained ad timing read and prove the video-entrance native branch. Preserve private actions, IDs, mappings and globals; use disposable native fixtures.
3. Run hidden synthetic Universal Overlay acceptance for the installed package set, independent routing and all relevant state/lifetime transitions. Verify no old HTTP/static-server dependency.
4. Adopt the modern URL on the existing OBS aggregate source with backed-up settings and no duplicate renderer. Preserve accepted individual module settings.
5. Adopt startup/shutdown changes with rollback. Include Widgets' intended automatic-start setting in the cold-start checklist; current running status alone is insufficient.
6. Stop only the verified old repository API server for a bounded rehearsal. Verify host, normal/ticker chat, module services, scene routing, phone pairing, guided launch state and synthetic owner dispatch without starting a real stream or ads. Restore immediately if any vital dependency remains.
7. Cold-start the complete setup in a separately announced off-stream session; preserve Ollama and external application startup. Record tested behavior versus remaining operator observation.
8. Remove migration-only Import settings buttons/readers after final-switch acceptance. Preserve ordinary action/media imports, backups and all private data.

The server remains running. No permanent production source URL, startup script, native action, service process or import control changed in this pass. Widgets recovery is complete, its original enabled state is restored, and the same aggregate source settings are retained.

Post-recovery stability: 35.45 seconds, 35 active samples, zero ownership changes, zero OBS requests and no viewer actions. Temporary observer exited.
