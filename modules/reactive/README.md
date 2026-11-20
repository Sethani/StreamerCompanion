# Reactive Guests

Arrange saved reactive-avatar browser pages in a bottom-aligned guest lineup on your stream. Show/hide guests, reorder them and adjust the lineup's appearance. Their provider pages remain subject to their own terms and rights.

## Set up your roster

1. Install Reactive Guests from **Catalogue**. Back up your current Streamer.bot guest list before imports; do not overwrite it with an older partial export.
2. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the nine supplied actions. This guide/display-label update preserves native data, so existing current imports need no reimport.
3. Choose **Open controls**, or select Reactive Guests in [Universal Dock](../universal-dock/README.md).
4. Enter a guest **Name** and their provider's **Reactive URL**. Choose **Show on overlay**, then **Save guest**. These saves can change the actual lineup. Use **New** to clear the form before adding another guest.
5. Use your existing [Universal Overlay](../universal-overlay/README.md) OBS source. In [Overlay Visibility](../source-modules/README.md), allow Reactive Guests in the intended scenes. Do not add a duplicate lineup source.

No separate module service is needed. The roster and private provider URLs are saved in Streamer.bot, never seeded from a bundled personal roster. The package/UI ID remains reactive so saved scene rules and phone cards continue to work.

## Everyday controls

Click a guest's name/URL in the list to edit that saved guest, then **Save guest**. The row checkbox immediately changes Show on overlay. **↑** and **↓** change roster order; **Delete** asks for confirmation. Existing rows and renderer frames are retained during refresh, and unsaved guest/appearance edits are preserved.

Under **Lineup appearance**, choose Avatar size (px), Maximum row width (%), Bottom offset (px) and Gap (px), then **Save appearance**. **Reset** changes the draft to defaults; Save appearance is still needed to apply it.

Provider URLs may contain private tokens and are visible in the local roster editor. Keep them out of screenshots and shared exports. Showing a guest can load their remote provider page in the intended overlay.

## Optional Camera 2 assignment

Install [Cameras](../cameras/README.md) 2.0.0 or newer, configure its source mappings and connect OBS before using a row's **Camera 2** button. Cameras owns the real selection; Reactive Guests retains its compatibility mirror. This assignment is separate from lineup visibility: showing or hiding a guest does not enable or disable their Camera 2 assignment.

Saving or deleting a guest requests camera reconciliation after the roster save. Deleting the selected guest never chooses a replacement automatically. Stream Together and TTRPG are outside this module.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Show saved guest** and **Hide saved guest** under Reactive Guests. Pick an existing saved guest; the command retains order, URLs, appearance and other guests. Add controls in the deck editor; no cards appear automatically.

Matching persisted request-ID results confirm visibility changes. For an unconfirmed outcome, check saved state before retrying. Phone Camera 2 assignment belongs to Cameras and uses its saved guest inventory. Cameras remains optional for lineup visibility.

## Troubleshooting and backup

If controls wait for actions, check the imports and Streamer.bot WebSocket connection. If the lineup is absent, check guest URLs, enabled flags, scene routing and the shared source. A local save confirms roster state, not successful rendering by the remote provider.

Guest or camera changes may report an unconfirmed result; inspect saved state/OBS before retrying to avoid duplicate changes. Package removal does not erase guests or URLs. Back up Streamer.bot with the entire current roster and keep private URLs out of shared exports. Updates retain stable action IDs, full roster order/enabled flags, presentation and saved state.

First-party code: Sethani, MIT. External provider services and media retain their own terms and rights.
