# Embedded Widgets

Put external browser widgets, including Tangia, inside your existing shared OBS overlay. Widget URLs and layout are private; fresh installations are empty and disabled. Remotely hosted widget apps and assets are not bundled.

## Set up a widget

1. Install Embedded Widgets from **Catalogue**. It requires Companion 1.3.1 or newer, Universal Overlay 1.0.2 or newer and Overlay Visibility (package source-modules) 1.0.2 or newer. Follow [Overlay Visibility](../source-modules/README.md) for its own Streamer.bot import; Widgets needs no widget-specific import.
2. Expand Embedded Widgets in **Installed**, **Start** its service and open **Settings** or **Open controls**. It is also available in [Universal Dock](../universal-dock/README.md).
3. Set the **Canvas** Width/Height to match your overlay. Press **Add widget** and expand its row. Enter a **Label** and choose **Tangia routing** or **Generic widget routing** under Routing group.
4. Enter the provider's HTTP/HTTPS embed address in **Private widget URL**, keeping its complete query and fragment. Use Show URL only when it is appropriate to reveal it on screen; the editor never loads a preview or validates it with a remote request.
5. Set X/Y, Width/Height and Horizontal/Vertical scale. Check the row's **Enabled** switch and the master **Enable widgets** switch, then **Save**. Saving can change a live widget.
6. In Overlay Visibility, allow the corresponding **Tangia** or **Other widgets** group in your intended scenes. Keep the single [Universal Overlay](../universal-overlay/README.md) source. Do not open another renderer for the same widgets.

Before moving widgets from an older renderer, disable that owner and follow Renderer recovery below. A new window cannot take over an unconfirmed old session. The local management service uses port **3143**.

## Everyday use

Changes remain a draft until Save, including Remove widget. **Discard draft and reload** restores the saved configuration. Each group keeps its own scene list. Ordinary scene exclusion hides already loaded widgets while retaining their sessions; disabling a widget/group, clearing its URL, removing it or losing routing/service availability unloads it.

Changing position or scale does not reload the widget. Changing its URL while its group is hidden unloads the old frame and waits for the group to become eligible before loading the new URL. The private single-owner record prevents a second combined view from loading duplicate external embeds. Directly opening the renderer URL does not load widgets without the shared routing context.

If another editor saved first, the draft is retained and the conflict must be resolved explicitly: discard/reload, review the latest saved settings and make your edits again. Invalid or corrupt saved data fails closed and is not replaced with defaults.

## Phone Deck and private backups

[Phone Deck](../phone-deck/README.md) optionally offers **Embedded Widgets setup**, a read-only status widget with boolean/count information. Add it in the deck editor; no card appears automatically. It exposes no URLs, credentials or viewer history and does not verify delivery from a remote provider. Group visibility is managed separately through Overlay Visibility controls.

Keep private module data and backups out of shared repositories. Exact provider URLs can contain access tokens. Management uses loopback/same-origin checks and scoped write tokens; renderer credentials cannot edit configuration or recover ownership. First-party code: Sethani, MIT.

## Renderer recovery

Open the folded Renderer status and recovery panel. Disable widgets and Save first. Confirm streaming is stopped, then request release. A responding renderer clears its embeds before acknowledging; no new owner is granted until release is confirmed.

If the old view cannot respond, close every old OBS browser source and other overlay view, confirm that they are closed, and type CLOSED. Manual recovery is rejected while the old renderer is still responding or the saved configuration is enabled. The app cannot verify a disconnected browser: these confirmations are operator assertions, not a substitute for actually closing its views. Recovery never enables widgets or changes URLs/layout/routing. Re-enable explicitly only when ready.

Damaged ownership is privately backed up before recovery. Atomic recovery results retain the last 64 request IDs, surviving restart and later operations. Lost responses are resolved with read-only status lookups; no recovery request is automatically retried. Old request IDs cannot clear a newer owner. There is no timer-based ownership stealing or automatic crash reset.

Management defaults to loopback 3143. Exact Host/Origin checks, scoped CSRF, no CORS and restricted local framing protect private settings. Renderer-only credentials cannot recover ownership or save settings. Health and the optional Phone Deck setup widget expose boolean/count information only, never URLs, credentials or viewer history, and do not claim remote delivery. Phone Deck adds no cards automatically. Keep private data and backups out of shared repositories.
