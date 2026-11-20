# Shared first-run walkthrough checkpoint

November 17, 2026. The update is installed, open and live-verified. A separate blocked Streamer.bot instance was recovered after native/profile backups; no native import or native file edit was needed.

## Completed

- Replaced the short Getting Started placeholder with the shared workflow: roles of the apps, local Streamer.bot connection, separate OBS connection, catalogue/dependencies, native imports versus packages/services, OBS Custom Browser Dock, one reusable Universal Overlay source, visibility, deliberate off-stream checks, later starts and recovery.
- Added safe Getting Started links to installed, declared module guides. Missing modules stay plain text. The resolver still rejects arbitrary files, traversal and engineering-only guides in the normal first-run flow.
- Rewrote Universal Dock, Universal Overlay and Overlay Visibility guides around purpose, requirements, actual setup/use, optional phone integration and troubleshooting. Retained widget ownership/recovery restrictions and moved native state/history detail into the visibility developer guide.
- Applied the focused display rename Source Modules → Overlay Visibility in its manifest, controls title/header, guide and export title. Package ID `source-modules`, four Module Routing action identities, routing keys, phone contribution and native data remain unchanged.
- Corrected the Sound controls hint and media/entrance guides to use the actual **Import audio** and **Import into Streamer.bot…** button labels.

## Artifacts

| Component | Local candidate |
| --- | --- |
| Companion | 1.4.1, `companion/out/build-aEl1JK/packages/Streamer Companion Preview-win32-x64` |
| Universal Dock | 1.1.3 |
| Universal Overlay | 1.1.1 |
| Overlay Visibility | 1.1.1 |
| Sound Player | 1.1.1 |
| Video Player | 2.4.1 |
| Walk Ons | 3.0.2 |

Host ASAR SHA256: `b6f4ccaf092ed67350b6e957ba5d9d9cf8cdc201fe451eea68241e24552b13f9`, 152 payload files. Six module archives and SHA256SUMS are in `companion/out/first-run-polish-preview`. No release or commit was made.

## Verification

- Full `npm run check` passed, including guide security/links, package validation and all Phone Deck declarations/availability checks.
- Complete packaged desktop/browser suite passed. The Help test follows Getting Started → Universal Dock → Back and checks the walkthrough in the actual bundled reader. It also preserves controls/drafts/scroll while Help is open. Its scroll measurement now waits for the intentionally offline editor's initial status/layout update.
- Compared the candidate with the installed app: only package version, embedded Getting Started text and safe first-run link resolution changed. Module comparison permits guide/descriptor/version labels and the two explicitly reviewed HTML wording changes; all native import data, playback code and overlay runtime assets are identical.
- Complete closed-profile/application backups saved privately. Installed payload bytes match the candidate and all private configuration hashes remain unchanged. The existing executable/startup path is retained.
- Streamer.bot menus and OBS dock/source settings were cross-checked against official documentation linked in the guides and current code/export format. This is not a claim of a human walkthrough of every 1.0.7 menu/dialog; that broader acceptance item remains open.

## Completed live handoff

Fresh operator confirmation of off-stream/all closed overlay-widget views was recorded. Companion1.4.1 is open, Getting Started was opened, all 29 modules are Ready, and declared first-run links and six installed guide/package payloads were verified. The Overlay Visibility display name is live. Phone card revisions/layout, pairing/TLS, favorites and private settings are preserved. One Widgets owner is active with its original enabled preference; OBS is neither streaming nor recording.

The pre-existing native instance had no window and would not reopen. Its readable database and current files were backed up. Shutdown saves changed only action/command timestamps and were captured again. Ended only that blocked process and reopened the same profile. The saved eligibility ledger was empty and remains empty; roster settings, sound/video configuration and routing rules were verified preserved. Normal startup added empty optional pool-ID fields without changing assignment values. No old restoration helper or stale snapshot was reused.

Widgets was temporarily disabled while its service was stopped/waiting for the native connection, preventing a renderer from starting during normal native startup. After recovery its old owner was released through the scoped API and the original enabled setting restored. No ownership file was edited. Streamer.bot's normal startup reopened OBS; no stream/record/play command was issued for adoption.

The documentation update itself requires no native reimport/restart. The native restart was environmental recovery requested by the operator. Continue with the remaining module guides; a human walkthrough of every menu/dialog remains explicitly outside the completed automated checks.
