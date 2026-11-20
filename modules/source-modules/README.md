# Overlay Visibility

Choose whether each supported overlay is hidden, shown in all scenes, or shown only in selected OBS scenes.

Find it under **System**. This is the module previously displayed as **Source Modules**. Its package ID and supplied **Module Routing -** action identities are unchanged.

## What you need

Keep Companion and Streamer.bot running. Install Overlay Visibility and Universal Dock through the catalogue. Use [Universal Overlay](../universal-overlay/README.md) for the shared audience source.

Streamer.bot must be connected to OBS to follow its current scene. Overlay Visibility has no separate service or audience source. See **Help → Getting started** for local Streamer.bot and OBS WebSocket connections.

## First setup

1. Expand Overlay Visibility's row in Companion **Installed** and choose **Import into Streamer.bot…**.
2. In Streamer.bot, paste the copied code into **Import → Import String**, review and import the four Module Routing actions.
3. For a fresh setup, run **Module Routing - Initialize** once. The supplied startup and OBS Scene Changed triggers handle later updates.
4. Open **Controls** in Companion, or choose Overlay Visibility in Universal Dock.
5. Check the displayed **Current scene**. Choose a visibility mode for the overlays you want and press **Save routing**.

A fresh configuration starts with no enabled overlays. Installing this package does not edit routing, import actions or change OBS sources. This rename/guide update needs no new native import when the current actions are already installed.

## Modes and scene names

| Mode | Result |
| --- | --- |
| Hidden | Exclude that overlay from the shared output. |
| All scenes | Allow it whenever the shared source is active. |
| Selected scenes | Allow only the exact OBS scene names you enter, one per line. |

Scene names are exact text. Press **Save routing** after edits. Refresh/status polling does not save draft changes. Save and inspect the actual current scene before testing.

The list comes from installed modules with a registered overlay. A missing row can mean a module has no audience overlay, uses its own explicitly documented source, or is unavailable. Walk Ons has no separate audio row: configure **Sound Player** for its audio and **Video Player** for video.

Visibility allows rendering; it does not trigger a sound, start a video, add an OBS source or configure another module. Blank output can be normal until that module has something to show.

## Scene changes and widget groups

Ordinary overlays unload outside allowed scenes. Video can restart an active clip when returning; Sound requires an explicit new request after a renderer opens. Stop a waiting Sound request and Play again after enabling visibility.

Embedded Widgets can expose separate named groups. Ordinary scene hiding retains their browser sessions; explicitly disabling a group unloads it. Read that module's Renderer recovery instructions before moving or closing its renderer.

## Phone Deck

The optional **Set saved overlay visibility** control selects an existing saved rule and changes only its mode. **Selected saved scenes** reuses its saved scene list; it cannot add rules or edit that list.

Saved rule identifiers may differ from current module display names. The Sound Player rule retains its earlier Walk Ons identity. The display rename does not rewrite saved rules or invalidate phone cards.

No cards are created automatically. If the control remains unavailable with old imports, back up and import the current functional Module Routing export, then run Initialize. An older engine without phone-operation acknowledgements cannot confirm this control. Unconfirmed changes are not retried automatically: inspect the saved rule before another request.

## Troubleshooting and recovery

- Nothing visible: choose an allowed mode, save, check the module is ready and trigger an intended effect.
- Current scene unavailable/wrong: check Streamer.bot's OBS connection; do not change the separate Companion module-server URL.
- Module not listed: check installation and its guide for whether it uses Universal Overlay.
- Phone cannot find a rule: save it in these controls first.
- Updated actions look Ready but behave differently: names alone cannot verify imported code; follow the functional-update import instructions.

Back up Streamer.bot configuration and OBS settings before a migration. The package rename preserves saved rules, scene lists, existing sources and native identities. Do not use migration or reset tools just to change a display name.
