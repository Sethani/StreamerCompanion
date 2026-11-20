# Reminders

Keep private viewer reminder backlogs in Streamer.bot, with chat commands and a dock for reviewing and completing them. Reminders has no audience renderer or OBS source.

## Set up

1. Use Companion 1.3.1 or newer, [Universal Dock](../universal-dock/README.md) 1.1.0 or newer and [Bot Chat Routing](../chat-routing/README.md) for replies. Connect Streamer.bot's local WebSocket server.
2. Back up the Reminders actions, commands and both saved reminder globals: `portable.reminders.private` and `portable.reminders.state`.
3. Install Reminders from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import its eight actions and two commands. No separate service is installed.
4. Choose **Open controls**, or select Reminders in Universal Dock. On first setup, **Load/migrate saved reminders** initializes existing saved data without discarding its items/history. Initialize also runs at Streamer.bot startup. Existing current imports need no reimport/restart for this guide-only patch.

## Chat commands

| Command | Result |
| --- | --- |
| `!rem <message>` or `!reminder <message>` | Adds to the sender's backlog |
| `!rem @person <message>` | Adds to another person's backlog without disclosing their existing list |
| `!reminders` or `!remlist` | Lists only the requester's unresolved reminders through Bot Chat Routing |

These commands can send chat replies. The default limits are **20 unresolved reminders per target** and **240 characters**; existing saved limits and unknown private fields are retained.

## Manage the dock

**Filter target** narrows the displayed backlog by Twitch name. **Refresh** rereads private saved state and performs no action. **Current limits** shows the saved limits.

Under Unresolved, **Done** marks an item completed and retains it in **Completed history**. **Restore** makes a completed item unresolved again. **Delete** permanently removes the selected reminder after confirmation. Review the target and text before changing an item; opening/refreshing the dock changes nothing.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Add reminder**, **Complete unfinished reminder** and **Reminder backlog status**. Add the desired Input cards/widget in its editor; no cards are created automatically.

Configure **Added by** with your Twitch login on the Add card, then enter the message on the phone, optionally starting with @person. Phone additions are quiet and do not send a new chat reply. The completion picker exposes only unfinished items labelled with target/message; completed history, Restore and Delete stay in the local dock. Completed items remain in private history.

Phone controls require the native engine's phoneDeckVersion 1 support. If an old import leaves them unavailable, back up/import current actions and run Initialize. This guide patch changes no native action data. Operations serialize with persisted intents/results; unknown outcomes are not replayed automatically. Inspect the saved item before sending another request.

## Privacy, recovery and backup

If controls are waiting, check the native imports and Streamer.bot WebSocket server. If commands do not reply, check Bot Chat Routing and Streamer.bot's Twitch accounts. Use Load/migrate saved reminders for initialization, not to replace current data with an older export.

The public readiness broadcast contains no item array or reminder configuration. The private dock and narrowly scoped phone controls use local native state. Streamer.bot's unauthenticated loopback WebSocket can return persisted globals to trusted local clients; it is not an access-control boundary for backlog contents. The module does not log, bundle or send backlog contents to external storage.

Back up actions/commands and reminder globals before engine updates. Restore with the previous compatible module package if needed, with Streamer.bot closed while restoring profile files. Disable obsolete reminder overlay commands left by older installations; this module is dock-only.

First-party code: Sethani, MIT. No private reminder text, viewer data or credentials are bundled.
