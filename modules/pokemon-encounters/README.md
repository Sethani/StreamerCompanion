# Pokemon Encounters

Show Pokemon Community Game encounters with artwork, type icons, a catch countdown and cosmetic viewer ball throws. Pokemon Community Game remains authoritative for catches; this module displays events and never catches on a viewer's behalf.

## Set up

1. Use Companion 1.3.1 or newer and connect Streamer.bot's local WebSocket server. Pokemon Community Game must be present in your chat for genuine encounter messages.
2. Install Pokemon Encounters from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** to import **Pokemon Encounters - Chat** and **Pokemon Encounters - Initialize**. Back up Streamer.bot first and keep only one copy of the chat bridge. Existing current imports need no reimport for this guide update.
3. **Start** the module service, then open **Settings** or **Open controls**. It is also under Games in [Universal Dock](../universal-dock/README.md).
4. Check **Enable encounters**. Set Default catch window, Corner, Width in pixels, Background opacity and Show catch countdown. Under **Catch throws**, choose animation, viewer names, duration and queue limit, then **Save**. Fresh installations start disabled.
5. For shared rendering, use the existing [Universal Overlay](../universal-overlay/README.md) source and allow Pokemon in the intended scenes using [Overlay Visibility](../source-modules/README.md). Do not add another renderer for the same feature. Initialize preserves existing scene rules and adds a disabled Pokemon rule only if one is absent.

The service uses port **3128**. For an advanced separate OBS source, use **Copy OBS URL** in Settings, normally `http://127.0.0.1:3128/pokemon/overlay`, with a 1920 × 1080 canvas. Direct use does not need the two optional routing modules. The package never changes OBS source properties automatically.

## Check the display

Settings' **Live overlay tests** affect the actual overlay, including OBS wherever visible. Enter a Pokemon name and use **Show test encounter**, then a Viewer name/Ball name and **Throw ball**. **Clear** removes the local encounter and throws. These tests send no chat and perform no game catch. **Unidentified Ghost** works without a network artwork lookup; a named Pokemon's initial lookup needs internet.

Only the exact pokemoncommunitygame sender can create or resolve genuine encounters. Viewer `!pokecatch` commands can produce cosmetic throws, with one throw per viewer per encounter and the saved queue limit. Ball aliases and gender/shiny/regional labels are supported. Cosmetic forms use PokeAPI form data when the ordinary Pokemon lookup is absent; cached successful lookups are retained.

## Phone Deck

[Phone Deck](../phone-deck/README.md) optionally provides **Clear encounter** and **Pokemon Encounters status**. Add them in its editor; no cards appear automatically. Clear removes only the local encounter/throw display, preserving settings, cached artwork and game outcomes. It sends no catch/chat command or test throw. It is unavailable without an active encounter, and an old encounter token cannot clear a newer arrival.

Status does not expose viewer throw history, private configuration or media paths. Unknown outcomes are not retried automatically. Check the owner state before retrying.

## Troubleshooting, updates and backup

If nothing appears, check the service, saved enabled setting, scene rule, Streamer.bot connection and the imported bridge. A local display test verifies appearance, not Twitch delivery or real catch results. Check the actual OBS layout before using it on stream.

Settings and downloaded artwork live in private `module-data/pokemon-encounters`. Updates preserve these files and service automatic-start preferences, but **an active encounter and its throw queue do not survive service restart**. Update when there is no encounter to preserve. Stop the service before backing up its data; do not run two services on port 3128.

## Assets and notices

The 18 type symbols and 27 ball images are byte-identical to PokeAPI/sprites revision `1b3b7c0a538dd2226ae08d0d2f8955125075bbd4`. Exact paths, source URLs and SHA-256 hashes are recorded in `reviewed-assets.json` (packaged as `ASSET-PROVENANCE.json`). Type symbols are from `sprites/types/generation-viii/sword-shield/small`; balls are from `sprites/items`. The unchanged upstream notice is included at `third-party/pokeapi-sprites-licence.txt`: it identifies image copyright as The Pokemon Company and describes the repository as CC0 1.0 Universal. Our MIT licence applies to first-party code and does not relabel third-party image rights. This project is not affiliated with Pokemon or PokeAPI. Runtime Pokemon artwork is fetched from PokeAPI into private cache, never seeded from personal data or bundled.


First-party code: Sethani, MIT.
