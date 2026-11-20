# source-modules developer notes

## Implementation and migration reference

The scoped operation sends `moduleRoutingMode=set-mode`, `moduleRoutingTarget` and `moduleRoutingVisibility` to the existing Engine action. Configuration updates are serialized with Save/Initialize; a matching terminal result is published only after configuration persistence. The last 256 request IDs/results survive Initialize and scene events. Duplicate IDs do not replay, unavailable rules remain unavailable, and unconfirmed outcomes are never automatically retried.

## Identity and compatibility

The display name is Overlay Visibility; package ID `source-modules`, `portable.moduleRouting.config`, `portable.moduleRouting.state` and all four Module Routing action IDs/names remain stable. The initialization/startup and OBS Scene Changed wiring are unchanged. New configuration begins with no enabled overlays. Save merges supplied module rules; scene names are exact, one per line. Existing unknown rule keys are retained by the owner.

The earlier 1.0.1 functional phone update required current native action bodies and a published `phoneDeckVersion: 1`. Later grouped-widget/routing-ID/editor/guide changes retain native data; the display rename requires no new import. A module's Ready name checks do not prove the imported engine version. Keep any required functional import separate from a documentation-only update.

Grouped widget declarations provide named routing rows with retained scene-hide behavior. The Sound Player package uses its explicit `walk-ons` routing ID, distinct from historical `walkonsound`; neither saved rule is renamed or overwritten by a display-name change. Phone cards retain provider revisions because the contribution declaration is unchanged.
