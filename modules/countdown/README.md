# Countdown

Show a countdown and multiline finished message in your shared stream overlay. Start, pause, resume and clear it from the dock or Phone Deck. Countdown controls only the timer; use [Stream Launch](../stream-launch/README.md) for guided stream startup.

## Set up

1. Connect Companion to Streamer.bot's local WebSocket server. **Help → Getting Started** covers the shared setup.
2. Install Countdown from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the supplied Countdown actions. Back up Streamer.bot before replacing imports. No separate module service is needed.
3. Choose **Open controls**, or select Countdown in [Universal Dock](../universal-dock/README.md). Press **Load saved state** once after import. The supplied Initialize action also runs at Streamer.bot startup and preserves saved timer settings/state.
4. Enter whole-number **Hours**, **Minutes** and **Seconds**, plus **Finished text**. Use actual line breaks for a multiline message. Press **Save preset** to keep these choices without restarting the current timer.
5. Use your existing [Universal Overlay](../universal-overlay/README.md) OBS source. In [Overlay Visibility](../source-modules/README.md), allow Countdown in the intended scenes. Refresh the shared source if needed after first installation; do not add a second countdown source.

The module requires Companion 1.2.2 or newer and Universal Dock. Shared rendering also uses Universal Overlay and Overlay Visibility.

## Run the timer

**Start countdown** saves the entered duration/message and starts a new timer, replacing an existing run. **Pause** freezes its remaining time; **Resume** continues a paused timer. **Clear** returns it to idle and removes its display.

**Save preset** updates settings for the next run without restarting or replacing the active timer. Empty finished text retains the previous saved message. An explicit zero-second duration finishes immediately. Use nonnegative whole seconds; the total cannot exceed 2,147,483,647 seconds.

These controls affect the actual overlay wherever visible. Nothing starts automatically when the control page opens. Starting a countdown does not start OBS streaming, play music or announce going live.

The overlay retains the centred yellow-to-green text, multiline completion message and Algerian/Georgia/serif font preference. Check its placement and font fallback in your own OBS canvas before using it on stream.

## Use your own Streamer.bot trigger

For a fixed-duration caller, create your own action and add **Core → Arguments → Set Argument** with `durationSeconds` set to the desired whole-second value, for example 300. Optionally set `finishedText`. Then add **Core → Actions → Run Action**, choose **Countdown - Start** and enable **Run Action Immediately**. Enter argument names without percent signs. Attach your chosen trigger to this caller rather than editing the imported engine.

To save a future preset instead, call **Countdown - Configure** with those arguments. To control an existing run, call **Countdown - Pause**, **Countdown - Resume** or **Countdown - Clear** without duration arguments. These actions affect the same timer as the dock and phone.

Streamer.bot's [Set Argument](https://docs.streamer.bot/api/sub-actions/core/arguments/set-argument) and [Run Action](https://docs.streamer.bot/api/sub-actions/core/actions/run-action) references describe the dialogs. Running Start is a real display action; perform intentional tests when it is appropriate to show them.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally offers Start saved countdown, 3/5-minute starts, custom duration/finished text, Save settings, Pause, Resume, Clear and Countdown status. Add controls in its editor; no cards are created automatically.

Starts and presets use the same native actions and update the saved duration. Save settings does not restart a running timer. Phone duration fields use whole seconds. The status widget follows the saved end timestamp, freezes when paused and shows Unknown when state is unavailable; display expiry sends no additional native action.

Commands report Requested rather than claiming confirmed native completion. Check timer status before retrying. These phone controls never launch a stream or play music.

## Troubleshooting and updates

If controls are unavailable, check Streamer.bot's WebSocket server and the required action import. If the overlay is absent, check its scene rule and shared source. During a lost connection the audience timer hides rather than keeping stale text; saved timer state is used when the connection returns.

Timer settings and state live in Streamer.bot's private globals and are retained by imports/updates. Include them in your private Streamer.bot backup. Guide-only package updates need no native reimport or Companion rebuild.

First-party code/design: Sethani, MIT. No font files or external assets are bundled.
