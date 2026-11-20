# local-ai developer notes

## Implementation and migration reference

Management uses **3145**. Origin-less loopback native JSON clients call `POST /api/warmgeneration/raid` or `/api/warmgeneration/shoutout` and receive plain text. Generation routes reject browser Origin/Fetch headers and provide no CORS. They accept structured legacy facts only, not arbitrary prompts, endpoint overrides or model overrides. Browser previews/settings/warm commands use separate same-origin CSRF-protected routes. Private settings require revisions, atomic saves and explicit conflict resolution; failed saves preserve the previous configuration. No installation bearer token is exposed.

Optional Phone Deck contribution: read-only status. No phone cards are added automatically. No overlay, Streamer.bot import or Companion rebuild is required for the package itself. The existing private raid/shoutout callers need a separate backed-up endpoint handoff; no public legacy Import settings control is added. Writing Challenge's parked classifier is excluded. Model weights/software are not bundled or licensed by this package.

