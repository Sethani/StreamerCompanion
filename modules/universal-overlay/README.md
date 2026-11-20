# Universal Overlay

Combine supported module overlays in one OBS browser source. [Overlay Visibility](../source-modules/README.md) decides which are allowed in each scene; each module still owns its settings and effect controls.

## What you need

Keep Companion and Streamer.bot running. Install Universal Overlay and its required Universal Dock dependency through the catalogue. For scene visibility, install Overlay Visibility and import its four Module Routing actions.

Universal Overlay itself has no native actions or separate service to start. Module services, media and optional integrations are configured in their own guides.

## Add the shared source

1. In Companion, expand Universal Overlay's Installed row and choose **Copy overlay URL**.
2. In OBS **Sources**, use **+ → Browser** to create one source, such as **Companion Overlay**.
3. Leave **Local file** unchecked and paste the URL.
4. Set Width/Height to your OBS Base (Canvas) Resolution, for example 1920 × 1080. Keep the normal transparent CSS.
5. Leave **Shutdown source when not visible** and **Refresh browser when scene becomes active** unchecked for the shared setup.
6. Reuse this source with **Add Existing** in other scenes. Do not create separate copies for each supported module.

The default URL is:

```text
http://127.0.0.1:3135/api/public/assets/universal-overlay/overlay/index.html
```

Copy the actual URL from Companion if your installation differs. Do not use Universal Dock's controls URL here. Individual guides identify any separate sources, such as Live Chatbox; not every module renders through this aggregate.

[OBS Browser Source properties](https://obsproject.com/kb/browser-source).

## Enable and test a module

1. Open Overlay Visibility.
2. Set the desired overlay to **All scenes**, or **Selected scenes** with exact OBS scene names, and **Save routing**.
3. Configure that module and trigger one effect deliberately while off-stream.

Fresh/missing rules stay hidden. A blank transparent source is normal when no allowed effect is active. Verify Streamer.bot's OBS connection if selected-scene routing is not following the current scene. See **Help → Getting started** for the full connection walkthrough.

This page has no general Play button or automatic demonstration. Phone Deck controls are supplied by individual owners; the aggregate adds no cards or audience triggers.

## Scene changes and a single renderer

Ordinary module frames unload when leaving allowed scenes or losing their ready owner/routing. An active Video clip can restart when its frame is recreated. Sound Player does not replay saved requests when a renderer opens: after restoring visibility, Stop and Play again.

Avoid opening another direct/aggregate playback view while the intended OBS renderer is in use. Do not run old and new overlay pages simultaneously during a cutover.

## Embedded Widgets

Grouped widgets load lazily when their scene group is eligible and keep their browser session during ordinary scene hiding. Explicitly disabling a group, losing routing or losing its owner unloads them.

Embedded Widgets supplies its own exclusive renderer through this aggregate. Add no separate widget source. Before moving existing widgets, finish its acknowledged release. If the old view cannot respond, use **Renderer recovery** in Embedded Widgets settings and provide the required off-stream/closed-view confirmation. Never rely on a timeout or a file edit to steal the owner. Widget URLs remain private.

## Troubleshooting and recovery

- No effect: check the selected module is ready/configured, its visibility allows this scene and the OBS source is active.
- Wrong scene: verify the OBS connection and exact selected-scene names.
- Silent audio: check the module volume, OBS monitoring/output and a fresh playback request.
- Source unavailable: keep Companion running; it hosts the packaged assets and copied media.
- Existing source after an update: retain its URL. Follow the relevant module's import/recovery instructions rather than replacing all sources.

Back up the relevant data and OBS configuration before a renderer migration. Closing/reloading the shared source can interrupt multiple modules; handle ownership and unsaved work before a coordinated handoff.
