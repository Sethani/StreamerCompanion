# Pass 3 — Bot Chat Routing, Controller Display and Countdown

November 17, 2026. Installed local preview from dirty main over base2b9889c443c5568b8ca9ea18ee5a461e7109d062. No commit or public release. User's authorization to update the running setup through API remains in effect; stop if user action or a decision is required.

## Changes

Bot Chat Routing and Controller Display are focused display renames. Package IDs chat-routing/controller-input, UI/routing IDs, native action names/IDs and complete Phone Deck declarations remain unchanged. Bot Chat Routing still has no dock control page; its native actions and optional Phone Deck form are the controls. Controller page/renderer titles and scene visibility hints now use current names. Countdown's hint now says Overlay Visibility.

All three user guides now cover fresh setup, actual labels, daily use, optional Phone Deck and recovery. Bot guide includes fixed/dynamic message and reply caller recipes, Twitch-only support despite the legacy All Platforms entry point, native bot fallback and Requested versus actual delivery. Controller covers per-axis scale, selected XInput index, live synthetic tests, scene rules, fallback and private layout. Countdown distinguishes Save preset from live Start, saved-state loading, zero duration, retained empty finished-text behavior, caller recipes and optional Stream Launch.

The recipes use Set Argument then immediate Run Action; argument names and engine behavior were checked against source. Streamer.bot dialog references reviewed: https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument and https://docs.streamer.bot/api/sub-actions/core/actions/run-action . No real command, reward or chat/timer action was created or fired.

## Checks

Full npm run check passed, including all guide packages, integration discovery and Phone Deck coverage. Actual C# test-action-engines.ps1 passed with recording/synthetic adapters, including Chat Routing message/reply/fallback/rejection and Countdown initialization, configure/start/pause/resume/clear/invalid-input cases. Hidden Controller and Countdown browsers passed. Controller title is asserted in its browser test; upgrade fixture now uses1.1.5 over1.1.4 to retain a real upgrade test.

Final whitespace check caught the existing CRLF in the renamed Controller renderer line; normalized its line endings, rebuilt and reran Controller browser successfully. Build normalization yielded identical package digest. Diff whitespace check passed. Package comparison with the installed baseline allowed only documentation, manifest name/description/version, exact HTML text/title changes and import metadata name/version; native export data/runtime scripts stayed identical.

## Artifacts and API adoption

companion/out/bot-controller-countdown-guide-preview:

| Package | Version | SHA256 |
| --- | --- | --- |
| Bot Chat Routing (chat-routing) | 1.0.3 | 6acf57b19a3153553ec95c59fd5c380a615960fb386aae91f23ddc636c2be07b |
| Controller Display (controller-input) | 1.1.4 | cf64e4f6fc1462d31c0afff0e19610ff1fc71adef69a85aa8a827074895d4a59 |
| Countdown | 1.1.2 | 8c9725629c545e8b7e32f6bdec0f4a91ad54c8013a4a8ba405c2e06a992f60b9 |

Private helper: personal scripts/apply-bot-controller-countdown-guide-preview.js. Final checkpoint: output/bot-controller-countdown-guide-preview-r2, with previous packages/settings/controller data, before.private.json, installed.json and verification.json. Prepare/install/verify completed: DO NOT rerun mutations. Initial output/bot-controller-countdown-guide-preview is a prepare-only backup before line-ending cleanup; it was never installed.

Installed with authenticated POST /api/modules/install. Live exact package bytes and Help text verified. Both renamed labels verified in shared registry and Phone Deck. All29 modules Ready. Phone cards/layout/control revisions, controller configuration, private preferences/TLS/auto-start and unrelated service processes preserved. Read-only Streamer.bot GetGlobal snapshots prove Countdown config/state unchanged. Only Controller Display service restarted. OBS connected, streamActive=false and recording=false before installation and at verification. No native reimport, host build/restart, Widgets ownership transfer or public release.

Human physical-device and real-chat delivery checks remain unclaimed. Existing cross-guide mentions of old display labels can be cleaned in a later versioned consistency sweep; their declared links/package IDs remain valid. Next guide group: Embedded Widgets, Local AI and Named Timers. Widgets adoption must obey its ownership requirements; do source/isolated work first and stop if a user action becomes necessary. Pass4 visual chatbox editor/independent command filters remain open.
