# Phone Deck contribution contract v1

Optional module metadata, consumed by Phone Deck 2.0.0. Companion 1.3.1 already passes `ui.phoneDeck` through its read-only `/api/public/modules` response; no host rebuild, installation token or dependency on Phone Deck is required for a contributing module. Unsupported declaration versions disable only that contribution. Installing/discovering a contribution never adds a card, imports actions, starts a service or invokes an owner action.

## Declaration

```json
{
  "schemaVersion": 1,
  "owner": { "transport": "streamerbot" },
  "actions": {
    "send": {
      "id": "dcac5dec-c796-4b8b-9cb6-4271ef4c2f53",
      "args": {
        "chatMessage": { "field": "message" },
        "chatTargets": "twitch",
        "chatIsReply": false,
        "chatReplyId": ""
      }
    }
  },
  "controls": [{
    "id": "bot-message",
    "name": "Send bot message",
    "kind": "form",
    "action": "send",
    "fields": [{
      "id": "message", "label": "Bot message", "type": "text",
      "input": true, "required": true, "maxLength": 500
    }]
  }]
}
```

This is Chat Routing's contribution. Its four existing native actions, bot/reply behavior and required imports stay unchanged. No direct Twitch chat connection or duplicate account selector is added to Phone Deck. The new package changes metadata/documentation only; no Streamer.bot restart/import is needed for an existing Chat Routing installation.

Control IDs are stable within a package ID. `kind` is `button`, `form` or `widget`. Buttons/forms reference an action declared by that package. Widgets declare `display`, an array of projected state field names. Fields support `text`, `number`, `boolean` and `resource`, with `required`, text `maxLength`, numeric `min`/`max`, and a resource key. Fields without `input: true` are configured in the editor; form input fields are entered on the card. Only explicitly declared fields may be submitted. Action arguments are scalar constants or `{ "field": "fieldId" }` references; no expressions, JavaScript, arbitrary request bodies or templates are evaluated. Phone Deck supplies `requestId` itself.

`confirm: true` on a control requires explicit confirmation before dispatch, enforced server-side as well as in the UI. A saved card may additionally require a hold. `active` may name a projected boolean for button highlighting. `prerequisites` is an AND list of `{ "field": "ready", "equals": true }` or `{ "field": "status", "notEquals": "running" }`, checked against projected state before dispatch. Owner validation remains authoritative.

## Resources and state

Native declarations may specify:

```json
{
  "state": {
    "global": "portable.example.state",
    "fields": { "ready": "payload.ready", "status": "payload.status" },
    "ack": { "path": "payload.results", "requestId": "requestId", "status": "status" }
  },
  "resources": {
    "media": { "source": "state", "path": "payload.media", "id": "id", "label": "name" },
    "profiles": { "path": "payload.profiles", "id": "$key", "label": "$key" },
    "unfinished": { "path": "payload.entries", "id": "id", "label": "text", "filter": { "path": "completed", "equals": false } },
    "mode": { "source": "static", "items": [{ "id": "off", "label": "Off" }] }
  }
}
```

State uses a single declared persisted global via `GetGlobal`; never `GetGlobals`, viewer lists, histories or arbitrary globals. Only the named scalar projections reach the handset, capped at 500 characters per string. Resource projections expose only IDs and labels, not whole objects. Resources may be arrays or maps (`$key` selects a map key), with an optional equality filter. Invalid/missing lists remain unavailable; no first resource is substituted. Resource IDs are checked against the current owner's list again before dispatch.

Native `source: "actions"` is reserved for explicit action pickers. Its chosen field can be referenced by an action's `resourceField` instead of a fixed UUID. The built-in custom-action control uses this, verifies the chosen enabled action ID, and passes no arbitrary arguments. Other native controls use their declared fixed action IDs; they never join by display name or UI alias.

The native protocol/authentication and request shapes follow the official [Streamer.bot WebSocket client](https://github.com/Streamerbot/client/blob/main/packages/client/src/ws/StreamerbotClient.ts). Credentials are configured privately in local management. The optional connection is off by default and never opens Streamer.bot itself. Reconnect refreshes action/state reads without replaying mutations.

## Service transport

```json
{
  "owner": {
    "transport": "service", "apiPrefix": "/api/example/",
    "statePath": "/api/example/state",
    "csrf": { "path": "/api/example/state", "field": "csrf", "header": "X-Companion-CSRF" }
  },
  "actions": { "apply": { "path": "/api/example/apply", "method": "POST", "args": {} } },
  "state": { "fields": { "status": "status" } }
}
```

The service origin comes from that installed module's `nodeUrl`; only loopback HTTP is supported. It cannot be the Companion API port or Phone Deck management port. State, CSRF and write paths must remain under the declared `/api/<owner>/` prefix, excluding host management namespaces. Mutations support only POST/PUT. Redirects and embedded credentials are rejected. The owner receives exact-Origin requests and its own CSRF header where declared. CSRF data, full state responses and service addresses are not forwarded to phones. The installation bearer token is neither requested nor used. Responses are bounded to 2 MB and reads time out independently; stopped/unconfigured owners report unavailable and never start or fall back to legacy code.

## Completion, revisions and isolation

Native `DoAction` acceptance and service HTTP acceptance report **Requested** unless the declaration supplies an acknowledgement contract. Acknowledgements must retain matching terminal results: an array or map of records, or a single current record. For maps keyed by request ID, use `requestId: "$key"`. A record must match the exact request ID and have status `ok`, `success` or `completed`; `error`, `failed` or `rejected` is a terminal failure. Wrong IDs/running records never count as completion. A single current record can be overwritten before it is read, producing Unknown; durable result histories are preferred. Response loss may still be resolved from a matching persisted result. No mutation is automatically retried.

Phone Deck privately persists the latest 256 request intents/results, keeping terminal results independent of later owner state. Unknown provider outcomes block only that package's commands until explicit **Refresh status** succeeds; old request IDs remain non-replayable. These requests have independent queues from OBS, so provider latency/disconnection does not block basic OBS dispatch. Discovery uses four concurrent owner readers and batches notifications for large libraries. It does not share navigation/search state across clients.

Saved cards include the deck revision and a per-control definition hash. Submitted inputs cannot replace configured actions/resources. Changed dispatch/field/prerequisite contracts require editing/reviewing the card; unrelated new controls/projections/static choices do not invalidate existing cards. Missing providers/resources and unknown legacy cards remain saved and unavailable. Existing layouts receive no automatic cards. No new public legacy Import settings operation exists.

## Optional helper imports

`streamerbot.optionalActions` is an additive array of names; it never contributes to required import/readiness checks. The existing four Phone Deck helper UUIDs are preserved in its optional export, including both legacy chat labels. The historical broadcaster-labelled helper retains its existing bot-account behavior and stays hidden from new-card discovery. New chat cards use Chat Routing. Phone Deck's `requiredActions` and feature-module dependencies remain empty. The standard import file is available when desired; no import/restart is performed during early implementation sessions.

The compiler validates declaration v1 and optional metadata before building. Packages preserve the metadata on Companion 1.3.1; other consumers may ignore it. Later provider sessions should change only their own verified packages and leave this framework untouched unless a defect requires correction.
