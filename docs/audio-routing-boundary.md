# Audio Routing ownership boundary

Audio Routing 2.0.0 packages the existing source editor, classification labels, routing preview and unavailable-source controls. Streamer.bot owns configuration version 2 in `portable.audioRouting.config` and playback-independent inventory/operation state in `portable.audioRouting.state`. Six installed action identities are retained. Initialize has its own startup trigger; the private shared initializer's duplicate call is removed during migration.

Fresh installations have an empty source map and game-VOD enabled. The former embedded personal seed is excluded. Existing installations retain their saved map. Exact, case-sensitive OBS input names and existing audio-input eligibility remain authoritative. Missing mappings persist, and unmanaged inputs remain untouched.

Save persists without applying. Apply saves and writes available managed inputs; Toggle flips the saved game preference and applies the complete managed plan. Managed masks always enable track 1, enable track 2 for Live + VOD and enabled Game toggle, and disable tracks 3–6. Mute, volume, monitoring and OBS output profiles are outside this module's write surface. Initialize, Refresh and transport reconnect are read-only with respect to OBS routing.

Operations serialize, validate configuration before saving, check OBS request status and read back all six track flags. Results distinguish applied, skipped and failed sources. Dispatch is not completion: clients supply a request ID and wait for its persisted terminal acknowledgement. Unknown outcomes block further client mutations until a read-only refresh or late acknowledgement. Clients never replay mutations automatically. This is completion correlation, not an unlimited transaction journal; new requests must use new IDs.

## Private Phone Deck compatibility

The existing Phone Deck cards, action type, pairing and HTTPS listener remain private. Its legacy HTTP compatibility routes and toggle use one local Streamer.bot WebSocket bridge after an ownership marker is set. Native failure reports unavailable; the guarded old Node writer cannot take over. Two clients share the same native state and connection. The original JSON and Streamer.bot profile are backed up before handoff.

Inspection corrected a lifecycle assumption: legacy HTTP and Phone Deck HTTPS are listeners in the same repository Node process. Restarting that server briefly reconnects both listeners. It does not reset pairing, replace TLS material, start a second stack or extract the full Phone Deck. That extraction remains a later slice.

## Verification and limits

The pre-migration native and Node maps agreed on all 22 configured sources. Counts and digests are sufficient evidence; source names and configuration remain private. A private rollback snapshot records all readable OBS audio-track masks before rollout.

Actual C# regressions cover all classifications, both toggle states, six-track masks, exact names, missing/unmanaged/ineligible inputs, disconnected OBS, malformed data, failed persistence, rejected writes, readback mismatch and concurrent operations. They reproduce and fix the former false-connected inventory and false-applied write defects. Package tests verify stable actions, startup registration, private-free exports and installation without routing actions. Hidden dock tests verify stable rows/focus, drafts/previews, unavailable removal, Save without Apply and matching acknowledgements. Private bridge tests exercise two Phone Deck clients, duplicate IDs, native failure, mismatched/late completion and disconnect/reconnect without duplicate mutations.

Synthetic checks do not establish audible live/VOD output. Any real Apply is an explicit off-stream acceptance step with recorded before/after masks and restoration available. No Companion rebuild, overlay or service port is required. Final retirement still requires the integrated old-server-off rehearsal after the remaining vital features migrate.

The completed rollout preserved all 22 classifications and 54 readable masks. Its explicitly announced off-stream Apply verified 17 managed sources and skipped 5 unavailable/ineligible mappings. Before/after masks already matched; the final baseline comparison passed. Two real Phone Deck clients agreed, the module reported Ready and incoming Twitch events passed after restart. Release and delivery-limit evidence is in [VALIDATION.md](VALIDATION.md).

For rollback, stop Streamer.bot before restoring its backed-up action profile, including the private shared initializer. Restore the original legacy JSON to remove the ownership marker, then restart only the repository Node server and Streamer.bot. Retain current private globals/media and use the old dock with the old engine; the modern editor expects the new acknowledgement contract. OBS masks can be restored from the private pre-rollout snapshot. Never restore a globals database over a running Streamer.bot process. Full Phone Deck extraction remains a later slice.
