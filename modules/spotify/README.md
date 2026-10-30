# Spotify Music

Provides Spotify playback, countdown fading, scene-owned music, `!song`, `!playlist`, and optional automatic now-playing announcements.

## Requirements

- Streaming Companion 1.0 or newer.
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

Configured scenes start music only when playback is not already active. Music is paused on leaving only when the scene session started it. Countdown playback and scene playback share ownership so leaving Starting Soon does not interrupt an active countdown handoff.

`!song`, `!playlist`, and automatic announcements are individually optional. Streamer.bot sends all public messages through `Chat - All Platforms`; service errors remain private.

## Data and updates

Spotify client credentials, refresh tokens, device IDs, playlists, and scene settings are stored in Companion's private `module-data/spotify` directory. They are not included in the module package or exposed by health responses. Module updates replace code without overwriting private configuration.
