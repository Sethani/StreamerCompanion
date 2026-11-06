# Named and language timers boundary audit

Audited 2026-11-06 against the installed Streamer.bot configuration and the personal legacy source. This is a read-only extraction audit. No timer action was invoked, no global was changed, no redemption was fulfilled or refunded, and no OBS source was changed.

## Outcome

The generic named-timer core can be extracted as a standalone `named-timers` module. The language-timer lifecycle cannot be declared fully independent until the Redeem Checklist migration follows: the installed all-rewards router currently decides whether a redemption is a language timer or a checklist item, and its five-second checker combines language fulfillment with retrying the old checklist backlog.

The safe order is therefore:

1. Package the generic timer core, public state publisher and copied renderer while preserving all installed compatibility contracts.
2. Keep the installed redemption router/checker as the temporary language adapter.
3. Extract Redeem Checklist immediately afterward, making it delegate language redemptions to the timer module and removing the old Node retry responsibility.
4. Only then declare both language timers and Redeem Checklist independent of the personal monolith.

## Installed component inventory

| Component | Installed identity / source | Current behavior and dependencies | Intended destination | Disposition |
| --- | --- | --- | --- | --- |
| `Timer_Add` | Action `3b530a98-e76e-44dd-b00d-30dfa3ea4978`; installed inline C# | Accepts `timerSeconds` and `timerTitle`; normalizes the title; starts or extends `timer_end_<title>`; prepares one Chat Routing message; publishes overlay state | `named-timers` Streamer.bot export | Retain publicly, preserving ID and arguments |
| `Timer_Check` | Action `522e56d5-d0b8-495d-ac40-1993cc160734`; installed inline C# | Every five seconds, finds expired ordinary `timer_end_*` globals, prepares a completion message, sets each completed value to `0`, excludes Dutch/French/German, then publishes | `named-timers` Streamer.bot export | Retain publicly, preserving ID and exclusions |
| `Timer_Command` / `!timer` | Action `91c9981d-eb92-454f-9f08-742fb8fdc460`; installed command | Moderator-only `!timer <seconds> <title>` parser; calls `Timer_Add`; zero command cooldown | `named-timers` Streamer.bot export | Retain publicly, preserving ID, syntax and permission |
| Timer publisher | `Timers - Publish Overlay State`, action `9a509d5f-f78c-4ad2-a296-5d0fac075261`; `scripts/install-streamerbot-named-timers-overlay.js` | Scans persisted `timer_end_*` globals, publishes active items to `portable.timers.state`, broadcasts schema-1 state; runs in blocking `Named Timers State` queue | `named-timers` Streamer.bot export | Retain publicly, preserving ID, global and envelope |
| Five-second schedule | Streamer.bot timed action `timer_check` | Enabled, repeating, fixed five-second interval. Both `Timer_Check` and `Redeems - Check Timers and Retry` subscribe to it | Timer module owns the generic schedule; Redeem Checklist stops sharing implementation responsibility after its cutover | Preserve schedule compatibility; replace shared ownership |
| Chat output | Nested calls to `Chat - All Platforms` | Ordinary start/error/completion messages are prepared by timer actions and sent through the published Chat Routing action | `chat-routing` dependency | Retain publicly; never fall back to direct personal chat code |
| Language queue ingress | `Redeems - Route Managed Redemption`, action `d994ff16-ecf4-48db-a6e5-8779be0d3ed4`; installed patched C# | Reads the private managed-reward map. Language redemptions join one serial queue; non-language redemptions go to the portable checklist or old dock path | Redeem Checklist router delegating to a public timer queue action | Replace jointly with Redeem Checklist; temporary private adapter |
| Language queue checker | `Redeems - Check Timers and Retry`, action `c4f6a8f4-ccb0-4839-bf48-ade7555aa0e7`; installed patched C# | Fulfils due Twitch redemptions, advances the active language and messages transitions. It also retries an unrelated old checklist backlog against port 3124 | Split between `named-timers` language engine and Redeem Checklist retry/ownership | Replace; do not copy the monolithic checker |
| Legacy language wrappers | `Speak_Dutch`, `Speak_German`, `Speak_French` | Their reward triggers are disabled. They still set a five-minute title/duration and call `Timer_Add`; the French wrapper additionally opens a private local reference file | Personal compatibility only | Retain privately during acceptance, then remove or defer; do not publish private path or reward IDs |
| Startup registration | `Streaming - Initialize Modules` calls the publisher directly | Reconstructs `portable.timers.state` after Streamer.bot starts | New timer initialization wrapper plus retained publisher compatibility | Replace public startup ownership without deleting the existing call during first import |
| Public timer state | Persisted `portable.timers.state` | Schema 1 envelope: `feature: timers`, `type: state`, numeric revision, payload containing only `timers` and `serverTimeMs` | `named-timers` transport contract | Retain publicly |
| Generic timer storage | Persisted globals with prefix `timer_end_` | Unix end seconds as strings; expired values are reset to `0`; arbitrary normalized titles are supported | Streamer.bot private installed state | Preserve in place; never copy values into a package or diagnostic |
| Language private state | `managedLanguageRedemptionsJson`, `managedLanguageActive`, and managed reward mapping | Queue records contain Twitch/redemption and viewer fields; the active marker selects the currently displayed language | Installed private state with in-place migration | Retain privately; package contains schema support but no records or platform IDs |
| Overlay renderer | `public/obs/source.html`, `source.js`, `source.css` | Bottom-right transparent list; sorts active timers by end time then title; underscores become spaces; green cards count down locally | `modules/named-timers/web/overlay` and Universal Overlay | Retain publicly by copying the established markup, logic and CSS |
| Scene visibility | `portable.moduleRouting.state`, timer rule currently global | Existing Source Modules routing controls display visibility | Existing `source-modules` dependency | Retain contract and saved preference |
| Old Node countdown API | `server.js` `/api/timer` and Countdown state | Separate stream countdown/Spotify-clock feature; it does not own named timers | Existing Countdown/Stream Launch modules | Exclude from named timers |

