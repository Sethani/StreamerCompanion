# Source Modules

Preserved Streamer.bot scene routing for installed module overlays.

Requires Companion 1.2.0 or later. Install through the catalogue so dependencies are included. Browser assets are served by Companion; no personal server or static tree is required.

Import the included actions through Streamer.bot after backing up. Existing action IDs, portable.moduleRouting.config, portable.moduleRouting.state and unknown module rules are preserved. Initialize has a Streamer.bot startup trigger; Scene Changed tracks OBS scene changes. Run Initialize once after import. New configuration starts with no enabled overlays. Save merges only supplied module rules. Scene names are exact and entered one per line.
