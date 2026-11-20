# Controller Display

Show your controller's buttons and sticks in the stream overlay. Windows XInput supplies input while OBS has focus; the module only reads input and never generates game, keyboard or chat commands.

## Set up

1. Use Companion 1.3.1 or newer on Windows with PowerShell available. Connect an XInput-compatible controller.
2. Install Controller Display from **Catalogue**. Expand its **Installed** row, **Start** its service and open **Settings** or **Open controls**. You can also select Controller Display under Games in [Universal Dock](../universal-dock/README.md).
3. Choose **First connected** or a specific **Index 0–3** under Controller. Check **Input status** to confirm that the service sees your device.
4. Set **X**, **Y**, **Width**, **Height**, **Scale X** and **Scale Y** for your canvas. Check **Enable controller display** and press **Save display**. Fresh installations start disabled; the layout defaults to X 1420, Y 850, width 260, height 190 and scale 1 on each axis.
5. Use your existing [Universal Overlay](../universal-overlay/README.md) source. In [Overlay Visibility](../source-modules/README.md), allow Controller Display in the intended scenes. If necessary, refresh the existing OBS source to load a newly installed integration. Do not add a duplicate renderer.

No Streamer.bot import, external skin, GamepadViewer connection or new driver installation is required. The local service uses port **3126**; keep it and Companion running.

## Everyday use and tests

Edit position, size, scale or controller selection and **Save display**. Width/height set the display box; Scale X and Scale Y adjust its drawing. Updates preserve your layout, device choice and automatic-start preference.

**Test buttons and sticks** shows a clearly labelled synthetic state on the actual overlay for ten seconds, including OBS wherever the renderer is visible. Use it when that output is appropriate. **Clear test** removes it early. Neither control sends input to Windows, games or chat, and tests do not survive restart.

The diagnostic **Renderer URL for diagnostics** section includes **Open renderer**. Advanced direct-source use is possible without Universal Overlay or Overlay Visibility; use only one renderer for this feature.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides Show overlay, Hide overlay and Controller status. Add the controls you want in its editor; no cards appear automatically. The provider is listed as Controller Display in Games.

Show/Hide changes the enabled preference and retains layout, device selection and scene routing. It cannot override a hidden scene rule. Commands report Requested; check status before retrying an uncertain outcome. Status distinguishes ready, stale and unavailable input; synthetic test state is not reported as a real connected controller. The phone cannot simulate input or start/stop the native helper.

## Troubleshooting and backup

If the display is absent, check the service, saved enabled preference, selected index and scene rule. The native helper reads up to four XInput controllers. Non-XInput hardware may need an existing Windows compatibility layer. A browser Gamepad API fallback may be available, depending on browser focus and device permissions.

Stale native snapshots are cleared to prevent stuck pressed buttons. DISCONNECTED is part of the controller drawing. Input status in Settings shows connection diagnostics. If port 3126 is occupied, identify and stop only a duplicate Controller Display service before starting this one.

The private `module-data/controller-input` directory stores layout and preferences, not input history, viewer data or credentials. Back it up with your setup. Stopping the service also stops its hidden input helper. Updates do not alter drivers, games or OBS source URLs. Its internal package/routing IDs remain controller-input/controller so existing scene rules and phone cards continue to work.

First-party code and drawing: Sethani, MIT.
