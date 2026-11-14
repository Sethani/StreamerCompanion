# Grouped widget overlay contract v1

Companion 1.3.1 already passes optional `ui` metadata through the public module inventory. No host API/rebuild is introduced. Embedded Widgets 1.0.0, Universal Overlay 1.0.2 and Source Modules 1.0.2 implement this contract. Release evidence and private cutover status are recorded in embedded-widgets-extraction.md.

```json
"overlayRouting": {
  "version": 1,
  "retainOnSceneHide": true,
  "groups": ["tangia", "microlayer"],
  "labels": { "tangia": "Tangia", "microlayer": "Other widgets" }
}
```

Only valid opt-in declarations use this policy. Source Modules presents one row for each existing group ID, never an umbrella rule that replaces scene lists. Unrecognized versions/invalid groups fail closed. Ordinary modules retain their existing routing and iframe lifetime.

The combined parent creates a widget owner frame only after a group first becomes eligible. Scene exclusion hides the retained frame; explicitly disabled/missing groups, lost routing, unavailable/removed modules, changed owner URL and expired registry freshness unload it. Independent groups can remain visible or hidden in one owner. The parent removes stale registry responses and stops trusting a registry snapshot after five seconds without successful refresh. Existing scene-revision protection remains in effect.

The frame URL fragment carries a random `channel` and the loopback HTTP parent origin. Routing messages contain only type `companion-widget-routing`, version 1, that channel and group states (`visible`, `hidden`, `disabled`, `unavailable`). They go to the exact child origin. The renderer checks `event.source === parent`, the exact origin/channel/type/version, and a parent heartbeat. Directly opening the owner overlay does not load widgets. The channel identifies a frame; it grants no installation or settings permission. No widget URL, private identifier, scene name or token is sent in these messages.

The renderer privately reads its own same-origin bootstrap (configuration plus a renderer-only CSRF token). This token cannot save settings. Acquiring renderer ownership supplies its random UUID and the bootstrap's configuration revision; stale requests are rejected. A private atomic `render-owner.json` record permits one owner. The record is written before any external iframe may load. Other views remain transparent and never load a duplicate external widget. Release clears local embeds before asking the service to free ownership; it must match the owner UUID. Failed/uncertain release blocks takeover rather than assuming playback stopped. Corrupt ownership fails closed. There is no timer-based stealing after restart. A surviving document can confirm release/reacquire after a service restart; a new document cannot steal an unconfirmed old session.

Widget configuration changes remain revisioned settings saves. Frame visibility messages and ownership maintenance do not dispatch Streamer.bot/OBS/Twitch actions or change configuration/routing. They may repeat read/coordination requests; no viewer action is retried. Pending requests are fenced by the current parent-routing generation. The renderer serializes ownership work and keeps a pending-release state until confirmed; routing updates cannot redraw using a released/uncertain lease.

Master/widget disable, URL clear, removed widget or disabled/missing group unloads that embed. Ordinary scene exclusion retains it after first eligibility. URL edits while hidden unload the old frame and defer the new URL until eligibility returns. Geometry changes and polling preserve the frame. Routing/parent heartbeat loss, bootstrap failure and shutdown clear embeds without audience diagnostics.

Settings and renderer APIs enforce exact listening loopback Host/Origin, scoped CSRF writes and no CORS. Health/Phone Deck retain only boolean/count projections. URL-bearing state stays inside the intended local editor/renderer; it is never added to public inventory, diagnostics, parent messages or logs. Remotely loaded widget applications/assets are not bundled.

This protocol does not govern an unpatched legacy overlay. The private candidate must suppress its old Tangia/generic paths and skip the generic extension loader before migrated URLs are activated. Missing Companion must remain transparent, not fall back to Node rendering. The candidate is staged outside production. Cutover also has to account for old standalone sources, private ownership guards and all live callers.

Ownership recovery is settings-only and requires the saved master switch disabled. A renderer-only heartbeat reports activity and revocation; a responding owner clears embeds before acknowledging release. Recent activity prevents manual takeover. If it cannot acknowledge, an operator must confirm off-stream and closed views and type CLOSED. The app cannot mechanically verify a disconnected browser; that confirmation is an operator assertion. Status/recovery never infer closure from an expired heartbeat.

Recovery requests use settings CSRF, a config/ownership-generation scope and UUID. Old scopes cannot recover a newer owner. The atomic owner record contains up to 64 request outcomes, so duplicates/read-only lookups survive restart and newer state without repeating a reset. Corrupt records are privately archived before recovery. The earlier internal version-1 owner record is read without overwriting it and still blocks takeover until released/recovered. The Phone Deck projection remains read-only and gains no recovery mutation.

The private cutover must still verify live callers, guard old feeds/renderers, back up private state and explicitly adopt the new owner off-stream. Real Tangia delivery, OBS source adoption and final retirement remain separate acceptance steps.
