# Pass 3 — Shoutout Clips, Spotify Music and Stream Launch

November 17, 2026. Installed local preview on dirty main over base2b9889c443c5568b8ca9ea18ee5a461e7109d062. No commit/public release. Existing user authorization covers API adoption; stop if user actions or decisions become necessary.

Rewrote guides around actual controls and fresh setup, keeping playback/stream effects explicit. Shoutout Clips separates player setup from clip lookup/chat/official shoutout automation; Play preview saves dirty settings before playing on the actual overlay. Added a stable clip-ID caller recipe and retained provider-controlled mute restrictions, external player rights and no guaranteed remote delivery. Spotify separates credentials/callback/device setup, saved scene autoplay, ownership/manual controls and optional chat announcements. Stream Launch distinguishes inert readiness/configuration from confirmed Go Live, optional-step partial failure, online fallback, duplicate protection and raw Phone Deck OBS Start.

Reviewed primary references for current external setup details: Spotify redirect URI requirements (https://developer.spotify.com/documentation/web-api/concepts/redirect_uri), Spotify start/resume Premium requirement (https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback) and Twitch clip embed parameters (https://dev.twitch.tv/docs/embed/video-and-clips/). Guides link those sources. No account settings, provider configuration or real caller actions were changed.

Only README/patch versions and Shoutout Clips description changed. Runtime/native export data/action identities, dependency maps and complete Phone Deck declarations remain identical to installed predecessors.

## Validation

Full npm run check passed, including isolated Spotify autonomous fade/shared scene/countdown ownership and manual-pause handoff tests, guide packaging, provider scope and no-replay behavior. Hidden Shoutout Clips and Stream Launch browsers passed. External clip player requests were intercepted; synthetic native/OBS/Spotify sinks received all effects. Controls/labels checked against the actual Spotify settings source. No real clip, song, chat, announcement, authorization change or stream was launched. Diff whitespace check passed.

## Artifacts and API adoption

Artifacts: companion/out/clips-spotify-launch-guide-preview.

| Package | Version | SHA256 |
| --- | --- | --- |
| Shoutout Clips | 2.1.3 | eb9147696aaa4d5ce99e4969ac00e3385bba2363405be5c3f9fa515a347dd2ad |
| Spotify Music | 2.0.6 | 277e9f884de40221078fccdd845e799170aba43cbd93a5a221249ee64d625839 |
| Stream Launch | 1.0.2 | 98e860742776144de363ec1caeb47be9cd06aca2b0a6e705096d83bf17da9efe |

Private personal output/clips-spotify-launch-guide-preview holds previous modules/settings, complete Spotify private data and a read-only snapshot of native clip/launch/config-state/handled-at/countdown/routing globals. Helper scripts/apply-clips-spotify-launch-guide-preview.js prepare/install/verify completed; do not rerun mutation phases. before.private.json, installed.json and verification.json remain private.

Read-only guards before preparation/installation and after adoption confirmed Spotify not playing, fade disabled, no scene/countdown ownership, no clip or launch in progress, no pending phone action and OBS closed. Installed all three through authenticated POST /api/modules/install. Spotify status has a fade object even when idle; guard checks fade.enabled, not object truthiness.

Live verification passed: all29 modules Ready, exact installed packages and normalized Help/source content. All eight selected native globals match before/after exactly. Spotify credentials/auth/settings/announcement state/phone operation ledger remain byte-identical; existing logs only appended normal restart entries. Phone layout/cards/control revisions, private prefs/TLS/auto-start and unrelated service processes preserved. Only Spotify service restarted. No native reimport, host build/restart, Widgets handoff or public release. Spotify remains idle. Physical audio/real remote clip delivery/live stream outcomes are not claimed tested.

Next: Wheel practical guide and remaining Pass3 consistency/trigger-recipe checks. Pass4 visual chatbox editor and independent command filters remain unimplemented; the two chat guides need final feature documentation afterward.
