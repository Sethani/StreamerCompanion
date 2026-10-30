# Browser module contract (Companion 1.2.0)

Schema 2 modules can declare `web: { root: "web", overlayPage: "/overlay/index.html" }`, `ui.dockPage`, and `ui.links: [{ name, path }]`. These are package-relative paths beneath the validated web root. Companion serves only that root at `/api/public/assets/<package-id>/...`; it does not expose package metadata, imports, private configuration or the personal repository.

Root `provides` declares capabilities for packages without a child service. Inventories and package/catalogue identity checks use the union of root and service declarations. Required module version ranges, host compatibility and import state determine readiness. Cycles, missing/unready dependencies and incompatible hosts block browser assets explicitly. Static packages without actions work while Streamer.bot is disconnected.

The public module projection is the only UI registry. It contains resolved controls/overlay URLs, named links, readiness and optional `ui.transport: { feature, stateKey, actionPrefix }`. Shared transport reads registered feature globals, invokes registered `ui.actions` on explicit commands, and uses the host's loopback WebSocket configuration. It reads persisted globals on connect; it never initializes modules or invokes Play automatically. No API token is embedded in pages. WebSocket authentication is not yet implemented.

Universal Dock and Tests poll the installed registry. Universal Overlay owns no feature renderer: it creates frames for overlays with explicit Source Modules rules. Missing rules are hidden; `global`, `scenes` and `disabled` are supported. Removing a routed frame stops its browser media. Returning recreates it from saved state. Disconnection hides frames; reconnect reads globals. Source Modules merges supplied rules while preserving unknown legacy module rules.

`media: { kind: "video" }` enables an explicit native picker. Chosen supported files are copied to `module-data/<id>/media/<uuid>.<extension>` with an index of labels/generated filenames. The media API lists indexed files and supports GET/HEAD and a single byte range. It never accepts arbitrary disk paths or browser uploads. Loopback URLs contain no credentials and must remain local. Code replacement/rollback leaves media intact.

Builds include reviewed JavaScript, HTML, CSS and JSON under the declared web root. Binary artwork/media are excluded; another asset type requires provenance/build review. The host package allow-list includes static serving and dependency states. Installed actions/globals, OBS profiles, media and personal server files are never build inputs.

Action-name verification cannot prove imported code/version. Explicitly import replacement exports, initialize once and verify before retiring legacy endpoints. No silent action import is provided.

For cross-origin legacy registry readers, the public projection supplies the legacy UI arrays/ownership defaults and omits packaged overlay frames by default. This prevents the old aggregate overlay from automatically embedding the replacement aggregate and duplicating Video when new packages are installed. Same-host clients receive packaged overlays; a deliberate cross-origin client can opt in with `?browserModules=1`. Existing child-service overlay registrations remain compatible. This adapter does not require the personal server to run.
