# Redeem Checklist

Redeem Checklist preserves the established private pending/history state and dock workflow while removing the old port-3124 callback. First-party code and design: Sethani, MIT.

## Install and cutover

Requires Companion 1.3.0+, Named Timers 1.0.0+, Universal Dock and Streamer.bot's local WebSocket server. Back up the Redeems action group and these persisted globals before import: `portable.redeems.state`, `managedRedeemRewardsJson`, `managedRedeemDockBacklogJson`, `managedLanguageRedemptionsJson` and `managedLanguageActive`.

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
