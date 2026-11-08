# Reactive Guests and Cameras extraction

Reviewed November 8, 2026. This slice keeps two independent modules: Reactive Guests 2.1.0 owns the established lineup and roster; Cameras 2.0.0 owns native OBS routing, source mappings and inventory. Cameras has no audience overlay. Stream Together and TTRPG remain excluded.

## Confirmed boundary and audit findings

The nine installed Reactive actions matched the dedicated 2.0.0 installer before extraction. The installed Cameras implementation has five actions, including its consolidated engine; the older four-action installer is not the authoritative current export. Camera code embedded private fallback configuration and hard-coded OBS names. The dock always obtained its input/scene visibility inventory from the personal server even with native routing selected.

The live Streamer.bot roster had 21 entries while the Node JSON contained 16. The Node normalizer caps that roster at sixteen, so it must not seed or replace the live state. Neither public export contains a roster, URL, mapping, credential or media asset. Public camera defaults are empty and unconfigured. Actual guest/provider content stays private; the existing remote iframe integration is copied without bundling provider code or assets.

Read-only inspection confirmed both legacy/native camera configurations were marked configured and the old HTTP listener was available. Legacy OBS reconnect handling could apply its saved camera configuration without checking native ownership. Isolated C# reproductions confirmed nine OBS visibility calls on an unconfigured native startup, success status after simulated visibility failures, and a deleted Reactive guest leaving Cameras' selection stale. The saved OBS collection contained both expected camera scenes and all six required global inputs; this is not proof of physical camera feed behavior.

## Resulting ownership and compatibility

Reactive retains nine stable action IDs, `portable.reactive.state`, guest ordering/enabled flags and presentation. Its controls and renderer preserve the original layout, padding, transition, sizing and responsive breakpoint. Polling preserves rows/iframes, keyboard focus and unsaved edits. The shared source claims the packaged renderer once; Universal Overlay uses the existing routing identity. No extra OBS source is required.

Cameras retains its five installed action IDs and existing configuration fields in `portable.cameras.state`. Mapping/inventory/version/request-confirmation fields are additive. New explicit Refresh/Health operations only read OBS; Configure Mappings saves private roles without switching visibility. Mode changes apply one slot and Reapply applies configured slots. Unconfigured startup is inert. A five-second native observer detects connection transitions and applies saved routing once after reconnect; failed writes are not automatically repeated on later ticks. Required selections are validated before visible content is hidden. The legacy scene-item template transforms and selected webcam/browser input lifetime settings are retained.

Cameras owns the real guest selection and updates Reactive's compatibility mirror under a shared state lock. Reactive assignment delegates once; roster save/delete requests reconciliation after releasing that lock. Deleting a selected guest clears its actual camera selection without choosing someone else. Lineup visibility is independent of Camera 2. State acknowledgements confirm persistence rather than depending on child-action return arguments.

The private handoff backs up actions, settings, commands, globals and legacy camera JSON before replacing the bounded player records/timer. It preserves all private roster/configuration and adds existing source-role mappings explicitly. Legacy configured/mainConfigured/secondaryConfigured flags are disabled so the already-running server cannot reapply cameras; the owner marker also prevents future legacy routing requests after a server restart. Other personal features keep running. Never restore the stale Node roster or copy private camera defaults into the public source.

## Verification and remaining acceptance

Local package/source tests verify privacy, independent optional dependencies, 21-guest state retention, repeat installation, native schedule and only Reactive's overlay registration. Actual C# tests verify fifty concurrent roster additions, read-only inventory/mapping saves, scoped routing, failures, selection/deletion consistency, item creation/transforms and one reconnect apply. Hidden browsers verify copied controls/lineup, stable rows/frames/focus, unsaved edits, native acknowledgements/errors and a single shared-overlay renderer using synthetic OBS/provider fixtures. No real cameras are switched by these implementation tests.

Release/install, backed-up private handoff, actual native inventory and Twitch EventSub recovery are recorded in VALIDATION.md when completed. Physical camera switching, guest-provider rendering and subjective appearance remain user acceptance checks. Ready and action dispatch alone do not establish those outcomes. Whole-system legacy retirement still waits for the other vital feature areas.
