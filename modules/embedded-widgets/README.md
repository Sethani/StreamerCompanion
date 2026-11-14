# Embedded Widgets

Configure external browser widgets, including Tangia, inside the existing combined overlay. Fresh installations are empty and disabled. First-party code is Sethani/MIT; remotely hosted widget applications/assets are not bundled.

Requires Companion 1.3.1, Universal Overlay 1.0.2 and Source Modules 1.0.2. No Companion rebuild or widget-specific Streamer.bot import is needed. Existing Source Modules imports remain valid for the 1.0.2 editor update. Fresh Source Modules installations still need their own documented import.

Open Settings, add a widget, choose its Tangia or generic routing group, enter the provider's HTTP/HTTPS embed URL and adjust its box. Enable the widget/master and Save explicitly; select its group's visibility in Source Modules. Keep the existing combined OBS source: do not add a separate widget source. Existing private legacy installations must complete their backed-up ownership/data handoff before migrated URLs are enabled.

The editor masks URLs by default and never loads previews. Exact URL queries/fragments, stable IDs, canvas, position, dimensions and nonuniform scale are saved privately with revisions and atomic writes. Polling preserves drafts/focus/caret/scroll/disclosures. Conflicting edits retain the draft. Invalid/corrupt data fails closed without a default overwrite. There is no public legacy Import settings option or private configuration seed.

Widgets first load when their group is eligible, retain the same session across ordinary scene exclusion and unload when disabled/cleared/removed, routing is lost or the service is unavailable. Separate Tangia/generic rules preserve scene lists. URL edits while hidden unload the old frame and defer the new URL until eligibility returns. Geometry/polling do not reload it. A private persisted single-owner record prevents competing combined views from loading duplicate embeds.

## Renderer recovery

Open the folded Renderer status and recovery panel. Disable widgets and Save first. Confirm streaming is stopped, then request release. A responding renderer clears its embeds before acknowledging; no new owner is granted until release is confirmed.

If the old view cannot respond, close every old OBS browser source and other overlay view, confirm that they are closed, and type CLOSED. Manual recovery is rejected while the old renderer is still responding or the saved configuration is enabled. The app cannot verify a disconnected browser: these confirmations are operator assertions, not a substitute for actually closing its views. Recovery never enables widgets or changes URLs/layout/routing. Re-enable explicitly only when ready.

Damaged ownership is privately backed up before recovery. Atomic recovery results retain the last 64 request IDs, surviving restart and later operations. Lost responses are resolved with read-only status lookups; no recovery request is automatically retried. Old request IDs cannot clear a newer owner. There is no timer-based ownership stealing or automatic crash reset.

Management defaults to loopback 3143. Exact Host/Origin checks, scoped CSRF, no CORS and restricted local framing protect private settings. Renderer-only credentials cannot recover ownership or save settings. Health and the optional Phone Deck setup widget expose boolean/count information only, never URLs, credentials or viewer history, and do not claim remote delivery. Phone Deck adds no cards automatically. Keep private data and backups out of shared repositories.

Validation: npm --prefix companion run check:embedded-widgets. The fixtures use disposable data/ports and synthetic local embeds. Real provider delivery and private OBS adoption remain separate off-stream acceptance.