## Confirmed runtime contracts

### Ordinary timers

- `timerSeconds` must be a positive integer. `timerTitle` defaults to `default`.
- Titles are trimmed and lower-cased; ASCII letters, digits, `_` and `-` survive, spaces become `_`, and other characters are removed.
- Adding an existing active title extends its current end time. Adding an inactive title starts from the current time.
- `!timer` accepts seconds, not minutes, and is currently limited to moderators.
- The installed test trigger on `Timer_Add` is manual/synthetic and does not run automatically.
- `Timer_Check` and the publisher run from the same five-second schedule. Completed ordinary timer globals remain installed with value `0` so names survive restarts.
- The current checker prepares only one final chat payload per action run. If several ordinary timers finish on the same tick, all are cleared but the last prepared completion message is the one routed to chat. This follows directly from the installed action graph; it was not triggered during the audit.

### Language timers

- The installed managed reward map classifies Dutch, French and German rewards as language timers without placing their reward IDs in the timer actions.
- Every redemption adds a five-minute item to one queue shared across all three languages. The queue is serial globally, not separately per language.
- An immediately active item sets only its language's `timer_end_*` value; the other managed-language display globals are reset to `0`.
- A queued item receives `startsAt` and `dueAt`. The five-second checker fulfils the Twitch redemption when due, advances the next item and announces start/done transitions through Chat Routing.
- A failed Twitch fulfilment remains queued for retry. Once its due time has passed it is no longer displayed as active while retrying.
- The three older per-language reward triggers are disabled; the generic all-rewards router is authoritative.

### State and renderer

```text
!timer / compatible action calls
        -> Timer_Command -> Timer_Add -----------+
                                                     -> Timers - Publish Overlay State
five-second timer_check -> Timer_Check ----------+             -> portable.timers.state
                         -> Redeem checker -------+             -> combined/Universal Overlay
                                  |
managed reward trigger -> Redeem router -> serial language queue -> Twitch fulfilment
```

The publisher does not sort. The renderer filters expired items and sorts by `endTimeSeconds`, then title. The page itself is transparent; each timer is a dark translucent card positioned 32 pixels from the bottom-right with a maximum width of 330 pixels. There is no legacy timer dock/editor: ordinary creation is through `!timer` or compatible action arguments, and language creation is through channel-point redemptions.

The live read-only check found 11 parseable persisted `timer_end_*` globals, zero active timers, an empty language queue, no active language, an empty old retry backlog and a valid empty schema-1 public timer state. Live timer names/end values, viewer fields, reward IDs and redemption IDs were not printed or copied.

## Public-distribution blockers

| Blocker | Affected boundary | Required remediation |
| --- | --- | --- |
| Redemption and timer ownership are interleaved | Installed `Redeems - Route Managed Redemption` and `Redeems - Check Timers and Retry` | Add explicit public timer queue/check actions; make the forthcoming Redeem Checklist router delegate language items; keep checklist retry code out of the timer module |
| Private Twitch and viewer records exist in saved globals | Managed reward map, language queue and checklist backlog | Migrate in place. Never seed exports, fixtures, diagnostics or releases with installed values |
| Legacy reward wrappers contain platform IDs | Disabled `Speak_*` triggers | Do not export those triggers. Use argument-based public adapters; retain the installed wrappers privately until acceptance |
| One wrapper opens a personal absolute path | `Speak_French` | Exclude the process-launch subaction. Keep it as an optional private follow-up or later add an explicitly configured local hook |
| Old checker still contacts the personal server | Checklist backlog retry to port 3124 | Redeem Checklist must own a portable backlog and remove the Node callback before legacy retirement |
| No standalone startup owner | Publisher is called by personal `Streaming - Initialize Modules` | Add a timer-owned initialization action/startup trigger while preserving the publisher action ID; remove the old call only after acceptance |
| Packaged overlay would duplicate the embedded legacy renderer | Personal combined source already renders timer cards | Add an explicit Companion handoff that suppresses the legacy timer layer when the packaged timer overlay is Ready; refresh the existing source rather than adding a browser source |
| No dedicated timer tests exist | Legacy scripts and current public repository | Add C#, package, hidden-browser, combined-overlay and released-package coverage before publication |
| Installer source is not the final authority | Base redeem installer is subsequently patched by `install-streamerbot-language-queue.js` | Build from the installed action implementations and record hashes/IDs; do not reconstruct from the older base installer alone |

