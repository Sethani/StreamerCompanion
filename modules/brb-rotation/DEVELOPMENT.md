# BRB Rotation developer notes

The native engine owns `brb.private.state`; `portable.brb.state` is a bounded status/configuration projection. A static gate serializes all calls. The exported native timer ticks every two seconds; no renderer, browser tab or independent background thread drives the session. Startup/first invocation disarms persisted sessions. Scene state is never consulted or changed.

Start only arms; ticks persist selection intent before immediate native dispatch. Video Player 2.5.0's optional `brbRequestId` protocol persists acceptance with player state, deduplicates retained IDs and rejects busy playback. Shoutout Clips 2.2.0 supplies its existing correlated protocol for followed clips. Self selections call Self Clips - Play Next with the same request ID and reconcile that player's acceptance. Acceptance is not a completion/audio signal. Guarded start identities prevent stale Stop from replacing newer media.

Video completion/error uses the existing renderer's guarded Stop. Clip completion uses the existing native expiry; neither is claimed to prove remote clip completion. Video has a ten-minute watchdog. Unknown dispatch/persistence outcomes halt without replay, retaining the intent for explicit recovery. Request ledgers retain 128 BRB operations and 256 player acceptances; expired IDs must not be reused.

Followed caches reuse Auto Shoutouts' followed/exclusion globals read-only. Refresh is incremental, one channel/query per tick and up to 20 clips per channel/2,000 channels. A staged cache replaces the prior cache only after all queries complete. Exclusions/current follows filter every selection, not just refresh. No manual list or first-chat session suppression is modified.

`test-brb-engines.ps1` compiles actual BRB, Video, Self Clips and Shoutout Clips source against synthetic adapters. Test native command authorization, denied operations leaving running sessions alone, weighted counts, unknown intents, persistence failure, manual takeover, restart and failed refresh. Never use production playback/chat in automated tests. Native interface compilation, isolated browser checks and real operator acceptance are distinct evidence.
