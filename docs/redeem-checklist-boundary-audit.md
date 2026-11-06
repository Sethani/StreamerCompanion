# Redeem Checklist boundary audit

Audited 2026-11-06 against the installed Streamer.bot configuration, the personal legacy source and the already imported Named Timers 1.0.0 package. No action was invoked, no redemption was fulfilled/refunded, no saved global was changed and no viewer or reward value was printed.

## Outcome

Redeem Checklist is independently extractable as a private Universal Dock module. The coordinated language handoff is implemented in the package: the established wildcard router classifies the private installed reward map, delegates language items to Named Timers and sends checklist items to the portable checklist. The established five-second action delegates language completion to Named Timers and migrates any old Node backlog locally instead of calling port 3124.

Version 1.0.0 is now published, imported and Ready. Read-only post-import checks found exactly one copy of every core action, stable wildcard/startup/timed triggers, the expected Named Timers calls and no port-3124 callback. The new router/checker is authoritative.

## Installed component inventory

| Component | Installed identity / source | Current responsibility | Package disposition |
| --- | --- | --- | --- |
| Managed reward router | `Redeems - Route Managed Redemption`, action `d994ff16-ecf4-48db-a6e5-8779be0d3ed4`, wildcard reward trigger | Reads `managedRedeemRewardsJson`; currently contains language scheduling, portable checklist routing and an old Node fallback | Replace in place; preserve action/trigger IDs; delegate language to Named Timers; remove Node path |
| Shared checker | `Redeems - Check Timers and Retry`, action `c4f6a8f4-ccb0-4839-bf48-ade7555aa0e7`, shared `timer_check` trigger | Currently fulfils language items and retries `managedRedeemDockBacklogJson` against port 3124 | Replace in place; preserve action/trigger/timer IDs; migrate backlog locally; delegate language check |
| Portable initializer | `Redeems - Initialize`, action `0d2e4fe8-5aa1-492a-8a8f-d0babac60f3a`, startup trigger | Creates/publishes `portable.redeems.state` without overwriting an existing payload | Retain publicly with stable action/trigger IDs |
| Portable add | `Redeems - Add`, action `d2d86b99-b667-4d9c-8264-2340ec410241` | Deduplicates pending/history by redemption ID and stores checklist metadata | Retain publicly with stable ID |
| Portable resolve | `Redeems - Resolve`, action `e001a1a2-a82c-4ab2-ba89-7fbd7e6d062f` | Explicitly fulfils or refunds through Twitch, then moves the item into history; failures remain pending | Retain publicly with stable ID |
| Legacy resolution callback | `Redeems - Resolve Requested`, action `783c74cc-d913-4803-bc43-02ff67f79450` | Resolves Twitch then reports the result to the Node dock | Retain stable compatibility action as an alias to portable Resolve; remove callback |
| Private reward setup | `Redeems - Create Managed Rewards` and `Redeems - Finalize Managed Rewards` | Contains the operator's original/replacement reward definitions and manages Twitch reward creation/enabling | Retain privately; do not package reward IDs, titles, costs or prompts |
| Private reward map | `managedRedeemRewardsJson` | Installed classification map used by the wildcard router | Preserve in place; read at runtime; never seed packages or diagnostics |
| Checklist state | `portable.redeems.state` | Schema-1 `redeems` state containing pending and recent history | Preserve in place; private dock consumption only; never bundle records |
| Legacy backlog | `managedRedeemDockBacklogJson` | Items that could not reach the old Node dock | Migrate idempotently into portable state, then clear only after the state write |
| Language state | `managedLanguageRedemptionsJson`, `managedLanguageActive`, `timer_end_*` | Serial queue and current display state | Named Timers remains owner; preserve values in place |
| Operator UI | `public/redeems` | Do on stream, Writing backlog, recent resolutions and confirmation-gated Complete/Refund | Copy into package as a dock only; no OBS overlay |

## Sanitized live-state snapshot

The read-only local WebSocket snapshot found ten managed reward mappings: three language and seven checklist entries. Checklist categories comprise three live and four writing mappings. The language queue and old Node backlog were empty. `portable.redeems.state` was valid schema 1 with zero pending items and 14 completed history items. The selected backend was `streamerbot`.

No reward ID/title/prompt, viewer identity/input, redemption ID, history record or authentication value was printed or copied. The 14 existing history records remain only in Streamer.bot.

## Public-distribution and cutover requirements

- Preserve the six installed core action IDs, wildcard trigger, startup trigger, shared timed trigger and blocking `Redeem Manager` queue.
- Require Named Timers and call its public queue/check actions by stable action ID. Do not copy its fulfilment implementation into Redeem Checklist.
- Include no managed reward definitions. Existing setup actions and map remain private; a triggerless generic adapter supports new native channel-point triggers.
- Remove every port-3124 request and Node result callback.
- Keep the dock private and unregistered from Universal Overlay/OBS.
- Opening, refreshing and cancelling the dock must execute nothing. Complete/Refund require explicit confirmation.
- Preserve unknown payload fields, cap history at 50, deduplicate across pending/history and retain failed Twitch updates for retry.

## Verification status and remaining gates

Confirmed in source/package tests: stable identities and trigger ownership, Named Timers delegation, local backlog migration, no private seeds/port/service/overlay, deterministic package construction and dependency/import states. Actual C# passes in-place history preservation, deduplication, category routing, managed-map routing, language arguments and success/failure resolution against synthetic Twitch sinks. Hidden packaged-host acceptance passes private rendering and confirmation gating without live actions. The real GitHub release also passes catalogue/hash/dependency installation in the packaged Companion host without executing an action.

Controlled operator acceptance is complete: the private dock/history was confirmed; one live and one writing item routed exactly once; one was completed and one refunded; and a German redemption delegated to Named Timers, displayed, fulfilled and cleared. Operation during the eventual whole-system port-3124-off rehearsal remains unchecked because other vital features still depend on the monolith.

Publication, released-package verification, local rollback backup, import, restart, structural/state verification and controlled Twitch acceptance are complete. The module reports Ready. After acceptance the checklist returned to zero pending, history contained 16 records (15 completed and one refunded), and both the legacy backlog and language queue were empty.
