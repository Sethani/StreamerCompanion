# Redeem Checklist

## Optional Phone Deck controls (1.0.1)

Add Input cards for Complete pending redemption and Refund pending redemption, plus an optional pending-count widget. Pick the exact reward/viewer entry and confirm before dispatch. Only currently pending IDs are accepted; reward IDs, viewer input and history are not part of the phone projection. Completion/refund uses the existing native Twitch owner and preserves history and language routing. No history deletion, manual reward creation or duplicate language route is exposed.

Back up and reimport the updated actions, then run Initialize. Stable action/trigger/timer/queue IDs, wrappers, existing globals and configuration are retained; only engine code changes. New controls require phoneDeckVersion 1 so old imports stay disabled. The owner saves an intent before contacting Twitch and a keyed terminal result afterward. Rejected responses report failure; thrown responses or failed persistence remain unknown, without automatic mutation retry. Serialized operations prevent competing resolutions. No Companion/Phone Deck rebuild, new service or automatically added card is needed.

Redeem Checklist preserves the established private pending/history state and dock workflow while removing the old port-3124 callback. First-party code and design: Sethani, MIT.

## Install and cutover

Requires Companion 1.3.0+, Named Timers 1.0.1+, Universal Dock and Streamer.bot's local WebSocket server. Back up the Redeems action group and these persisted globals before import: `portable.redeems.state`, `managedRedeemRewardsJson`, `managedRedeemDockBacklogJson`, `managedLanguageRedemptionsJson` and `managedLanguageActive`.

Importing replaces the established router, five-second checker and compatibility resolver by their stable action IDs. It preserves `Redeems - Initialize`, `Redeems - Add` and `Redeems - Resolve` IDs and keeps all existing state in place. Restart Streamer.bot once so Initialize republishes the checklist and migrates any old Node backlog. The dock is private operator UI; this module deliberately registers no OBS overlay.

The installed `Redeems - Create Managed Rewards` and `Redeems - Finalize Managed Rewards` setup actions remain private and are not replaced or packaged. Their saved reward map continues to work. New installations may duplicate the triggerless `Redeems - Trigger Adapter`, set a title/category and attach a native Streamer.bot channel-point trigger without creating a managed reward map.

## Language handoff

`Redeems - Route Managed Redemption` remains the single installed wildcard reward trigger. Checklist items are added to `portable.redeems.state`; language items delegate to `Named Timers - Queue Language`. `Redeems - Check Timers and Retry` retains the shared five-second trigger but now only migrates any legacy backlog and delegates language completion to `Named Timers - Check Languages`.

This import is the authority switch: do not retain a second enabled copy of the old router/checker. The package has no reward IDs, viewer records, private reward definitions or Twitch credentials. Existing `managedLanguageRedemptionsJson` records remain in place and Named Timers continues their serial queue.

## Dock and resolution safety

The dock copies the established Do on stream, Writing backlog, recent resolutions and Complete/Refund confirmation workflow. Merely opening, refreshing or searching the dock executes nothing. Complete and Refund are the only controls that call Twitch, and each requires explicit confirmation. Failed Twitch updates remain pending with an error for retry.

History is capped at the established 50 items. Items are deduplicated by redemption ID across pending and history. No checklist state is bundled into source, packages, fixtures or diagnostics.

## Testing

Synthetic C# tests cover in-place initialization, deduplication, categories, backlog migration, managed-map routing, language delegation arguments, complete/refund success and Twitch failure without live calls. Package and hidden-browser tests cover stable IDs, trigger ownership, absence of port 3124/private definitions, private dock rendering, inert load/refresh and confirmation-gated resolution.
