# universal-overlay developer notes

## Implementation and migration reference

Opt-in ui.overlayRouting version 1 declares named Source Modules groups and retainOnSceneHide. Only these frames load lazily and remain hidden across scene exclusion. Explicitly disabled/missing groups, owner unavailability, lost routing and expired registry freshness unload them. Existing modules retain normal unload-on-exit behavior. The parent sends only group states plus a random frame channel to the exact child origin; private widget URLs never enter these messages or public inventory.

Embedded Widgets supplies its own same-origin renderer and exclusive persisted ownership. Add no separate widget source. For existing private legacy installations, complete the backed-up guard/data handoff before enabling migrated URLs. Renderer recovery lives in Embedded Widgets settings.

