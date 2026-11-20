# Scene Links

Link an OBS program scene to a Twitch category and an existing Windows application window. Saving a link does not execute it; switching to its scene applies the saved behavior.

## Set up your links

1. Connect Streamer.bot to OBS using its default OBS connection and authenticate Twitch for category updates. Windows focus also requires Windows PowerShell. Use Companion 1.3.1 or newer and [Universal Dock](../universal-dock/README.md).
2. Back up Streamer.bot, then install Scene Links from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import the nine supplied actions. Existing current imports need no reimport for this guide/display-title patch.
3. Choose **Open controls**, or select Scene Links in Universal Dock. Press **Refresh scenes and windows** to read available OBS scenes and window targets.
4. On the desired scene row, enter its **Twitch category**, select a **Window target** and adjust **Title contains** as needed. Leave an empty category for no category change, or No window focus for no focus action.
5. Press **Save links**. Fresh installations start with empty bindings. Scene names match exactly, including case; unavailable scenes/window targets remain saved rather than being replaced.

No overlay, background service or extra port is installed. The old Monitor action/queue remain disabled/inert compatibility records; keep them that way. Initialize's startup/OBS registrations establish inventory/baselines without applying the current link.

## Apply and test deliberately

An actual OBS **program-scene** change applies its saved link after 350 ms debounce, independently attempting category and window focus. Save links persists the plan without applying it. Refresh and reconnect do not apply the current binding.

**Test focus** applies only that row's draft window target. **Test category** applies only its draft category. These tests have real effects even before saving, so choose an appropriate time. The dock has no general Apply button; the native **Scene Links - Apply** action and optional phone control explicitly execute a saved link.

Applying a link does not switch OBS scenes. Window focus restores an existing window and attempts foreground activation; it does not start an application or resize/reposition it. Windows may refuse foreground activation. Category status reports Twitch API acceptance, not independent visual confirmation.

If a saved scene is unavailable, its row remains visible with a Remove control. Removing it changes the draft; Save links applies the configuration change.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally offers **Apply saved scene link** and **Scene Link status**. Add them in the deck editor; no cards appear automatically. Select the exact saved binding and confirm before applying its saved category/focus behavior. Removed bindings stay unavailable.

Phone controls do not edit mappings, choose arbitrary category/window targets, run draft tests or change automatic scene handling. They use the native owner's durable request acknowledgement. Partial failures remain partial; unknown outcomes are not retried automatically.

## Troubleshooting and private backups

If no scenes appear, check OBS and Streamer.bot's default OBS connection, then Refresh scenes and windows. For unavailable windows, open the intended application yourself, refresh and review the saved process/title match. If category updates fail, check Twitch authentication/permissions and the reported result.

Inspect partial failures and real state before explicitly retrying; dispatch alone does not guarantee completion. The native helper is embedded and contains no personal filesystem path.

Saved version-1 `portable.sceneBindings.config` and state globals are retained. Removing the package does not delete mappings. Keep window titles, bindings and credentials private. Back up Streamer.bot before engine changes and restore profile files only while it is closed.

First-party code: Sethani, MIT.
