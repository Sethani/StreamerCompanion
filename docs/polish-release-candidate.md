# Polish release record — November 20, 2026

**Published:** [Companion v1.4.1-preview.1](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.4.1-preview.1) and all29 independent module updates, with operator approval. PR #1 is merged; every release uses **f6e80c64d5354ccbebfa53aa1e7270a365865514**, which passed main Windows/Linux CI. The app release workflow also passed packaged desktop acceptance. No production installation or restart was performed during publication.

Actual app ZIP SHA256: **ec0aff841953cedff02fe32f62a1962c3f15fa6cc532ec419c7dbba1f4f0905f**. Published ASAR: **c85a1216d5236e494fd5122ab8e4d2ece2da812fa3c943b76a2f05dff1a261fd**. Official checksum and downloaded ZIP verified; all25 shipped first-party host source files match approved source after line-ending normalization. All29 module downloads match the prepared r5 package hashes and official checksums; the final29-entry [catalogue](https://github.com/Sethani/StreamerCompanion-Modules/blob/main/catalog/modules.json) contains the expected versions and full source provenance, with existing entries preserved.

The sections below retain prepublication proposal/build evidence. Local candidate ZIP/ASAR hashes differ from the CI-built published app and must not be substituted for its official checksums. Planned fresh-user acceptance combines isolated packaged setup and operator menu confirmation; simulated platform operations remain distinguished. Production adoption is a separate step.

## Proposed release

Application: **Companion 1.4.1**, proposed unused tag **v1.4.1-preview.1**. GitHub's release list and matching tag refs were checked November18: the latest published app preview is1.3.3 and the proposed tag has no matching ref. Recheck before publication.

The standalone candidate ASAR is byte-identical to the already tested1.4.1 host: SHA256 b6f4ccaf092ed67350b6e957ba5d9d9cf8cdc201fe451eea68241e24552b13f9 (152 payload files). No additional host feature change or immediate replacement of the running app is needed for this preparation.

The independent module set has28 updates and the first public Sound Player package. Each proposed module tag is absent from the distribution repository's tag refs as checked November18; all existing module versions advance the current public catalogue version. Publish through each module's independent workflow, never by replacing existing release bytes.

| Module ID | Previous public version | Published November20 |
| --- | --- | --- |
| archipelago | 1.0.10 | 1.0.12 |
| audio-routing | 2.0.1 | 2.0.2 |
| bouncing-avatar | 1.0.1 | 1.0.2 |
| cameras | 2.0.2 | 2.0.5 |
| chat-archive | 1.0.0 | 1.2.1 |
| chat-core | 1.0.1 | 1.4.1 |
| chat-routing | 1.0.2 | 1.0.3 |
| controller-input | 1.1.2 | 1.1.4 |
| countdown | 1.1.1 | 1.1.2 |
| embedded-widgets | 1.0.0 | 1.0.2 |
| local-ai | 1.0.0 | 1.0.2 |
| named-timers | 1.0.1 | 1.0.3 |
| phone-deck | 2.0.4 | 2.0.5 |
| pokemon-encounters | 1.7.2 | 1.7.6 |
| reactive | 2.1.1 | 2.1.2 |
| redeem-checklist | 1.0.1 | 1.0.2 |
| reminders | 1.0.2 | 1.0.3 |
| scene-bindings | 2.0.3 | 2.0.4 |
| shoutout-clips | 2.1.1 | 2.1.3 |
| sound-player | New module | 1.1.1 |
| source-modules | 1.0.2 | 1.1.1 |
| spotify | 2.0.4 | 2.0.7 |
| stream-launch | 1.0.1 | 1.0.3 |
| universal-dock | 1.1.2 | 1.1.4 |
| universal-overlay | 1.0.2 | 1.1.1 |
| update-probe | 1.0.2 | 1.0.3 |
| video | 2.2.1 | 2.4.1 |
| walk-ons | 2.1.2 | 3.0.2 |
| wheel | 2.1.2 | 2.1.4 |

Universal Dock1.1.4 corrects its minimum Companion version to **>=1.4.1**, because this Dock uses built-in Help. Its controls, IDs and native action inventory are unchanged. This candidate is **not installed** in the running setup; the earlier installed Dock1.1.3 remains untouched. Upgrade the host before the new Dock. Fixtures now use the current host where that is their intent; explicit old-host rejection remains tested.

## Prepared artifacts

- App ZIP: companion/out/polish-release-candidate/StreamerCompanion-Windows-x64.zip
- App ZIP SHA256: 3aa51b14fc34a962473b9070eb27bade7a871c0d2e49f9f81062c9174933ea59
- Module packages/catalogue/checksums: companion/out/polish-release-candidate-r5/modules
- Standalone tested app: companion/out/build-SpSU14/packages/Streamer Companion Preview-win32-x64
- Module hashes are recorded in the adjacent generated SHA256SUMS; published CI artifacts must have their own verified checksums. A local candidate is not a promise that a fresh CI ZIP has the same timestamps or hash.

The246 reviewed implementation files are committed as **88d7eae3028e30f5fe86c8e42599ab0ad620db7d** over2b9889c443c5568b8ca9ea18ee5a461e7109d062 on **review/usability-polish-2026-11-20**, with operator approval. [Draft PR #1](https://github.com/Sethani/StreamerCompanion/pull/1) records any later checkpoint changes and their CI results. Confirm the exact full40-character CI-passed source SHA before publishing; module workflows require that full SHA. The old base alone does **not** identify this candidate. Only the hash-reviewed file list was staged.

## Verification completed

- All source-suite commands passed. The sequence was resumed after correcting stale synthetic host versions exposed by the Dock requirement; no production compatibility check was weakened.
- Actual native engine contract suite and separate Sound Player native suite passed with synthetic adapters.
- All21 packaged desktop/browser scenarios passed against the standalone app in disposable profiles. Expected rejected import/external-player fixture errors were handled by assertions; overall exit was0. Fixture processes exited.
- Both chatbox and Archive operator reviews are accepted. Their approved saved settings and production data were not touched in this release-preparation session.
- Automated audit read573 public text files and all29 module payloads: no tested credential/personal-path/private-payload patterns; no unresolved relative guide links after applying the Help reader's virtual module-root resolution. Deterministic package/metadata/notices checks passed. This is bounded audit evidence, not a guarantee that regexes discover every possible secret or a replacement for final diff review.
- Release notes now describe Help, guides, integrations, independent chat settings and the separate Sound/Walk Ons adoption path. Named Raffles and personal checklist/Wheel results are explicitly excluded as planned work.

## Remaining gates

**Publication status:** steps1–4 below are complete: acceptance/review, approved merge, passing main CI, app plus29module publications and actual-download/catalogue verification. Step5 remains the separate production adoption gate. Earlier proposed tags/source/CI wording elsewhere in this record is historical. App workflow run44729580575 succeeded; individual module workflow/source/checksum provenance is available through their releases and catalogue.

1. The installed Streamer.bot1.0.7 command/reward/subscription menu walkthrough passed November20. Immediate native caller propagation was already proven and temporary actions deleted; do not rerun that probe. Archive/Pokémon human repair checks are also accepted.
2. Final publication-scope and packaging audit results are recorded below. The planned fresh-user walkthrough passed: empty-profile packaged installation/Help/import-copy/dependency/status/URL controls, plus operator-confirmed native and OBS menus. Catalogue delivery and native import outcomes were simulated; this is not a claim of exhaustive live platform configuration or viewer-effect testing.
3. Commit/push approval was received and the reviewed source is in draft PR #1. Await passing Windows/Linux CI on the exact selected source SHA; merge/release approval remains separate. This document does not itself authorize publishing.
4. Publish the app and independent module releases, then verify downloaded checksums and catalogue entries. Recheck tag availability immediately before doing so.
5. Any later production cutover must use fresh backups, a consistent archive backup, advance restart notice and Widgets' acknowledged ownership-release procedure where applicable. No timeout-based owner takeover, URL rewrite, auto-created phone card or real viewer-effect test is implied.

The current running Companion, installed packages, OBS URLs, Widgets ownership and private settings are unchanged by this preparation.

## November 18 enrichment correction

Chatbox1.3.0 supersedes1.2.1 with emote-preserving proxy cleanup, cache-first pronouns/member profiles and suppressed unchanged replacements. Full npm run check and final focused browser/Archive checks passed; installed locally with preserved data. See chatbox-enrichment-review.md. Module artifacts were rebuilt into a fresh29-package r2 folder and re-audited (575 text files, zero tested private-content findings, zero unresolved relative links). Old module folders are historical and may contain superseded versions; use r2. The standalone host ZIP and hash are unchanged. Previous21 packaged scenarios remain host evidence; the latest chat module has its separately rerun focused browser. Recheck all proposed tags before publication, including the newly proposed chat-core-v1.3.0. Human emote confirmation and native-menu/source/publication gates remain open.

### Native endpoint follow-up

Chatbox1.3.1 supersedes1.3.0 with native exclusive-endpoint normalization. Focused tests and an explicitly authorized off-stream cold-pronoun emote confirmation passed; see chatbox-enrichment-review.md. Current module set is fresh r3 (29 packages,576 text files audited, no tested private-content findings or unresolved links). Older r2 candidate is historical. Host artifacts unchanged; tags/source/CI/publication gates still require final review.

## Shared-profile and Pokémon repair follow-up

Current candidates/installed repairs are Chatbox1.4.1, Archive1.2.1 and Pokémon1.7.6. Archive now performs a backed-up schema2 migration and displays current shared profiles retroactively; its producer dependency is Chatbox^1.4.1. Pokémon cleans gender display annotations while reusing variant artwork/cache. See archive-profile-repair-review.md for migration/rollback/privacy evidence and limitations. Current29-package set is fresh r5; earlier module sets are superseded. The operator accepted both repairs and the native-menu walkthrough November20. CI/tag/publication gates still apply. New schema requires a compatible database restore when rolling back to a pre-migration module. Host artifacts unchanged; no native reimport required for these service fixes.

## November 20 final publication review

Reviewed the accumulated public scope against the recorded base, focusing on Help filesystem/HTTP/IPC boundaries, integration metadata, media ownership/migration, normalized Archive storage and enrichment handling, package allowlists and release provenance. Prior per-module guide reviews remain the detailed evidence for wording and setup coverage. The private publication inventory records each proposed file and its SHA256; it is not a source commit or publication approval.

- Public text/link audit:579 files scanned, zero tested private-content findings and zero unresolved relative links. Regex/content audits are bounded evidence, not a guarantee of detecting every possible secret.
- Rebuilt all29 modules in an isolated directory; every package hash matched the prepared r5 candidate. Audited native export JSON and23 decoded inline sources with no tested private-content findings. Package licences and declared engineering guides are present.
- Verified all25 packaged first-party host source files against current source, plus the recorded app ASAR and ZIP hashes. No host/package rebuild or production restart was needed for this review.
- Found and fixed a CI coverage gap: the Windows native-engine entry point now also invokes the separate Sound Player native test. The complete entry point passed locally using synthetic effects only. This changes CI coverage, not shipped app/module bytes.

The full current `npm run check` source suite passed locally on Windows with Node24.13.1. Remote Windows/Linux CI (configured for Node22) was requested through draft PR #1 after the reviewed commit/push; inspect the PR's latest checks for current outcomes. Local success is not a substitute for those checks. No publication or production mutation was performed by this review.
