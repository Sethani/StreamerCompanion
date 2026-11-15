# Retired personal-settings imports

## Candidate scope - November 15, 2026

Companion 1.3.3 removes the desktop's unused legacy settings-import action hook. The standalone host/preload/service registry already export no personal-settings import API. A stale service manifest and legacy preload method cannot recreate the removed control.

Controller 1.1.2 removes the settings page's legacy layout JSON picker and its file-reading/parser handler. Configure the display directly in Settings. The service API, input sampling, drawing, native helper, selected controller, position/size/scale and existing private configuration keep their contracts. Health reports the packaged manifest version. No native actions, imports, dependencies or ports change.

Video and Wheel import/export operate on their current module backup formats and remain available. Streamer.bot action-code imports and media imports are preserved. Application-managed relocation of older installed Companion data remains for upgrade compatibility; it does not read a personal repository or appear as an import option. Archived private migration tools are not shipped or deleted by this cleanup.

## Verification

The complete source suite and synthetic C# engine suite pass. Actual packaged hidden desktop acceptance covers import copy/show/cancel, service lifecycle, automatic starts, catalog installation/upgrades, media, logs and navigation. The navigation fixture deliberately exposes old legacy-import metadata and a legacy preload method; the current renderer still has no import-existing-settings control. Controller hidden-browser acceptance confirms no file picker and exercises normal save/input/test/clear/transparency/stale-state behavior. Its package-upgrade test preserves the entire saved layout file byte-for-byte.

Tests use disposable profiles, synthetic native/OBS/provider data and isolated ports. No real media, chat, controller-input injection, stream or redeem is used as a build check. Normal Video/Wheel backup functions and installed-data migration code have no source changes in this release.

## Release and adoption gates

Source/Windows/Linux checks, immutable app and single-module publication, released-byte checks and backed-up adoption must finish before the final checklist is marked complete. Publish only Controller among the modules. Replace the installed application at its current executable path to preserve the approved Phone Deck firewall scope, with normal shutdown, private configuration/pairing/TLS/favorites/automatic-start snapshots and rollback. OBS and Streamer.bot can remain open; do not restart the old API or repeat accepted hardware/widget tests. Preserve Widgets enabled state through acknowledged owner release before host shutdown and restore it before startup.
