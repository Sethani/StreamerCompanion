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

Independent module distribution and updates are proven; full legacy retirement still requires per-feature cutovers. The browser foundation implementation and isolated evidence are recorded below. Streamer.bot imports remain explicit, and real clean-machine compilation/import has not been claimed.

Pokemon imagery and Chat Core's bundled helper remain outside the public batch pending their redistribution notices. Host self-update, production data migration and full legacy shutdown are later gates. See [the migration batches](MIGRATION.md).

## Browser foundation 1.2.0

The host now serves reviewed assets from installed package web roots and explicitly selected private media. Universal Dock 1.0.0 (including Tests), Universal Overlay 1.0.0 and Source Modules 1.0.0 are separate packages. Video 2.2.0 includes its own editor/renderer and requires all three. New modules start with no personal library or scene rules. Existing action IDs, globals, valid library sources, unknown routing rules and presentation settings are preserved.

Verified locally with temporary data and isolated loopback ports:

- Full existing check suite plus actual four-package dependency installation, top-level capability/identity validation, incompatible ranges/cycles, missing-dependency propagation and repair, missing imports, offline states and broken-manifest handling.
- Only declared web roots are served; imports/package metadata and unindexed media are excluded. Traversal, GET/HEAD, partial/suffix byte ranges, invalid ranges and methods were checked. Explicit copies store generated filenames without original absolute paths. Invalid selections cannot partially alter the index.
- Browser package upgrades preserve synthetic private files, media URLs and stored preferences. A package missing a declared page is rejected before replacement, leaving the previous version/data intact. Installation/verification invokes no Streamer.bot action.
- Actual Video and Source Modules C# source compiles in PowerShell's compiler against a synthetic CPH adapter. Tests execute Initialize/Configure/Play/Stop and routing Save: empty defaults, legacy/new media URLs, rejected remote URLs, preserved configuration, merged unknown routing rules, invalid-save atomicity, scene updates and stale-completion guards pass. This does not substitute for Streamer.bot's own compiler/import test.
- The built ASAR passed existing hidden desktop acceptance and a new hidden browser acceptance. A tiny synthetic WebM is generated locally and copied through the real media implementation. The test opens packaged Dock/Tests, registers and saves media, relinks an existing ID, checks cancelled/explicit tests, plays the real generated clip, verifies title/volume, duplicate-state handling, natural completion, scene routing and disconnect/reconnect. No live integrations or personal media are used. All spawned test processes/listeners are stopped and temporary profiles removed.

Unchecked/remaining: real Streamer.bot import and startup/OBS triggers, real OBS browser behavior/audio/codec support and production cutover. Existing action-name verification cannot establish installed action code/version; reimport exports explicitly. Shared WebSocket transport currently requires unauthenticated loopback access. Spotify's service controls remain its operational test surface: its older service does not enable cross-origin fetch responses for the new shared Tests page's localRequest buttons. Shared Tests checks the service's read-only health endpoint first and reports an unsupported/unavailable service before sending the requested command. A synthetic service verifies that local query/body/method handling works and that blocked cross-origin requests cannot send a mutating command. No real Spotify/OAuth/playback calls were made. This does not prove every legacy test registration works.

Full legacy retirement is not claimed. Original legacy video URLs retain their original host dependency until the operator explicitly copies/relinks them. Pokemon and other legacy feature renderers are not copied into Universal Overlay.

### Published browser-module proof

All four independent module publication workflows succeeded: [Universal Dock 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/universal-dock-v1.0.0), [Universal Overlay 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/universal-overlay-v1.0.0), [Source Modules 1.0.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/source-modules-v1.0.0), and [Video 2.2.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/video-v2.2.0). Spotify 2.0.1 and Update Probe 1.0.2 retained identical package bytes/hashes. Module source provenance points to the exact tested source commit.

The app-only 1.2.0 preview release passed Windows build, C# checks and hidden desktop/browser checks. Its release contains exactly the app ZIP and SHA256SUMS. The ZIP was downloaded and its checksum verified locally. `test-github-browser-foundation.js` then ran inside that released app's embedded runtime, fetched the real GitHub catalogue/assets, upgraded an isolated Video 2.1.1 to 2.2.0, installed its three dependencies, verified hashes and preserved a synthetic private marker and stored preference. It checked pending-import states, then synthetic verified-action states and actual served browser pages. No Streamer.bot action was invoked. Temporary profiles/listeners were removed.

The first app release attempt was correctly stopped when its desktop test began a second install before the first completed. The test now waits for completed-operation feedback and the released installation lock; rerun passed. An additional migration regression verifies that a Ready module still exposes its import button, allowing users to replace old action code with matching names. The app-only follow-up includes this button fix; module releases are unchanged.
