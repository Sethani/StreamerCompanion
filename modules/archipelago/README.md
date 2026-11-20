# Archipelago

Show selected Archipelago players' progress, logic and recent activity on stream. Choose rooms and slots reported by Archipelago Controller; Companion remembers display choices separately for each room.

## Before you start

Use Companion 1.3.1 or newer and Archipelago Controller with Room data API 2.2 running locally. The default Controller address is `http://127.0.0.1:38283/api/controller/v2`. Expose the rooms you want in Controller. Controller owns the game connection and calculations; this module needs no Streamer.bot import or local logic worker.

## Set up your display

1. Install Archipelago from **Catalogue**. In **Installed**, expand its row and **Start** the service, then open **Settings**. Universal Dock is installed as a dependency.
2. Under **Available rooms**, choose your room. Use **Reload rooms** if it is missing.
3. Under **Slots**, check **Include** for the players you want, or use **Select all**. Choose **Percentage** and **Logic** independently for each included slot.
4. Under **On stream**, choose Progress, Goals, Logic, Activity and Player names as needed. Check **Enable this overlay**, then **Save display**. A fresh installation displays nothing until configured.
5. If you use [Universal Overlay](../universal-overlay/README.md), reuse that shared OBS source. In [Overlay Visibility](../source-modules/README.md), allow Archipelago in the intended scenes.

For an advanced separate source, use the renderer address shown in Settings (default `http://127.0.0.1:3141/overlay`). Direct use does not need Universal Overlay or Overlay Visibility. Disable any old Archipelago renderer before showing the replacement. Keep Companion, the Archipelago service and Controller running.

## Everyday use

**Save display** saves the current room's selections and display options. Returning to a room restores its choices. A new room generation requires a fresh slot selection so old slot IDs cannot display different players accidentally.

**Enable overlay** / **Disable overlay** at the top saves immediately, even if Controller is offline, and retains your room choices and unsaved form edits. Disable also clears a live test. Scene routing still applies separately.

**Hide logic for games at 100% checks** hides completed games' logic without hiding their percentage or activity. **Show BK games** includes fresh logic results with no available checks. Neither option starts or cancels Controller calculations. Unavailable or stale analysis is labelled rather than counted as zero.

SlotLock filtering starts enabled. Locked, unknown or unsynchronized slots stay hidden when the corresponding filter is on; rooms reporting no SlotLock restriction display normally. Activity involving a locked or unknown participant is also hidden when activity filtering is enabled. Only included game slots contribute to the display.

## Test the appearance

**Test incoming item (preview)** opens a separate synthetic notification with a replay button. It does not affect the live overlay, fetch room data or send game items.

**Test incoming item on live overlay** shows a marked sample on the actual OBS display for 15 seconds. Enable and save the overlay first; this test can appear even with normal activity hidden or SlotLock pending. **Clear live test** removes it immediately. It sends no game item or Controller request and is never replayed after restart.

## Optional room actions and Phone Deck

For **Refresh room**, **Wake room** or **Recalculate selected slots**, open **Connection settings**, paste the Controller API key (or **Choose API key file**) and **Save connection**. Passive local reads normally need no key. Wake and Recalculate require confirmation. Configure the appropriate YAML templates in Controller before recalculating. A starting response does not confirm a room has finished waking; some Controller builds require their Rooms screen open.

The key stays in private module data and never belongs in the overlay URL. Only loopback HTTP Controller addresses are supported. Changing the address clears the old key unless you supply a replacement.

[Phone Deck](../phone-deck/README.md) optionally offers Show/Hide, Refresh selected room, confirmed Wake selected room and status. Add the controls you want in its editor; no cards appear automatically. Show/Hide preserves room selections and scene rules. Room actions need the same connection/key as Settings. Commands report Requested: check status before retrying. The handset receives no credentials, player details or event history. Slot editing and recalculation remain in the local controls.

## If something looks wrong

- **No rooms:** check Controller and the address in Connection settings, then Reload rooms.
- **Nothing visible:** check the service, saved room, included slots, overlay enable switch and scene routing. SlotLock or stale analysis can legitimately hide results.
- **Controller unavailable:** settings are retained while the display waits. Progress can remain available when an individual slot or activity read fails. A disconnected renderer hides after at most ten seconds.
- **Room action failed:** inspect Controller's analysis details and the reported partial result before trying again. Mutating requests are not automatically retried.

Existing activity is not replayed as new notifications after service start, room changes or a new generation. Event messages stay in bounded memory for at most 75 seconds; no viewer/event archive is written. Restored save-file counts do not become item-delivery alerts.

Updates preserve private `module-data/archipelago/config.json` and the optional key in `auth.json`. Back these up privately. Legacy settings and tokens are not copied automatically; retain your previous setup until your room, scene and restart checks pass.
