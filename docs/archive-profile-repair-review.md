# Shared Archive profiles and Pokémon labels — November 18, 2026

Installed local previews: **Live Chatbox1.4.1**, **Chat Archive1.2.1**, **Pokémon Encounters1.7.6**. Companion remains1.4.1. No public release or native import was performed.

## Shared profiles restored

Archive schema2 stores account identity/current pronouns in `users`, current member profiles in `pluralmind_members`, and foreign-key references in `messages`. Search, counts, pagination and exports use a joined view with the same public row shape as before. Later-known pronouns now appear on older messages for that identity. Unchanged original/displayed text is stored once, rather than duplicated.

Chatbox feed metadata now supplies stable system/member IDs and separate confirmation flags for account and member pronouns. Unknown, failed or disabled lookups retain known Archive values; confirmed empty results can clear them. Account and member pronouns remain independent. Deleted/expired/missing-message updates cannot create profiles or restore content, and older message updates cannot overwrite newer profile information. Retention removes unreferenced profile rows.

The schema1 migration runs transactionally after a consistent private SQLite backup, checks counts/references, and compacts the active file when possible. IDs, timestamps, original/displayed text, platform/user identity and moderation records are preserved. Ordinary old blank pronouns are filled through the latest known nonempty account value; older records cannot distinguish unknown from confirmed removal. Older member records lack stable IDs and remain legacy groups by observed account/name, not guessed matches to real current member IDs. These limitations are documented in the guide.

Migration was first rehearsed on a consistent copy of the installed database: all158 messages retained their immutable fields, six shared users were created, and the reported early/later pronoun pair now matches. The active database shrank from86,016 to77,824 bytes (84 to76KiB). This small-archive measurement is not a fixed savings promise. Safety backups temporarily add to total disk usage, contain private history and remain outside normal retention cleanup until deliberately removed.

## Pokémon label correction

Gender annotations are removed from the display label, so `Shinx (F)` displays **Shinx**. Female metadata, cache key and artwork selection remain intact. The fix also applies when existing cache metadata still contains the old label: no image redownload or cache rewrite is required. Shiny, regional and cosmetic-form labels remain, and Nidoran species lookup distinctions are preserved.

## Verification and adoption

- Full source suite passed for the initial repairs, including new transactional migration/rollback/profile-isolation tests. The final account/member confirmation safeguard passed focused Core/enrichment/Archive/profile checks and both chat browsers.
- Tests cover a populated schema1 rollback on simulated failure, metadata/text normalization, historical pronouns, equal-name distinct members, account/member isolation, unknown-versus-confirmed removal, stale updates, moderation, deduplication, command exclusion, paging/exports, restart and orphan cleanup. Synthetic repeated-history storage was measured smaller after compaction.
- Pokémon package and hidden browser checks passed for clean Shinx naming with female image route, cached-image reuse, shiny/form labels and unchanged normal artwork/type/ball presentation. Real cached female artwork was also checked in a disposable copy with network access forbidden.
- Live adoption followed module/config/design/cache backups and a consistent database backup. Fresh OBS status confirmed off-stream/not recording; Pokémon had no active encounter. Only affected services restarted, with unrelated processes, Widgets, automatic starts, Phone Deck cards/control revisions, pairing/TLS and private settings preserved.
- Post-adoption checks verified schema2, foreign keys, all158 prior immutable message records, moderation, the corrected historical pronoun pair, unchanged Pokémon cache hashes, exact installed package/Help bytes and all29 modules Ready. The final confirmation guard left normalized message/user/member table contents unchanged. No real chat, Pokémon spawn or viewer-effect test was sent during this repair.

| Installed package | SHA256 |
| --- | --- |
| chat-core-1.4.1.streammodule | bf964dc6fb0365d7000a154d0c313ed5f7ffe03fbbd9f2496d197e3067bcdbd6 |
| chat-archive-1.2.1.streammodule | 1d1a26d1ce7c655b646f5a2401ded9426ddb43ed961ea75e403981805dffb0db |
| pokemon-encounters-1.7.6.streammodule | 217d6e2b7f1aca13723929a6660020939fe6ae4da96b3e376e4e7fd2581c5780 |

Current full module candidate set: `companion/out/polish-release-candidate-r5/modules`. Earlier module candidate sets are historical; the standalone host ZIP is unchanged. The operator accepted both the historical Archive pronoun check and Pokémon clean-name/female-artwork check on November20,2026. Exact-source review, CI and publication approval remain separate gates.

Refresh the Archive page or run Search again to see the updated historical profile values. The next matching Pokémon encounter uses the cleaned name automatically; no OBS URL change is needed.
