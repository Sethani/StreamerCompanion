# Sound Player extraction contract

Contract established November 15, 2026. The isolated source candidate now implements this ownership boundary; adoption and human listening acceptance remain pending. Machine-readable reserved IDs and the proposed Phone Deck contribution are in `docs/contracts/sound-player-extraction.json`. The source inventory is now 29 packages.

## Current behavior established from source

| Area | Current owner and behavior |
| --- | --- |
| Entrances and eligibility | `walk-ons-engine.cs`, persisted `portable.walkOns.state`. `config.roster`, `config.sounds`, `config.settings`, `session.seen`, `lastEvent`. |
| Weighted choices | Walk Ons `Pick`: preserves entry order; includes nonempty values with positive weights. Normalization clamps weights to 0–1000 and discards zero/negative values. There is one draw. It does not filter choices by sound-library enabled state. |
| Volume | Walk Ons passes the chosen person's linear volume, clamped to 0–1. The stored `defaultVolumePercent` is currently not applied by `Trigger`; extraction must not suddenly apply it. Zero is valid. |
| Playback | Four Walk-on Sound actions, one native engine, `portable.walkonSound.state`, feature `walkonSound`. Play accepts safe explicit sources or a legacy ID fallback; direct Play replaces the current audio. No queue or direct-Play busy rejection exists. |
| Walk Ons busy policy | Rejects before selection when Video, Shoutout Clip or walk-on audio is visible. Rejected/busy entrances remain eligible. Test never consumes eligibility. |
| Sound acceptance | Parent supplies a fresh `walkOnSoundRequestId` and reads matching persisted `payload.lastAcceptedRequestId`. Child argument changes are not a return channel. Stop preserves the accepted ID, including immediate completion. Persistence failure must not acknowledge. |
| Video acceptance | Current parent checks only RunAction's result. Video catches errors and returns true, and has no request-bound acceptance field. Existing synthetic Video-walk-on coverage uses a recording stub, not a failed real child acceptance. This gap must be covered before claiming rejected video remains eligible. It is unrelated to optional dependency metadata. |
| Reset | Walk Ons Initialize resets `session.seen` and has the existing startup trigger. Reset Session supports one person/all; the private going-live caller remains separate. Configure/Upsert and browser refresh do not reset eligibility. |
| Media | Host imports to `module-data/walk-ons/media`, with UUID filenames and `index.json`; URLs use `/api/public/media/walk-ons/`. Safe legacy local sources on 7474 remain supported. No 3124 server is required. |
| Rendering | Walk Ons owns the audio iframe and its additional transport declaration. The renderer watches `startedAtMs`, stops on matching completion/error and can replay a visible persisted request after a fresh document loads. Timestamp collisions and reconnect reconstruction need explicit new coverage. |
| Routing | Modern aggregate and routing editor use registration `id`, not `ui.overlays`. Walk Ons currently uses rule `walk-ons`; the historical logical key `walkonsound` can also remain in saved configurations. These are not interchangeable. |
| Phone Deck | Walk Ons declares `test`, `test-picker`, `stop`, `reset`, `status`. Stop targets the legacy Sound Stop UUID; other controls remain roster/session operations. Control revisions depend on their precise declaration, resources and projected fields. |

The read-only installed audit found the expected four sound actions, no external sound dispatchers, and one external sound-state reader. Private caller details, media hashes and current state checks are kept outside public source. Historical personal server/overlay/installer references were also located; they are compatibility evidence, not tools to rerun. No real action, sound, reset, import, phone edit or configuration change was performed.

## Ownership and action/import boundary

Sound Player owns audio library, reusable weighted pools, master volume, playback state and the sole audio engine. Walk Ons owns viewer assignments, entrance selection, Test, eligibility and reset policy. Video stays a separate optional owner. Sound-only entrances never require Video; video-only entrances never require Sound Player.

Keep `portable.walkonSound.state` and `walkonSound` as the canonical playback key/feature, now owned by Sound Player. Extend the existing envelope with `config.library`, `config.pools`, `config.settings.masterVolumePercent`, phone-operation results and per-request renderer claims. Preserve existing acknowledgement/current fields and unknown compatibility fields. Do not create a competing mirrored playback global or a second native playback engine.

Keep all four legacy action IDs in Walk Ons:

