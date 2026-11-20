# video developer notes

## Implementation and migration reference

No automatic uninstall/data deletion is provided. Intentional removal must affect only Video's own actions/global, preserving other modules and shared media. Keep the original production applications available until a controlled cutover passes.

## Native state and argument reference

Library/presentation are stored in `portable.video.state`. Files and their inventory are in Companion's `module-data/video/media`, outside installed package code. No media bytes or original absolute paths are packaged. Legacy `/streaming/videos/` and port 7474 sources remain supported until deliberately replaced; preserve originals for rollback.

`Video - Play` supports registered `id`, optional `title`/`src`, `fit`, `volume` (0–1), `muted`, `loop` and legacy pixel geometry (`x`, `y`, `width`, `height`). Empty ID has no personal fallback; empty title omits the title bar. An explicit volume overrides the presentation default; other supplied playback options are captured in current state. An older completion cannot stop a newer request when `startedAtMs` is supplied and checked.

The 2.3.0 owner accepts an optional `videoRequestId` and persists `lastAcceptedRequestId` only with successful state persistence. Stop, Initialize and Configure retain it. Walk Ons checks this exact match; a child action's argument mutations are not a return channel. Module Ready/name verification alone cannot establish imported engine version. Later category/read-only-ID/guide updates do not change the native action data and require no native reimport.

Scene hiding removes the normal Video iframe. Returning can reconstruct an active clip from saved current state and restart from the beginning. This differs from Sound Player's claim/no-snapshot-replay contract; do not describe Video as having Sound's renderer ownership protocol. Keep one intended Video overlay instance.

