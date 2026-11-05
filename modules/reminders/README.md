# Reminders

Reminders keeps persistent viewer backlogs in Streamer.bot, provides private management in Universal Dock, and displays only an explicitly selected subset in the existing combined overlay. First-party source: Sethani, MIT. No viewer name, reminder text, saved state, credential or personal setting is included in the package.

Install Reminders with Companion 1.3.0 or later, then explicitly import its ten actions and three commands. Chat Routing 1.0.1 and Universal Dock 1.1.0 are required. Universal Overlay and Source Modules are optional presentation/routing integrations. The module adds no child service and no separate OBS source.

The established action IDs, command IDs and `portable.reminders.state` key are preserved. On the first explicit **Load/migrate saved reminders** action (or the next Streamer.bot startup), legacy items, completion history, display state and limits are copied without changing their IDs into `portable.reminders.private`. The original state key is then reduced to the intentionally selected display projection. Do not delete either global during migration. Importing the package alone does not modify the backlog.

Commands are unchanged:

- `!rem <message>` / `!reminder <message>` adds to the sender's backlog.
- `!rem @person <message>` adds to another person's backlog without revealing that person's existing backlog.
- `!reminders` / `!remlist` lists only the requester's unresolved reminders through Chat Routing.
- `!remshow [@person]` is restricted to the existing Moderators group and selects a backlog for the overlay.

Universal Dock lists unresolved and completed records, filters by target, and provides Show, Done, Restore, Delete, Show all and Hide controls. Delete requires confirmation. Opening or refreshing controls never executes an action. The overlay uses the existing bottom-right dark card with green border, renders viewer text with `textContent`, automatically hides after the selected duration, and contains no operational diagnostics.

The default limits remain 20 unresolved reminders per target, 240 characters, eight visible items and 30 seconds. Existing values and unknown private payload fields are preserved. The public display envelope never includes the complete item array or configuration. Streamer.bot's unauthenticated loopback WebSocket can still return all persisted globals to local clients, so it is a trusted-local boundary rather than access control; the public module never logs, packages or sends backlog contents elsewhere.

Back up the ten existing Reminders actions, three commands and both reminder globals before import. The import replaces the matching action/command identities in place. Roll back by restoring that backup and the previous module package. Do not remove the legacy server until every other selected feature has migrated; Reminders itself has no personal-server dependency after import and initialization.

Automated tests use synthetic names/messages and isolated ports. They compile the actual C# engine, verify legacy-state migration, owner-only lookup, targeted display projection, lifecycle controls and atomic state preservation, and exercise the hidden dock/overlay through the packaged host. Tests never run a real chat command, send a message, expose the installed backlog or alter production globals.
