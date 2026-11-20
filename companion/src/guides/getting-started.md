# Getting started

Set up Companion's module controls and one shared OBS overlay. Start with the modules you want; you do not need to install every module.

## What each part does

| Part | Purpose |
| --- | --- |
| Companion | Installs modules, hosts their controls/media and provides Help. |
| Streamer.bot | Runs imported actions and holds state for modules that use it. |
| Universal Dock | Puts module controls and Help inside an OBS dock. It is not an audience source. |
| Universal Overlay | Displays supported modules through one OBS browser source. |
| Overlay Visibility | Chooses which supported overlays are allowed in each OBS scene. Formerly named Source Modules. |

Phone Deck and other modules are optional. Installing a package does not import actions, add OBS sources, create phone cards or configure personal audience triggers.

## 1. Start the apps and connect Streamer.bot

Open Companion and Streamer.bot. Open OBS for the shared-overlay setup.

In Streamer.bot, open **Servers/Clients → WebSocket Server**. The current Companion preview checks `ws://127.0.0.1:8080/`: address `127.0.0.1`, port `8080`, endpoint `/`. Start that server and enable **Auto Start** if you want it available on later starts.

The shared browser controls currently use an unauthenticated local connection. An authentication-required server is not supported by that transport; Companion's Settings page has no password field for it. Keep this connection on loopback. Phone Deck has its own optional connection settings.

Wait for Companion's Streamer.bot connection indicator. Help remains available while disconnected. [Streamer.bot WebSocket setup](https://docs.streamer.bot/api/websocket/guide/configuration).

For OBS scene-aware features, also connect Streamer.bot to OBS:

1. In OBS, enable its server in **Tools → WebSocket Server Settings** and note its port/password.
2. In Streamer.bot, open **Stream Apps → OBS**. Use an existing matching connection, or right-click **Add**.
3. For current OBS, choose WebSocket v5, host `127.0.0.1`, normally port `4455`, and the OBS password if configured. Connect it; enable automatic connection/reconnection if desired.

