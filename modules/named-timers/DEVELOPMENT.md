# named-timers developer notes

## Testing

Synthetic C# tests cover title normalization, start/extend, invalid input, expiry/reset, language exclusions, state publishing, serial language ordering, restart preservation and fulfilment retry without Twitch or chat calls. Package and hidden-browser checks cover stable identities, private exclusions, command permissions, transparent rendering, sorting, expiry hiding, dock inactivity and combined-overlay ownership. Real command/redeem and OBS acceptance remain explicit operator actions.

## Implementation and migration reference

Named Timers is the faithful extraction of the installed named/language timer core. It preserves `Timer_Add`, `Timer_Check`, `Timer_Command`, `Timers - Publish Overlay State`, the moderator-only `!timer <seconds> <title>` command, the five-second `timer_check` schedule, `timer_end_*` globals and `portable.timers.state`. First-party code and design: Sethani, MIT.

The export includes inert `Named Timers - Queue Language`, `Named Timers - Check Languages` and `Named Timers - Language Trigger Adapter` actions. They preserve the installed serial queue schema and five-minute adapter default, but have no reward or timed trigger. Do not attach or invoke them while `Redeems - Route Managed Redemption` remains authoritative or a redemption could be queued twice.

The forthcoming Redeem Checklist migration will delegate language redemptions to these actions and remove language/checklist coupling from the old checker. Until that coordinated handoff, the installed redemption router/checker continues to own live language rewards. The public export contains no reward ID, redemption record, viewer name, checklist backlog or old port-3124 callback.

Imports preserve unknown `timer_end_*` titles, inactive values, `managedLanguageRedemptionsJson`, `managedLanguageActive` and the schema-1 public envelope. No installed global values are bundled. The old disabled `Speak_Dutch`, `Speak_German` and `Speak_French` wrappers remain private; their reward IDs and the French local reference-file launch are not exported. The old Node countdown/Spotify clock is a separate feature and is not included.
