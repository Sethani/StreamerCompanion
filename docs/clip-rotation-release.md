# Self Clip Shoutouts and BRB Rotation release review

November 21, 2026. The operator accepted the corrected playback test and explicitly requested publication of the accumulated changes.

| Module | Previous public version | Release |
| --- | --- | --- |
| Shoutout Clips | 2.1.3 | 2.2.1 |
| Video Player | 2.4.1 | 2.5.0 |
| Self Clip Shoutouts | New | 1.0.1 |
| BRB Rotation | New | 1.0.1 |

Companion remains 1.4.1. No host implementation changed; test registration and module documentation are included in source. Existing action IDs, OBS URLs, saved layouts/audio settings and phone cards are preserved. Phone controls are discovered without creating cards automatically.


**Published November 21:** all four experimental module releases were downloaded and checked against their published checksums and catalogue entries. Source [a4b979a8160e167141ec263febeb30e5b531f647](https://github.com/Sethani/StreamerCompanion/commit/a4b979a8160e167141ec263febeb30e5b531f647) passed [Windows/Linux main CI](https://github.com/Sethani/StreamerCompanion/actions/runs/44909767715); [PR #3](https://github.com/Sethani/StreamerCompanion/pull/3) is merged. The catalogue now contains 31 entries, with unrelated entries unchanged. No app release, production restart or native reimport was performed during publication.

- [brb-rotation 1.0.1](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/brb-rotation-v1.0.1) — SHA256 `4f15837ded26691fc955c723d90e4cfa2e833f8ef7ba5c9116ccbadb56bccd10`
- [self-clips 1.0.1](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/self-clips-v1.0.1) — SHA256 `ac54d11a3bfe70a7c0422cc3a2287d7f02cbab7a59905f1319eff730f155c9c2`
- [shoutout-clips 2.2.1](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/shoutout-clips-v2.2.1) — SHA256 `fd91bbb2530cc5c27551bb7685dd0f540dbf086ff10761e31ccfaa4eb09062d8`
- [video 2.5.0](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/video-v2.5.0) — SHA256 `e4910b2f1e32cc25a242899f33b4ccf80618ab0227b88f1ddb8b5ed5a20da245`

## Behavior and adoption

Self Clip Shoutouts maintains private per-broadcaster unused-clip cycles, explicit refresh and guarded playback through Shoutout Clips. BRB uses a saved mix by selection count, selected registered videos, the existing Auto Shoutouts followed/excluded lists and the same self-clip history. Broadcaster/moderator commands `!brb`/`!back` and authenticated Phone Deck controls share the explicit session. Scenes do not start/stop or switch the session.

Both owners persist dispatch intent/acceptance and deduplicate bounded request windows. Unknown outcomes stop without replay. Player takeover and guarded Stop preserve newer manual media. Restart disarms the rotation. Followed refresh is staged and bounded; cached availability is filtered against current follows/exclusions.

The real playback check exposed fractional milliseconds falling back to the player's maximum, producing black waits. Shoutout Clips 2.2.1 converts numeric/invariant-decimal durations without locale string loss, rounds up and clamps. Self Clips 1.0.1 retains/forwards actual clip duration after refresh. BRB 1.0.1 requires these corrected owners.

Fresh installations require native imports and idle initialization. Enable **BRB rotation tick** under **Services → Timers** after import (Repeat, 2 seconds, Lines 0), refresh clips and save a mix. Inspect command conflicts in native import preview. Existing installations upgrading the two clip owners must reimport them and refresh own timing metadata; used-cycle history is retained.

## Evidence and limits

- Full source regression suite and complete Windows native engine entry point passed locally. Native sources also compile against the installed Streamer.bot interface/model assemblies. Remote Windows/Linux Node 22 CI passed on the selected merged source commit before publication.
- Synthetic four-engine tests cover selection weights/redistribution, shared cycles, exclusions, duplicate/concurrent operations, command authorization, source refresh failures, durable intent failures, player takeover/guarded Stop, watchdog and inert restart.
- Timing regressions use the exact failing 9.4/32.6-second float values, a 25-second integer, Dutch culture, native hide deadlines, self duration forwarding and full BRB dispatch. Browser tests cover real controls/transport, safe labels, dirty edits, correlated results, confirmations and reload without replay. Existing Video browser completion/routing tests passed.
- Actual native imports/initialization, timer dispatch, broadcaster clip lookup and followed refresh completed. The operator accepted Self Clip playback and the corrected BRB transition/return test. Used IDs/cycles and existing player settings were compared unchanged during timing refresh. Full manual operation of each Phone Deck control is not claimed; declaration/discovery/availability and shared native contracts are tested separately.
- Player acceptance is not proof of remote loading or audible output. The remote clip player has no verified completion callback here; scheduling uses clip metadata/native expiry. Followed caches contain up to 20 clips per channel, not a complete all-time catalogue.

Public packages contain code, neutral defaults and documentation, never local settings, clip caches/history, credentials, media files or native DLLs. Before publication, review the exact source scope and decoded package payloads, check unused tags, then publish dependencies before dependents and verify actual downloads/checksums/catalogue provenance. Private installation receipts and histories remain outside this repository.