There are no timer media assets or third-party libraries to redistribute. The established renderer is first-party HTML/CSS/JavaScript. The only external/private file relationship is the optional French reference file, which is excluded.

## Recommended smallest extraction slice

Create `modules/named-timers` with:

- a manifest registered as `Named Timers`, owned by Streamer.bot, with `chat-routing` as a required dependency and Universal Overlay/Source Modules as overlay dependencies;
- an editable Streamer.bot export preserving `Timer_Add`, `Timer_Check`, `Timer_Command`, `Timers - Publish Overlay State`, the `!timer` command and the existing five-second schedule identities;
- timer-owned Initialize and Health wrappers that perform no live timer mutation beyond republishing saved state;
- copied transparent overlay markup, renderer logic and styling from the existing combined source;
- no Node service, port, credential, reward ID, timer value, viewer record, personal path or scene seed;
- state compatibility for `timer_end_*` and `portable.timers.state`, including unknown timer titles;
- a public language queue action/adapter whose input is arguments rather than embedded reward IDs, but whose production routing remains disabled until the Redeem Checklist handoff is imported.

Do not add a new timer editor or change command syntax, duration semantics, appearance or queue order in the first release. A read-only dock status view is optional and must not become required for operation. Existing language records and automatic display visibility remain in Streamer.bot; package upgrades must not overwrite them.

## Ordered implementation backlog

1. **Freeze compatibility fixtures — blocks extraction.** Capture sanitized action/export structures and code hashes for the four timer actions, command, queue and timed schedule. Verification: generated export retains IDs, nested Chat Routing calls, permissions and timer references without private values.
2. **Implement generic timer engine — blocks extraction.** Preserve title normalization, start/extend, expiry/reset, five-second checks, global keys and state envelope. Verification: compile actual C# against a recording adapter and cover invalid input, new/extended timers, restart preservation, managed-language exclusions and no repeated completion.
3. **Package the established renderer — blocks extraction.** Copy its layout, sorting, title formatting, local countdown and transparent background. Verification: hidden browser covers zero/one/many timers, equal-end sorting, refresh reconstruction, expiry hiding and scene-routing disablement.
4. **Add combined-overlay ownership handoff — blocks extraction.** When the packaged module is Ready, hide the embedded legacy timer renderer and embed only the package renderer. Verification: exactly one visible timer list before, during and after host/module restarts.
5. **Isolate language queue actions — blocks language extraction.** Preserve the single global queue, five-minute installed behavior, `startsAt`/`dueAt`, transition messages, fulfilment retry and private saved records. Do not include checklist backlog retry. Verification: synthetic redemptions cover different-language ordering, restart, transitions and failed/successful fulfilment without Twitch calls.
6. **Migrate Redeem Checklist routing — blocks legacy retirement, not generic timer publication.** Replace the mixed router/checker with a checklist-owned router that delegates language items to Named Timers. Verification: language items never enter the checklist, checklist items never enter the language queue, and neither path calls port 3124.
7. **Import/upgrade safety — blocks publication.** Install into isolated data with existing globals, old wrappers and the shared schedule. Verification: no duplicate command/timer/queue, no erased custom titles or queued records, rollback retains globals, and import alone starts/clears nothing.
8. **Publish and controlled acceptance — blocks cutover.** Test the actual GitHub package in the packaged Companion host, install it into Preview as import-required, then explicitly import. Operator acceptance covers moderator `!timer`, direct action compatibility, one controlled language redemption, exact overlay appearance and old-server-off behavior.
9. **Private cleanup — after acceptance.** Disable/remove the old startup publisher call, disabled `Speak_*` reward triggers and personal helper path only after their replacements are confirmed. Preserve backups; cleanup does not block public source extraction.

## Findings versus decisions

Confirmed findings are the installed IDs/call graph, five-second schedule, command permission, global/envelope schemas, serial language queue, renderer behavior, routing mode, private-path/reward boundaries and current empty/inactive live-state counts.

Unchecked behavior includes a real language redemption/fulfilment, simultaneous ordinary timer completions in production, import replacement of the shared timed schedule, the packaged renderer inside the live combined source and operation with the old server stopped. Those are controlled acceptance checks, not audit claims.

Decisions before implementation:

- Whether to preserve the current last-message-only behavior when several ordinary timers finish together or deliberately send every completion. Fidelity default: preserve it for 1.0.0.
- Whether the private French reference-file launch stays as a private wrapper or becomes a configurable local follow-up. Recommendation: keep it private and outside the public module.
- Whether Named Timers and Redeem Checklist publish separately but cut over together, or publish in one coordinated batch. Recommendation: separate packages with a coordinated language/redeem cutover.

