# Wheel

Create saved wheels with weighted entries, then spin one on your stream. Configure its timing, position, appearance and result sound from the dock. The same profiles can be used by commands, rewards, subscriptions and Phone Deck.

## Set up a profile

1. Connect Companion to Streamer.bot's local WebSocket server. Install Wheel from **Catalogue**, expand its **Installed** row and choose **Import into Streamer.bot…** to import the six core actions and triggerless adapter. Back up Streamer.bot and the saved `portable.wheel.profiles` / `portable.wheel.state` globals first.
2. On a fresh or required engine import, run **Wheel - Initialize** once to load saved profiles; it also runs at Streamer.bot startup. Existing current imports need no reimport/restart for this guide-only patch. Requires Companion 1.3.0 or newer and [Universal Dock](../universal-dock/README.md); no module service is needed.
3. Choose **Open controls**, or select Wheel in Universal Dock. Pick a Profile or use **New**; Duplicate copies the selected profile. Set Profile name and use **Add entry** for each result label/weight.
4. Positive weights determine relative chance: weight 2 is twice as likely as weight 1. Zero-weight entries are not selected, and a wheel needs at least one positive entry. Review Minimum spin, Maximum spin and Result display durations.
5. Adjust Position and size and Appearance, then **Save settings**. Reset buttons change the draft and still need Save. **Import** loads a settings export into a draft for review; **Export** creates a JSON copy of your settings. Keep private profile data out of public exports.
6. Use your existing [Universal Overlay](../universal-overlay/README.md) OBS source and allow Wheel in [Overlay Visibility](../source-modules/README.md). Refresh the shared source if needed after first installation; do not add a duplicate Wheel source.

## Preview deliberately

**Preview spin** displays the chosen profile on the actual overlay, including OBS wherever visible, and can play its result sound. It saves unsaved settings first. Optional test user supplies a display label; no real viewer/chat request is required. **Clear** removes the local display. Test at a time when the real visual/audio output is appropriate.

The Status and Last result fields show the current run and selected label. Profile settings, weights, original transparent animation and result sound are retained across package updates.

## Prepare your own trigger adapter

Select the saved profile and use **Copy profile slug** in the Trigger adapter panel. The slug is the internal profile key, which may differ from its display name.

In Streamer.bot, duplicate **Wheel - Trigger Adapter**, rename the copy for its intended purpose and replace its **profile** Set Argument value with that slug, without percent signs. Keep wheelActionMode set to trigger-spin and its immediate call to Wheel - Engine. Attach the trigger to your copy; leave the imported template untriggered so it remains reusable. It passes userName (or user) from the trigger, spins the selected profile and waits for its selection duration.

## Command, reward and subscription examples

Use separate adapter copies when different triggers need different profiles or rules:

- **Chat command:** create a command such as !wheel in Streamer.bot's Commands tab, choose its permissions/cooldown, then add **Core → Commands → Command Triggered** to the adapter copy and select that command. The fixed profile argument selects the saved wheel; the command sender supplies the user context. See the [Command Triggered reference](https://docs.streamer.bot/api/triggers/core/commands/command-triggered).
- **Channel points:** configure your intended channel-point reward, then add **Twitch → Channel Reward → Reward Redemption** to its adapter copy and select that exact reward. Do not select Any unless every reward should spin this wheel. Redemption Updated and Automatic Reward Redemption are different events; avoid a second handler for the same reward. See [Reward Redemption](https://docs.streamer.bot/api/triggers/twitch/channel-reward/reward-redemption).
- **New subscription:** add **Twitch → Subscriptions → Subscription** to its adapter copy and choose the intended tiers. Resubscription and Gift Subscription are separate triggers; add them only when deliberately wanted, avoiding overlap with gift-bomb handling. See [Subscription](https://docs.streamer.bot/api/triggers/twitch/subscriptions/subscription).

These recipes create real stream behavior when enabled. This package never creates/enables personal commands, rewards or subscription handlers. A spin does not itself refund/complete a reward, perform a result-specific task or announce a chat result; that automation belongs to your own caller.

## Use the selected result

The engine records the selected label in `portable.wheel.state` at `payload.currentSpin.result`, together with the spin ID, profile, user and start/end timestamps. It also sets an engine-local **result** argument before waiting for the spin duration. The dock displays the chosen label after selection completes.

Immediate visual Run Action argument propagation was verified in Streamer.bot 1.0.7 using a triggerless child that sets a synthetic argument and a parent that logs it. In your adapter copy, add Set Argument for **result** with an empty value before its Wheel - Engine call, keep **Run Action Immediately** enabled, then use **%result%** in optional downstream steps after that call. Check that result is nonempty before announcing or acting on it; an invalid profile or failed spin must not reuse an older inherited value.

Keep immediate execution enabled for this recipe. Queued calls need their own completion strategy. For advanced work reading persisted spin state, match its ID/profile/timestamps to the intended spin: another spin or Clear can replace the current state, so an uncorrelated latest result is not proof of your caller's outcome.

## Phone Deck and backup

[Phone Deck](../phone-deck/README.md) optionally offers spin for an existing profile, Clear and status. Add cards explicitly; missing profiles stay unavailable and no cards appear automatically. It uses the same weights, animation and sound. Commands report Requested because these native actions have no matching durable completion acknowledgement; inspect status before retrying an uncertain result.

If nothing appears, check required imports, saved positive-weight entries, profile slug and scene routing. Back up actions/profiles/state before engine changes. Updates preserve profiles, settings and presentation; removing the package does not delete saved globals. Restore Streamer.bot profile files only while it is closed.

First-party code/design: Sethani, MIT. No credentials, viewer history or OBS profile is bundled.
