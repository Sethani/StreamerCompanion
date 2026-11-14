# Embedded Widgets — unpublished integration candidate

This unpublished candidate stores external widget setup, including Tangia, privately. Fresh installations are empty and disabled. The settings editor supports per-widget URL, position, dimensions, nonuniform scale and enable choices. URLs are masked by default and are never loaded by the editor. Save is explicit, revision checked and atomic; polling preserves drafts, focus and expanded rows.

Combined-overlay integration is locally tested and remains unpublished. Use the existing combined source through Universal Overlay 1.0.2 and Source Modules 1.0.2; no additional permanent OBS source is needed. Separate Tangia and generic-widget rules preserve saved scene lists. Widgets load only on first eligibility, stay loaded while ordinary scene routing hides them, and unload when disabled, cleared, removed, disconnected or unavailable. Ordinary modules keep their existing lifetime.

The renderer accepts only its exact parent/source/origin and per-frame channel. Parent and registry freshness guards fail closed. A private persisted single-owner record prevents competing combined sources from opening duplicate embeds. Confirmed release permits a new renderer; a crash or uncertain release blocks automatic takeover. Off-stream ownership recovery controls and migration/publication gates are still pending. Do not install or migrate this candidate into production yet.

Private legacy-overlay guards must be applied during the backed-up adoption before enabling migrated URLs; leases cannot control an unpatched old renderer. The staged guard is outside the public package and never falls back to the old Tangia/widget renderers when Companion is unavailable.

Management defaults to loopback port 3143. Host/origin checks, CSRF protection, no cross-origin access and restricted local framing protect private settings. Health and the optional Phone Deck setup widget contain only boolean/count information; they do not report remote-site availability or delivery. No installation token, Streamer.bot import or app rebuild is needed. Phone Deck adds no cards automatically.

URLs accept explicit HTTP/HTTPS only and preserve the supplied query and fragment. They may contain credentials, so keep the private data directory out of Git and backups intended for sharing. Only the local settings editor and the intended renderer should receive URLs. There is no public legacy Import settings option, embedded private seed, automatic preview, external validation request or remote application/asset bundle. Migration tooling and rollback data remain private.

Configuration schema version 1 uses a revision, master enable switch, canvas dimensions and a widget map. Each widget has a stable ID, label, routing group (`tangia` or `microlayer`), enable switch, URL and layout box. Invalid or corrupt saved data fails closed without replacing the file. Missing settings start empty without a write. No existing owner (Controller, Stream Together, notifications, clips) is imported or activated automatically.

Local validation: `npm --prefix companion run check:embedded-widgets`. Both use disposable data, isolated ports and synthetic embeds. See `docs/embedded-widgets-extraction.md` for the bounded migration checkpoints. No production installation/publication/cutover is authorized by merely building this candidate.
