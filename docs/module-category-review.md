# Module category review

Approved by the operator ("Looks good") and applied to source and the local preview. Companion, Universal Dock and Phone Deck provider discovery use this grouping. The user's phone pages/layout are preserved.

Group modules by what users go looking for. **Media** contains playback owners, **Games** contains game integrations and controller display, **Effects** contains general visual overlays, and **System** contains shared infrastructure and backend configuration. Keep existing useful groups instead of adding more single-module categories.

| Category | Modules |
| --- | --- |
| Stream | Audio Routing, Cameras, Countdown, Phone Deck, Scene Links, Stream Launch |
| Media | Sound Player, Video Player, Spotify Music, Shoutout Clips |
| Chat | Live Chatbox, Chat Routing, Chat Archive |
| People | Walk Ons, Reactive, Reminders, Redeem Checklist |
| Games | Archipelago, Pokemon Encounters, Controller |
| Activities | Named Timers, Wheel |
| Effects | Bouncing Avatar, Embedded Widgets |
| System | Universal Dock, Universal Overlay, Overlay Visibility, Local AI, Update Probe (developer-only) |

## Applied moves

| Module | Previous | Now | Reason |
| --- | --- | --- | --- |
| Video Player | Effects | Media | Put the two general file players together. |
| Spotify Music | Stream | Media | Music playback belongs beside other audio controls. |
| Shoutout Clips | Effects | Media | It plays clips; grouping it with Video makes that owner easier to find. |
| Controller | Effects | Games | Users look for controller display among game tools. |
| Pokemon Encounters | Effects | Games | It is an interactive game, with an overlay as its presentation. |
| Local AI | Stream | System | It configures a backend/helper rather than operating the stream directly. |

The other 23 modules retain their current categories. Sound Player stays in Media. The Source Modules → Overlay Visibility display rename is now part of the first-run guide update; package identities remain stable. Other display-name work remains in Pass 3.

## Review and verification

- The approved mapping includes Shoutout Clips in Media and Local AI in System.
- Change category metadata only. Preserve package/action IDs, provider control revisions, saved configuration, favorites and phone pages/layout.
- Verify category filters and selection persistence in Companion and Universal Dock, plus actual Phone Deck provider headings/discovery. Category changes must not create cards or execute actions.
- Prepare any updated module artifacts with appropriate independent version labels; record clearly whether a change is source-only or installed. Do not publish changed bytes under an existing release version.

## Local preview verification

Installed six independent metadata patch packages: Controller 1.1.3, Local AI 1.0.1, Pokemon Encounters 1.7.3, Shoutout Clips 2.1.2, Spotify 2.0.5 and Video 2.3.1. Artifacts: companion/out/category-polish-preview. No release was published.

Full npm check and the actual hidden Companion/two-dock browser navigation test passed. The browser check explicitly moves a selected module between categories and confirms its controls document is retained. Package comparison against the installed preview proved only category/version, the guide location sentence and export version labels changed; native action data and runtime assets are identical.

Backed up changed files and applied only those metadata/guide payloads to the running local preview. Actual public registry and Phone Deck provider categories match the mapping. Existing provider control revisions, phone layout/TLS/settings, favorites, service PIDs and auto-start settings are unchanged. No app rebuild/restart, native reimport, playback command or renderer ownership handoff was required. Private backups and verification are recorded in the operator handover.
