# Self Clip Shoutouts developer notes

`selfClips.private.state` is the authoritative account-scoped catalogue/used-cycle/pending-intent/result ledger. `portable.selfClips.state` is a bounded public projection: counts, last selection, result acknowledgements and 50 displayed clip rows. Phone Deck projects only its declared fields. There is no credential export, independent playback renderer or duplicate source.

The selector persists an intent before immediate player dispatch. Shoutout Clips 2.2.0 atomically persists correlated acceptance with its clip state and retains 256 accepted/rejected self-request records. Selector results retain 128 operation IDs; these are bounded deduplication windows, not unlimited replay protection. Do not replay expired historical operation IDs.

Reconciliation reads acceptance; it never dispatches. Accepted media followed by a failed selector save leaves a pending intent that is resolved on explicit reconciliation or Initialize. If acceptance remains unknown, selection stays blocked until an explicit operator skip. A public projection failure cannot downgrade authoritative completed acceptance. Malformed authoritative history fails closed; it is not silently replaced with empty history.

Catalogue refresh uses the native broadcaster identity and bounded date-window GetClipsForUserById queries, with overlapping minute boundaries and ID deduplication. Only a completed collection replaces the previous catalogue. The supported bound is 20,000 clips/128 queries; saturated windows of two minutes or less fail visibly. Built-in API error behavior must be verified on the target Streamer.bot version; synthetic adapters test thrown/null responses and preserve prior data.

Native contracts: `companion/scripts/test-self-clips-engines.ps1`. Package/browser checks are separate. Never use production chat, native globals or remote players in automated fixtures. Later BRB integration must call this owner and share its cycle/history rather than maintaining another self-clip ledger.
