# Walk Ons

Walk Ons maps selected Twitch logins to one sound, a weighted sound pool, or an optional Video module item. The first ordinary chat message from that person starts the entrance once per stream. Commands are ignored, and an entrance skipped because media is busy remains eligible.

## Setup

1. Install Walk Ons and import `streamerbot/walk-ons.sb` through Source Modules.
2. Open its controls in Universal Dock.
3. Use **Import audio** in Streamer Companion, then **Refresh audio** in the dock.
4. Add or edit each viewer assignment.
5. Add the packaged Walk Ons overlay to Universal Overlay or OBS if it is not already part of the shared overlay.

Imported audio is copied to Companion's private module-data directory. Packages and upgrades never contain or replace those files. Existing `127.0.0.1:7474/streaming/sounds/...` assignments continue to work while they are relinked; new assignments use Companion on port 3135 and no longer depend on the personal server.

The roster and session ledger remain in the Streamer.bot persisted global `portable.walkOns.state`. Audio playback uses `portable.walkonSound.state`. Existing state and stable action and command IDs are preserved on import.

## Behavior

- `!walkonadd`, `!walkonremove`, `!walkonlist`, and `!walkonreset` remain moderator-only compatibility commands.
- A normal entrance does not overlap Video, Shoutout Clip, or another walk-on sound.
- **Test** plays an assignment without consuming its once-per-stream eligibility.
- **Reset** makes one person eligible again; **Reset all eligibility** clears the session ledger.
- Video assignments require the optional Video module. Sound-only installations do not.

Walk Ons never ships a viewer roster or personal media. Removing the module does not delete Streamer.bot globals or Companion's private media directory.
