# Streamer Companion

An experimental Windows desktop host for independently installable Streamer.bot modules, by **Sethani**. First-party code is MIT-licensed; third-party licences remain separate.

This is the canonical source for the new host and the modules migrated here. The earlier personal integration project remains a migration laboratory and private configuration store; it is not bundled into this application.

Current browser-foundation build: [Windows preview 1.2.0 preview 3](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.2.0-preview.3). This app-only release includes the explicit action reimport and legacy-overlay compatibility fixes. Install modules separately from its catalogue.

## What is available

- **Update Probe**: a harmless local service for exercising install/update/restart behavior. No stream integrations, credentials or overlays.
- **Spotify Music**: independently hosted OAuth, playback and music-session service. Configure your own Spotify application and authorization. Viewer chat integration is optional and requires your own Chat Routing actions.
- **Universal Dock / Overlay / Source Modules**: packaged controls, operator Tests, a transparent overlay and preserved Streamer.bot scene routing.
- **Video 2.2**: its own editor/renderer and explicitly selected private media. The catalogue installs its three browser dependencies. See [installation and migration](modules/video/README.md).

Pokemon and Chat Core are not in this first public batch: their bundled artwork/library notices need a separate redistribution review. Other legacy features will migrate in batches; see [the migration checklist](docs/MIGRATION.md).

## Run or build

Install Node 22 or newer for development, then:

```powershell
npm --prefix companion ci
npm run check
npm run build:module -- spotify
npm run package
```

The packaged Windows application embeds Node; end users do not need Node/npm. Keep the whole extracted application folder together. Close any other Companion window before starting it: the authenticated loopback API uses port 3135. The preview uses the separate `Streaming Companion Preview` application-data profile, including modules installed in the previous local preview.

## GitHub module updates

Click **Check for updates** to read [`catalog/modules.json` in StreamerCompanion-Modules](https://github.com/Sethani/StreamerCompanion-Modules/tree/main/catalog). The client shows installed/latest versions and required/optional dependencies, then downloads only the modules you explicitly confirm. Each entry points to that module's own immutable release asset in the distribution repository.

Required module dependencies are resolved before changes. Downloads are bounded, their SHA-256 is checked, and package identities/metadata are verified before installation. Services are supervised by the host; failed multi-module operations restore changed code where possible. Private module data is kept outside immutable code and is not deleted during an upgrade or code rollback. A failed network check leaves installed services running and the last valid catalogue available.

Freshly installed services remain stopped until explicitly started, unless an existing automatic-start preference applies. Streamer.bot imports remain a guided user action; the host verifies required action names without editing Streamer.bot data.

Browser modules require Companion 1.2.0 and stay available while Companion runs. Their links come from installed manifests. Video media is copied only through **Add media** and stored outside package code. Import new Streamer.bot exports explicitly even when old action names show as verified; matching names do not establish imported code/version.

Host self-update, automatic installation, silent updates and automatic downgrades are not implemented. This experimental catalogue currently includes preview modules. Do not rely on it as the only copy of production configuration yet.

## Releases and ownership

All editable source remains here under `modules/`. `npm run build:module -- <id>` builds just that module. Streamer.bot `.sb` files are compiled from editable action JSON and C# sources; no live Streamer.bot installation is a build input.

**Application releases** in this repository contain only the Windows app and its checksum. The Application release workflow never publishes module packages or a module catalogue. The two original combined prototype releases remain as compatibility archives for older previews.

**Module releases** live in [Sethani/StreamerCompanion-Modules](https://github.com/Sethani/StreamerCompanion-Modules). Its Publish module workflow accepts one module ID and builds only that source folder. It publishes a release such as `spotify-v2.0.1` with one package/checksum, then atomically changes only Spotify's catalogue entry. Unchanged modules retain their previous URLs and hashes; no app rebuild/release is involved.

For local publishing, check out the distribution repository and run `npm run publish:module -- <id> <distribution-checkout>`. The checkout must be clean and point to the expected repository. Reusing an existing version with different bytes is rejected. Bump a changed module's version first. The distribution workflow uses its own repository-scoped GitHub token; no cross-repository write token is needed.

See [catalogue format](catalog/README.md), [third-party notices](THIRD_PARTY_NOTICES.md) and [MIT licence](LICENSE).

The first real GitHub update test passed from Update Probe 1.0.0 to 1.0.1 with the same host binary. See [validation evidence and remaining gates](docs/VALIDATION.md).
