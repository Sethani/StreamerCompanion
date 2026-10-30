# First public GitHub update validation

Validated on 2026-10-30 against the public `Sethani/StreamerCompanion` repository.

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
