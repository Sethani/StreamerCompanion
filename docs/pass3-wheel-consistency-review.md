# Pass 3 — Wheel, developer help and wording consistency

November 17, 2026. Installed local preview on dirty main over base2b9889c443c5568b8ca9ea18ee5a461e7109d062; no commit or public release. Host remains Companion1.4.1 build-aEl1JK at the established launcher path.

## Work completed

Wheel now has practical profile/entry/weight setup, exact dock labels, draft/save/import/export/preview behavior, slug-based adapter setup and separate command/reward/subscription recipes linked to official Streamer.bot references. Preview saves dirty settings before spinning the actual overlay; guide makes sound/live-output effects explicit. Existing profile/action/routing IDs, selection/animation/sound and Phone Deck declarations remain unchanged.

Corrected an overclaim in the old guide: the engine sets result locally, but the C# test does not prove that a separate native Run Action caller receives that argument. The guide points to the persisted currentSpin result/ID/profile/timestamps, notes replacement by another spin/Clear and leaves caller propagation/correlation explicitly unverified. No runtime/adapter feature was changed to conceal that limitation.

Update Probe now explains its disposable-profile/synthetic-marker workflow, version/health/service checks and developer-only Help gating. It remains absent from normal setup and contributes no phone action.

Completed small consistency edits: benefit-oriented descriptions for Cameras/Widgets/Named Timers/Stream Launch/Wheel; Bot Chat Routing link label in Live Chatbox; Overlay Visibility labels in Archipelago/Pokemon controls; Bot Chat Routing label in Spotify controls. Archipelago's obsolete old-label caveat removed. Historical Source Modules alias in its own rename explanation is intentional and retained. Existing scenes in Cameras' description describes the mapping target, not migration history.

No runtime JavaScript/C#, native export data, action names/IDs, dependencies, routing IDs or Phone Deck declarations changed. HTML differences are exact label substitutions. Unique patch versions assigned to each changed package.

## Verification and limits

All29 module guide headings agree with manifest names. Audited88relative links: no missing targets;24external links counted. No private-workspace path patterns found in user guides. Generated package/catalogue integration checks pass. This is source/declared-link review, not a claim every external site or every human menu was exercised.

Final full npm run check and complete21-script hidden desktop/browser suite passed using compatible Companion1.4.1 bundle, disposable profiles and synthetic services. Actual C# action-engine suite passed, including Wheel profile/user/wait/engine-local result and compatibility modes. Browser Wheel checks cover profiles/weights, slug control, saved presentation, transparent animation, escaped results, one sound and Clear. Developer browser proves normal/default-off Probe gating. Updated fixture package paths and real forward-upgrade versions where needed (Chatbox1.0.3→1.0.4, Pokemon1.7.5→1.7.6). Diff whitespace check passed.

Outstanding: human Streamer.bot1.0.7 menu walkthrough, separate native caller result propagation/correlation, full public-file privacy review before publication and final human output checks. Wheel Copy/Guide are complete, Verified remains open for the result-caller boundary. Pass4 visual chatbox editor/independent command filtering remains unimplemented; Chat Archive/Live Chatbox final Guide/Verified rows remain open.

## Artifacts and adoption

Artifacts: companion/out/wheel-consistency-preview, including change-plan.json and module-entries.json. The earlier two-package companion/out/wheel-probe-guide-preview was only an intermediate candidate and was never installed; use the final set below.

| Package file | SHA256 |
| --- | --- |
| archipelago-1.0.12.streammodule | 0cdfd401df9e97240e1c64353a818b086cd3b0892321adc50af5843234a5f0eb |
| cameras-2.0.5.streammodule | 6a9907da5cc1d33b92dc772ef6357ec140be3b99a98884d559f90d62d4f7c6c2 |
| chat-core-1.0.3.streammodule | f456e288186fe797198337f3ffd6e09fefaa9a318fc72bb4474884ec98410ee5 |
| embedded-widgets-1.0.2.streammodule | d54533d4d6d6cc3618e7f227ae8882c53868d080654d2be0a014ef113f07ffa4 |
| named-timers-1.0.3.streammodule | 115ffd15b3bf15790a6318753a99ecaa021118dd95d04aa4f2009c5597d9490e |
| pokemon-encounters-1.7.5.streammodule | 6c4b00b5db706fc0053e4be952aba90a68ea01f1b53688a4e74bcdb8d54cc985 |
| spotify-2.0.7.streammodule | 189848495433dc5a9737a2c950f6de13713bfd455d47ad871e1ee8b123dd8ac4 |
| stream-launch-1.0.3.streammodule | 19f47a8273713f12f59762880d290d49da039c9ddc3e59865cd5445c5ec8e00a |
| update-probe-1.0.3.streammodule | 0c3630f886ec8d9838682e48cbc446882431c20dd5f6dfb5d703add8ea4340f9 |
| wheel-2.1.3.streammodule | ff499aede02c3a6d120fe4a62aac40297e4f99a30894b4671578e242c4d5f877 |

Private personal output/wheel-consistency-preview contains previous packages/settings, full affected module data and nine selected native Wheel/profile/launch/countdown/routing globals. Helper scripts/apply-wheel-consistency-preview.js completed prepare/install/verify; do not rerun mutation phases. before.private.json, installed.json and verification.json remain private.

Before preparation/install and after adoption: OBS closed, Widgets idle/no active owner, Spotify not playing/no fade or ownership, no Pokemon encounter and no pending phone action. No ownership recovery/old confirmation reuse was required for this idle owner. Installed ten candidates using authenticated POST /api/modules/install.

Live exact package/Help bytes verified (Probe normal read correctly404with Developer tools still off); all29modules Ready. All nine selected raw native globals, affected private data including Widget ownership record/URLs/layout, Spotify credentials/ledger, chat config and Pokemon cache/settings preserved. Existing logs proved append-only. Phone cards/layout/provider revisions/private prefs/TLS/autostart and unrelated service processes unchanged. Six updated services restarted: Archipelago, Live Chatbox, Widgets, Pokemon, Spotify and the already-running Probe. No native imports, host build/restart, live spin/test chat/playback/stream command or public release. No new renderer opened.

Do not mark all Pass3 acceptance complete from these checks. Continue with the native caller-boundary/menu verification where independently possible; stop if actual user actions are required. Resolve those outstanding checks and the still-open public-file review before publication. Pass4 can be prepared independently, but its features must not be claimed implemented by guide polish.
