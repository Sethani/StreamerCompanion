# Archipelago

Choose a Controller room from a dropdown, check the reported game slots and save the display. Companion remembers each room's selection by team/slot identity. One stable OBS URL follows the saved room and slot choices.

## Requirements and installation

- Companion **1.2.2 or newer**, with its embedded Node runtime. Universal Dock is installed as a dependency.
- Archipelago Controller's **Room data API 2.2** running locally; default `http://127.0.0.1:38283/api/controller/v2`. Expose the desired rooms in Controller.
- No Streamer.bot import, direct AP connection, tracker scraping, APWorld installation or local logic worker is part of this module. Controller owns those operations.

Install the module through the catalogue, start its service explicitly, and open Settings. Choose a room, check its slots (or Select all), choose progress/goals/logic/activity and enable the overlay. Press **Save display**. A new installation displays nothing until configured. Existing service automatic-start preferences are handled by Companion.

Copy the OBS URL shown in Settings into a browser source, normally at 1920 × 1080. The default is `http://127.0.0.1:3141/overlay`; no room ID, credentials or player names belong in the URL. Keep Companion, this service and Controller running. The transparent overlay renders the selected slots and recent selected activity. Its own preview uses the same saved configuration.

Up to six visible slots appear per overlay page, using two columns for larger groups. More slots rotate through pages every ten seconds; selected goal totals cover all visible permitted slots. Recent activity remains below the slots. This keeps a large room from covering the entire canvas.

Universal Overlay and Source Modules are optional. If using them, enable Archipelago in Source Modules for the intended scenes. Direct OBS use needs neither optional module. Before cutover, disable the old Archipelago renderer; do not run both renderers for the same feature. This package never edits OBS profiles, imports old secrets or switches the live setup automatically.

## Less typing, explicit controls

Rooms and player/game names come from Controller. No server address, room password or player name needs to be entered per room. Each room's saved checkboxes and display options are restored when switching back. A new generation of a saved room clears its selected slots and asks for a new selection, preventing old slot IDs from accidentally displaying a different seed's players. Missing slots stay stored but are not displayed until reported again.

Progress, goals and logic display only selected game slots. SlotLock controllers themselves are excluded. Filtering defaults on: locked, missing or unsynchronized lock state is hidden, while a room explicitly reporting no SlotLock works normally. Activity involving any locked/unknown participant is hidden when activity filtering is enabled; identities are resolved by team/slot, not names. Filters can be changed explicitly per room.

Only fresh Ready analysis provides logic counts; unavailable/stale analysis is labeled accordingly. A glitched count is shown only with `glitchedSupported: true`; go mode remains absent when unsupported/unknown. Checked sphere data is not treated as reachability. Display data is read from Controller, not recalculated by Companion.

## API key and room actions

Local passive reads normally need no key. For **Refresh room**, **Wake room**, or **Recalculate selected slots**, open Connection settings and paste the Controller API key or choose a small text file containing it, then Save connection. The key is stored only in private module `auth.json`, never in browser responses, module packages, OBS URLs, exported settings or logs. Changing the broker address clears the previously saved key unless a replacement is explicitly supplied. Only loopback HTTP broker addresses are supported; redirects are refused.

Wake and Recalculate ask for confirmation and never run from startup, room selection, overlay loading or polling. Recalculate targets only selected reported game slots. Configure their correct YAML templates in Controller first. Partial job failures direct you to Controller's analysis details. Current Controller builds may require their Rooms screen to be open for local wake requests; a `starting` response does not guarantee startup completed.

## Polling, outages and activity

The backend polls every five seconds for online rooms and fifteen for offline/unselected rooms, uses ETags, and backs off to at most sixty seconds after failures. Settings/overlay browser polling reads only this local service and does not multiply broker polling. Broker outages hide the stream display; settings retain choices and report the issue. No fallback to the old monolith or direct room parsing occurs.

Activity starts at the current tail on service start, room switch and generation change. Existing history is not replayed as new alerts. Subsequent pages are deduplicated and bounded. A cursor reset resumes at the current tail and records an operator notice. Event messages stay in bounded process memory for at most 75 seconds; they are not written to disk. Activity types and maximum rows are configurable. Selected state can intentionally restart visibility when returning to a room, but old historical alerts are never fetched for replay.

## Data and rollback

Private `module-data/archipelago/config.json` stores the local broker address, chosen room ID, overlay enable state and per-room display preferences/slot identities. `auth.json` stores only the optional broker key. No viewer/event archive is created. Package updates replace code, preserving these files. No legacy Archipelago configuration or token file is copied automatically. Keep the original system available until your controlled cutover, scene changes, room switches and restart checks pass.
