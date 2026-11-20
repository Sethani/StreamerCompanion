# Bouncing Avatar

Move an image around your stream with a white glow and optional colour changes when it bounces off an edge. Your uploaded images and saved choices stay private to this computer.

## Set up

1. Install Bouncing Avatar from **Catalogue**. In **Installed**, expand its row and **Start** the service, then choose **Open controls** or **Settings**. You can also select Bouncing Avatar in [Universal Dock](../universal-dock/README.md).
2. Expand **Image library** and use **Upload an image** to choose a PNG, JPEG, GIF or WebP file. Uploading adds the image to your library and selects it in the draft.
3. Check **Enable avatar**, choose whether to **Change colour on bounce**, then **Save**. Until Save, the audience continues to see the previous saved settings. Fresh installations start disabled with no image.
4. Use your existing [Universal Overlay](../universal-overlay/README.md) OBS source. In [Overlay Visibility](../source-modules/README.md), allow Bouncing Avatar in the scenes you want. Do not add a second renderer for the same feature.

This module needs no Streamer.bot import or separate OBS browser source. Its local image/settings service uses port **3144**; keep Companion and that service running.

## Everyday use

Choose another saved **Image**, change Enable avatar or Change colour on bounce, then **Save**. **Discard and reload** restores the saved settings after confirmation if you have unsaved edits.

The image is 220 pixels wide, retains its aspect ratio and moves at 220 pixels per second on each axis. Colour changes add 47 degrees of hue rotation at each wall collision. Turn them off to show the original colours. The background stays transparent.

To remove a library image, select it and use **Remove selected image from library**, then confirm. The currently saved image cannot be removed: first save another image or choose No image and Save. Removing a library file is immediate; other draft settings still need Save.

Uploads allow up to **8 MiB**, 8192 pixels per side and 32 million pixels, with at most 64 stored images. SVG, remote image URLs and filesystem paths are not accepted.

## Phone Deck and visibility

[Phone Deck](../phone-deck/README.md) optionally offers a read-only setup-status widget. Add it in the deck editor; no cards appear automatically. To change scene visibility from the phone, use Overlay Visibility's controls for this overlay. Its existing internal identifier remains `bouncing`, so saved scene lists continue to work.

## Troubleshooting and backup

If nothing appears, check the service, saved image, Enable avatar and scene routing. An unavailable image or service leaves the audience picture transparent; check the local controls for details.

If another editor saved first, your draft is preserved but Save is blocked to prevent overwriting its changes. Use Discard and reload, review the current settings and make your changes again. Failed saves retain the previous configuration.

Images and configuration are stored in private `module-data/bouncing-avatar`, outside the installed package, and survive upgrades. Back up that directory privately with your setup. Disable any older Bouncing Avatar renderer before enabling the replacement.
