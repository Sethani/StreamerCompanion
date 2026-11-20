# Stream Launch

Start a guided stream launch using a saved OBS scene and Countdown, with optional Spotify music and an existing private follow-up action. Use **Go Live…** only when you intend to start a real stream.

## Configure before launching

1. Connect Streamer.bot to OBS and Companion's local WebSocket transport. Install/import [Countdown](../countdown/README.md) and [Universal Dock](../universal-dock/README.md). Spotify Music is optional; use Companion 1.3.0 or newer.
2. Back up Streamer.bot, install Stream Launch from **Catalogue** and choose **Import into Streamer.bot…** from its expanded Installed row for the six supplied actions. Existing current imports need no reimport/restart for this guide patch.
3. Choose **Open controls**, or select Stream Launch in Universal Dock. Press **Load saved settings**, then **Check readiness / refresh scenes**. These controls read status/action availability; they do not start a stream, music or follow-up.
4. Choose **Starting Soon scene**, Countdown seconds (1–86400 whole seconds) and Finished text. Check **Enable launch automation** when the intended settings are ready.
5. Choose whether to **Start Spotify Music and its countdown fade**. Configure playlist/device/volumes/fade separately in [Spotify Music](../spotify/README.md).
6. If needed, enable **Run an existing private announcement/bookkeeping action** and select its exact existing action name. Leave it off if you have none. Enable the online fallback only if you intend the behavior below.
7. Press **Save launch settings**, then review readiness. Unsaved changes block Go Live. A missing enabled follow-up blocks launch before effects.

Fresh profiles start disabled without a saved scene/follow-up/fallback. No background service or new OBS source is added. Countdown uses the existing [Universal Overlay](../universal-overlay/README.md) source and [Overlay Visibility](../source-modules/README.md) scene rules.

## What Go Live does

Go Live requires explicit confirmation and saved ready settings. The native action selects/verifies the saved scene, starts Countdown, requests OBS streaming and waits up to 15 seconds for streaming confirmation. Only then does it request enabled Spotify playback/fading and the private follow-up. Spotify uses the countdown time remaining, sharing an existing scene-owned music session rather than restarting it unnecessarily.

OBS startup failure prevents Spotify/follow-up dispatch, although Countdown may remain running; inspect its controls. Once OBS is live, optional-step failure reports partial completion and does not stop the stream or blindly retry announcements. There is no automatic rollback of external effects. Inspect the failed module/action and actual stream before manually retrying.

The private follow-up remains your own action; credentials, webhook settings, reward changes and session-reset behavior stay there. Dispatch does not prove a remote webhook or reward update arrived. No private action body or personal scene/playlist is bundled.

## Online fallback and duplicate protection

**Run fallback automation when Twitch reports the stream online** applies only if enabled and OBS is already streaming. It never chooses a scene or starts OBS. The fallback shares duplicate-launch protection with guided Go Live; duplicate online events are suppressed for 30 minutes after a launch attempt.

The deduplication latch is saved before effects. Late online events after a partial launch are suppressed, and a persisted interrupted launch is reported on reload rather than replayed. Restarting does not replay a launch or announcement. Manual Countdown Start/Pause remains separate from guided launch and music automation.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Go live (guided)** and **Launch progress**. Add cards explicitly; none are created automatically. Guided Go Live dispatches **Stream - Launch** using saved settings and retains the mandatory 1.2-second hold/keyboard confirmation.

Phone Deck's **raw OBS Start** remains a direct stream command without this countdown/music/follow-up sequence. Progress shows starting/complete/partial/error/interrupted and optional-step results rather than invented percentages. Requested means dispatch, not confirmed completion. Configuration and readiness remain in this module's dock.

## Recovery and backup

If readiness fails, check the exact scene, OBS connection, required actions and enabled optional providers/follow-up. Recheck without launching; never use Go Live as a connection test. For an interrupted/partial run, inspect OBS, Countdown, Spotify and the private action before another intended launch.

Saved launch configuration/state live in Streamer.bot and survive imports/updates. Back up those settings and private actions before engine changes, retaining the compatible previous module package for rollback. Guide-only updates require no native reimport or host rebuild.

First-party code: Sethani, MIT.
