# Video Player

Play saved local videos through the shared overlay, with optional titles, adjustable placement and volume. Use it directly, from a custom trigger, or as the video owner for [Walk Ons](../walk-ons/README.md).

Find Video Player under **Media** in Companion and Universal Dock. Its Streamer.bot actions retain the `Video -` names.

## What you need

- Companion and Streamer.bot running, with the local Streamer.bot WebSocket connected.
- Universal Dock, [Universal Overlay](../universal-overlay/README.md) and [Overlay Visibility](../source-modules/README.md), installed with the player through the catalogue.
- Video and Overlay Visibility actions imported into Streamer.bot.

The browser transport currently uses an unauthenticated loopback Streamer.bot WebSocket. Companion serves the editor, overlay and copied files. No separate Video service, personal server or extra OBS video source is required for newly added media. Phone Deck and Walk Ons are optional.

## First setup

1. Back up Streamer.bot. Install Video Player in Companion and choose **Import into Streamer.bot…**. Paste the copied code into Streamer.bot's **Import → Import String**, review and import all six Video actions. Import Overlay Visibility' actions as well if they are not set up.
2. On a fresh setup, run **Module Routing - Initialize** and **Video - Initialize** once. Their startup triggers handle later starts. Installing package files alone does not import actions.
3. Choose **Add media** on Video Player in Companion. Supported files are MP4, WebM, M4V and MOV; the file's codec must also be supported by the OBS browser.
4. Open **Controls**, press **Refresh media**, label the videos and press **Save settings**. Uncheck availability to stop offering an entry for new selections.
5. Add the Universal Overlay URL to OBS once, using your canvas dimensions. Reuse an existing shared source rather than adding a second copy.
6. In Overlay Visibility, allow **Video Player** in **All scenes** or the chosen exact scene names, and save.
7. Choose a video and optional title under **Preview and save**, then press **Play preview**. Check the title, placement, sound and natural completion; **Stop** hides it.

**Play preview** uses the real shared overlay and can be visible to viewers. It is not an isolated editor preview; do the first check off-stream. Save pending settings before relying on them in Phone Deck or other actions.

## Adjust presentation

| Controls | Purpose |
| --- | --- |
| Anchor, X/Y offset, Width | Place and size the video relative to the canvas. |
| Aspect ratio | Choose 16:9, 4:3, Square or Source. |
| Video fit | Contain keeps the whole image; Cover crops to fill; Stretch fills without preserving proportions. |
| Volume (%) | Set playback volume; zero is silent. |
| Title position/size/colours/opacity | Style the optional title bar. An empty title hides it. |
| Reset buttons | Stage defaults for position or title styling. Save to apply. |

Presentation changes apply when saved and used for the next playback. The active video keeps its playback snapshot. Stop affects Video only, not Sound Player or Shoutout Clips.

## Library, IDs and replacement files

**Video ID** is read-only. Select and copy it for a custom Streamer.bot action. Labels can change without changing the ID.

To replace a file while retaining an existing ID, add the new file through Companion and press **Refresh media**. In the original row choose the replacement in **Replace media**, then save. New copies also receive their own library IDs; disable duplicates you do not want to offer.

**Export** downloads the current settings, including staged edits. **Import** loads a settings file into the editor; inspect it and save to apply. These buttons import/export settings, not the actual media files. Original files are never moved or deleted.

Legacy local video URLs remain supported while their original host is available. Replace them deliberately through the existing row to remove that dependency. Missing old files are not silently scanned or copied. Keep original files/settings for rollback.

## Connect a command, reward or subscription

Create a separate wrapper action for each selection; keep the supplied actions intact.

1. Add an action such as **Play celebration video** in Streamer.bot.
2. Add **Core → Arguments → Set Argument**, Variable Name `id`, Value the copied **Video ID**. No percent signs belong around the variable name.
3. Optionally add a second Set Argument named `title` with fixed text. Leave it empty for no title bar.
4. Add **Core → Actions → Run Action**, choose **Video - Play**, and keep **Run Action Immediately** enabled.
5. Attach one of these triggers to your wrapper:

| Trigger | Setup |
| --- | --- |
| Chat command | Add a command such as `!celebrate` in **Commands**, configure permissions/cooldown, then choose it in **Core → Commands → Command Triggered** on the wrapper. |
| Channel points | Use **Twitch → Channel Reward → Reward Redemption** and select one specific configured reward. Video playback does not automatically fulfill or refund the redemption. |
| Subscription | Use **Twitch → Subscriptions → Subscription**, choosing the desired tiers. Add resubscription or gift triggers separately if wanted. |

For a stop wrapper, run **Video - Stop** with no media argument. The module does not create commands, rewards or subscription triggers for you, and does not perform birthday matching or shoutout clip lookup.

These recipes use registered IDs rather than viewer-supplied file paths. Test the wrapper manually off-stream before enabling an audience trigger.

Streamer.bot references: [Set Argument](https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument), [Run Action](https://docs.streamer.bot/api/sub-actions/core/actions/run-action), [Commands](https://docs.streamer.bot/guide/core/commands), [Reward Redemption](https://docs.streamer.bot/api/triggers/twitch/channel-reward/reward-redemption), [Subscription](https://docs.streamer.bot/api/triggers/twitch/subscriptions/subscription).

## Optional integrations

**Phone Deck:** add Play registered video, Stop video or Video status. Play selects an enabled saved video and can take a title; private source paths are not sent to the handset. Commands show **Requested**, not proof of audible/visible playback. No cards are added automatically.

**Walk Ons:** save a Video assignment there. Walk Ons handles the person and eligibility; Video handles playback. Sound Player is not required for video-only entrances.

## Troubleshooting and recovery

| Symptom | Check |
| --- | --- |
| No registered videos | Add media in Companion, refresh here and save. |
| Black/hidden playback | Current scene visibility, open Universal Overlay, saved enabled ID and a browser-supported codec. |
| No sound | Player volume, any muting argument, OBS source audio and monitoring/output. |
| Clip restarts after a scene change | Leaving an allowed scene removes Video's frame. Returning may rebuild an active clip from the beginning. Avoid multiple playback overlays. |
| Disconnected | Keep Companion/Streamer.bot running and restore the WebSocket connection. Reconnect reads saved state without issuing a new Play. |
| Old actions look Ready but behave differently | Names alone cannot verify imported code. Reimport a required functional update after backing up; documentation/editor-only updates need no native reimport. |

Back up Streamer.bot and Companion's data profile before uninstall or rollback. Package installation preserves copied media and saved settings; it does not modify OBS sources. Restore compatible browser packages, native actions and intentionally changed settings together. Removing package code does not erase imported actions, globals or private media.

Video 2.3.0 introduced request-bound acceptance for Walk Ons and required updated native actions. The later category, guide and read-only ID changes keep that native action data unchanged.
