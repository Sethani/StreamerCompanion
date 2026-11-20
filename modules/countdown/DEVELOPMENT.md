# Countdown developer notes

## Compatibility and scope

The original six Countdown action IDs are preserved, along with portable.countdown.config and portable.countdown.state and the countdownMode argument. New Configure and Health wrappers are self-contained. The export contains only Countdown actions and startup initialization: no personal queues, chat commands, stream-start action, OBS credentials, media or Spotify settings. Imports replace the matching existing actions rather than requiring duplicate groups. Existing Streamer.bot globals and active timer state are retained; unknown config/state fields survive initialization. No legacy installer is executed and installed Streamer.bot JSON is never edited by builds.

The old countdown dock also orchestrates Stream - Launch, Stream - Configure Launch and legacy /api/stream/config routes. Those are a separate stream-launch feature and are deliberately still available in their original tools. The existing legacy stream-launch automation already forwards Countdown - Start while keeping a separate Node timer for Spotify fades; those action IDs and that call shape remain compatible. After timer cutover use this module's manual timer controls, not the old Node-only timer buttons. This package does not claim that launching a stream or retiring that backend has been migrated. Starting the timer does not trigger streaming, Spotify or OBS operations.

## Tests and limits

C# tests compile the actual engine against a synthetic CPH adapter and cover initialization, preservation, start/pause/resume/clear, preset configuration and invalid-input atomicity. Browser fixtures use a fake Streamer.bot endpoint; no real stream action is invoked. Final real Streamer.bot import/compiler and OBS visual acceptance remain controlled user checks. Old timer globals stay in Streamer.bot; no viewer history, tokens or personal defaults are copied into Companion or this package.

## Implementation and migration reference

Public standalone installations can use Universal Overlay and Source Modules. The renderer is served from the module package; the existing personal combined shell embeds that renderer with its old countdown drawing suppressed. If Streamer.bot disconnects or the package is not Ready, the renderer hides instead of showing stale countdown text. The countdown advances from its saved end timestamp without requiring a tick service or per-second action calls.
