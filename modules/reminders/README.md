# Reminders

## Optional Phone Deck controls (1.0.2)

Add Input cards for Add reminder and Complete unfinished reminder, or a backlog-count widget. Configure Added by with your Twitch login once on the Add card; type the message on the phone, optionally prefixed with @person. Phone additions are quiet and do not dispatch chat replies. The completion picker contains only unfinished items, labelled with their target and message; it does not expose completed history, Restore or Delete. Completed items remain in private history. Ordinary viewer chat commands and the dock retain their existing behavior.

Back up and reimport the updated actions, then run Initialize before using phone controls. Action/command IDs, existing globals/configuration and private unknown fields are preserved; only engine code changes. The phone reads narrowly declared fields from the private reminder state; public broadcasts remain content-free readiness. Old imports fail the phoneDeckVersion 1 prerequisite. Operations serialize and use persisted request intents/results, with no automatic replay after unknown outcomes. No app/Phone Deck rebuild, service or automatic card is needed.

Reminders keeps persistent viewer backlogs in Streamer.bot and provides their private list and management controls in Universal Dock. It is dock-only and does not register an OBS overlay. First-party source: Sethani, MIT. No viewer name, reminder text, saved state, credential or personal setting is included in the package.

Install Reminders with Companion 1.3.0 or later, then explicitly import its eight actions and two commands. Chat Routing 1.0.2 and Universal Dock 1.1.0 are required. The module adds no child service, renderer or OBS source.

The retained action IDs, command IDs and `portable.reminders.state` key are preserved. On the first explicit **Load/migrate saved reminders** action (or the next Streamer.bot startup), legacy items, completion history, limits and unknown fields are copied without changing their IDs into `portable.reminders.private`. The original state key becomes a content-free readiness envelope for Companion. Do not delete either global during migration. Importing the package alone does not modify the backlog.

Commands are unchanged:

- `!rem <message>` / `!reminder <message>` adds to the sender's backlog.
- `!rem @person <message>` adds to another person's backlog without revealing that person's existing backlog.
- `!reminders` / `!remlist` lists only the requester's unresolved reminders through Chat Routing.

Universal Dock lists unresolved and completed records, filters by target, and provides Done, Restore and Delete controls. Delete requires confirmation. Opening or refreshing controls never executes an action. Reminder text is rendered with `textContent`; the module has no audience renderer or overlay controls.

The default limits remain 20 unresolved reminders per target and 240 characters. Existing values and unknown private payload fields are preserved. The public readiness envelope never includes the item array or configuration. Streamer.bot's unauthenticated loopback WebSocket can still return all persisted globals to local clients, so it is a trusted-local boundary rather than access control; the public module never logs, packages or sends backlog contents elsewhere.

Back up the existing Reminders actions, commands and both reminder globals before import. The import replaces the retained eight action and two command identities in place. The obsolete experimental `Reminders - Show`, `Reminders - Hide` and `!remshow` entries are not exported; disable or remove those separately if they remain in Streamer.bot. Roll back by restoring that backup and the previous module package. Do not remove the legacy server until every other selected feature has migrated; Reminders itself has no personal-server dependency after import and initialization.

Automated tests use synthetic names/messages and isolated ports. They compile the actual C# engine, verify legacy-state migration, owner-only lookup, content-free public state, lifecycle controls and atomic state preservation, and exercise the hidden dock through the packaged host. Tests never run a real chat command, send a message, expose the installed backlog or alter production globals.