| Legacy entry | UUID | New role |
| --- | --- | --- |
| Walk-on Sound - Engine | `3999caa3-0625-419f-be94-eaa3fcee8cb9` | Forward recognized modes to the Sound Player owner; no local playback/state writer |
| Walk-on Sound - Initialize | `11b4bbee-286a-46d8-9c3f-6d85ec7a3ec3` | Compatibility initialization forwarding; never initializes the roster |
| Walk-on Sound - Play | `7b2a868f-867f-404b-ab47-0e1f58e335d1` | Forward legacy ID/source/volume/request contract |
| Walk-on Sound - Stop | `16f3bce9-9c70-4791-98b5-bef600897957` | Forward matching-start/unscoped sound stop |

Sound Player exports only its separately reserved new IDs. Neither package imports the other's IDs. Existing callers and the Walk Ons phone Stop card retain their targets. A missing owner rejects the affected request without creating playback state or consuming eligibility. Old Play compatibility retains its ability to replace current audio; Walk Ons explicitly requests reject-when-busy, checked atomically inside the Sound Player owner. No queue is introduced.

Do not reimport an older Walk Ons playback-engine export while the new owner is active. Installation name checks do not prove native code version. Adoption must verify actual imported engines/forwarders and no overlapping action IDs. Rollback reverses the coordinated owner transition; it is not an independent downgrade of one package while both engines remain active.

## Pool, request and renderer behavior

1. Copy sound IDs, labels, sources and enabled values into the Sound Player library without relinking URLs or changing filenames. Keep the original data for rollback.
2. Migrate each existing inline pool losslessly to a stable private pool ID, retaining exact order and normalized weights; record its assignment-to-pool mapping in Sound Player state, leaving the authoritative roster and ledger unchanged. Explicit new roster pool selections use `poolId`. Compare retained original inline choices before applying the migration map so an edited inline assignment is respected. Keep original choices as compatibility/rollback data rather than performing a second selection.
3. Sound Player makes exactly one weighted draw. Migrated pools carry `walk-ons-v2` semantics, preserving the old eligibility/selection behavior including positive choices the old engine did not filter. New pool editing validates selected resources. Never silently drop entries, renormalize a saved pool, select twice or consume eligibility after an unavailable/unsafe selection is rejected. Test missing/disabled legacy references explicitly rather than assuming the current private roster covers them.
4. Default master volume to 100%. Preserve each entrance's existing linear volume. Apply master gain once, and do not activate the previously unused legacy default-volume setting. Set Volume updates active gain without replaying/restarting the sound.
5. A fresh request ID is persisted with acceptance only after playback-state save succeeds. Keep a bounded result map for deduplication; matching retries return the recorded outcome without replay. Immediate Stop/complete/configuration preserves the acceptance record. A monotonic start identity prevents same-millisecond replay collisions.
6. One native engine remains the only playback-state writer. New renderer documents additionally claim each new playback request through the internal Renderer action; persist the winning renderer ID before audio starts. Only the matching request/start/owner can report completion/error. Multiple aggregate/direct/compatibility documents must not both play one request.
7. Initial persisted snapshots do not replay previously accepted sound. A disconnected renderer does not restart an already-started request on reconnect; a replaced document does not reclaim an old request. New explicit Play remains possible. Initialization on actual startup can mark an interrupted playback hidden while preserving settings/acceptance; do not replay the saved request. Failed/uncertain completion is visible and is not resolved by an automatic new Play or timeout-based owner takeover.
8. Native request acceptance is not proof of audible output. Preserve the distinction in UI and Phone Deck status. Overlay routing still decides where rendering is allowed.

For Video assignments add an optional request ID and persisted `lastAcceptedRequestId` to the Video owner, preserving it through Stop/Initialize/Configure. Walk Ons must read the exact match before consuming eligibility. This is a small functional Video update with its own import/version validation, not a dependency correction or player redesign.

## Media and scene compatibility

New uploads belong to `module-data/sound-player/media`. Copy old media/index into that namespace with byte/hash verification and collision checks; retain the old directory until rollback no longer needs it. Preserve IDs and filenames. Accept old `/api/public/media/walk-ons/` sources and supported 7474 sources.

Add a narrowly validated media-owner alias for the Walk Ons compatibility namespace. Both old and new URLs resolve through the appropriate registered inventory; imports through an old Walk Ons entry point go to Sound Player rather than creating a second active library. Alias targets must be safe package IDs of the same media kind; reject cycles, private paths and arbitrary file access. If Sound Player is missing, report that on imports/affected sound controls; do not make Walk Ons video-only operation require it. Old media must remain recoverable, not moved/deleted blindly.

