# Source Modules

Preserved Streamer.bot scene routing for installed module overlays.

Requires Companion 1.3.1 or later. Install through the catalogue so dependencies are included. Browser assets are served by Companion; no personal server or static tree is required.

Import the included actions through Streamer.bot after backing up. Existing action IDs, portable.moduleRouting.config, portable.moduleRouting.state and unknown module rules are preserved. Initialize has a Streamer.bot startup trigger; Scene Changed tracks OBS scene changes. Run Initialize once after import. New configuration starts with no enabled overlays. Save merges only supplied module rules. Scene names are exact and entered one per line.

## Optional Phone Deck control

Version 1.0.1 contributes **Set saved overlay visibility**. Choose an existing saved rule and Hidden, All scenes, or Selected saved scenes. This operation changes only that rule's mode; it preserves its scene list, extra fields, every other rule and configuration version 1. It cannot add rules or edit scenes. Saved rule IDs may differ from package IDs; the picker uses the exact native keys, never a display-name match.

Existing installations must back up and reimport the updated Source Modules actions, then run Initialize. Until the new engine publishes `phoneDeckVersion: 1`, phone controls remain unavailable instead of treating an old engine's ignored request as success. All four installed action IDs, triggers and arguments are retained. No Phone Deck/Companion rebuild is required; no cards are added automatically. Installing the package does not import actions or change routing.

The scoped operation sends `moduleRoutingMode=set-mode`, `moduleRoutingTarget` and `moduleRoutingVisibility` to the existing Engine action. Configuration updates are serialized with Save/Initialize; a matching terminal result is published only after configuration persistence. The last 256 request IDs/results survive Initialize and scene events. Duplicate IDs do not replay, unavailable rules remain unavailable, and unconfirmed outcomes are never automatically retried.

## Widget group presentation (1.0.2)

Grouped external-widget declarations show separate Tangia and generic-widget routing rows using the existing saved rule IDs. There is no replacement umbrella rule or automatic scene-list change. Ordinary module rows remain unchanged. Only the editor/manifest version changes; all native actions, IDs, globals, engine bodies and arguments are unchanged. No new Streamer.bot import is required for this update.
