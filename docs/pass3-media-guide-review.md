# Pass 3: Sound, Walk Ons and Video guides

Completed for the local preview. This review covers these three modules; the remaining module guides and shared first-run walkthrough are still pending.

| Module | Guide/control review | Local package |
| --- | --- | --- |
| Sound Player | Shared-overlay setup and visibility before Play; media registration; master volume; weighted pools; non-replay after opening/reconnect; fixed sound/pool trigger wrappers; Phone Deck; recovery | 1.1.0 |
| Walk Ons | Login/type/saved pool or inline choices; player prerequisites; actual volume/title rules; Test and eligibility/reset behavior; included moderator commands; custom Test/reset wrappers; phone scope | 3.0.1 |
| Video Player | Media registration/replacement; placement/title/volume; real-output preview warning; settings versus media import/export; ID-based wrappers; scene-change replay behavior; phone scope; rollback | 2.4.0 |

Sound and Video editors now show selectable, read-only Sound ID, Pool ID and Video ID fields. This closes the gap between trigger recipes requiring an ID and an editor previously showing only labels. No clipboard permission, automatic action, save or playback is involved in selecting an ID. Video's module display name now matches its existing Video Player editor name; package ID `video` and native `Video -` action identities remain unchanged.

The three descriptions explain what users can do. Guides lead with purpose, requirements, first setup, normal operation, trigger recipes, optional integrations and troubleshooting. Video's advanced state/argument/migration reference is retained in its separate developer guide rather than leading the user guide.

## Evidence and limits

- Checked control labels and behavior against the actual editor sources, manifests, exported action wrappers and owner engines.
- Checked the Streamer.bot argument/action/import/command/reward/subscription/Stream Online instructions against official documentation linked in the guides. The current native profile is 1.0.7. This does not claim a human walkthrough of every menu/dialog; the broader first-run/menu acceptance item remains open.
- Full `npm run check` passed, including package/help link validation, native action inventories, Phone Deck coverage and missing/stopped-owner availability.
- Focused Sound native tests exercised the documented fixed-ID and pool Trigger Adapter recipes with in-memory state. Existing separate parent/child tests cover Video/Walk Ons playback acceptance and eligibility. No real command/reward/subscription was created, enabled or fired.
- Real hidden Sound browser checked Sound/Pool ID values, read-only status and no dispatch from selection, plus existing library/pool/play/stop behavior with silent generated audio.
- Real hidden packaged-host Video browser checked the Video ID, no dispatch from selection, library registration, ID-preserving replacement, save, generated-video playback/completion and routing/reconnect behavior.
- Compared candidate packages with installed files before applying. Native import data and all overlay/runtime assets are unchanged; only approved guides, descriptors/version labels and Sound/Video editor files differ.

## Installed checkpoint

Artifacts are in `companion/out/media-guide-polish-preview`. All three updates are installed locally; no release was published. The running Help endpoint serves the exact new guides. Running registry and Phone Deck keep the approved categories and identical control revisions. Phone pages/layout, favorites, TLS/configuration, service PIDs and auto-start settings were verified unchanged. No app/service restart, native import or overlay-owner handoff was required.

Already-open controls keep their current document/drafts. Reopen or refresh controls when ready to load the new ID fields. Backups and detailed adoption checks are private. Continue with the shared first-run instructions and remaining module guides.
