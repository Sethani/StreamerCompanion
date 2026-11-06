# Wheel

Wheel is the direct package extraction of the established Wheel 2 module. It preserves the existing profile editor, weighted selection, timing, placement, appearance, transparent canvas animation, result presentation and result sound. First-party code and design: Sethani, MIT. No credentials, viewer history, OBS profile or installed Streamer.bot state is packaged.

## Install and migration

Requires Companion 1.3.0+, Universal Dock and Streamer.bot's local WebSocket server. Install through the catalogue, back up the existing Wheel actions and the `portable.wheel.profiles` and `portable.wheel.state` globals, then import the Wheel action group. The six established core action IDs are preserved. Import replaces their implementation in place and adds one inert `Wheel - Trigger Adapter` action with no trigger.

Open Wheel in Universal Dock and use **Load saved Wheel** once after import. Initialization normalizes the existing schema-2 profile container without changing its profile slugs, labels, weights, timings, position or appearance. Existing `Sub Spin` and `Selfcare wheel` actions are deliberately not exported: they remain in the installed profile with their IDs and triggers, and their `sub-spin` and `selfcare-spin` calls remain supported by the new engine. The old Node backend is no longer needed by the imported actions.

Refresh the existing combined OBS browser source after installation. Do not add a second Wheel source. Public standalone installations can use Universal Overlay and Source Modules; the package renderer is the same transparent Wheel renderer used by the legacy module.

## Trigger adapter

`Wheel - Trigger Adapter` is an untriggered Streamer.bot action template. Duplicate it, rename the copy, change its plain `profile` argument to a profile slug shown in the Wheel dock, then attach any native Streamer.bot command, channel-point redeem, subscription, gift-subscription or other trigger. It passes the triggering `userName` to the existing Wheel engine, waits until selection completes and leaves the selected label in the existing `result` argument for optional downstream actions. The module never creates or enables personal triggers automatically.

## Compatibility and exact scope

The package retains `portable.wheel.profiles`, `portable.wheel.state`, schema 2, `wheelActionMode`, the original two compatibility modes, the established default profiles, and the existing six core action IDs. Dock and renderer markup, styling, canvas drawing, easing, label fitting, positioning, palette, result timing and sound behavior come directly from the legacy Wheel files. The only user-facing addition is the trigger-adapter guidance and copy-profile-slug control in the dock.

Wheel 2.1.0 does not include the personal result-chat actions called after the existing adapters. Those remain private and continue to receive the `result` argument. The public package contains no legacy server route, personal static path or Node fallback. Roll back by restoring the Streamer.bot backup and previous package; saved globals are not deleted by package removal.

## Testing

Automated tests use synthetic profiles and an isolated Streamer.bot endpoint. They cover stable action identities, schema migration, configuration preservation, weighted-spin boundaries, adapter behavior, dock editing, import/export, animation reconstruction, exact legacy CSS/design invariants, result timing, sound invocation, clearing and disconnect handling. No production wheel, redeem, subscription, chat message or OBS source is activated by build tests.
