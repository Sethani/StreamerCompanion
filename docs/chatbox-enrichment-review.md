# Chatbox emotes and cached enrichment — November 18, 2026

Live Chatbox **1.3.0** is installed as a tested local preview. This supersedes the chatbox1.2.1 portion of the earlier release candidate; Companion1.4.1, Archive1.1.0 and the running Dock are unchanged. No public release or native import was made.

## Correction

PluralMind enrichment previously discarded all emote positions whenever a proxy matched. The service now gives the existing pinned plugin text/emote fragments, then reconstructs emote positions from its cleaned fragments. Prefix, suffix and autoproxy retain the correct images, including repeated emote names and Unicode text. Original text/user/emotes remain separately available for filtering, archive history and renderers with member display disabled.

The existing profile cache is now applied synchronously before initial message delivery. Ordinary account pronouns remain separate from per-message member pronouns. Fresh cached profiles bypass the configured enrichment wait. Expired entries provide their last known values while refreshing; temporary lookup failures keep those values, while successful empty/404 responses clear removed data. Identical lookup results emit no replacement event. Completed changed lookups can release an already-pending message immediately.

The cache is bounded and memory-only, uses five-minute freshness and a short failure retry backoff, and clears on service restart or connection-setting saves. It is a service-session cache, not persisted history or an exact stream-boundary tracker. Cold/unknown lookups can still use the configured short display wait; configured URLs and wait values were not rewritten.

Renderer updates change only a changed author/pronoun or message body. Pronoun-only updates retain existing badge/time/pronoun/image elements where possible. Settings-epoch and moderation guards still prevent late lookup results from restoring deleted content or repopulating a replaced configuration.

## Verification

- Full `npm run check` passed, including new `test-chat-enrichment.js` coverage for delayed prefix/suffix/autoproxy resolution, repeated/Unicode emotes, cache-first delivery, member/account isolation, unchanged refresh suppression, changed pronouns, failed refresh retention, confirmed removal, negative cache and deduplication.
- Final hidden chat browser passed: two actual image elements survive delayed proxy replacement; a subsequent pronoun-only change preserves their DOM identities and the pronoun element. Known profiles display within the test's half-second bound despite a configured one-second wait. Existing preview, command filtering, moderation and URL checks remain passing.
- Existing Archive producer/consumer tests passed with original/enriched capture and moderation. No production message was sent as a test.

API adoption followed private module/config/design backups and a consistent SQLite backup, with fresh OBS status confirming connected/off-stream/not recording. Exact installed package/Help bytes were verified. Both saved designs/configuration, archive table hashes, Phone Deck card/control revisions, pairing/TLS, Widgets and unrelated service PIDs are preserved. Only Live Chatbox restarted; all29 modules report Ready.

Artifact: `companion/out/chatbox-enrichment-preview/chat-core-1.3.0.streammodule`

SHA256: `8899673b0bc2745c7cbb9f69a3e4774879abb2e10c25f16d4ac503f6833073ff`

Refresh the existing chatbox browser-source pages to load the renderer change. Their saved OBS addresses point to the current chatbox service and need no URL edit. Old displayed messages are not replayed or retroactively repaired by the service restart.

The refreshed29-module release set is in `companion/out/polish-release-candidate-r2/modules`; earlier module output folders are superseded. The previously verified standalone app ZIP remains applicable. Human confirmation of the emote fix and the remaining native-menu/source/publication gates remain open.

## Native endpoint correction — 1.3.1, November 18

A subsequent operator report exposed an additional native-contract mismatch. Current Streamer.bot1.0.7 events provide exclusive emote endIndex values, while the renderer and plugin-fragment adapter use inclusive last-character positions. At the end of a message, an unnormalized native range failed the replacement renderer's bounds check and became plain text. A warm repeat could avoid that replacement and mask the error. Historical Archive rows retain text, not emote metadata, so they cannot prove the original event's range or replacement sequence.

With explicit off-stream chat-test authorization, two controlled messages captured native and normalized events; a third final confirmation exercised an uncached pronoun lookup. The native endpoint equalled the message length; fixed initial and enriched events both had the inclusive endpoint one lower and retained the same emote. Capture was restricted to these test markers and stopped afterward. Other chat/log content remains private.

Normalization now prefers coherent rich message parts, deriving unambiguous UTF-16 positions, and corrects named exclusive raw ranges when rich parts are unavailable. Valid legacy inclusive ranges remain unchanged. Focused node chat/package/enrichment/Archive checks and the hidden browser passed, including the exact cold end-of-message emote/pronoun replacement case and trailing-space compatibility. The preceding1.3.0 full source-suite result remains applicable evidence for unaffected components; this patch used focused checks.

Live Chatbox1.3.1 was installed through API after backups and fresh OBS off-stream/not-recording verification. Exact package/Help, designs/config, existing archive content, phone cards/revisions, Widgets and unrelated processes were preserved; only chatbox restarted, all29Ready. Authorized test messages were added normally to chat/archive. No existing messages or URLs were edited.

Artifact chat-core-1.3.1.streammodule SHA256743fd7aa5659c92f1b9a5966eb404a5b76fee6457d0c0e231dabb2c87042e686. Fresh current29-module candidate is companion/out/polish-release-candidate-r3/modules; r2 and earlier module sets are historical. No public release was made.
