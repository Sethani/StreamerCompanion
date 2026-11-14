# Universal Overlay

Manifest-driven browser overlay with explicit scene routing.

Requires Companion 1.2.0 or later. Install through the catalogue so dependencies are included. Browser assets are served by Companion; no personal server or static tree is required.

Copy the overlay URL from Companion into an OBS browser source with the desired canvas dimensions. Enable installed overlays in Source Modules. Missing rules and Streamer.bot disconnects hide overlays; leaving a routed scene removes its frame and stops browser playback. Do not run the old overlay with the new one during cutover.

## Grouped widget frames (1.0.2 candidate)

Opt-in ui.overlayRouting version 1 declares named Source Modules groups and retainOnSceneHide. Only these frames load lazily and remain hidden across scene exclusion. Explicitly disabled/missing groups, owner unavailability, lost routing and expired registry freshness unload them. Existing modules retain normal unload-on-exit behavior. The parent sends only group states plus a random frame channel to the exact child origin; private widget URLs never enter these messages or public inventory.

Embedded Widgets supplies its own same-origin renderer and exclusive persisted ownership. Add no separate widget source. This candidate is unpublished; the private legacy guard/data handoff and recovery gates must pass before production adoption.
