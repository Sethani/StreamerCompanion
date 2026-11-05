# Controller

Native Windows XInput and the existing local controller drawing, in the same combined OBS overlay as the other modules. First-party code and drawing: Sethani, MIT. No external skin, GamepadViewer connection, Streamer.bot import or controller driver installation is part of this package.

## Install and cutover

Requires Companion 1.2.2+, Windows, PowerShell and Universal Dock. Universal Overlay and Source Modules are optional for a standalone public setup. The existing personal combined overlay is integrated directly; do not create another OBS browser source.

Install Controller, start its service explicitly, open Settings, enable/save the display, then refresh the existing combined OBS source. Port 3126 must have one owner: if the old built-in Controller Input service is running, stop only that service before starting this module. Leave OBS, Streamer.bot, Controller room hosting and other Companion services running. Existing scene rules retain the UI key `controller`; the package/service ID remains `controller-input`.

The drawing, button mapping, trigger thresholds, axis dead zones and stick directions are preserved. Layout defaults are X 1420, Y 850, width 260, height 190, scale 1, matching the old layout defaults. New installations start disabled. Settings can import a legacy microlayer JSON file or a controller-only layout file, reading only the controller enable/position/size/scale fields; Save display applies it. External URLs and other widget settings are ignored. Existing installed-module data and automatic-start preferences are retained during upgrades; cross-profile copies are explicit.

## Input and tests

The Node service owns a hidden PowerShell helper using XInputGetState from Windows. Native input continues while OBS has focus. It reads up to four XInput controllers; select the first connected or a specific index. Non-XInput devices may require an existing Windows compatibility layer. When native input is unavailable, the renderer can use the browser Gamepad API if exposed; this fallback may depend on browser focus/device permission. No keyboard/game input is generated.

Settings show current input diagnostics. **Test buttons and sticks** displays a clearly labeled synthetic state on the actual combined overlay for ten seconds. **Clear test** removes it. Neither sends input to Windows/games/chat. No test or input history survives restart. Stale native snapshots are cleared, preventing stuck pressed buttons. The disconnected label is part of the existing drawing, not an operational log message.

## Ownership and data

The legacy read-only `/state` response retains `source: native-xinput`, `pads`, indices, pressed buttons and normalized axes. New health/settings/overlay routes belong to this service. Read-only health/input responses permit HTTP loopback origins; settings and test writes require the settings-page CSRF token. Data under private `module-data/controller-input` contains layout config and a helper PID marker only (it can remain after a forced Windows termination and is replaced on the next start); no controller input history, viewer data or credentials are stored. Source code and helper are packaged independently of the personal monolith.

The helper watches its actual parent process and exits if that process ends, including forced Windows service stops. Normal stop also explicitly stops the helper. The package does not alter your system drivers, OBS source URLs, games or legacy service automatic-start preferences.

## Verification

Tests cover sanitized inputs/settings, rendering, XInput mapping/dead-zone source, the real helper startup/shutdown, temporary package installation and data retention, synthetic live tests and combined-overlay routing/duplicate suppression. Real physical-button response and final OBS placement remain controlled user acceptance checks.
