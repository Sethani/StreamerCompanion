# OBS request traffic follow-up

Recorded November 14, 2026 during the accepted Widgets handoff.

The private cutover verifier repeatedly enumerated inputs, mute states and track masks and opened a fresh connection for each CLI phase. Those finite verification bursts stopped. Its replacement visibility/stability check held one OBS socket, made four total requests and then observed the widget owner without OBS polling. A further 65.7-second check made zero OBS requests. Temporary observers closed afterwards.

The remaining OBS clients were the repository server, Phone Deck and Streamer.bot. Phone Deck already holds a persistent WebSocket. In `modules/phone-deck/service/runtime.js`, the two-second timer calls `obs.refresh()`. In `service/obs-client.js`, every OBS event also schedules a refresh. Core refresh reads scene/stream/record/input inventories and per-input mute state. Holding the connection open therefore does not remove its periodic request volume.

Next reliability task: bootstrap once, apply authoritative state events directly, invalidate and refresh only affected inventories for structural changes, and retain a slower bounded reconciliation/reconnect path. Preserve fresh pre-dispatch reads and post-write confirmation, unsupported-feature handling, unknown outcomes, no mutation replay and direct OBS independence from optional providers. Coalesce concurrent refreshes/event bursts; avoid repeated scans of unchanged inputs. Test idle/request budgets with many synthetic inputs, event storms, missing events, reconnect and real existing controls before publishing a Phone Deck update. Production Phone Deck 2.0.3 has not been changed for this follow-up.

Future operational checks should reuse a single temporary connection, collect a baseline once, and verify relevant changes rather than repeatedly enumerating all audio/input state. No hidden production-profile Companion instance is needed.
