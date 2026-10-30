# First public GitHub update validation

Validated on 2026-10-30 against the public `Sethani/StreamerCompanion` repository.

## Current layout: independent app and module distribution

The initial combined previews below are historical compatibility archives. Starting with [app 1.1.1 preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.1-preview.1), application releases contain exactly the portable Windows app and `SHA256SUMS`.

All editable module source remains in this repository. Live module metadata now lives in [`catalog/modules.json` in StreamerCompanion-Modules](https://github.com/Sethani/StreamerCompanion-Modules/tree/main/catalog); that repository hosts per-module releases and its own Publish module workflow. The client reads the catalogue folder using the GitHub Contents API, without enumerating either repository's releases.

Verified separation:

- Migrated Spotify 2.0.1, Video 2.1.1 and Update Probe 1.0.1 without changing any package bytes/hashes. Video was published by the distribution repository's workflow, using its own token and building only Video.
- Published only Update Probe 1.0.2 through that workflow. The before/after catalogue comparison showed that only Update Probe's entry changed: Spotify and Video's versions, URLs, hashes and source metadata were identical.
- Installed Update Probe 1.0.1 from the real distribution catalogue, then used the rebuilt app's embedded runtime to update the running service to 1.0.2. Health, synthetic private data, automatic-start preference and offline cache behavior passed. The assertions verified 1.0.2; an obsolete hard-coded success-message version was subsequently corrected.
- Both module publication workflows passed. The app-only release workflow also passed, including its hidden desktop acceptance test, and its published asset list was verified to contain only the app ZIP and checksum.
- Selected-module build tests verify that one module produces only one `.streammodule`. Catalogue merge tests preserve unrelated entries, reject downgrade/version reuse, and make a same-version retry a no-op.
- Old combined-repository caches are ignored after switching sources, while installed modules and their private data remain intact. The isolated network-test state was removed and its service stopped.

Module publications require neither an app release nor rebuilding/re-uploading unrelated modules. The original combined release assets remain available so older preview clients are not broken by this migration.

## Published releases

- [Preview 1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.0-preview.1): host 1.1.0, Video 2.1.1, Spotify 2.0.1 and Update Probe 1.0.0.
- [Preview 2](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.1.0-preview.2): the same host binary, Video and Spotify packages; Update Probe advances independently to 1.0.1.

Both releases contain a portable Windows app, versioned module packages, `modules.json` and SHA-256 sums. Unchanged Video/Spotify versions retain identical package hashes across the two releases. First-party code, generated import metadata and modules are attributed to Sethani under MIT. Third-party runtime notices are retained separately.

## Real network proof

`companion/scripts/test-github-updates.js baseline` used the public GitHub Releases API, fetched the first release catalogue, downloaded Update Probe 1.0.0, verified its hash, installed it and started it. The test saved a synthetic private marker and enabled automatic startup in an isolated temporary profile.

After Preview 2 was published, the `upgrade` phase ran using the actual packaged Electron executable in embedded-Node mode. It discovered version 1.0.1 through the real GitHub API, verified/downloaded the release asset, upgraded the running service and verified the new health version. The private marker and automatic-start setting survived. A subsequent simulated network failure retained the last valid catalogue without stopping the service.

The isolated service and API were stopped, and the test profile/state file was removed. The user's open preview, live Streamer.bot/OBS data, OAuth state, chat and playback were not changed.

## Other verification

- Windows and Linux CI passed for the initial source. The second module-only source update runs the same check group.
- Deterministic archive tests compile readable action JSON/C# into `.sb`, verify action inventories and attribution, and assert that public Video defaults contain no personal media library.
- Source tests cover capability blocking, explicit version comparison, cached/offline catalogue behavior, package identity, invalid hashes and URLs/redirects, size limits, dependency cycles/conflicts/order, traversal through installed dependencies, missing-dependency repair and multi-module rollback after a parent fails.
- Hidden Electron tests load the built ASAR, exercise the sandboxed preload, catalogue comparison and confirmed update, generic settings, dependency display, Start/Stop/Restart, automatic-start preferences, picker hot-upgrade rendering, expanded logs and quit cleanup. All integrations/data are synthetic.

## Remaining retirement gates

This proves independent module distribution and updates; it does not retire all legacy features. Universal Dock/Overlay/Tests still need a clean distributable foundation. Video's catalogue entry declares those missing facilities and remains unavailable until they are supplied. Streamer.bot imports are explicit, and real clean-machine compilation/import has not been claimed.

Pokemon imagery and Chat Core's bundled helper remain outside the public batch pending their redistribution notices. Host self-update, production data migration and full legacy shutdown are later gates. See [the migration batches](MIGRATION.md).
