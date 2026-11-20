# pokemon-encounters developer notes

## Implementation and migration reference

These phone endpoints use exact loopback Host/Origin checks, scoped CSRF tokens and durable request intents with no automatic replay after unknown outcomes. They provide no cross-origin access and return no viewer throws/history, private configuration, media paths or installation token. Existing legacy endpoints/Streamer.bot bridge are preserved. No new native import or Companion/Phone Deck rebuild is needed. Update through Catalogue when no encounter needs preserving: restarting the service retains saved settings/cache but its transient active encounter is not persisted. No cards are added automatically.

The package supplies immutable images in `service/type-icons` and `service/ball-icons`. The service also supports those directories in private `module-data/pokemon-encounters/assets` for code-only development. The tests use generated synthetic PNGs, not personal images or network requests.

Configuration and fetched artwork live under `module-data/pokemon-encounters`. Updates preserve them and service automatic-start preferences by module ID. Do not migrate live encounters, throw queues, viewer history, logs, tokens or the entire old profile. To migrate a built-in legacy installation later, stop only its Pokemon service to free port 3128; explicitly copy compatible `config.json` and optionally `cache` into the new module's private data directory before starting it. Set automatic-start in the new host explicitly. If an existing installed module already uses this ID/data directory, retain those files rather than overwriting them. Keep the old service available until controlled cutover passes; never run both owners of port 3128.

Synthetic service/package/browser checks cover parsing, sender rejection, disabled state, cached metadata/artwork, settings, encounters, throws/clear, package updates and import metadata. They do not establish real Streamer.bot import/compiler acceptance, Twitch delivery, PCG behavior, OBS animation performance. Those remain explicit cutover checks.

Version 1.7.2. Shows genuine Pokemon Community Game encounters using the existing green-bordered card, artwork/type symbols, countdown and animated viewer ball throws. The service is independent of the personal monolith. First-party code is MIT, author Sethani.
