# Named Timers

Create labelled timers that appear as green cards in the shared overlay. Add an ordinary timer with the moderator command, a compatible Streamer.bot caller or Phone Deck. Adding the same normalized name extends its active timer rather than creating another card.

## Set up

1. Connect Companion to Streamer.bot's local WebSocket server. Install [Bot Chat Routing](../chat-routing/README.md) and import its actions for timer chat messages.
2. Install Named Timers from **Catalogue**. Back up Streamer.bot's existing timer actions/globals. Expand the module's **Installed** row and choose **Import into Streamer.bot…** to import the supplied action group. Stable action, command, checker schedule and publisher-queue IDs replace the generic implementation in place.
3. Run **Named Timers - Initialize** once after a fresh or required engine import to publish saved timers; it is also registered at Streamer.bot startup. This guide-only update changes no native action data, so existing current imports need no reimport or restart.
4. Choose **Open controls**, or select Named Timers in [Universal Dock](../universal-dock/README.md). **Refresh state** rereads public state; **Republish saved timers** republishes the saved timer globals without adding a timer.
5. Use the existing [Universal Overlay](../universal-overlay/README.md) OBS source. In [Overlay Visibility](../source-modules/README.md), allow Named Timers in the intended scenes. Refresh that source if needed after first installation; do not add a duplicate timer source.

Requires Companion 1.3.0 or newer. No separate module service is needed. The dock shows current timers; timer creation stays in the command/actions/phone controls.

## Add or extend a timer

As a moderator, use `!timer 600 hydration` to add ten minutes to hydration. Syntax is `!timer <seconds> <title>`; seconds must be a positive whole number. Ordinary creation prepares a chat acknowledgement, and configured expiry notifications can also send chat.

Names are normalized to lowercase; spaces become underscores and unsupported characters are removed. The overlay displays underscores as spaces. Choose distinct names after normalization to avoid extending another timer unintentionally.

For your own Streamer.bot caller, add **Core → Arguments → Set Argument** with `timerSeconds` set to a positive whole-second value and `timerTitle` set to the intended title, then **Core → Actions → Run Action**, choose **Timer_Add** and enable **Run Action Immediately**. Enter names without percent signs. Attach your chosen trigger to the caller rather than modifying the imported engine. Running it changes the real timer and can acknowledge it in chat.

Existing timers and inactive timer globals survive imports and package removal. The five-second checker clears every completed ordinary timer, but when several expire on one tick the established behavior prepares only the last expiry message for chat.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally offers **Create or extend named timer** and **Named timer status**. Add the form/widget in its editor; no cards are created automatically. Enter a name and whole seconds from 1 to 604800.

Phone creation is quiet: it does not send a new acknowledgement in chat. Existing expiry notifications remain unchanged. Controls require the native engine's phoneDeckVersion 1 support; if unavailable after an old import, back up and import the current actions, then run Initialize. These guide changes alone do not require that import.

Persisted request intents/results prevent duplicate additions after lost responses or restart. An uncertain result is not retried automatically; inspect the owner state before another request. Status shows the published active count and remaining-time summary at its last update.

## Queued language timers

German, French and Dutch timing uses the separate managed language queue. Phone creation cannot bypass that queue. When [Redeem Checklist](../redeem-checklist/README.md) handles language rewards, keep it as the single redemption router; it delegates timing to Named Timers.

The supplied language trigger adapter has no attached reward or timed trigger. Configure it only for separate automation you intend to own, and do not add a second trigger for a redemption already routed by Redeem Checklist.

## Troubleshooting and backup

If the dock is disconnected or waiting for actions, check Streamer.bot's WebSocket server and required imports. If a saved timer is absent, Refresh state or Republish saved timers, then check its expiry and scene rule. Do not create a duplicate just to refresh the display.

Back up Streamer.bot before engine updates, including active/inactive timer globals and managed language queues. Package updates preserve these; removing the package does not delete them. First-party code and design: Sethani, MIT.
