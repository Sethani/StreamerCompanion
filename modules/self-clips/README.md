# Self Clip Shoutouts

Play a random unused clip from your connected Twitch broadcaster account. Each eligible clip is used once per saved cycle; the next request starts another cycle when the current pool is exhausted. Manual requests and future BRB callers share this same history.

Find **Self Clip Shoutouts** under **Media** in Companion or Universal Dock.

## Setup

1. Install Self Clip Shoutouts and its required Shoutout Clips 2.2.1 and Universal Dock dependencies. Keep your existing Shoutout Clips layout, mute and maximum duration settings.
2. Back up Streamer.bot, then import the updated **Shoutout Clips** actions and the new **Self Clips** actions using **Import into Streamer.bot… → Copy import code → Import String**. Updating the package alone does not update native code.
3. Run **Shoutout Clips - Initialize** and **Self Clips - Initialize** once after these imports, while playback is stopped. The selector's Initialize preserves history and performs no clip lookup or playback.
4. Use your existing Universal Overlay source and allow **Shoutout Clips** in Overlay Visibility. This module adds no audience source, renderer or service.
5. Open Self Clip Shoutouts controls and press **Refresh own clips**. This reads clips for Streamer.bot's connected broadcaster using its existing Twitch connection; no credentials need copying into Companion.
6. Review the catalogue and cycle counts, then press **Play next self clip** when you intend playback. It uses the existing player's saved layout, mute and duration limit. No chat message or official Twitch shoutout is sent.

## Cycles and history

The module chooses randomly from unused clips. Once all currently eligible clips have been used, a subsequent request starts the next cycle. It avoids an immediate repeat across that boundary when another clip is available. With one eligible clip, each new cycle necessarily reuses it.

History survives restarts and is separate for each broadcaster account. Refreshing adds newly discovered clips to the current unused pool and removes unavailable clips from eligibility without clearing the current cycle's used IDs. A later reappearance does not make a used clip unused within that cycle.

The table shows pages of 50 clips and whether each is used in the current cycle. **Previous clips** and **Next clips** change the displayed page without playing anything.

Twitch limits individual paginated result sets. Refresh splits saturated date windows and deduplicates clip IDs. A refresh that cannot complete, exceeds 128 requests or 20,000 clips, or encounters a saturated minimum window is rejected; the previous catalogue/history remain available. See [Twitch Get Clips](https://dev.twitch.tv/docs/api/reference/clips) and [Streamer.bot clip queries](https://docs.streamer.bot/api/csharp/methods/twitch/clips/get-clips-for-user-by-id).

## Acceptance and recovery

A clip counts as used after the native clip player accepts the correlated request. This is not confirmation that a remote player finished loading or that OBS audio was audible. The existing player can shorten clips to its saved maximum duration.

- **Return last clip to unused** returns the last accepted clip from the current cycle to the pool. Confirm the operation. It sends no replay or Stop command.
- **Stop self clip** sends a guarded Stop for this module's last playback start. It cannot stop a newer unrelated clip.
- **Check pending request** checks the saved player acceptance and resolves a known accepted selection without replaying it.
- **Skip unconfirmed selection** explicitly marks an unresolved selection used without retrying playback. Confirm after checking the player; an unknown request may have played.

The module refuses another selection while its previous request is unresolved, and does not replace a busy clip player. Failed requests with a known player rejection leave their clip unused. Repeated retained request IDs do not play twice. Reconnects, initialization, status refreshes and history browsing do not automatically play or retry clips.

## Phone Deck and callers

Phone Deck discovers **Play next self clip**, **Refresh own clips**, **Return last clip to unused**, **Check pending request**, **Skip unconfirmed selection**, **Stop self clip**, and **Self clip cycle status**. Add cards in its editor; existing cards are untouched. Return/skip controls require confirmation. Status exposes cycle/count/last-selection fields, not your private full catalogue/history.

For a command or later BRB automation, add **Core → Actions → Run Action → Self Clips - Play Next**, with **Run Action Immediately** enabled. Supply a unique GUID `requestId` per intended request; reuse that same ID only to inspect the same retained operation. Attach your trigger to a caller action rather than editing the engine. No triggers are created automatically.

## Backup and limitations

Back up private Streamer.bot globals/profile and native actions before imports or rollback. The selector's private catalogue/history uses its own saved global, with a bounded public status projection. Do not share those globals as public exports. Removing a module package does not delete that history. The new player protocol preserves old player settings and accepted self-request acknowledgements across Initialize, Configure and Stop.

Experimental module. Verify native imports, Twitch lookup and audible overlay behavior in your own setup before using it live. First-party code: Sethani, MIT.

Timing fix in 1.0.1: self-clip refresh saves the actual clip duration. After importing the updated Self Clips and Shoutout Clips 2.2.1 actions, refresh your own clips once to populate timings; existing used-cycle history is retained.
