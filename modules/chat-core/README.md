# Live Chatbox

Show incoming Twitch and YouTube chat in OBS, with moderation updates, optional pronouns and PluralMind member names/colours. Live Chatbox sends no outgoing chat; use [Bot Chat Routing](../chat-routing/README.md) for that.

## Connect live chat

1. Enable Streamer.bot's local unauthenticated WebSocket server, normally `ws://127.0.0.1:8080/`, and connect the Twitch/YouTube accounts you use in Streamer.bot. Companion's **Help → Getting Started** covers the shared setup.
2. Install Live Chatbox from **Catalogue**. Expand its **Installed** row, **Start** the service and open **Settings** or **Open controls**. You can also select it in [Universal Dock](../universal-dock/README.md). No Streamer.bot action import is required.
3. Under **Live connection**, check **Enable chatbox**, confirm the WebSocket URL and choose **Twitch messages and moderation**, **YouTube messages and moderation**, **Pronouns** and **PluralMind member names, colors and proxies** as needed.
4. Press **Save settings**. Check the connection status. A ready local feed confirms the Streamer.bot subscription; check actual incoming messages separately to confirm platform delivery.

The local service uses port **3136**. Keep it, Companion and Streamer.bot running while using the chatbox.

## Preserve or adjust appearance

Paste your existing chatbox URL or its appearance query into **Existing chatbox URL or appearance query**, then Save settings. Known appearance/filter options are retained; credentials, connection URLs and custom script/CDN options are discarded.

For a new display you can leave the field empty for defaults, or enter a query such as `bubbles=true&timestamp=true&fontsize=24px`. This field preserves the global defaults used by older URLs. **Use platform and enrichment switches from pasted URL** copies those switches into the checkboxes separately; Save settings applies them.

Select **Open preview** to inspect the saved appearance. **Show test message** and **Show enriched test** send synthetic messages to **every connected renderer, including OBS**. They never post to Twitch/YouTube or fetch a real viewer's profile. **Clear test messages** removes synthetic messages. Run these display tests when it is appropriate for them to appear on screen.

## Named normal and ticker chatboxes

Open **Chatboxes** and choose **New chatbox**, or expand **Load an existing URL** to import an old URL into a new draft. Choose vertical layout for ordinary chat or horizontal for a ticker. Expand the appearance groups to adjust text, colors, bubbles, badges, timestamps, highlights, announcements, message limits, hidden accounts and platform/enrichment display switches. Use the color pickers or hexadecimal fields. Enable **Override** beside an optional setting to include it; turning the override off restores the renderer default (transparent for the page background). Fonts accept suggestions or a custom installed font; sizes accept CSS units such as px and rem. Message limits, fading and enrichment delay use numeric controls with units and help. Global connection switches still control what the service supplies.

Name the draft and **Save chatbox**. **Copy OBS URL** copies a self-contained appearance snapshot. Each normal/ticker configuration is saved separately. Editing or deleting a saved configuration never changes a previously copied URL. The editor never rewrites OBS sources. **Reload saved chatboxes** reloads the saved list while preserving your current draft; conflicting saves from another window are rejected.

Opening **Chatboxes** starts a local sample preview that updates automatically as you edit. It includes normal, command, highlighted, announcement, YouTube and PluralMind messages. It opens no live feed and writes nothing to Chat Archive. Choose a light/dark checkerboard and preview dimensions to inspect transparency and layout; these controls never change OBS. **Pause preview** stops it; **Show / refresh preview** resumes it. The separate **Checks** panel retains the explicitly labelled tests for all connected renderers.

**Hide commands** applies only to that chatbox URL. It defaults off, with prefix `!`. It compares a literal prefix at the start of original message text after leading whitespace; a prefix later in a sentence does not match. Enrichment cannot change this classification. The legacy `cmdprefix` option keeps its older exact-start behavior and can be edited separately. Chat Archive's exclusion setting is independent.

## Use the OBS source

Use **Copy chatbox URL** to copy the normal renderer address, normally `http://127.0.0.1:3136/chat/chat.html`. After checking the preview, replace the URL of your existing Chatbox Browser source in OBS and keep its dimensions, placement and filters. If this is your first chatbox, add one Browser source using that URL and your intended dimensions.

This chat source stays separate from Universal Overlay; do not add it as another aggregate renderer. Saving settings never changes OBS source properties automatically. Refresh the OBS chat source after changing appearance. Explicit appearance query options in an OBS URL override the saved appearance, so remove an old override if a saved change does not show. Enable/disable and moderation updates apply live.

The Izzy stream-chat layout supports bubbles, fonts, timestamps, badges, emotes, announcements and filters. Open Sans uses Google Fonts when available with an offline system fallback. Badge and emote images remain remote resources. Reconnecting does not replay old messages; the default maximum is 200 messages when no older explicit limit was saved.

## Phone Deck and optional history

[Phone Deck](../phone-deck/README.md) optionally provides the **Live Chatbox connection** status widget. Add it in the deck editor; no card is created automatically. It reports the service's Streamer.bot socket/subscription and enabled platforms, not platform authentication or actual delivery. It exposes no viewer identities, messages, credentials or history and does not open an extra chat connection.

Known pronouns and PluralMind profiles are reused immediately from a bounded memory-only cache. Repeat messages with fresh cached profiles bypass the enrichment wait; cold or stale lookups can still use your configured short wait. Expired profiles refresh in the background, unchanged results do not replace messages, and temporary lookup failures retain the last known value. A successful empty/404 result clears removed profile data. Restarting the service or saving connection settings clears this cache. It does not persist viewer profiles or track a stream boundary.

PluralMind proxy cleanup preserves emote images and adjusts their positions in the cleaned text. Pronoun-only updates preserve existing message/emote elements.

Only configuration is saved by Live Chatbox. Incoming history, profile caches and synthetic tests are not written to its data or logs. Install [Chat Archive](../chat-archive/README.md) separately and enable its capture if you want retained history.

## Troubleshooting and updates

If nothing arrives, check Enable chatbox, the platform checkboxes, Streamer.bot's WebSocket server and its platform connections. The audience display stays transparent during an outage; Settings shows connection details. Pronoun/member lookups run after ordinary messages arrive; failed lookups leave ordinary chat usable. Moderation cancels pending updates so removed messages do not reappear.

Back up your OBS source settings and private module configuration before changes. Catalogue updates briefly restart this service and interrupt ingestion; update between streams, as missed messages cannot be backfilled. Saved configuration and existing source URLs are preserved. No native reimport, Companion rebuild or Phone Deck update is required. To undo an OBS URL change, restore the saved previous URL with its compatible module version.

First-party code: Sethani, MIT. Included third-party notices cover stream-chat (Izzy, MIT) and PluralMind 2.1.1 (leahinmoonlight, MIT) in `third-party/`.
