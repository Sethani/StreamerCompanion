# Pokemon Encounters

Version 1.7.1. Shows genuine Pokemon Community Game encounters using the existing green-bordered card, artwork/type symbols, countdown and animated viewer ball throws. The service is independent of the personal monolith. First-party code is MIT, author Sethani.

Cosmetic forms such as Sawsbuck (Summer) resolve through PokeAPI's `pokemon-form` endpoint when the regular Pokemon endpoint returns 404. Artwork comes from the requested form, including shiny artwork; types come from its linked Pokemon. Existing successful lookups and caches remain unchanged. Native actions are unchanged, so this update requires no Streamer.bot reimport.

## Assets and notices

The 18 type symbols and 27 ball images are byte-identical to PokeAPI/sprites revision `1b3b7c0a538dd2226ae08d0d2f8955125075bbd4`. Exact paths, source URLs and SHA-256 hashes are recorded in `reviewed-assets.json` (packaged as `ASSET-PROVENANCE.json`). Type symbols are from `sprites/types/generation-viii/sword-shield/small`; balls are from `sprites/items`. The unchanged upstream notice is included at `third-party/pokeapi-sprites-licence.txt`: it identifies image copyright as The Pokemon Company and describes the repository as CC0 1.0 Universal. Our MIT licence applies to first-party code and does not relabel third-party image rights. This project is not affiliated with Pokemon or PokeAPI. Runtime Pokemon artwork is fetched from PokeAPI into private cache, never seeded from personal data or bundled.

## Installation and behavior

Requires Companion 1.2.2 or newer and the two Streamer.bot actions. Universal Dock is a package dependency. Universal Overlay and Source Modules are optional for scene routing; a direct OBS source can use `http://127.0.0.1:3128/pokemon/overlay`. This URL and every existing `/api/pokemon/*` route are preserved. Keep the service running. For shared rendering, enable Pokemon in Source Modules for the desired scenes. The package does not switch any OBS source.

Install the module package, import **Pokemon Encounters - Chat** and **Pokemon Encounters - Initialize**, then explicitly start the service. Importing replaces the same action IDs; do not run duplicate bridges. New installations are disabled. Enable and save in Settings, then use **Show test encounter**, **Throw ball** and **Clear** to test the actual overlay without sending chat or performing a catch in Pokemon Community Game. Initial named-Pokemon lookup needs internet; **Unidentified Ghost** works without network/artwork. The game remains authoritative for catch results.

Only the exact `pokemoncommunitygame` sender may create/resolve encounters. Viewer `!pokecatch` commands produce cosmetic throws. Ball aliases, gender/shiny/regional labels, one throw per viewer per encounter, queue limits, position, opacity, width and timer/throw preferences are preserved. The extracted bridge source and retained trigger/action IDs build reproducibly without reading or editing installed Streamer.bot files. Initialize preserves existing routing rules and adds a disabled Pokemon rule only if absent.

## Artwork and data

The package supplies immutable images in `service/type-icons` and `service/ball-icons`. The service also supports those directories in private `module-data/pokemon-encounters/assets` for code-only development. The tests use generated synthetic PNGs, not personal images or network requests.

Configuration and fetched artwork live under `module-data/pokemon-encounters`. Updates preserve them and service automatic-start preferences by module ID. Do not migrate live encounters, throw queues, viewer history, logs, tokens or the entire old profile. To migrate a built-in legacy installation later, stop only its Pokemon service to free port 3128; explicitly copy compatible `config.json` and optionally `cache` into the new module's private data directory before starting it. Set automatic-start in the new host explicitly. If an existing installed module already uses this ID/data directory, retain those files rather than overwriting them. Keep the old service available until controlled cutover passes; never run both owners of port 3128.

## Verification limits

Synthetic service/package/browser checks cover parsing, sender rejection, disabled state, cached metadata/artwork, settings, encounters, throws/clear, package updates and import metadata. They do not establish real Streamer.bot import/compiler acceptance, Twitch delivery, PCG behavior, OBS animation performance. Those remain explicit cutover checks.
