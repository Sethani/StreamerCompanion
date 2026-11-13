# Spotify Music

Provides Spotify playback, countdown fading, scene-owned music, `!song`, `!playlist`, and optional automatic now-playing announcements.

## Requirements

- Companion 1.3.1 or newer.
- Streamer.bot with its WebSocket server enabled on `127.0.0.1:8080`.
- A Spotify application and a Spotify account capable of remote playback control.
- Chat Routing for viewer-facing command responses and announcements.

## Install

1. Install `spotify.streammodule` through Streaming Companion.
2. Use **Open Streamer.bot import** if Companion reports missing actions.
3. Start Spotify Music and enable automatic startup if desired.
4. Open Settings and enter the Spotify application client ID and secret.
5. Add the displayed callback URL to the Spotify application's allowed redirect URIs.
6. Save, choose **Authorize Spotify**, and complete authorization.
7. Open Spotify on the stream computer, refresh devices, choose the device, and save.
8. Configure the default playlist, volumes, fade duration, scenes, and chat options.
9. Run the registered current-playback and scene tests before going live.

## Behaviour

Configured scenes start music only when playback is not already active. Music is paused on leaving only when the scene session started it. Countdown playback and scene playback share ownership so leaving Starting Soon does not interrupt an active countdown handoff. If playback is manually paused after entering Starting Soon, the later stream-start handoff observes that paused state and starts the configured playlist again before arming the fade.

`!song`, `!playlist`, and automatic announcements are individually optional. Streamer.bot sends all public messages through `Chat - All Platforms`; service errors remain private.

## Data and updates

Spotify client credentials, refresh tokens, device IDs, playlists, and scene settings are stored in Companion's private `module-data/spotify` directory. They are not included in the module package or exposed by health responses. Module updates replace code without overwriting private configuration.

## Optional Phone Deck controls

Version 2.0.3 contributes Resume, Pause, Play/pause, Next, Previous, a volume input, volume presets and a playback-status widget. Add cards explicitly using Module action or the module input/widget picker. No cards are added automatically, and Phone Deck is not required to use Spotify Music.

The service must be running and authorized. The phone uses the existing device setting and server-side credentials; it cannot change credentials, playlists or scene bindings. Manual Resume continues the current Spotify context instead of starting the configured countdown playlist. Manual Pause/Resume releases the service's current scene/countdown ownership and fade; a manual volume request cancels the active fade. Saved automation settings remain intact. Next/Previous retain the current automation ownership.

Commands show **Requested** after Spotify accepts the API request. The widget independently reads playback, track, artist and volume; it does not prove audible output. No automatic mutation retry occurs. The owner stores recent request IDs privately to prevent duplicate dispatch after a lost response or service restart. Its narrow `/api/spotify/phone-deck/` endpoints enforce exact loopback Host/Origin and a session CSRF token. Existing native exports are unchanged; no Streamer.bot reimport is needed for this patch.

Scene bindings include **Autoplay on entering**, enabled by default for existing bindings. Turn it off for Starting Soon to avoid starting music just by previewing that scene. Guided Stream Launch/countdown music remains independent and still starts at stream launch. Already-playing music is preserved on entry.
