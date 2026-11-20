# Pass 3 — Archipelago, Audio Routing and Cameras guide review

November 17, 2026. Source-only checkpoint on dirty main over base 2b9889c443c5568b8ca9ea18ee5a461e7109d062. Preserve existing polish changes.

Rewrote the three user READMEs around requirements, numbered setup, everyday controls, optional Phone Deck and recovery. Checked labels against shipped HTML/JavaScript and Phone Deck manifest declarations. Archipelago's earlier detailed reference is retained in its developer guide. Native actions, services, manifests, provider registrations and card layouts were not changed in this checkpoint.

- Archipelago: room/slot selection, saved display versus immediate enable switch, SlotLock, preview versus live synthetic test, key-scoped room actions, offline behavior and private backups.
- Audio Routing: current dock label Audio, exact Apply to OBS label, four classifications, complete six-track masks, Save versus Apply versus immediate native Toggle, partial failures and optional phone controls.
- Cameras: source mappings before modes, exact webcam labels, immediate per-slot changes, explicit Reapply, reconnect behavior, separate guest lineup visibility, phone controls and physical-feed verification limits.

Validation: test-guide-packages.js built and installed all 29 packages into a disposable profile and passed normal/developer Help isolation and retained-notice checks. git diff --check passed (existing line-ending warnings only). Reviewed referenced controls against source; no OBS mutations, game requests or real audience tests ran.

No version bumps, durable release artifacts, app builds, live installs, app restarts or publications were made. Temporary test packages reuse current source versions only inside the disposable test profile; do not distribute those versions as a new release. The running preview remains Companion 1.4.1 with the previously installed guides.

Remaining: finish the focused Audio → Audio Routing display rename with manifest/phone/navigation coverage and a unique patch version; version/package these three guide updates before adoption. Do not mark human menu/camera/audio/room verification complete from documentation checks. The operator asked to stop when user action or a question is needed; live adoption or a closure-dependent ownership handoff must wait. Other practical-guide rows remain open.

## Versioned API adoption — November 17, 2026

The operator explicitly authorized updating the running setup through the API. Completed the Audio → Audio Routing dock/provider display rename, preserving package/UI IDs, action names and complete Phone Deck declarations. Installed through POST /api/modules/install:

| Package | Version | SHA256 |
| --- | --- | --- |
| Archipelago | 1.0.11 | 584107dd001aaeb4e0e3ec014c94c9d537b9e7983525b8d77f9932358cd6dbd0 |
| Audio Routing | 2.0.2 | 1db9f67e49be13add8b3cfbb52ab47cfd23b45477eded9ceee94340375a8b387 |
| Cameras | 2.0.3 | 51dc2417dd8e520820d20b7040b8d0b092fd24916f548bded307aa1b778a076f |

Artifacts: companion/out/controller-camera-guide-preview. Private backups and verification: personal workspace output/controller-camera-guide-preview, helper scripts/apply-controller-camera-guide-preview.js. Completed prepare/install/verify; do not repeat those mutations.

Full npm run check passed. Hidden Audio Routing browser passed renamed Universal Dock selection with no routing write, plus existing draft/save/apply/error coverage. Hidden Cameras and Archipelago browsers passed with synthetic fixtures. Archipelago browser initially referenced its old package filename; corrected to1.0.11 and reran successfully. Diff whitespace check passed. Package/runtime comparison against installed files confirmed no runtime changes and identical native export data; only import metadata version changes.

Live API verification: exact candidate bytes installed; Help serves exact source guides; Audio Routing name appears in shared registry and Phone Deck; 29 modules Ready. Phone layout and all three providers' control revisions unchanged. Private config/key/preferences/service-start settings preserved. Only Archipelago's own service restarted; unrelated service processes retained. Companion remains1.4.1; no app restart/build, native reimport or public release. No live camera switches/audio Apply/game room mutation was invoked.

The source-only checkpoint above is historical and is superseded by this adoption. Human physical-camera/audio-output/controller-room checks are still unclaimed. Cameras still has an older browser title Camera Router; defer that small display-copy item to the next candidate rather than silently changing an installed version. Other guide rows remain open.
