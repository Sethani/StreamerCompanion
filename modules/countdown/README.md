# Countdown

Version 1.1.1 adds optional Phone Deck controls: start the saved timer, 3/5-minute presets, custom whole-second duration/finished text, save settings, pause, resume, clear and a live status widget. Starts/presets retain native behavior, including updating saved duration; Save settings does not restart an active timer. The widget follows the saved end timestamp using Companion's clock, freezes when paused and shows Unknown for unavailable data. Local display expiry sends no native action. These timer controls never launch a stream, play music or announce going live. Dispatch reports Requested, since the existing native actions do not retain matching request-ID results. No cards are added automatically and Phone Deck is not a dependency.

This changes metadata/documentation only. The full native export body matches 1.1.0; existing imports/settings/active timers/combined-overlay rendering are preserved. Existing installations need no native reimport/restart or Companion rebuild.

Start, pause, resume and clear a countdown in the existing combined OBS overlay. Preserves the original centered yellow-to-green text and multiline finished message. First-party code/design: Sethani, MIT. No font files or external assets are bundled; the original Algerian/Georgia/serif font preference is retained.

## Install

Requires Companion 1.2.2+, Universal Dock and Streamer.bot's local WebSocket server. Install through the catalogue and import the Countdown action group. No Node service is installed or started. Initialize is registered for Streamer.bot startup; it preserves existing timer/config globals. Open Countdown in the dock, click Load saved state once after import, save a preset if desired, then Start/Pause/Resume/Clear. These are live timer controls; no automatic test starts on page load. Refresh your existing combined OBS source to load the integration. Do not add another OBS browser source. Source Modules controls scene visibility.

Public standalone installations can use Universal Overlay and Source Modules. The renderer is served from the module package; the existing personal combined shell embeds that renderer with its old countdown drawing suppressed. If Streamer.bot disconnects or the package is not Ready, the renderer hides instead of showing stale countdown text. The countdown advances from its saved end timestamp without requiring a tick service or per-second action calls.

## Compatibility and scope

The original six Countdown action IDs are preserved, along with portable.countdown.config and portable.countdown.state and the countdownMode argument. New Configure and Health wrappers are self-contained. The export contains only Countdown actions and startup initialization: no personal queues, chat commands, stream-start action, OBS credentials, media or Spotify settings. Imports replace the matching existing actions rather than requiring duplicate groups. Existing Streamer.bot globals and active timer state are retained; unknown config/state fields survive initialization. No legacy installer is executed and installed Streamer.bot JSON is never edited by builds.

The old countdown dock also orchestrates Stream - Launch, Stream - Configure Launch and legacy /api/stream/config routes. Those are a separate stream-launch feature and are deliberately still available in their original tools. The existing legacy stream-launch automation already forwards Countdown - Start while keeping a separate Node timer for Spotify fades; those action IDs and that call shape remain compatible. After timer cutover use this module's manual timer controls, not the old Node-only timer buttons. This package does not claim that launching a stream or retiring that backend has been migrated. Starting the timer does not trigger streaming, Spotify or OBS operations.

## Tests and limits

C# tests compile the actual engine against a synthetic CPH adapter and cover initialization, preservation, start/pause/resume/clear, preset configuration and invalid-input atomicity. Browser fixtures use a fake Streamer.bot endpoint; no real stream action is invoked. Final real Streamer.bot import/compiler and OBS visual acceptance remain controlled user checks. Old timer globals stay in Streamer.bot; no viewer history, tokens or personal defaults are copied into Companion or this package.
