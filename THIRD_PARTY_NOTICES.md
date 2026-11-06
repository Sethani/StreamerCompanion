# Third-party notices

The MIT licence at this repository root applies to first-party source by Sethani. It does not replace the licences of dependencies or grant rights to Streamer.bot itself or third-party artwork.

The runtime includes these npm packages and preserves their distributed licence files:

| Package | Licence |
| --- | --- |
| adm-zip | MIT |
| ws | MIT |
| semver | ISC |
| electron-squirrel-startup | Apache-2.0 |
| debug | MIT |
| ms | MIT |

The Windows app is packaged with Electron, distributed under MIT with additional Chromium/third-party notices. Keep Electron's `LICENSE` and `LICENSES.chromium.html` files with the complete application folder. Development tooling is recorded in `companion/package-lock.json` and is not part of the minimal application payload.

Streamer.bot is a separately installed dependency. This project uses its documented APIs and distributes its own action definitions; no Streamer.bot executable, DLL or proprietary integration source is bundled. Assembly references in the action source refer to the user's installed environment and do not include those assemblies.

Pokemon Encounters contains 45 PokeAPI/sprites images verified against a pinned source revision. Their exact source URLs/hashes and unchanged upstream notice are packaged with that module; see [its asset provenance](modules/pokemon-encounters/reviewed-assets.json) and [upstream copyright/CC0 notice](modules/pokemon-encounters/third-party/pokeapi-sprites-licence.txt). First-party MIT does not relabel those image rights. No personal media, chat archive data or user credentials are bundled.

Live Chatbox retains the MIT-licensed Izzy stream-chat presentation (Copyright 2022 Izzy), with first-party service integration changes. It includes the verified PluralMind 2.1.1 helper (Copyright 2026 leahinmoonlight, MIT). Both complete upstream notices and provenance are included in the module; see [stream-chat notice](modules/chat-core/third-party/stream-chat.txt), [PluralMind notice](modules/chat-core/third-party/pluralmind.txt) and [pinned provenance](modules/chat-core/service/provenance.json). Google Fonts and platform badge/emote images remain external resources; no font/image binaries are redistributed by this module.

Wheel retains its established result sound unchanged. The project owner confirms that it was downloaded as an open-source/free-use asset, but its original URL, author and specific licence identifier were not retained and could not be recovered. The exact bytes are hash-locked and the limitation is disclosed in the [packaged sound notice](modules/wheel/third-party/wheel-result-sound.txt) and [asset provenance](modules/wheel/reviewed-assets.json). The repository MIT licence does not relabel the sound.
