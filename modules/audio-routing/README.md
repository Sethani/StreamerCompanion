# Audio Routing

Choose which OBS audio sources reach the live stream and the VOD. Save a routing plan, apply it when ready, and switch game audio's VOD inclusion from the dock or Phone Deck.

## Set up

1. Connect Streamer.bot to OBS using its default OBS connection. Open **Help → Getting Started** in Companion for the shared setup.
2. Install Audio Routing from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the six supplied actions. Back up Streamer.bot before replacing imported actions.
3. Choose **Open controls**, or select **Audio Routing** in [Universal Dock](../universal-dock/README.md).
4. Press **Refresh** to read the available OBS sources. For each source you want managed, choose a classification below.
5. Review **Routing Plan** and **Game audio goes to VOD**. Press **Save** to store choices, or **Apply to OBS** to save and change OBS routing.

No additional service or audience browser source is needed. New installations start without managed sources; updates retain your saved mappings. Source names must match exactly, including case.

| Classification | Applied tracks |
| --- | --- |
| Unmanaged | Leaves the source's existing tracks alone |
| Live only | Track 1 |
| Live + VOD | Tracks 1 and 2 |
| Game toggle | Track 1, plus track 2 when Game audio goes to VOD is checked |

Applying a managed classification writes a complete six-track mask, turning tracks 3–6 off for that source. Check that this fits any separate recording tracks you use. The module preserves mute, volume, monitoring and OBS output profile settings; configure OBS's stream/VOD output tracks separately.

## Everyday use

**Save** stores the draft without changing OBS. **Apply to OBS** saves it and applies the managed plan to available eligible inputs. **Refresh** reads OBS; startup and reconnect handling do not apply routing.

The **Game audio goes to VOD** checkbox remains a draft until Save or Apply to OBS. The imported **Audio Routing - Toggle** action instead flips the saved preference and immediately applies the entire managed routing plan.

Missing sources remain under **Configured but unavailable**, retaining their classification for when they return. Unmanaged and unavailable sources are skipped during Apply.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Toggle game audio VOD** and **Audio routing status**. Add them in the deck editor; no cards are created automatically. The toggle requires OBS to be available and uses the same saved routing plan as the dock. Check its completion status: partial application is reported as partial completion.

## Troubleshooting and backup

If Streamer.bot is disconnected, reconnect it before saving or applying. If OBS is unavailable, check Streamer.bot's default OBS connection and Refresh. After a timeout or partial result, inspect OBS and refresh before explicitly retrying; uncertain writes are not retried automatically.

Saved source mappings live in Streamer.bot and survive module removal. Keep them in your private Streamer.bot backup with your phone settings. Do not include private source mappings in shared exports.

First-party code: Sethani, MIT.