The OBS connection is separate from Streamer.bot's port 8080 server. [Streamer.bot's OBS connection guide](https://docs.streamer.bot/guide/stream-apps/obs-studio).

## 2. Install modules and import their actions

1. Open **Catalogue** in Companion. Select a module, review its required dependencies, then **Install**. Optional integrations do not all need installing.
2. In **Installed**, expand the module's row. Choose **Documentation** for its specific setup.
3. If it has **Import into Streamer.bot…**, use it to copy the import code. In Streamer.bot click **Import**, paste into **Import String**, review the listed items and import.
4. Refresh module health in Companion. An existing action name can look Ready even when its code is older, so follow functional-update import instructions too.
5. Run an Initialize action only when that module's fresh-setup guide calls for it. Do not initialize every module indiscriminately; some Initialize actions reset sessions.
6. If the module has **Start**, it runs a managed service. Start/configure that service as its guide directs. Modules without a Start button do not need a separate service.

A local `.streammodule` file can be installed from **Catalogue → Install module file…**. Native actions and package files are separate installations. Universal Dock and Universal Overlay have no native imports; Overlay Visibility does.

For the shared-overlay steps below, install [Universal Dock](modules/universal-dock/README.md), [Universal Overlay](modules/universal-overlay/README.md) and [Overlay Visibility](modules/source-modules/README.md). Import Overlay Visibility's four **Module Routing -** actions and run **Module Routing - Initialize** once on a fresh setup.

[Streamer.bot import instructions](https://docs.streamer.bot/guide/core/import-export).

## 3. Add Universal Dock to OBS

1. On **Universal Dock** in Companion, choose **Open controls**.
2. Copy the address from the browser address bar.
3. In OBS, open **Docks → Custom Browser Docks…**.
4. Enter a Dock Name such as **Companion**, paste the controls URL in **URL**, and press **Apply**.
5. Position the dock in OBS. Choose a module explicitly; the dock does not pick one for you.

The default dock address is:

```text
http://127.0.0.1:3135/api/public/assets/universal-dock/dock/index.html
```

Use the actual Open controls address if your installation differs. Search by name/category, or use favorites. **Help** opens guides without closing the selected controls; **Controls** returns to the same document, including unsaved input. Tests are a separate link and can affect real outputs.

The same dock-menu steps are shown in [Streamer.bot's OBS browser-dock instructions](https://docs.streamer.bot/guide/extra-features/chat#obs-browser-dock); use Companion's URL here.

## 4. Add one Universal Overlay browser source

1. On **Universal Overlay** in Companion, choose **Copy overlay URL**.
2. In OBS **Sources**, press **+ → Browser** and create one source, for example **Companion Overlay**.
3. Leave **Local file** unchecked, paste the URL, and set **Width**/**Height** to your Base (Canvas) Resolution from OBS Video settings; for example 1920 × 1080.
4. Keep the normal transparent background. For this shared setup, leave **Shutdown source when not visible** and **Refresh browser when scene becomes active** unchecked.
5. In other scenes, use **Add Existing** to reuse that source rather than creating independent copies.

Do not put the controls/dock URL in the audience source. Do not add a second copy of the shared overlay in a browser for preview while its OBS instance is running. Some modules, such as Live Chatbox, have their own explicitly documented source URLs; follow their guides instead of assuming everything belongs in the aggregate.

[OBS Browser Source properties](https://obsproject.com/kb/browser-source).

## 5. Allow the overlays you want

Open **Overlay Visibility** in Universal Dock or Companion. Choose a rule for each overlay:

- **Hidden:** keep it out of the shared output.
- **All scenes:** allow it whenever the shared source is active.
- **Selected scenes:** allow it only in the exact OBS scene names entered, one per line.

Press **Save routing**. A fresh setup starts hidden; installing a player does not enable its visibility. Verify the displayed current OBS scene before relying on selected-scene rules.

Ordinary overlays unload when leaving an allowed scene. Video can restart an active clip on return; Sound does not replay an old request when a renderer opens. After enabling Sound visibility, press Stop and Play again. Embedded Widgets retains sessions during ordinary scene hiding and has its own release/recovery procedure; read its guide before moving or reopening renderers.

## 6. Configure and check one module

Open its controls and follow its guide. For media, use the module's **Import audio** or **Add media** button in Companion, refresh the media list in controls and save. Importing files and registering them are separate steps.

Check connection/status first. Then, while off-stream, deliberately test one chosen effect and its Stop/Clear action. A button labelled Preview or Test may use the real OBS output. Do not create a real chat message, redemption or stream start just to check installation.

Start with [Sound Player](modules/sound-player/README.md) or [Video Player](modules/video/README.md) if that is your goal. [Walk Ons](modules/walk-ons/README.md) adds viewer rules after its selected player works. Add [Phone Deck](modules/phone-deck/README.md) controls manually if wanted; discovery never creates cards.

## Later starts, updates and troubleshooting

Keep Companion running while using its hosted controls and overlay. **Start automatically with Companion** applies to that module's service; it does not arrange Windows startup or launch OBS/Streamer.bot.

Before updates or recovery, back up the relevant Streamer.bot state and Companion data profile. The preview uses `%APPDATA%\Streaming Companion Preview`. Package files and personal data are separate; keep media, pairing/TLS and settings together for backup. Reading Help never requires closing overlays. A renderer handoff/restart involving Embedded Widgets does require its acknowledged closure/release procedure.

| Symptom | First check |
| --- | --- |
| Module missing | Clear search/filters, then check Installed versus Catalogue. |
| Import button missing | Some modules have no native actions; read its guide. |
| Streamer.bot confirmation needed | Local server is running and the required actions are imported. |
| Service stopped or configuration needed | Start/configure that module; unrelated optional modules can stay absent. |
| Dock cannot load | Companion is running and the controls URL is used in Custom Browser Docks. |
| Shared overlay blank | Correct source URL, Overlay Visibility saved, current scene allowed, selected module ready/configured. Blank can be normal when no effect is active. |
| Sound accepted but silent | Overlay open before Play, visibility, volume and OBS output/monitoring; Stop and Play a fresh request. |
| Help link is plain text | Its module/guide may not be installed. Reading does not install it. |

Developer tools is optional and unnecessary for ordinary setup. Open a module's own guide for its limits, recovery steps and custom-trigger recipes.
