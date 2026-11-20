# scene-bindings developer notes

## Implementation and migration reference

Arguments remain `sceneBindingsMode`, `configJson`, `sceneName`/`obs.sceneName`, `windowJson` and `category`. An optional unique `requestId` correlates persisted terminal `operation` acknowledgements. Dispatch is not completion. Partial failures and unknown outcomes are visible; clients never retry mutations automatically. Twitch category results describe API acceptance, rather than claiming independent remote confirmation. Windows may refuse foreground activation.

Version 2.0.2 retains the latest 32 completed request results in `completedOperations`, including their execution details. Later inventory/events preserve those acknowledgements; request arguments are frozen for the invocation. Older request IDs outside this bounded window are not a permanent transaction journal. Use new IDs for new operations. This release supersedes 2.0.0 and 2.0.1.

Private mappings, window titles, account credentials and OBS snapshots are not distributed. Removing the module does not delete saved globals. The private handoff guards old Node callers and retains their original configuration only for rollback. Full Phone Deck extraction is separate. Back up Streamer.bot before replacing actions and restore files only while it is closed.

