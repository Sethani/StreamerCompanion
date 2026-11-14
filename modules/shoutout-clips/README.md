# Shoutout Clips

## Optional Phone Deck controls (2.1.1)

Add a Button for Play saved clip ID or an Input card for Play clip by ID, plus Stop shoutout clip and a status widget if desired. Playback accepts a Twitch clip ID directly and uses the native owner's existing player, duration limit, mute, layout and title styling. Phone controls add no channel lookup or AI step and do not change saved presentation settings. Status reflects the owner's saved clip visibility/ID/duration, not proof that a remote player is audible.

Commands report Requested without a matching durable operation acknowledgement. Lost responses stay unknown and never retry automatically. Existing native actions/state and import data are unchanged; no new Streamer.bot import/restart, Companion/Phone Deck rebuild, service, dependency or automatic cards are needed.

The existing Streamer.bot-owned Twitch clip player, extracted with its established controls and shared-overlay appearance. Version 2.1.1 preserves the six action IDs and `portable.shoutoutClip.state`; importing never seeds personal settings or viewer data.

Install from Companion, import the included Streamer.bot export, and open Shoutout Clips in Universal Dock. Universal Overlay hosts the renderer using the existing `shoutoutclip` routing identity. The personal combined source can host the same packaged renderer; no extra OBS source is needed.

Configure player mode, maximum duration, mute, position, dimensions and title-bar appearance. Preview plays only the supplied clip; it sends no chat or official Twitch shoutout. Stop is guarded by the playback start identity, including when the same clip is replayed. Controls retain unsaved edits during refresh. Existing settings survive initialization, import and upgrades.

`Shoutout Clips - Play` accepts `clipId` (or `slug`), optional `channel`, `title` and `durationMs`. Duration is limited by the saved maximum. `Shoutout Clips - Stop` accepts optional `startedAtMs` to reject stale completion. Configure accepts the existing JSON `config`; the state-envelope contract is unchanged.

Target lookup, clip selection, chat routing, official shoutouts and session bookkeeping remain in the separate private orchestration adapter. Its optional warm-text service is still a legacy dependency until the Ollama migration. Missing AI must retain fallback chat and must not prevent clip playback.

## External players

Twitch and MustachedManiac players load remotely; their code, clips and media are not redistributed or covered by this project's MIT licence. Internet access and provider availability are required. This package does not bypass provider restrictions or guarantee playback for every clip. Twitch's documented clip embed parameters include autoplay, muted and parent: https://dev.twitch.tv/docs/embed/video-and-clips/

The retained mature-content-compatible mode uses the existing MustachedManiac hosted player with `clipId` and `platform=obs`. Its mute behavior is provider-controlled: the legacy integration has no verified mute parameter for this mode. Use Twitch embed when the saved mute setting is required. External player/provider terms continue to apply.

First-party source: Sethani, MIT. No external player code or media assets are included. Removing this module does not delete Streamer.bot state, private adapters or session lists.
