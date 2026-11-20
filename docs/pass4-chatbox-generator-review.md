# Live Chatbox generator rework — November 17, 2026

The operator rejected the initial 1.1.0 editor as an inadequate replacement for the existing HTML URL generator. Its basic field coverage and passing tests did not establish equivalent usability. The original `stream-chat` `generator.html` and `generator.js` were then read directly and used as the reference for this rework.

Live Chatbox **1.2.0** is now installed as a local preview; Chat Archive remains **1.1.0**, and Companion remains **1.4.1**. No commit, public release, native import or host rebuild was performed.

## Controls and behavior

- Real color pickers plus hexadecimal editing, with explicit optional override switches; absent page background remains transparent.
- Numeric message limits, fade seconds and enrichment delay, with units and validation. Font suggestions/custom names and CSS size inputs remain available.
- Help beside every appearance control. All supported appearance options from the original generator are represented, including normal/ticker direction, text/emote sizes, bubble fill/border/size/radius, viewer/default/text colors, badges and their position, highlighted/announcement colors, timestamps/locales and hidden accounts/commands. Platform/enrichment display switches remain separate from the service connection settings.
- Generated URL, Copy and existing-URL import at the top. Import restores optional controls and recognizes the original deprecated `background_color` spelling as `bubble_color`.
- Automatic, debounced local sample preview; vertical and horizontal preview sizes, pause/resume, and light/dark transparency checkerboards. Preview dimensions/backing never alter OBS or the generated appearance. Samples include ordinary chat, a command, highlights, announcements, YouTube and PluralMind, with local synthetic badges.
- Named snapshots, revision conflict protection, unchanged copied URLs, isolated preview and independent archive filtering remain intact. Legacy connection/CDN/update/debug options are deliberately excluded from the appearance designer; Companion owns those functions.

## Verification and adoption

Full `npm run check` passed. Focused package/ingestion/archive tests and the final hidden Electron chat browser passed. Browser checks cover typed controls, optional color omission, automatic color/font preview updates, import/legacy spelling, narrow dock overflow, saved designs/delete, normal/ticker URLs, enrichment classification, draft/caret polling, and isolation with an active synthetic archive/renderer. Actual desktop layout was inspected from a synthetic screenshot. An optional offscreen screenshot experiment exposed an Electron shutdown crash; that mode was removed, and the normal hidden browser passed afterward. No such mode is part of the module runtime.

API installation followed private package/settings/design backups and a consistent SQLite backup. Installed package and Help bytes match the candidate. Private settings/designs, archive table hashes, Phone Deck cards/control revisions, pairing/TLS, Widgets files and unrelated service PIDs are preserved. Only Live Chatbox restarted; all 29 modules report Ready. No production synthetic message, OBS source change or Widgets handoff occurred.

Artifact: `companion/out/chatbox-generator-preview/chat-core-1.2.0.streammodule`

SHA256: `214934277d40ea9917d23dffac986dee213a506cdd4127ecdd366415568fd162`

## Next gate

Operator visual review passed November18; see acceptance below. The reviewed path is Live Chatbox Settings → **Chatboxes**. Review color overrides, URL import and the automatic preview before adopting any new URL in OBS. No OBS or aggregate renderer needs to be opened for this review. The 1.1.0 implementation evidence remains historical; this document supersedes its claim of visual-editor completeness.

## November 18 preview-only follow-up — 1.2.1

A saved thin ribbon exposed a preview mismatch: the generic900×120 preview was taller than the actual OBS source, and light message text was hard to see on light backing. Preview height now accepts1px and defaults to30px for horizontal designs. Resizing reloads only local sample messages. Loading a light-text design chooses dark checkerboard backing; the operator may still choose either backing manually. No live renderer CSS, saved appearance query, OBS source or font choice was changed. Match preview dimensions to OBS to judge the actual ribbon.

Focused package/ingestion and final hidden-browser tests passed, including1620×30 preview dimensions without URL changes and automatic white-text contrast. The tested patch was installed through the API after private backups and verified OBS off-stream/not recording. Saved designs/configuration, archive tables, Phone Deck cards/revisions, Widgets and unrelated service processes remain unchanged. All29 modules Ready; only Live Chatbox restarted.

Artifact chat-core-1.2.1.streammodule SHA256 fa98de7b4a464aa8008f563e4b7bc60be60866b2d09e268b3e77a555f46c5dc1. This is a local preview, not a public release. Operator visual review subsequently passed; see acceptance below.

## Operator acceptance — November 18, 2026

After importing both designs and checking the corrected ribbon preview, the operator confirmed: “Perfect. Visual inspection passed.” Chatbox visual acceptance is complete. Separate Archive control acceptance and broader final walkthrough/prepublication review remain open. This confirmation does not authorize publication or imply a changed OBS URL.

## Archive operator acceptance — November 18, 2026

Operator separately confirmed the Archive review looks good and requested checking it off. Both chatbox visual and Archive control acceptance are now complete. Earlier pending statements above are historical; broader final walkthrough and prepublication work remain open. No runtime or private data changed.
