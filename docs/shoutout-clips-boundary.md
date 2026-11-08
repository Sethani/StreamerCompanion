# Shoutout Clips extraction boundary

Reviewed November 8, 2026. Shoutout Clips 2.1.0 extracts the installed 2.0.0 presentation player. Before extraction, its engine was compared with the personal installer and matched exactly. This slice preserves the player rather than substituting a new design.

## Public ownership

The module owns six stable Streamer.bot actions (Engine, Initialize, Health, Configure, Play, Stop), the existing `portable.shoutoutClip.state` envelope, dock controls and transparent shared-overlay renderer. The package has no service, new listener, media library, command trigger or chat sender. Initialize preserves saved configuration and current playback. Imported actions contain public defaults only.

The copied layout, title styling, player modes and duration limits remain. Playback start identities are unique within the engine and the renderer notices a new start even for an identical clip. Guarded Stop rejects stale completions. State operations share a lock so configuration cannot overwrite a concurrent Play. The private combined source claims the packaged renderer once and suppresses its original clip iframe; Universal Overlay uses the existing module routing identity. No extra OBS source is required.

## Private ownership and remaining dependencies

The existing orchestration action retains target/channel lookup, featured/recent selection, warm-text timing, fallback chat, official-shoutout conditions and the session ledger. A bounded local update replaces only native clip dispatch and removes its obsolete Node clip fallback/backend lookup. All other private action structure and unrelated actions remain intact. Parent/child argument return propagation is not used to acknowledge dispatch; dispatch is logged as requested, not proof of remote video playback.

Optional warm generation still calls the personal warm-text service. Its failure must retain fallback chat and must not block the native clip player. Extracting that service belongs to the later Ollama slice; this release does not establish whole-system independence from the monolith. Automatic shoutout management and its private lists are unchanged.

## Distribution and provider boundary

First-party code is Sethani/MIT. The archive contains no viewer list, session data, credential, media, thumbnail or hosted player implementation. Twitch and MustachedManiac are external iframe services, with ownership/terms retained in the package notice. This release distributes first-party integration code only and asserts no permission to redistribute third-party code/media; future bundling requires a separate review.

Twitch's documented clip URL supports autoplay, muted and parent parameters. The retained MustachedManiac URL has no verified mute control in this integration. That limitation is documented, not presented as fixed. Real provider playback, audio and restrictions remain separate from intercepted browser tests.

## Acceptance

Package/inventory tests cover stable IDs, clean exports, shared transport, readiness, assets and repeat installation. Actual C# tests cover saved configuration, restart, limits, repeated clips, stale Stop, failed input/save and concurrent changes. Hidden browser tests cover copied controls/styles, unsaved edits, provider URLs, mute encoding, transparent idle/expiry and a single shared-overlay iframe; remote players are intercepted. The private caller compiles with synthetic Twitch/AI/action adapters and covers concurrent warm dispatch, no clip, failed lookup, unavailable AI and missing player without sending chat.

The published package passed real GitHub catalogue/hash installation in an isolated Companion 1.3.1 runtime. It is installed in the running host and reports Ready. The user-authorized normal Streamer.bot close, backup, bounded offline action update and restart are complete; native initialization reports 2.1.0. Private clip configuration, Walk Ons configuration, favorites and service preferences are unchanged. The existing combined-source page also passed an isolated hidden test confirming single ownership and permissions. See VALIDATION.md for release, backup and source evidence.

Real clip appearance/audio and a complete public shoutout remain explicitly recorded acceptance checks until observed. Do not retire legacy startup/routes or declare the entire cutover complete from this slice alone.
