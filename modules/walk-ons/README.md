# Walk Ons

Give a viewer a sound or video entrance on their first ordinary chat message each stream. Commands beginning with `!` are ignored; an entrance skipped because media is busy remains eligible.

Find Walk Ons under **People** in Companion and Universal Dock.

## What you need

- Companion, Streamer.bot and Universal Dock, with the local Streamer.bot WebSocket connected.
- The Walk Ons actions imported into Streamer.bot.
- [Sound Player](../sound-player/README.md) for sound entrances, [Video Player](../video/README.md) for video entrances, or both.
- An open [Universal Overlay](../universal-overlay/README.md) and allowed scene visibility for the selected player.

Video-only entrances do not need Sound Player. Sound-only entrances do not need Video Player. Phone Deck is optional. Walk Ons has no separate audience overlay or service; the selected player renders the entrance.

## First setup

1. Install Walk Ons and choose **Import into Streamer.bot…** in Companion. In Streamer.bot's **Import** window, paste into **Import String**, review and import. Its **Chat Watcher** listens for chat messages; you do not need to add a second chat-message trigger.
2. Prepare the player first: add media, refresh its library and save. Enable that player's visibility in Overlay Visibility for the intended OBS scenes.
3. Open Walk Ons **Controls**. Enter the viewer's Twitch login without a display-name decoration.
4. Choose **Sound**, **Weighted sound pool** or **Video**. Select the saved sound/video, choose a saved Sound Player pool, or use the inline weighted choices.
5. Set **Volume**, an optional video **Title**, and **Enabled**, then press **Save**. An empty Walk Ons video title uses the login followed by "has entered chat".
6. Use that person's **Test** button off-stream. Test follows the same busy/availability rules but does not consume first-chat eligibility.

**Refresh audio** refreshes the Sound Player library; add and register sounds in Sound Player. **Refresh state** reloads saved assignments and session status.

## Entrances and eligibility

With **Once per person per stream** enabled, an accepted normal entrance marks that login used. Later messages stay silent. Disabled assignments do not play. Missing players, rejected requests and busy media leave the person eligible.

The default is once per stream. Turning the option off allows later ordinary messages to request another entrance when media is free. Save the behaviour setting explicitly.

- **Reset** on a person makes that person eligible again.
- **Reset all eligibility** clears the session for everyone and asks for confirmation.
- **Test** never marks someone used.
- Editing assignments, refreshing controls or discovering phone controls does not reset the session.
- Streamer.bot startup resets the session through the supplied Initialize action. If you also want a going-live reset, wire it explicitly as below; existing personal going-live wiring remains separate.

A viewer's audio volume is multiplied by Sound Player master volume. Zero is valid. Video entrances use the person's Volume instead of Video Player's default volume. Sound pools make one weighted draw; a weight of 3 is three times as likely as 1. There is no queue. Normal entrances do not overlap Sound Player, Video or Shoutout Clips.

## Connect other automation

The regular chat entrance is supplied. Keep its watcher and engine intact.

To test a specific saved person from another action, add **Core → Arguments → Set Argument**, name `login`, value the saved login, then **Core → Actions → Run Action → Walk Ons - Test** with **Run Action Immediately** enabled. This intentionally keeps normal eligibility unchanged. Attach a hotkey or a specific command trigger to your wrapper if desired.

For an explicit stream-start reset, create a separate wrapper with `login` set to `all`, followed by **Run Action → Walk Ons - Reset Session**. Connect it to your chosen going-live action or **Twitch → Channel → Stream Online** trigger. Choose one reset path so reconnecting or duplicate automation does not reset a session unexpectedly. Do not use **Walk Ons - Initialize** as an upgrade or migration shortcut.

Moderator compatibility commands are included:

| Command | Example |
| --- | --- |
| `!walkonadd` | `!walkonadd viewer sound sound-id` or `!walkonadd viewer soundpool sound-a:3 sound-b:1` |
| `!walkonlist` | Write configured assignments to the Streamer.bot log. |
| `!walkonremove` | `!walkonremove viewer` |
| `!walkonreset` | `!walkonreset viewer` or `!walkonreset all` |

Replace example names/IDs with your saved entries. The dock is easier for editing reusable pools and video titles. The imported commands are moderator-only; no channel-point or subscription triggers are created.

Streamer.bot references: [Set Argument](https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument), [Run Action](https://docs.streamer.bot/api/sub-actions/core/actions/run-action), [Stream Online](https://docs.streamer.bot/api/triggers/twitch/channel/stream-online).

## Phone Deck

Add **Test saved entrance**, **Choose entrance to test**, **Stop walk-on sound**, **Reset all walk-on eligibility** or **Walk-on session status** in Phone Deck's editor.

Test selects an enabled saved person. Stop affects audio only; use Video's Stop card for video. Reset all requires confirmation. Commands show **Requested**, which does not guarantee playback. The native playback acceptance used for eligibility is checked separately. Sound Player also offers independent library/pool/volume cards. No cards are added automatically.

## Troubleshooting and upgrades

| Symptom | Check |
| --- | --- |
| No entrance | Correct login, Enabled, ordinary message, selected player installed/imported, saved selection and player visibility. |
| Person already used | Reset that person for another normal entrance, or use Test. |
| Media busy | Stop/wait for the active player. The viewer remains eligible. |
| Test accepted but silent | Check the player's overlay, volume and OBS output. After opening Sound's overlay, Stop and Test again. |
| Sounds or videos missing | Save that player's library first, then refresh Walk Ons. |
| Reset happened after restart | Initialize resets eligibility at startup; review any separate going-live/reset wiring too. |

Upgrading from bundled Walk Ons audio requires a backed-up, coordinated Sound Player migration and updated native actions. Preserve roster, eligibility, media, routing and phone data; do not import an old bundled sound engine while Sound Player owns playback. Package removal does not erase those saved globals, imported actions or private media.
