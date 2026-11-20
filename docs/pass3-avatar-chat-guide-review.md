# Pass 3 — Avatar and chat practical guides

November 17, 2026. Local preview on dirty main over base 2b9889c443c5568b8ca9ea18ee5a461e7109d062; no commit or public release. User authorized installing tested updates through the running API.

Rewrote Bouncing Avatar, Chat Archive and Live Chatbox around fresh setup, actual button labels, daily use, phone boundaries and recovery. Checked descriptions and controls against source. Corrected Cameras browser title to Cameras and Bouncing Avatar's settings hint to Overlay Visibility. Phone Deck declarations, package/UI IDs, native action data, service logic and renderer behavior remain unchanged.

- Avatar: upload versus saved display; image deletion; limits; enable and scene routing; read-only phone status; conflict recovery and private images.
- Archive: explicit opt-in capture; retention/deletion effects; UTC filters/local timestamps; last submitted search filters for export; 10,000-row limit; no backfill; WAL-consistent backup advice; no phone history contribution.
- Live Chatbox: actual query-based appearance control; import switches versus Save; preview; synthetic tests broadcast to every renderer; separate OBS source and explicit URL overrides; read-only phone connection status; transient history and independent archive.

The planned visual normal/ticker editor and independent chat/archive command filters DO NOT exist yet; Pass 4 remains unchecked. The two chat guides need a further update and verification when those features land. No synthetic display test was sent to the running setup.

## Validation and adoption

Full npm run check passed. Hidden Bouncing Avatar, Chat Archive and Live Chatbox browsers passed using synthetic images/chat/history and disposable profiles. Avatar's first browser attempt timed out waiting for the transient Saved. message: polling can replace it with Saved settings. before the assertion reads it. The fixture now accepts the settled saved status after controls are enabled and preserves a failing exit code while closing windows. Rerun passed; no product JavaScript changed for this fixture issue. Live Chatbox upgrade fixture now uses1.0.3 over candidate1.0.2 rather than reinstalling the same version. Diff whitespace check passed.

Candidates in companion/out/avatar-chat-guide-preview:

| Package | Version | SHA256 |
| --- | --- | --- |
| Bouncing Avatar | 1.0.2 | 052d67f68db6c53fe01188c14f5b26bf709145ed5f30fcef6bc416670495f40d |
| Cameras | 2.0.4 | cc31f2ad08b91166201521423ac2b22018b323038651585d6ab7bb22f7076e04 |
| Chat Archive | 1.0.1 | 97b3bd154a78e0f3d23e10457df3142cb942bb2076511002a3e8ce9b161c9146 |
| Live Chatbox (chat-core) | 1.0.2 | a6f480bfbcc3350ed8e295a2316526cc006c8c5bd16041906ca5de928541fb4d |

Private backups/evidence: personal workspace output/avatar-chat-guide-preview and scripts/apply-avatar-chat-guide-preview.js. Prepare/install/verify completed; do not rerun mutation phases. Backups contain previous packages/settings, avatar data, phone TLS and a consistent SQLite backup made using Node SQLite backup from a read-only connection, not a loose live database copy. Live archive contained zero rows at baseline and after verification; message/moderation content hashes match. Capture was enabled and remains enabled.

All four packages installed using authenticated POST /api/modules/install. Exact installed bytes and live Help text match candidates. Cameras title verified from its live controls. All29 modules Ready. Phone card layout and provider control revisions unchanged; no Archive provider appeared. Private settings, avatar images, phone TLS, favorites and automatic-start preferences preserved. Only the three updated module services restarted. No host build/restart, native reimport, Widgets ownership transfer, OBS source edit or published release. OBS was connected, off-stream and not recording before installation and at verification. Physical feed/audio/room human checks remain unclaimed.
