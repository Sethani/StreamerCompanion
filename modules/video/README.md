# Video Player

Provides reusable local-video playback in the shared overlay, including an optional title bar, a registered video library, volume and fit controls, positioning, and guarded playback completion.

## Requirements

- Streamer.bot with its HTTP and WebSocket servers enabled.
- Universal Dock and the shared overlay source.
- Video files hosted in the Streamer.bot `/streaming/videos/` directory.

Streaming Companion is used only to install and verify the module. It does not need to run for Video playback.

## Install

1. Install `video.streammodule` through Streaming Companion.
2. Use **Open Streamer.bot import** if Companion reports missing actions.
3. Import all six Video actions into Streamer.bot.
4. Open Universal Dock > Video Player and save the desired presentation settings.
5. Enable `video` in Module Routing for every scene where videos may appear.
6. Run **Video health**, then play and stop a short registered video from Tests.

## Behaviour

`Video - Play` accepts a registered `id` and optional `title`. An empty title displays no title bar. `Video - Stop` hides and stops the active video. The browser renderer acknowledges natural playback completion with the active start timestamp so an older video cannot stop a newer one.

The module does not own birthday matching, walk-on selection, or shoutout clip lookup. Those are separate modules which may depend on Video Player.

## Settings and media

The library and presentation configuration are persisted in the Streamer.bot global `portable.video.state`. Installing or updating the package does not overwrite that global. Media files are not bundled in the module package; copy them into the shared `/streaming/videos/` folder and register them in Video Player.

## Uninstall and rollback

Disabling the module keeps its actions, settings, and media intact. Full removal deletes only the six `Video -` actions and the `portable.video.state` global. It must not remove Birthday, Walk Ons, Shoutout Clips, Universal Dock, or shared media files.
