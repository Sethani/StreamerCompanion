# Redeem Checklist

Manage pending channel-point requests in a private operator checklist. Separate **Do on stream**, **Writing backlog** and **Recent resolutions** views keep the work visible without an audience overlay.

## Set up

1. Connect Streamer.bot's local WebSocket server and Twitch account. Install [Named Timers](../named-timers/README.md) 1.0.1 or newer for managed language timing, plus [Universal Dock](../universal-dock/README.md). Use Companion 1.3.1 or newer.
2. Back up Streamer.bot's Redeems action group and persisted globals: `portable.redeems.state`, `managedRedeemRewardsJson`, `managedRedeemDockBacklogJson`, `managedLanguageRedemptionsJson` and `managedLanguageActive`.
3. Install Redeem Checklist from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the supplied actions. Stable router/checker/resolver/queue identities replace the established implementation in place.
4. On a fresh or required engine import, run **Redeems - Initialize** to publish/migrate saved state; it also runs at Streamer.bot startup. Existing current imports need no reimport or restart for this guide-only update.
5. Choose **Open controls**, or select Redeem Checklist in Universal Dock. **Refresh** only rereads the saved checklist. No service, extra port or OBS source is needed.

## Resolve a pending request

Review the reward, viewer and any input in Do on stream or Writing backlog. Choose **Complete** when fulfilled, or **Refund** to return its points. Review the confirmation dialog and select Complete or Refund points; Cancel leaves it unchanged.

These are real Twitch operations. Opening, refreshing or reading the checklist performs no resolution. After dispatch, check whether the entry moved into Recent resolutions or remains pending with an error; a request message alone does not prove Twitch accepted the change. Rejected updates remain pending. For a lost response or unknown result, inspect state before explicitly retrying.

Pending/resolved entries are deduplicated by redemption ID. History is capped at 50 items, with the dock showing its recent portion. Keep that private history out of shared exports.

## Reward routing and your own adapter

The imported **Redeems - Route Managed Redemption** is the single wildcard reward router. It uses the saved managed reward map; this dock is not a reward-mapping editor. Checklist rewards enter the private state. Language rewards delegate to **Named Timers - Queue Language**, while the five-second **Redeems - Check Timers and Retry** delegates language completion and migrates legacy backlog.

Keep one enabled router/checker. Do not add a second trigger for a reward already handled there.

For a separate channel-point integration you intend to own, duplicate the triggerless **Redeems - Trigger Adapter**, rename the copy, set its **rewardTitle** and **category** arguments (live or writing), and attach the intended redemption trigger that supplies the actual redemption/reward/viewer arguments. Keep its call to **Redeems - Add**. A generic trigger without those redemption identifiers cannot resolve a real Twitch redemption. Do not enable overlapping wildcard/custom routes for the same reward.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Complete pending redemption**, **Refund pending redemption** and **Redeem backlog status**. Add Input cards/widget in its editor; no cards appear automatically. Select the exact reward/viewer entry and confirm before dispatch. Only currently pending IDs are accepted.

The phone projection excludes reward IDs, viewer-entered text and history. Native Twitch ownership preserves history/language routing. Persisted request intents/results and serialized operations protect against competing resolutions and duplicate replay. Rejections report failure; thrown responses or failed persistence may remain unknown and are not automatically retried.

Old native engines lacking phoneDeckVersion 1 leave these controls unavailable. Back up/import the current actions and run Initialize only if that engine upgrade is actually needed. This guide patch alone requires no native reimport. No phone history deletion, reward creation or second language queue is offered.

## Troubleshooting and backup

If the dock is disconnected/waiting, check Streamer.bot's WebSocket server and required imports. For missing requests, check the saved reward map and enabled single router; avoid adding a duplicate trigger to diagnose it. For resolution failures, check Twitch account permissions and the entry's saved error/status before another operation.

Imports retain current pending/history/language state. Keep the private Streamer.bot backup made before an engine change; restore profile files only while Streamer.bot is closed. First-party code and design: Sethani, MIT.
