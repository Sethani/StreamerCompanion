# Pass 1 guide separation review

Reviewed November 15, 2026. This records separation of user and engineering material, not the complete fresh-user configuration/trigger walkthroughs scheduled for Pass 3. No live triggers, media or production profiles were exercised.

User guides retain configuration, ordinary backup and compatibility advice, safety/recovery procedures, supported action arguments, troubleshooting limitations and third-party rights. Original engineering paragraphs remain in explicitly declared developer guides, hidden from normal Help.

| Module | Engineering material | User guidance retained |
| --- | --- | --- |
| Archipelago (`archipelago`) | Separate `DEVELOPMENT.md` | SlotLock privacy, connection key setup and isolated versus live tests |
| Audio Routing (`audio-routing`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Bouncing Avatar (`bouncing-avatar`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Cameras (`cameras`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Chat Archive (`chat-archive`) | Separate `DEVELOPMENT.md` | Retention, deletion limits, privacy and SQLite/WAL backup |
| Live Chatbox (`chat-core`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Chat Routing (`chat-routing`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Controller (`controller-input`) | Separate `DEVELOPMENT.md` | XInput/browser fallback limits and explicit live test |
| Countdown (`countdown`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Embedded Widgets (`embedded-widgets`) | Separate `DEVELOPMENT.md` | Acknowledged release and CLOSED recovery; private URLs |
| Local AI (`local-ai`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Named Timers (`named-timers`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Phone Deck (`phone-deck`) | Separate `DEVELOPMENT.md` | TLS/pairing, OBS independence, backups and Lucide notice |
| Pokemon Encounters (`pokemon-encounters`) | Separate `DEVELOPMENT.md` | Pokemon/PokeAPI rights, test limits and transient encounter behavior |
| Reactive Guests (`reactive`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Redeem Checklist (`redeem-checklist`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Reminders (`reminders`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Scene Links (`scene-bindings`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Shoutout Clips (`shoutout-clips`) | Separate `DEVELOPMENT.md` | External player rights and provider-controlled mute limits |
| Source Modules (`source-modules`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Spotify Music (`spotify`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Stream Launch (`stream-launch`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Universal Dock (`universal-dock`) | User guide only; no engineering appendix needed | Setup, behavior, limitations and relevant backup advice |
| Universal Overlay (`universal-overlay`) | Separate `DEVELOPMENT.md` | Setup, behavior, limitations and relevant backup advice |
| Update Probe (`update-probe`) | Entire module is developer-only | Setup, behavior, limitations and relevant backup advice |
| Video (`video`) | Separate `DEVELOPMENT.md` | Action arguments, media relinking and restore advice |
| Walk Ons (`walk-ons`) | Separate `DEVELOPMENT.md` | Optional video, Test/eligibility and corrected-version import advice |
| Wheel (`wheel`) | Separate `DEVELOPMENT.md` | Trigger adapter instructions and saved-profile backup |

All 28 packages were built and installed only into disposable registry fixtures. The guide-package check verifies 26 engineering guides are absent from normal Help and denied on direct reads/links, then available with Developer tools enabled. Universal Dock has a user guide only; Update Probe is hidden entirely when Developer tools is off. No native action code/exports or third-party notice files changed.

Practical guide completeness, focused display renames, menu walkthroughs and final release/privacy review remain in Pass 3/5. Source/package versions remain unchanged for these unpublished local artifacts; assign new versions before publication.
