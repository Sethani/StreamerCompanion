# Archipelago

Choose a Controller room from a dropdown, check the reported game slots and save the display. Companion remembers each room's selection by team/slot identity. One stable OBS URL follows the saved room and slot choices.

## Requirements and installation

- Companion **1.2.2 or newer**, with its embedded Node runtime. Universal Dock is installed as a dependency.
- Archipelago Controller's **Room data API 2.2** running locally; default `http://127.0.0.1:38283/api/controller/v2`. Expose the desired rooms in Controller.
- No Streamer.bot import, direct AP connection, tracker scraping, APWorld installation or local logic worker is part of this module. Controller owns those operations.

Install the module through the catalogue, start its service explicitly, and open Settings. Choose a room, check its slots (or Select all), choose progress/goals/logic/activity and enable the overlay. Press **Save display**. A new installation displays nothing until configured. Existing service automatic-start preferences are handled by Companion.

Copy the OBS URL shown in Settings into a browser source, normally at 1920 × 1080. The default is `http://127.0.0.1:3141/overlay`; no room ID, credentials or player names belong in the URL. Keep Companion, this service and Controller running. The transparent overlay renders the selected slots and recent selected activity. Its own preview uses the same saved configuration.

Each included slot has independent **Percentage** and **Logic** checkboxes. **Hide logic for games at 100% checks** removes their logic results without hiding percentage or activity; completion uses reported checks, including released games that reach 100%. **Show BK games** controls fresh zero-check logic results; unavailable analysis is not treated as BK. These preferences are remembered per room. They control display only and do not cancel or prevent Controller calculations.

The percentage strip sorts from highest to lowest, preserving the reported order for ties. The overlay preserves the legacy translucent box, cyan summary strips and colored fading event stack at the bottom left of a transparent canvas. All permitted selected slots share continuous progress and logic strips; there are no timed pages or alternating views. Polling preserves existing nodes and animation timelines.

Universal Overlay and Source Modules are optional. If using them, enable Archipelago in Source Modules for the intended scenes. Direct OBS use needs neither optional module. Before cutover, disable the old Archipelago renderer; do not run both renderers for the same feature. This package never edits OBS profiles, imports old secrets or switches the live setup automatically.

Use **Test incoming item on live overlay** to show a marked synthetic item on the actual OBS URL for 15 seconds. Enable/save the overlay first. This explicit test works even when normal activity is hidden or SlotLock is pending, uses only sample identities, and does not change filters or room data. **Clear live test** removes it immediately. Only one test is held in process memory; it expires and is never replayed after restart. No Controller request or game item is sent.

Use **Test incoming item (preview)** to open a separate, clearly labeled synthetic item notification with a replay button. It uses the same renderer without fetching room data, sending items, calling Controller or changing the live overlay. This tests presentation, not actual broker event delivery.

## Less typing, explicit controls

Rooms and player/game names come from Controller. No server address, room password or player name needs to be entered per room. Each room's saved checkboxes and display options are restored when switching back. A new generation of a saved room clears its selected slots and asks for a new selection, preventing old slot IDs from accidentally displaying a different seed's players. Missing slots stay stored but are not displayed until reported again.

Progress, goals and logic display only selected game slots. SlotLock controllers themselves are excluded. Filtering defaults on: locked, missing or unsynchronized lock state is hidden, while a room explicitly reporting no SlotLock works normally. Activity involving any locked/unknown participant is hidden when activity filtering is enabled; identities are resolved by team/slot, not names. Filters can be changed explicitly per room.

Only fresh Ready analysis provides logic counts; unavailable/stale analysis is labeled accordingly. A glitched count is shown only with `glitchedSupported: true`; go mode remains absent when unsupported/unknown. Checked sphere data is not treated as reachability. Display data is read from Controller, not recalculated by Companion.

## API key and room actions

Local passive reads normally need no key. For **Refresh room**, **Wake room**, or **Recalculate selected slots**, open Connection settings and paste the Controller API key or choose a small text file containing it, then Save connection. The key is stored only in private module `auth.json`, never in browser responses, module packages, OBS URLs, exported settings or logs. Changing the broker address clears the previously saved key unless a replacement is explicitly supplied. Only loopback HTTP broker addresses are supported; redirects are refused.

Wake and Recalculate ask for confirmation and never run from startup, room selection, overlay loading or polling. Recalculate targets only selected reported game slots. Configure their correct YAML templates in Controller first. Partial job failures direct you to Controller's analysis details. Current Controller builds may require their Rooms screen to be open for local wake requests; a `starting` response does not guarantee startup completed.

## Polling, outages and activity

The backend polls every five seconds for online rooms and fifteen for offline/unselected rooms, uses ETags, and backs off to at most sixty seconds after failures. Settings/overlay browser polling reads only this local service and does not multiply broker polling. Broker outages replace player details with a neutral waiting message; settings retain choices and report the issue. Pending SlotLock data also shows a neutral waiting message without exposing player identities. Activity failures do not suppress available progress and logic. A failed local browser read retains the previous frame for at most ten seconds before hiding it. No fallback to the old monolith or direct room parsing occurs.

Activity starts at the current tail on service start, room switch and generation change. Existing history is not replayed as new alerts. Subsequent pages are deduplicated and bounded. A cursor reset resumes at the current tail and records an operator notice. Event messages stay in bounded process memory for at most 75 seconds; they are not written to disk. Activity types and maximum rows are configurable. Selected state can intentionally restart visibility when returning to a room, but old historical alerts are never fetched for replay.

## Data and rollback

Private `module-data/archipelago/config.json` stores the local broker address, chosen room ID, overlay enable state and per-room display preferences/slot identities. `auth.json` stores only the optional broker key. No viewer/event archive is created. Package updates replace code, preserving these files. No legacy Archipelago configuration or token file is copied automatically. Keep the original system available until your controlled cutover, scene changes, room switches and restart checks pass.

Item notifications prefer explicit sender/receiver roles and resolved item/location names from Controller. Numeric protocol-only item messages are replaced with a readable details-unavailable notice; Companion does not guess item names or participant roles from IDs.

Save-file restoration messages and unstructured item events without any participant or item metadata are excluded from stream activity. Restored received-item counts are operational state, not new deliveries. Controller's enriched sender/receiver, item/location and partial-resolution contract is supported; cheat items can name a receiver without inventing a sender.

Controller events marked `audience: operations` or `displayEligible: false` are always excluded from the overlay, regardless of selected activity types. Older event payloads remain supported.

## Existing combined overlay bridge

The personal legacy combined overlay can now explicitly embed this renderer for Archipelago alone, suppressing its own old Archipelago renderer. It keeps the existing OBS source URL and scene/module routing, retains the iframe between health polls, and hides it while the module is offline without falling back to old room data. This private compatibility bridge is separate from the public Universal Overlay; it does not pull the personal monolith into the module. Version 1.0.7 permits read-only health/public-state GET responses to HTTP loopback origins; private settings/actions still require their existing controls and CSRF protection. Keep Companion and the Archipelago service running. Refresh the existing combined source after applying the bridge; remove or hide a separate direct Archipelago source to avoid duplicate output.
