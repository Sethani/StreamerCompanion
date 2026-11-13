# Reactive Guests

## Optional Phone Deck controls

Version 2.1.1 adds Show saved guest and Hide saved guest. Pick an existing guest; commands retain roster order, URLs, presentation and other guests. The existing request-ID result confirms visibility changes when matched; unknown results are not retried. Camera 2 assignment is offered under the Cameras module, using its authoritative owner and saved guest inventory. Cameras remains optional; lineup visibility does not require it. No native reimport, new service or automatic cards are needed.

Version 2.1.1 extracts the established roster editor and bottom-aligned guest lineup. Install in Companion and import its nine Streamer.bot actions. Use Universal Dock and the existing shared overlay; no additional OBS source is needed. The package keeps stable action IDs, guest order, enabled flags, presentation and `portable.reactive.state`. No roster or private URL is bundled.

The live Streamer.bot roster is authoritative. Do not import the older Node JSON over it: that legacy path normalizes to sixteen entries and can omit newer guests. Initialization and upgrades preserve every guest. Remote provider pages load as existing iframes; no provider code or image media is redistributed under MIT.

Controls retain unsaved guest/appearance edits and keep existing rows/iframes during refresh. Save appearance explicitly after Reset. Camera 2 is optional and requires Cameras 2.0.0 with configured mappings and OBS connected. Cameras owns the real selection and updates the compatibility `camera2GuestId` mirror. Guest changes/deletion request camera reconciliation after the roster save; deletion never chooses another guest automatically. Showing/hiding a lineup guest is independent of its Camera 2 assignment.

The existing Configure/Save/Toggle/Delete/Move argument contracts remain. Assign Camera2 now delegates to the installed Cameras action. State writes are serialized with Cameras and acknowledge browser mutations using an optional requestId. Missing confirmations are reported without retrying mutations. Removing a package does not erase globals or private provider URLs.

First-party code: Sethani, MIT. External provider services and media retain their own terms and rights. Stream Together and TTRPG are excluded from this module.
