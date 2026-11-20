# audio-routing developer notes

## Implementation and migration reference

The existing Toggle action immediately flips the saved game preference and applies the entire managed routing plan. The dock checkbox is a draft until Save or Apply. The private Phone Deck compatibility bridge uses the same native action/state, without maintaining another routing map. The full Phone Deck migration is separate.

Configure calls retain `configJson` for Save/Apply and `audioRoutingMode` on Engine. An optional `requestId` is acknowledged as `lastRequestId` only with a persisted terminal `operation`; dispatch alone is not success. OBS request errors and verified per-source readback failures appear in results; missing inputs are skipped. Partial/unknown outcomes are not retried automatically. Refresh before retrying after a timeout. Removing the module does not delete Streamer.bot globals.

Private classifications, device IDs, capture targets, credentials and OBS snapshots are not included in the package. The installer handoff backs up data, removes only the duplicate legacy shared-initializer call and makes the old Node endpoints delegate to Streamer.bot. Phone pairing/cards/certificates remain in place. First-party code: Sethani, MIT.

