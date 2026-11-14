# Bouncing Avatar

The existing combined-overlay animation: a 220 px-wide image starts in the centre and moves at 220 px/second on each axis. Each wall collision adds 47 degrees of hue rotation when **Change colour on bounce** is enabled. The transparent background, original image aspect ratio and white glow are preserved. Disabling colour changes displays the original colours.

Open Bouncing Avatar from Universal Dock. Upload a PNG, JPEG, GIF or WebP image, select it, enable the display and **Save**. Uploads select a draft; they do not change the audience overlay until saved. Existing uploaded images remain selectable. Images stay in the private module-data directory and survive package upgrades. Fresh installs have no image and are disabled. No personal image or external asset is distributed.

Use the existing **Universal Overlay** OBS source. Source Modules controls scene visibility under the existing `bouncing` key; saved scene lists remain authoritative. This module needs no separate OBS source, OBS connection, Streamer.bot import or Companion rebuild. Its local management/media service uses port **3144**. No installation token is exposed.

Two editors use revisions to prevent accidental overwrites. Save failures retain the previous configuration and the draft; discard/reload before resolving conflicts. Image uploads are limited to 8 MiB, 8192 pixels per side and 32 million pixels, with at most 64 stored images. SVG, remote URLs and filesystem paths are not accepted. Removing the selected image is blocked until another image is saved or the selection is cleared. An unavailable image/service stays transparent without audience diagnostics or a legacy fallback.

Optional Phone Deck contribution: read-only setup status. Existing Source Modules controls can change the `bouncing` visibility mode without replacing saved scene lists. No phone cards are added automatically.

The original private renderer must be disabled during a backed-up cutover before enabling this one. Installing an unpublished local candidate is not production handoff or operator acceptance.
