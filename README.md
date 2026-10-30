# Streamer Companion

An experimental Windows desktop host for independently installable Streamer.bot modules, by **Sethani**. First-party code is MIT-licensed; third-party licences remain separate.

This is the canonical source for the new host and the modules migrated here. The earlier personal integration project remains a migration laboratory and private configuration store; it is not bundled into this application.

## What is available

- **Update Probe**: a harmless local service for exercising install/update/restart behavior. No stream integrations, credentials or overlays.
- **Spotify Music**: independently hosted OAuth, playback and music-session service. Configure your own Spotify application and authorization. Viewer chat integration is optional and requires your own Chat Routing actions.
- **Video**: the six-action Streamer.bot player package. Its Universal Dock, shared overlay and media hosting are still external prerequisites; the catalogue shows those dependencies rather than claiming a complete clean-machine install.

Pokemon and Chat Core are not in this first public batch: their bundled artwork/library notices need a separate redistribution review. Other legacy features will migrate in batches; see [the migration checklist](docs/MIGRATION.md).

## Run or build

Install Node 22 or newer for development, then:

```powershell
npm --prefix companion ci
npm run check
npm run build:modules -- v1.1.0-preview.1
npm run package
```

The packaged Windows application embeds Node; end users do not need Node/npm. Keep the whole extracted application folder together. Close any other Companion window before starting it: the authenticated loopback API uses port 3135. The preview uses the separate `Streaming Companion Preview` application-data profile, including modules installed in the previous local preview.

## GitHub module updates

Click **Check for updates** to read this repository's experimental GitHub Releases. The client reads a versioned `modules.json` asset, shows installed/latest versions and required/optional dependencies, and installs only after your explicit confirmation.

Required module dependencies are resolved before changes. Downloads are bounded, their SHA-256 is checked, and package identities/metadata are verified before installation. Services are supervised by the host; failed multi-module operations restore changed code where possible. Private module data is kept outside immutable code and is not deleted during an upgrade or code rollback. A failed network check leaves installed services running and the last valid catalogue available.

Freshly installed services remain stopped until explicitly started, unless an existing automatic-start preference applies. Streamer.bot imports remain a guided user action; the host verifies required action names without editing Streamer.bot data.

Host self-update, automatic installation, silent updates and automatic downgrades are not implemented. This preview intentionally sees prereleases. Do not rely on it as the only copy of production configuration yet.

## Releases and ownership

`scripts/build-modules.js <tag>` generates deterministic `.streammodule` archives, SHA-256 sums and the catalogue from module manifests. Streamer.bot `.sb` files are compiled from editable action JSON and C# sources; no live Streamer.bot installation is a build input. GitHub release assets use versioned URLs and must not be replaced in place; version source changes before publishing another package.

The release workflow is manually dispatched with an explicit tag and produces a prerelease. CI checks source and module builds on pushes and pull requests. See [catalogue format](catalog/README.md), [third-party notices](THIRD_PARTY_NOTICES.md) and [MIT licence](LICENSE).

The first real GitHub update test passed from Update Probe 1.0.0 to 1.0.1 with the same host binary. See [validation evidence and remaining gates](docs/VALIDATION.md).
