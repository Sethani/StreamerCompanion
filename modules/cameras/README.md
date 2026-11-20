# Cameras

Switch the contents of two existing OBS camera scenes from one control panel. Use webcams, your PNG tuber, a Reactive guest or an OBS video input, with separate mode controls for Main Camera and Camera 2.

## Set up your source mappings

1. Connect Streamer.bot to OBS using its default OBS connection. Back up Streamer.bot and OBS before changing camera routing, and use one camera router for these scenes.
2. Install Cameras from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the supplied actions.
3. Choose **Open controls**, or select Cameras in [Universal Dock](../universal-dock/README.md). Press **Refresh** to read the OBS scene/input inventory.
4. Expand **Source mappings**. Choose your existing **Main scene** and **Camera 2 scene**, then map the source roles you use: Monitor webcam, Laptop webcam, My PNG tuber and Guest PNG tuber. Frame and Background are optional.
5. Press **Save mappings**. This stores the mappings without switching cameras. When ready to change OBS, choose a mode for the relevant slot, or use **Reapply** for saved configured modes.

New installations have empty mappings and do not change OBS until configured. No additional service or audience browser source is needed. Reactive Guests 2.1.0 or newer is optional and needed only for Reactive guest mode.

## Choose what each slot shows

Main Camera offers **Off**, **Monitor webcam**, **Laptop webcam** and **My PNG tuber**.

Camera 2 offers **Off (empty)**, **Laptop webcam**, **Reactive guest** and **OBS video source**. Reactive guest reveals a saved-guest picker; OBS video source reveals an OBS source picker. Choose the intended entry before relying on that mode.

Changing a mode applies that slot immediately and preserves the other slot and source mappings. Assigning a Reactive guest to Camera 2 does not enable that guest in the overlay lineup. If a selected guest disappears, its camera assignment is cleared and Camera 2 turns off.

**Refresh** reads OBS without changing visibility. **Reapply** applies the saved configured slots. After OBS reconnects, the native observer reapplies configured routing once; it does not repeatedly retry failed changes.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally offers main-camera modes, Camera 2 Off/Laptop modes, an OBS video-input picker, a saved Reactive guest picker and mode/status information. Set up mappings in the local controls first, then add the controls you want in the deck editor. No cards are created automatically.

Controls require the relevant configured slot and an available OBS connection; missing inputs or guests remain unavailable. Each command affects its chosen slot. A Requested result means the command was dispatched; check owner status and OBS for its outcome.

## If a camera does not change

Check the OBS connection and press Refresh. Confirm the scene and source names in Source mappings, save any correction, then explicitly Reapply when ready. Missing mappings are validated before current content is hidden. Missing laptop/video scene items may be added using the slot's existing template transform.

After a partial failure, inspect OBS before Reapply. Failed browser writes are not retried automatically. A successful status confirms acknowledged OBS operations; check the actual picture in OBS to verify the camera feed.

The router also manages the selected webcam/browser source's established deactivate, shutdown and restart settings. Review OBS if another feature uses the same inputs. If you uninstall the imported actions, disable their Initialize and Observe OBS startup/reconnect behavior as well.

Keep source mappings and provider URLs private and retain your Streamer.bot/OBS backups. Updates preserve saved mappings.

First-party source: Sethani, MIT.
