# Bot Chat Routing

Send outgoing Twitch bot messages and replies from other modules or your own Streamer.bot actions. Streamer.bot owns account authentication and bot-account fallback. For incoming messages and an OBS chat display, use [Live Chatbox](../chat-core/README.md) instead.

## Set up

1. Connect your Twitch account and optional bot account in Streamer.bot. Configure account permissions there; this module does not store credentials.
2. Install Bot Chat Routing from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the four supplied actions. Back up Streamer.bot before replacing imports.
3. Confirm the module is Ready and that **Chat - All Platforms**, **Chat - Twitch**, **Chat - Engine** and **Chat - Twitch Send** exist in Streamer.bot.
4. Use a caller such as Spotify, Reminders or your own action to provide a message. Installation and connection checks do not send chat. There is no separate dock control page, background service, OBS source or automatically created command.

The supplied action names stay unchanged so existing callers continue to work. Despite the compatibility name Chat - All Platforms, **Twitch is currently the only adapter**. YouTube and other target names are rejected rather than sent to a different platform.

## Send a fixed message from your own action

Create an action for your command, reward or other intended trigger. Add these sub-actions in order:

1. **Core → Arguments → Set Argument**: variable name `chatMessage`, value your intended message.
2. Set `chatTargets` to `twitch`.
3. Set `chatIsReply` to `false` and `chatReplyId` to an empty value, clearing any reply arguments inherited from the trigger.
4. **Core → Actions → Run Action**: choose **Chat - Twitch**, with **Run Action Immediately** enabled.

Enter argument names without percent signs. Attach your trigger to your caller, keeping the imported actions reusable. Running this caller sends a real chat message; choose an appropriate time for an intentional test. See Streamer.bot's [Set Argument](https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument) and [Run Action](https://docs.streamer.bot/api/sub-actions/core/actions/run-action) references for those dialogs.

For dynamic messages, use a resolved argument from your caller as the chatMessage value. An empty message or a standalone unresolved placeholder is not sent.

## Replies and platform selection

For a Twitch reply, set chatMessage and chatTargets as above, set **chatIsReply** to true and **chatReplyId** to the actual target message ID, then run Chat - Twitch. A missing or unresolved reply ID falls back to a plain message. The ID must come from a trigger or caller that actually provides one; no reply target is inferred from a username. chatReplyUser remains a compatibility argument and does not replace the message ID.

Chat - All Platforms accepts an empty target, all or twitch; each currently selects Twitch. Chat - Twitch uses the same native send adapter. Bot-account selection, fallback and message-length limits remain Streamer.bot's responsibility. Message contents are not echoed into this module's diagnostic logs.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Send bot message** under Bot Chat Routing. Add the form in the deck editor; no cards appear automatically. It uses the same Chat - Twitch action and bot-account routing, with no second chat backend or phone credentials.

Submitting sends a real message. **Requested** confirms dispatch, not platform delivery; inspect chat before retrying an uncertain result to avoid duplicates. The phone form sends a plain message rather than a reply.

## Troubleshooting and updates

If the module is waiting for actions, check the import and Streamer.bot connection. If a request produces no message, check account authentication/permissions, the resolved message argument and supported target. For the wrong sender or unexpected fallback, review Streamer.bot's bot-account setup.

These guide/display-name updates preserve action IDs, action names, arguments and native export data. Existing imports need no reimport. Keep account settings and private caller messages out of shared exports.

First-party code: Sethani, MIT.
