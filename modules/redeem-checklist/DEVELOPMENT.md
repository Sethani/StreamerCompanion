# redeem-checklist developer notes

## Testing

Synthetic C# tests cover in-place initialization, deduplication, categories, backlog migration, managed-map routing, language delegation arguments, complete/refund success and Twitch failure without live calls. Package and hidden-browser tests cover stable IDs, trigger ownership, absence of port 3124/private definitions, private dock rendering, inert load/refresh and confirmation-gated resolution.

## Implementation and migration reference

Redeem Checklist preserves the established private pending/history state and dock workflow while removing the old port-3124 callback. First-party code and design: Sethani, MIT.

The installed `Redeems - Create Managed Rewards` and `Redeems - Finalize Managed Rewards` setup actions remain private and are not replaced or packaged. Their saved reward map continues to work. New installations may duplicate the triggerless `Redeems - Trigger Adapter`, set a title/category and attach a native Streamer.bot channel-point trigger without creating a managed reward map.

This import is the authority switch: do not retain a second enabled copy of the old router/checker. The package has no reward IDs, viewer records, private reward definitions or Twitch credentials. Existing `managedLanguageRedemptionsJson` records remain in place and Named Timers continues their serial queue.

History is capped at the established 50 items. Items are deduplicated by redemption ID across pending and history. No checklist state is bundled into source, packages, fixtures or diagnostics.

