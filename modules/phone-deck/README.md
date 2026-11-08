# Phone Deck — Session 3 development checkpoint

Independent OBS foundation for Companion 1.3.1. This local 2.0.0 package is **not a production cutover or published release**. Keep the existing Phone Deck until Session 6.

Start the service and open its settings from Companion to configure OBS WebSocket v5. Settings are private to this installation; passwords stay server-side. Fresh installations have a neutral Live page. No Streamer.bot connection or feature modules are required.

The copied Phone Deck grid/editor supports pages, ordering, duplication, colours, icons, sizes and an explicit Save deck button. Edits use revisions; conflicting drafts are retained for review. Buttons provide scene switching, raw OBS streaming start/stop, recording start/stop/toggle and input mute toggle. The scene-picker form changes scenes only when submitted. Streaming controls require a 1.2-second hold or keyboard confirmation. Raw Start does not run Stream Launch, countdowns, music or other launch automation.

The OBS widget reads current scene, streaming and recording state. Missing targets or disconnected OBS disable controls. Mutations are serialized, never automatically retried, and read back from OBS. Request identities and terminal results survive restarts (most recent 256). A lost or unconfirmed result requires a successful explicit Refresh before further actions; Refresh only reads OBS. Durable IDs must never be reused for a different operation.

Session 2 adds these optional OBS controls to the editor; existing layouts receive no new cards:

| Control | Behavior |
| --- | --- |
| Volume | A fixed-percentage button or 0–100% slider with explicit Go submission. Dragging never sends a mutation. The actual OBS percentage is shown separately from the retained draft; mute is preserved. |
| Scene/group items | Show, hide or toggle an exact container/item ID/source-name combination. Missing targets stay unavailable; duplicate names in different scenes are independent. Group children and the group itself are separate targets. |
| Recording | Pause/resume requires active recording and the announced OBS requests. OBS can still reject pause for its current recording format; no fallback or retry occurs. |
| Studio Mode | Toggle Studio Mode; set a preview scene without changing program; choose an existing transition; explicitly transition preview to program. Existing transition duration/settings remain unchanged. |
| Replay buffer | Start, stop and save when supported/configured by OBS. Saving reports **Requested**, since command acceptance does not prove file completion. No replay filesystem path is exposed. |
| Virtual camera | Start, stop and toggle, with status readback. Unsupported or failed status disables the affected controls. |

Discovery follows the official [OBS WebSocket v5 protocol](https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md), including advertised request support. A missing optional capability, failed status or missing target disables only its controls. Basic OBS actions do not wait for a background optional-status scan. Preview and transition require Studio Mode; saving replay requires an active buffer. Reconnect only reads status/inventory. The widget also reports pause, Studio Mode, preview, replay and virtual-camera status. A transition whose preview already matches program reports Requested rather than claiming a newly observed scene change. Unconfirmed readback blocks subsequent dispatch until explicit Refresh; it never retries a transition or output mutation.

Management binds to loopback port 3142. HTTPS uses port 3125 only when private `tls/phone-deck-key.pem` and `tls/phone-deck-cert.pem` exist. This checkpoint does not generate, trust, migrate or provision certificates. An isolated test creates its own temporary identity. Numeric pairing, paired editing and revocation are implemented; LAN host provisioning, QR provisioning, service-worker upgrade coverage and existing-device handoff are subsequent-session acceptance work. Do not copy production pairing/TLS data for early-session tests.

Unknown legacy cards are preserved and unavailable. In particular, `stream.launch` is never converted to raw OBS Start. No cards are added to existing layouts automatically. Additional module contributions arrive in later sessions. There is no legacy Import settings button.

Session 3 adds optional module discovery and a searchable editor picker, with grouped controls, explicit resource selection and persistent unavailable targets. In local settings, optionally enable Companion's loopback discovery URL and Streamer.bot WebSocket/password. These are off by default; paired phones cannot read or change credentials. Discovery only reads installed declarations and owner status; it never installs/starts modules, runs native actions or changes existing layouts. Settings contain no installation bearer token.

Choose **Optional module control** for a button, input form or widget, search for its module/control and explicitly configure any resources before saving. New fields and resource lists preserve drafts and focus during polling. Optional helper imports expose stream-title/category forms and a custom-action picker. Missing/disabled helpers disable only their controls; the OBS base stays Ready. The four existing helper IDs and argument names are preserved in the optional export. Both historical chat helpers remain compatibility records; new bot-message cards come from Chat Routing 1.0.2 instead.

Providers use version-1 `ui.phoneDeck` declarations for fields, resources, projected state, prerequisites and native/service owner transport. Only declared actions/fields are dispatched. Definitions and deck revisions prevent stale cards from invoking changed actions. Missing resources are never substituted. Owner commands have separate queues from OBS, scoped uncertainty and durable Phone Deck request records; no mutation is automatically retried. Dispatch alone reports **Requested**. Only a matching owner terminal result reports Completed. Use each card's **Refresh status** to read/reconcile its provider after an unknown outcome.

The framework supports later contributions without a Phone Deck update: native action/state references; bounded, scoped loopback owner APIs with private CSRF; state/list/map/static resource projections; and explicit button/form/widget controls. No Launch, Countdown or other later-session contributions are added yet. See `docs/phone-deck-provider-contract.md` in the source repository for declaration examples and owner acknowledgement requirements.

Private files: `config.json`, `connection.json`, `providers.json`, `auth.json`, `operations.json`, `tls/`. Never distribute them. Stopping the service closes both listeners, its OBS connection and optional owner connections. The service exits if its Companion parent disappears.

Lucide icons retain their ISC notice in `third-party/lucide.txt`. First-party code: Sethani, MIT.
