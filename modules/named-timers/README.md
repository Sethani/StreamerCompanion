# Named Timers

Named Timers is the faithful extraction of the installed named/language timer core. It preserves `Timer_Add`, `Timer_Check`, `Timer_Command`, `Timers - Publish Overlay State`, the moderator-only `!timer <seconds> <title>` command, the five-second `timer_check` schedule, `timer_end_*` globals and `portable.timers.state`. First-party code and design: Sethani, MIT.

## Install

Requires Companion 1.3.0+, Chat Routing, Universal Dock and Streamer.bot's local WebSocket server. Install through the catalogue, back up the timer actions and relevant globals, then import the Named Timers action group. Existing action, command, timer and publisher queue IDs are preserved so the import replaces the generic implementation in place. Restart Streamer.bot once so `Named Timers - Initialize` republishes saved timers. Refresh the existing combined OBS source; do not add another browser source.

The dock is deliberately read-only. It shows the active public timer state and can republish saved globals, but it does not add a new timer editor. Continue using `!timer <seconds> <title>` or compatible actions. Source Modules controls visibility. The transparent packaged renderer copies the established bottom-right green timer cards and sorting behavior.

## Language handoff

The export includes inert `Named Timers - Queue Language`, `Named Timers - Check Languages` and `Named Timers - Language Trigger Adapter` actions. They preserve the installed serial queue schema and five-minute adapter default, but have no reward or timed trigger. Do not attach or invoke them while `Redeems - Route Managed Redemption` remains authoritative or a redemption could be queued twice.

The forthcoming Redeem Checklist migration will delegate language redemptions to these actions and remove language/checklist coupling from the old checker. Until that coordinated handoff, the installed redemption router/checker continues to own live language rewards. The public export contains no reward ID, redemption record, viewer name, checklist backlog or old port-3124 callback.

## Compatibility and privacy

Imports preserve unknown `timer_end_*` titles, inactive values, `managedLanguageRedemptionsJson`, `managedLanguageActive` and the schema-1 public envelope. No installed global values are bundled. The old disabled `Speak_Dutch`, `Speak_German` and `Speak_French` wrappers remain private; their reward IDs and the French local reference-file launch are not exported. The old Node countdown/Spotify clock is a separate feature and is not included.

The installed checker prepares one final chat payload when several ordinary timers expire on the same five-second tick. Version 1.0.0 preserves that last-message-only behavior for fidelity while clearing every completed timer.

## Testing

Synthetic C# tests cover title normalization, start/extend, invalid input, expiry/reset, language exclusions, state publishing, serial language ordering, restart preservation and fulfilment retry without Twitch or chat calls. Package and hidden-browser checks cover stable identities, private exclusions, command permissions, transparent rendering, sorting, expiry hiding, dock inactivity and combined-overlay ownership. Real command/redeem and OBS acceptance remain explicit operator actions.
