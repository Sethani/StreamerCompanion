# Sound Player

Play sound effects from a saved library, or draw one sound from a weighted pool. Sound Player handles audio and master volume; [Walk Ons](../walk-ons/README.md) adds viewer entrance rules.

Find it under **Media** in Companion and Universal Dock.

## What you need

- Companion and Streamer.bot running, with the local Streamer.bot WebSocket connection configured.
- Sound Player and Universal Dock installed, with Sound Player's actions imported.
- [Universal Overlay](../universal-overlay/README.md) open in OBS to produce audio.
- [Overlay Visibility](../source-modules/README.md), which provides Overlay Visibility for the shared-overlay setup below.

Phone Deck, Walk Ons and Video Player are optional. Sound Player does not need a separate service, port, OBS audio source or chat trigger. Companion hosts your copied files.

## First setup

1. Install Sound Player, Universal Overlay and Overlay Visibility in Companion. For Sound Player and Overlay Visibility, choose **Import into Streamer.bot…**, copy the import code, then use Streamer.bot's **Import** window and **Import String** field. Review and import the listed actions. Installing a package alone does not import them.
2. For a fresh installation, run **Module Routing - Initialize** and **Sound Player - Initialize** once. Later Streamer.bot starts initialize them automatically. Do not initialize Sound during playback: interrupted audio is stopped.
3. Choose **Import audio** on Sound Player in Companion and select MP3, WAV, OGG or M4A files.
4. Open **Controls**, press **Refresh media**, name the entries and press **Save settings**. Uncheck **Available** to keep an entry without offering it for new selections.
5. Add the Universal Overlay browser-source URL to OBS once, using your canvas dimensions. Reuse an existing Universal Overlay source; do not add another just for Sound Player.
6. In Overlay Visibility, set **Sound Player** to **All scenes**, or **Selected scenes** with the exact OBS scene names, and save. Hidden is silent.
7. With the overlay already open in an allowed scene, select a sound and press **Play sound**. Check OBS audio monitoring and the output you intend viewers to hear. Then press **Stop**.

Files are copied; the originals are not moved or deleted. Saving the library registers the copies for playback and Phone Deck.

## Everyday use

- **Play sound** replaces current audio. There is no queue.
- **Stop** stops audio, including a request waiting for an overlay.
- Change **Master volume (%)** and **Save settings** to apply it. Zero is mute. A volume change does not restart a sound.
- **Sound ID** is read-only. Select it to copy the value for a custom Streamer.bot action; changing a label keeps the ID.

The status distinguishes an accepted request waiting for an overlay from one claimed by a renderer. Neither proves that OBS output is audible.

A new overlay document does not replay an old accepted request. After enabling visibility or reopening the overlay, press **Stop**, then **Play sound** again. Reconnecting also does not replay previous audio. Keep only the intended overlay view open.

## Weighted pools

1. Press **Create pool** and name it.
2. Press **Add sound** for each choice, select a registered sound and enter a positive weight.
3. Save settings, choose the pool and press **Play pool**.

Weights describe relative chances: 3 is three times as likely as 1. Each request draws once. A pool needs at least one valid choice. Disable the pool to remove it from new selections. **Delete pool** removes the saved pool after saving; check any Walk Ons assignments using it. **Pool ID** can be selected and copied for a custom trigger.

## Connect a command, reward or subscription

Create a separate action for your automation; keep the supplied engine and entry actions intact.

For a fixed sound:

1. In Streamer.bot, add an action such as **Play welcome sound**.
2. In its Sub-Actions, add **Core → Arguments → Set Argument**. Set Variable Name to `id` and Value to the copied **Sound ID**. Do not put percent signs around the variable name.
3. Add **Core → Actions → Run Action**, choose **Sound Player - Trigger Adapter**, and leave **Run Action Immediately** enabled.
4. Attach the trigger you want, using one of the recipes below.

For a pool, use `poolId` and the copied **Pool ID** instead of `id`. Use a separate action for each fixed selection. The adapter starts playback; it does not configure the library or create triggers.

| Trigger | How to connect it |
| --- | --- |
| Chat command | In **Commands**, right-click **Add** and configure a command such as `!welcome`, with the permissions/cooldown you want. On your action, add **Core → Commands → Command Triggered** and choose that command. |
| Channel points | On your action, add **Twitch → Channel Reward → Reward Redemption** and select one specific configured reward. Playback does not automatically fulfill, cancel or refund it. |
| Subscription | Add **Twitch → Subscriptions → Subscription** and choose the tiers. Resubscriptions and gifts have separate triggers; add them only if wanted. |

Test your wrapper manually while off-stream before enabling an audience trigger. These are recipes for actions you create; the module imports no commands, rewards or subscription triggers.

Streamer.bot references: [Set Argument](https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument), [Run Action](https://docs.streamer.bot/api/sub-actions/core/actions/run-action), [Commands](https://docs.streamer.bot/guide/core/commands), [Reward Redemption](https://docs.streamer.bot/api/triggers/twitch/channel-reward/reward-redemption), [Subscription](https://docs.streamer.bot/api/triggers/twitch/subscriptions/subscription).

## Optional integrations

**Phone Deck:** add Play sound, Choose sound to play, Play weighted pool, Stop sound, Set sound volume or Sound playback status in its editor. Sound and pool choices come from saved enabled entries. Discovery does not add cards. A completed command acknowledges saved playback state, not audible output.

**Walk Ons:** configure viewer assignments there. Entrance volume is multiplied by Sound Player's master volume. Busy/rejected entrances stay eligible. Direct sound playback replaces audio; Walk Ons requests reject while audio, Video or Shoutout Clips is busy.

## Troubleshooting and recovery

| Symptom | Check |
| --- | --- |
| Empty library | Import audio in Companion, refresh here and save. |
| Accepted but silent | Visibility must allow the current scene and the overlay must already be open. Check volume, OBS monitoring/output, then Stop and Play again. |
| Waiting after reconnect | Old audio is not replayed. Start a fresh request explicitly. |
| Pool will not save or play | Add valid enabled sounds and positive weights. Imported older pools can retain unavailable references; repair the chosen reference rather than assuming it was silently removed. |
| Phone choices missing | Save changes, then allow Phone Deck to refresh. Check that the native actions and owner are available. |
| Existing Walk Ons audio upgrade | Keep backups and use the coordinated Sound/Walk Ons migration; do not import an older bundled audio engine alongside Sound Player. |

Back up Streamer.bot state and Companion's data profile before migration or rollback. Keep legacy media and compatible native/browser code together until verification is complete. Removing a package does not erase imported actions, saved globals or private media.
