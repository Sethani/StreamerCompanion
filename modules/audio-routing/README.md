# Audio Routing

Audio Routing 2.0.1 packages the established OBS source classifications and dock controls. Install in Companion and import its six Streamer.bot actions. Open Audio in Universal Dock. No audience overlay, child service or Companion rebuild is required. The existing default OBS connection in Streamer.bot supplies inventory and track operations.

2.0.1 adds optional Phone Deck toggle/status declarations. The toggle uses the existing native owner and its persisted matching request acknowledgement; partial routing is reported as partial completion. It preserves classifications and the complete six-track routing rules. This metadata-only update has identical native export data to 2.0.0, so existing installations need no native reimport. Phone Deck is optional and no cards are added automatically.

Existing action IDs and `portable.audioRouting.config` / `portable.audioRouting.state` are retained. Configuration stays version 2. New installations start with an empty source map and game audio enabled for VOD; upgrades never seed personal source names or overwrite saved mappings. Exact source names, including case, are significant. Missing sources retain their classifications.

Save persists choices without changing OBS. Apply saves the draft and writes only available, eligible managed inputs. Live only uses track 1; Live + VOD uses 1 and 2; Game toggle uses 1 and optionally 2 according to the saved checkbox. These are complete six-track masks: managed routing turns tracks 3–6 off. Unmanaged/missing inputs, mute, volume, monitoring and OBS output profile settings are preserved. Initialize, Refresh and reconnect handling never apply tracks.

The existing Toggle action immediately flips the saved game preference and applies the entire managed routing plan. The dock checkbox is a draft until Save or Apply. The private Phone Deck compatibility bridge uses the same native action/state, without maintaining another routing map. The full Phone Deck migration is separate.

Configure calls retain `configJson` for Save/Apply and `audioRoutingMode` on Engine. An optional `requestId` is acknowledged as `lastRequestId` only with a persisted terminal `operation`; dispatch alone is not success. OBS request errors and verified per-source readback failures appear in results; missing inputs are skipped. Partial/unknown outcomes are not retried automatically. Refresh before retrying after a timeout. Removing the module does not delete Streamer.bot globals.

Private classifications, device IDs, capture targets, credentials and OBS snapshots are not included in the package. The installer handoff backs up data, removes only the duplicate legacy shared-initializer call and makes the old Node endpoints delegate to Streamer.bot. Phone pairing/cards/certificates remain in place. First-party code: Sethani, MIT.
