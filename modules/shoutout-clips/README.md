# Shoutout Clips

Play a Twitch clip you select in the shared stream overlay. This module is the clip player: channel clip lookup, chat messages, official Twitch shoutouts and optional AI wording belong to separate caller automation.

The2.2.0 candidate adds correlated, deduplicated acceptance for [Self Clip Shoutouts](../self-clips/README.md). Import its updated native actions when adopting that integration; the older player does not implement its acceptance protocol. Existing manual callers, action IDs and saved layout/mute/duration settings are preserved.

## Set up the player

1. Connect Companion to Streamer.bot's local WebSocket server. Install Shoutout Clips from **Catalogue**, expand its **Installed** row and choose **Import into Streamer.bot…** to import the six supplied actions. Back up Streamer.bot before replacing imports. Version 2.2.1 requires an updated native import and initialization for fractional clip timing and Self Clip Shoutouts support.
2. Choose **Open controls**, or select Shoutout Clips under Media in [Universal Dock](../universal-dock/README.md). No separate service is needed.
3. Under **Clip player**, choose Player, Maximum duration (seconds) and Muted. Configure Position and size and Title bar as desired, then **Save settings**. Reset buttons change the draft; save to apply those defaults.
4. Use the existing [Universal Overlay](../universal-overlay/README.md) source. In [Overlay Visibility](../source-modules/README.md), allow Shoutout Clips in the intended scenes. The internal routing ID stays shoutoutclip; do not add a duplicate clip source.

## Play intentionally

Under **Preview and save**, enter a **Twitch clip ID** (the clip slug/ID, not a channel name), optional Channel label and Optional title, plus Preview seconds. **Play preview saves any unsaved player changes first**, then plays the supplied clip on the actual overlay wherever visible, including OBS. Choose an appropriate time to test it. Preview sends no chat or official shoutout and needs no AI.

**Stop** clears the current local clip. The native player guards completion by the playback start identity so a late completion cannot stop a newer run of the same clip. The saved maximum limits requested duration. **Health** checks native state and writes details to Streamer.bot's private log; it does not play a test.

## Use a custom caller

In your own Streamer.bot action, add **Core → Arguments → Set Argument** for `clipId` with the selected slug, and optionally `channel`, `title` and `durationMs` (milliseconds, for example 15000). Then add **Core → Actions → Run Action**, choose **Shoutout Clips - Play** and enable **Run Action Immediately**. Enter argument names without percent signs. Attach your chosen trigger to the caller rather than changing the imported engine.

Play also accepts slug as a compatibility argument. Stop accepts optional startedAtMs for guarded completion. Keep channel lookup/official shoutout/chat automation separate and supply only the clip you intend to play. Running your caller has real overlay/media effects.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally offers **Play saved clip ID**, **Play clip by ID**, **Stop shoutout clip** and **Shoutout clip status**. Add Button/Input/widget cards in its editor; no cards appear automatically. Phone playback uses the native owner's saved mute/layout/title/duration limit and adds no channel lookup or AI step.

Commands report **Requested** rather than durable confirmed delivery. Status reflects saved clip visibility/ID/duration, not audible remote playback. Lost responses remain unknown and are never automatically retried; check the actual player before another request.

## Troubleshooting and backup

Check the clip ID, scene rule, native imports and shared source if a clip does not appear. Provider restrictions or network failures can prevent playback even when the native state accepted it. Use Twitch embed when its saved mute behavior is required; the retained mature-content-compatible provider controls its own mute behavior.

Initialization/imports/updates preserve saved player settings. Back up private Streamer.bot state and callers before engine changes. Removing the package does not erase that state or private adapters/session lists.

## External players

Twitch and MustachedManiac players load remotely; their code, clips and media are not redistributed or covered by this project's MIT licence. Internet access and provider availability are required. This package does not bypass provider restrictions or guarantee playback for every clip. Twitch's documented clip embed parameters include autoplay, muted and parent: https://dev.twitch.tv/docs/embed/video-and-clips/

The retained mature-content-compatible mode uses the existing MustachedManiac hosted player with `clipId` and `platform=obs`. Its mute behavior is provider-controlled: the legacy integration has no verified mute parameter for this mode. Use Twitch embed when the saved mute setting is required. External player/provider terms continue to apply.

First-party source: Sethani, MIT. No external player code or media assets are included. Removing this module does not delete Streamer.bot state, private adapters or session lists.

Timing fix in 2.2.1: numeric or invariant-decimal fractional milliseconds are rounded up within the saved duration limit, rather than falling back to that limit. Import the updated native actions and initialize while idle.