Sound Player registers one overlay. Remove Walk Ons' overlay registration and extra audio transport, retaining its roster transport. Retain its old direct overlay path only as a compatibility loader for the new claim-aware renderer, not a second engine. Coordinated adoption unloads old, already-loaded renderer code before enabling the new owner; a retained old page is not made safe merely by updating files.

Use an explicit `ui.routingId: "walk-ons"` for Sound Player while retaining its unique package/UI ID `sound-player`. Extend the modern aggregate and routing editor to honor that declared routing key, so existing scene lists and visibility cards keep controlling the same rule. Keep the old `walkonsound` entry untouched. Do not overwrite one saved rule with another or treat historical legacy embedding as identical to the modern aggregate; audit its mapping separately when present. Keep the single main OBS aggregate URL unchanged and add no extra source.

## Phone Deck registration

The JSON contract contains a schema-valid future `ui.phoneDeck` declaration with six controls:

- Play sound using an enabled registered sound ID.
- Choose sound to play through a form/input card.
- Play a saved weighted pool.
- Stop sound.
- Set master volume, 0–100%.
- Sound playback status: playing/selection/volume/issue, not a delivery guarantee.

Resources expose only IDs and labels, never source URLs, media paths or the viewer roster. Commands use the registered native owner and its persisted request results. The version prerequisite prevents the old playback-only envelope from masquerading as a configured new provider. Phone Deck remains optional; discovery creates no cards, imports no actions and starts no services.

Keep the existing Walk Ons Phone Deck declaration, IDs and provider revisions unchanged: its Test and Reset still belong to Walk Ons, and Stop follows the legacy forwarding UUID. Do not add acknowledgement metadata to that declaration if it would invalidate existing saved cards. The new Sound Player controls have their own provider revisions. Extend summary/coverage/availability tests for the eventual 29th package and 25th provider only when that package actually exists.

## Isolated implementation and adoption gates

Proposed versions are Sound Player 1.0.0, Walk Ons 3.0.0 and Video 2.3.0, with the coordinated Help/media-alias host minor 1.4.0. The routing-ID support needs matching Universal Overlay/Source Modules editor updates. These are planned labels, not releases or installed minimums; finalize all version ranges together before publication. Required browser-control infrastructure remains separate from optional playback/integration owners.

Implementation must cover:

- Sound Player standalone with no Walk Ons/Video, and Walk Ons with sound-only/video-only/both/neither owner.
- Real separate parent/child argument dictionaries, actual Sound/Video engines, matching/mismatched IDs, immediate completion, persistence failure and concurrent direct/Walk Ons requests.
- Legacy replacement versus guarded rejection; exact migrated pool weights/order, unknown/disabled references, zero volume, master gain once and same-clip replay identities.
- No eligibility change from Test, configuration, refresh, installation or migration. Normal explicit/startup/going-live reset behavior remains separately tested.
- Multiple renderer claim attempts, stale completion, disconnect/reconnect, startup interruption and no replay from saved state.
- Old/new media URLs, safe aliases, hash-preserving copy/rollback, saved visibility rules and unchanged existing Phone Deck card revisions.
- Actual Phone Deck declaration discovery, projected resources/status, old/missing native prerequisites, missing/stopped owners and no automatic cards or audience effects.
- Exact native assembly references/import metadata and package contents. Use temporary data/ports and synthetic audio only.

Before real adoption: finish automated/package/browser checks and a concrete backed-up checkpoint; announce required imports/restarts. Freeze the chat watcher during the owner transition and verify no active media. Back up the authoritative roster/seen ledger, source rules, media/index, action bodies, phone configuration and app/profile. Unload old audio documents, respecting Widgets' separate acknowledged-release contract before any aggregate document handoff. Import distinct new Sound IDs and new Walk Ons forwarders in the reviewed order, verify actual code/metadata, copy media and apply the idempotent state migration, then restore the watcher and scene policy. Never run Walk Ons Initialize as a migration shortcut: it resets eligibility. If a real Streamer.bot restart is necessary, explicitly preserve/restore the saved ledger under the paused handoff before resuming callers; do not silently treat that reset as data migration.

Rollback first stops/unloads the new renderer and suspends callers, then restores matching old native/module code and saved state/media/rules together. Preserve phone identities/layout/pairing and newer private data; do not delete the legacy media directory or imports during testing. No live media, chat, redeems or startup reset is an automated adoption test. Human verification is a checkpoint before subsequent module work.
