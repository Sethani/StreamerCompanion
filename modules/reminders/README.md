# Reminders

Reminders keeps persistent viewer backlogs in Streamer.bot and provides their private list and management controls in Universal Dock. It is dock-only and does not register an OBS overlay. First-party source: Sethani, MIT. No viewer name, reminder text, saved state, credential or personal setting is included in the package.

Install Reminders with Companion 1.3.0 or later, then explicitly import its eight actions and two commands. Chat Routing 1.0.1 and Universal Dock 1.1.0 are required. The module adds no child service, renderer or OBS source.

The retained action IDs, command IDs and `portable.reminders.state` key are preserved. On the first explicit **Load/migrate saved reminders** action (or the next Streamer.bot startup), legacy items, completion history, limits and unknown fields are copied without changing their IDs into `portable.reminders.private`. The original state key becomes a content-free readiness envelope for Companion. Do not delete either global during migration. Importing the package alone does not modify the backlog.

Commands are unchanged:

- `!rem <message>` / `!reminder <message>` adds to the sender's backlog.
- `!rem @person <message>` adds to another person's backlog without revealing that person's existing backlog.
- `!reminders` / `!remlist` lists only the requester's unresolved reminders through Chat Routing.

Universal Dock lists unresolved and completed records, filters by target, and provides Done, Restore and Delete controls. Delete requires confirmation. Opening or refreshing controls never executes an action. Reminder text is rendered with `textContent`; the module has no audience renderer or overlay controls.

The default limits remain 20 unresolved reminders per target and 240 characters. Existing values and unknown private payload fields are preserved. The public readiness envelope never includes the item array or configuration. Streamer.bot's unauthenticated loopback WebSocket can still return all persisted globals to local clients, so it is a trusted-local boundary rather than access control; the public module never logs, packages or sends backlog contents elsewhere.

Back up the existing Reminders actions, commands and both reminder globals before import. The import replaces the retained eight action and two command identities in place. The obsolete experimental `Reminders - Show`, `Reminders - Hide` and `!remshow` entries are not exported; disable or remove those separately if they remain in Streamer.bot. Roll back by restoring that backup and the previous module package. Do not remove the legacy server until every other selected feature has migrated; Reminders itself has no personal-server dependency after import and initialization.

Automated tests use synthetic names/messages and isolated ports. They compile the actual C# engine, verify legacy-state migration, owner-only lookup, content-free public state, lifecycle controls and atomic state preservation, and exercise the hidden dock through the packaged host. Tests never run a real chat command, send a message, expose the installed backlog or alter production globals.
