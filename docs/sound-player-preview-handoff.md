# Sound Player local preview handoff

November 15, 2026. Unreleased local preview is now installed. Native imports and backed-up migration are complete; the operator subsequently accepted it with "It worked".

| Component | Candidate | Native import |
| --- | --- | --- |
| Companion | 1.4.0 | None; media aliases and verified retained-file copy |
| Sound Player | 1.0.0 | Eleven new distinct action IDs; startup initialization only, no audience triggers |
| Walk Ons | 3.0.0 | Existing IDs retained; four sound entries become forwarders; roster delegates to owners |
| Video | 2.3.0 | Existing IDs retained; request-bound acceptance survives completion/configuration/startup |
| Source Modules | 1.1.0 | Native data unchanged; editor honors declared routing key |
| Universal Overlay | 1.1.0 | None; renderer honors declared routing key |

Local host artifact: `companion/out/build-TjTPLJ/packages/Streamer Companion Preview-win32-x64`. ASAR SHA256 `20ab1bfc491dfd9361793378e29cfc61d0a7818466b36aae2e0d0fd4cbb09888`, 152 payload files.

Module artifacts: `companion/out/sound-player-preview`. SHA256SUMS digest `2bd3d946a0c3cffa8e976c036a4dd3a3faa0e74c940176a4114c8130f7788767`.

## Validation completed

- Full `npm run check` passed for 29 packages, 25 Phone Deck providers and 78 visible controls, plus two hidden compatibility controls.
- Actual C# owner engines compiled and ran against synthetic adapters, including separate parent/child dictionaries, Sound/Video durable acceptance, immediate completion, failed persistence, guarded concurrency, legacy replacement, claims, volume zero/master gain, source validation and idempotent migration without roster/ledger writes.
- Complete packaged desktop/browser suite passed against the host artifact, including the new Sound editor and two actual silent-WAV renderers competing for one request.
- Walk Ons browser passed over the actual shared WebSocket transport: library discovery, roster save/Test, single-owner renderer claim and matching completion.
- Phone Deck discovery/dispatch/acknowledgement and missing/stopped/removed/old-state guards passed. Existing five Walk Ons provider revisions remain exact. No cards were auto-created.
- Media alias/copy tests preserve original bytes/index IDs, retain old directories, reject collisions/cycles/missing owners, and keep legacy links recoverable. Aggregate routing keeps the modern `walk-ons` rule separate from historical `walkonsound`.

## Guarded installation checkpoint

1. Confirm off-stream and recording stopped. Close OBS and every direct/aggregate/widget preview document. Obtain fresh operator closure acknowledgement for Widgets; the earlier Pass 1 acknowledgement does not apply to this handoff. Do not steal an owner or alter its ownership file.
2. Pause the chat watcher. Back up native action bodies, authoritative roster/seen ledger/playback globals, media/index files, routing, phone configuration/TLS/pairing, app/profile and launcher. Record hashes privately. Do not run Walk Ons Initialize to migrate.
3. Stop the exact Companion instance gracefully and make the stopped-profile backup. Install the verified host/modules at the established local executable path. Keep all legacy media and rollback copies.
4. Import new Sound Player actions and updated Walk Ons/Video actions as one owner transition. Verify actual action bodies/assembly metadata, UUIDs and forwarders rather than relying on Ready/name checks. No older bundled Sound engine may remain active. Source Modules needs no native reimport.
5. Use the host's explicit `copyAliasedMedia('walk-ons')` operation to copy and hash-check the inventory to Sound Player, retaining originals. Call Sound Player Configure with `migrateWalkOns=true` once. Its idempotent owner-side mapping retains exact inline pool choices/weights and does not write the authoritative roster or seen ledger. No public legacy-settings import button exists.
6. If Streamer.bot restart is necessary, preserve/restore the saved ledger while the watcher remains paused. Existing startup/going-live reset semantics are distinct from migration. Verify all protected state, cards, rules, native engines and media before restoring callers.
7. Reopen the existing aggregate normally, respecting Widgets' release/claim flow. Keep the existing OBS source URL and audio settings. Verify one sound owner/renderer. Do not start streaming or recording as a test.
8. Human listening check: play/stop a chosen sound, adjust master volume (including zero), try a saved pool and a Walk Ons Test, and add a Sound Player phone card manually. Confirm existing Walk Ons cards still work and Test leaves eligibility unchanged. Record acceptance before proceeding to the next polish module.

Rollback stops/unloads the new owner first, then restores matching app/module/native code and backed-up state/media/routing together. Retain newer private data for inspection. Do not independently reimport the old Walk Ons sound engine while Sound Player is active.

## Adoption result

Installed November 15, 2026 after fresh operator closure acknowledgement. Actual native bodies and all five module/app payloads match the tested candidates. Native roster/session, Video settings, media bytes, old Phone Deck control revisions/layout/pairing/TLS, 16 OBS browser sources and 54 audio mute/track maps were verified preserved. All 29 modules are Ready and the running phone provider discovers all six Sound controls. The original watcher is resumed; the scoped private restoration helper is disabled. One Widgets owner is active. Normal native startup reopened OBS without stream/record flags.

The native app stopped its window and action queues but left a reconnect thread alive. After the flushed database remained unchanged and matched the saved roster, native files were backed up and only that exact background process was ended. Companion closed normally. The tested one-time helper restored the exact roster/ledger before migration and resume. Backups and detailed verification are private.

The saved Sound visibility rule remains Hidden. For a listening check choose the desired visibility, Stop a waiting request and Play again; old requests never replay when a renderer is newly opened. The operator subsequently reported "It worked". This records general preview acceptance; individual listening/card subchecks were not separately described. Category review is next.
