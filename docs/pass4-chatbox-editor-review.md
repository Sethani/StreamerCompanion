# Pass 4 chat editor and command filters — November 17, 2026

Live Chatbox and Chat Archive **1.1.0** are tested local module previews installed through the running Companion API. Nothing was committed or publicly released. Companion remains 1.4.1; no host rebuild or native action import was needed.

## Behavior

- Settings has Connection, Chatboxes and Checks panels. Named chatboxes expose the supported appearance options in collapsible groups, with separate vertical/normal and horizontal/ticker snapshots, names, copyable URLs and explicit existing-URL import.
- Saved chatboxes use a separate revisioned `chatboxes.json`. Concurrent stale saves return 409. Global connection/appearance configuration and old OBS URLs are preserved. New URLs carry `appearance_mode=standalone`; they contain appearance values rather than referring to saved IDs. Editing/deleting a saved entry cannot change a copied URL.
- The local draft preview renders synthetic fixtures inside its iframe without subscribing to SSE or publishing test events. The Checks panel retains clearly labelled, deliberately broadcast synthetic controls for existing renderers.
- New per-URL `hide_commands` defaults off, with literal `command_prefix=!`. Classification uses original text after JavaScript `trimStart`, before enrichment. Explicit legacy `cmdprefix` retains exact-start behavior. The shared feed remains unfiltered.
- Archive `excludeCommands` defaults off, independently of display settings. It skips new matches and filters retained original text consistently for search, totals, pagination and both exports. Disabling reveals retained rows, but cannot recover skipped messages. No historical deletion or database migration is added. Moderator text scrubbing still takes precedence: an erased original cannot be reclassified by its old prefix.
- Existing Live Chatbox Phone Deck connection status remains registered with the same control revision. No cards are automatically added. Archive content remains unavailable to Phone Deck; this settings work adds no phone action or history endpoint.

## Verification

Passed full `npm run check`, including deterministic packages, guides, source/service/upgrade checks and Phone Deck coverage (29 packages, 25 providers, 78 visible controls).

Focused `test-chat-core.js` and `test-chat-archive.js` cover generator option preservation, stale saved-config rejection, global configuration isolation, literal/Unicode-whitespace command classification, enrichment, skipped capture, retained history, HTTP search/count/CSV/JSON filtering, prefix changes, restart, moderation and retention. Existing renderer CSS remains pinned to its original hash and third-party notices remain packaged.

Hidden Electron chatbox tests cover saved ticker creation/deletion and surviving copied URLs, two independent displays, original versus enriched command text, legacy ticker/cmdprefix URLs, draft/caret persistence through polling, and local preview isolation while a synthetic archive and renderer are active. Hidden Archive tests cover the new controls alongside desktop/mobile rendering, safe text, pagination, drafts and concurrent settings conflicts. All fixture processes were stopped.

Installed members and Help guides match the candidate packages. Consistent SQLite backup and pre/post table hashes verify archive preservation. Private chat configuration, automatic starts, phone cards/control revisions, pairing/TLS, Widgets files and unrelated service PIDs are unchanged. Only the two updated chat services restarted; all 29 modules report Ready. OBS was absent before installation. No viewer effects, synthetic live-setup messages, source URL changes or Widgets recovery were performed.

Artifacts in `companion/out/chatbox-editor-preview`:

| Package | SHA256 |
| --- | --- |
| chat-core-1.1.0.streammodule | a52de9b61edcd6dc48b83c2b4eef11d167304b0ef3959266e5edc834b6fc537d |
| chat-archive-1.1.0.streammodule | 0291cded1bb236ab57957cde0a379a670482d10622cf8ed139cab09c1468bfe7 |

## Remaining acceptance

Operator review of the new controls is pending. Open Live Chatbox Settings → Chatboxes, create or import a draft and use **Preview draft locally**. Keep existing OBS URLs until deliberately adopting a copied snapshot. This does not require opening OBS or an aggregate/Widgets renderer. Broader native-menu acceptance and prepublication work remain separate; automated checks do not replace that human review.
