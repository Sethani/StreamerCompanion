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

No Pokemon images, personal media, copied client library, chat archive data or user credentials are included in this initial public batch.
