# Retired personal-settings imports

## Completed scope - November 15, 2026

Companion 1.3.3 removes the desktop's unused legacy settings-import action hook. The standalone host/preload/service registry already export no personal-settings import API. A stale service manifest and legacy preload method cannot recreate the removed control.

Controller 1.1.2 removes the settings page's legacy layout JSON picker and its file-reading/parser handler. Configure the display directly in Settings. The service API, input sampling, drawing, native helper, selected controller, position/size/scale and existing private configuration keep their contracts. Health reports the packaged manifest version. No native actions, imports, dependencies or ports change.

Video and Wheel import/export operate on their current module backup formats and remain available. Streamer.bot action-code imports and media imports are preserved. Application-managed relocation of older installed Companion data remains for upgrade compatibility; it does not read a personal repository or appear as an import option. Archived private migration tools are not shipped or deleted by this cleanup.

## Verification

The complete source suite and synthetic C# engine suite pass. Actual packaged hidden desktop acceptance covers import copy/show/cancel, service lifecycle, automatic starts, catalog installation/upgrades, media, logs and navigation. The navigation fixture deliberately exposes old legacy-import metadata and a legacy preload method; the current renderer still has no import-existing-settings control. Controller hidden-browser acceptance confirms no file picker and exercises normal save/input/test/clear/transparency/stale-state behavior. Its package-upgrade test preserves the entire saved layout file byte-for-byte.

Tests use disposable profiles, synthetic native/OBS/provider data and isolated ports. No real media, chat, controller-input injection, stream or redeem is used as a build check. Normal Video/Wheel backup functions and installed-data migration code have no source changes in this release.

## Released and adopted

Companion **1.3.3** ([preview release](https://github.com/Sethani/StreamerCompanion/releases/tag/v1.3.3-preview.1)) and Controller **1.1.2** ([module release](https://github.com/Sethani/StreamerCompanion-Modules/releases/tag/controller-input-v1.1.2)) are published and installed. Source commit is c580caa. Source Windows/Linux Check 43698263174, app release 43698591629 and independent module publication 43698594565 passed. No other module was published by this cleanup. The actual downloaded app passed focused hidden Controller/navigation acceptance, including 120 synthetic modules and two dock clients. Published SHA256SUMS match the downloads; Controller archive bytes match the deterministic source build and every installed member. The installed app payload matches the released app payload.

Backed-up adoption closed Companion normally and replaced it at its existing executable path, preserving the approved firewall scope. OBS and Streamer.bot stayed open; no native import/restart was needed. Widgets acknowledged release before shutdown; its original enabled preference was restored offline before startup, without rewriting ownership. Readback confirms 27 Ready modules, one active Widgets owner, Phone Deck connected to OBS/native, unchanged OBS scene/source/audio settings, and preserved private settings, phone pairing/TLS, favorites and automatic-start choices. The old API remains stopped. Private rollback copies retain the prior application and configuration; no private data is published.

SHA-256: app ZIP e0ce32712843e92bbc4f37092cfc26278278407925d8a6cc4e48b9309ef8a033; app.asar 14995440c45fd0b4af3fd1472258b5625a6ddb404685040dc93534c43fe13dc7; Controller archive ee12899500f0be91f4254bd87d6a7745a20b936398f7ea2510ab688407f0b28b.
