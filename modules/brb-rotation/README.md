# BRB Rotation

Play a promotional mix until you return. Find **BRB Rotation** under **Media**. This controls existing Video Player and Shoutout Clips renderers; it adds no source, service, chat message or Twitch advertising call.

## Setup

1. Install BRB Rotation and its required Universal Dock, Video Player 2.5.0, Self Clip Shoutouts and Shoutout Clips dependencies. Back up native actions and persisted globals before imports.
2. Import the updated **Video Player** actions and new **BRB Rotation** actions through Companion. Existing Self Clips and Shoutout Clips imports must also be current. Package installation alone cannot update native code.
3. Inspect existing commands before importing: BRB adds broadcaster/moderator `!brb` and `!back` commands. Resolve any existing command using those words rather than allowing two handlers. Imports may leave the timer disabled. In **Services → Timers**, enable **BRB rotation tick** with **Repeat** checked, **Interval 2 seconds** and **Lines 0**; it is inert while stopped. Initialize Video Player and BRB while playback is idle.
4. Register your local videos in Video Player. In BRB Rotation choose the videos to include and save whole-number source percentages totaling 100. Zero disables a source. The initial 34/33/33 mix is editable, with no videos selected.
5. Refresh your own clips in Self Clip Shoutouts. Use **Refresh followed clips** here for the other-channel pool. This reads Auto Shoutouts' `autoShoutoutFollowedLogins` and honors `autoShoutoutExcludedLogins`; manual additions and first-chat suppression are not used or changed. No second follow list or credentials are created. The current follow/exclusion lists are checked again before selecting a cached channel.
6. Followed refresh visits one channel per timer tick, caching up to 20 clips per channel. The limit is 2,000 followed channels. It does not claim a complete all-time clip catalogue. A failed/cancelled refresh retains the previous cache. Stop cancels refresh. Empty followed lists clear the cache on explicit refresh.
7. Keep your existing Universal Overlay available and allow both Video Player and Shoutout Clips in Overlay Visibility on any scene where you want to show media. BRB does not change those settings or switch scenes.

## Start and return

Use **Start BRB**, `!brb`, or Phone Deck's **Start BRB rotation**. Start arms a session; the timer performs selections. **Stop / Back**, `!back`, or **Stop BRB rotation** stops it. **Toggle BRB rotation** switches the same shared state. Repeated Start while running and Stop while stopped are harmless. Only the broadcaster or a moderator may use chat commands; authenticated controls use the same owner.

The session continues across scene changes, with no fixed end time. Leaving your BRB scene does not stop it. Restarting Streamer.bot or reinitializing BRB stops the rotation; it does not silently resume. After an interrupted session, use Stop to resolve and clear saved ownership before a fresh Start.

Percentages count selections, not seconds. Smooth weighted selection keeps proportions close over short runs; tie order is random. With all sources available, a 50/30/20 mix gives five video, three followed-channel and two self-clip selections per ten items. Unavailable sources are omitted and their weights redistributed among eligible sources. If none are eligible the session stops. A followed-channel selection first chooses a channel uniformly, then a cached clip; these clips may repeat. Self clips always use the existing Self Clip Shoutouts cycle/history.

## Playback and recovery

The players retain their saved presentation, mute and volume settings. Videos do not loop. Video playback is capped at ten minutes per item to avoid a stalled session; clips use the existing player's duration limit. Player acceptance counts are separate from cleared/failed counts and do not prove remote loading, completion or audible OBS output. Keep the overlay renderer available; otherwise a video may reach the timeout without playing.

BRB waits while another player is busy. A newer manual request taking over its player ends the session without stopping the newer media. Stop targets only the saved playback start identity. It does not reclaim unrelated players, change scenes, stop music, or resume interrupted manual media.

An intent is saved before dispatch. Unknown acceptance stops the rotation without automatic retry. Stop reconciles known acceptance and sends a guarded Stop. If it remains unknown, inspect both players before explicitly confirming **Clear unconfirmed ownership**. Clear sends neither playback nor Stop; it cannot prove whether the request played. Start remains blocked until ownership is resolved/cleared. Retained request IDs are deduplicated within bounded ledgers, not forever.

Phone Deck discovers Start, Stop, Toggle, refresh, recovery and status controls. Add cards explicitly in its editor. No existing cards, pairing or TLS settings are changed. The saved mix is configured in the module controls and shared by every caller.

## Backup and status

Back up Streamer.bot's native actions, commands, timers and persisted globals, including `brb.private.state`, before imports or rollback. Private state contains followed clip caches, mix, ownership and bounded operation results. The public status excludes cached clip lists and media paths. Keep private globals out of public exports. Removing the package does not erase native history.

Experimental module. Automated fixtures use synthetic media; verify commands, Phone Deck and visual/audio behavior in your own setup before using it live. First-party code: Sethani, MIT.

Timing update in 1.0.1 requires Shoutout Clips 2.2.1 and Self Clips 1.0.1 to avoid black waits caused by fractional milliseconds or missing self-clip duration metadata. Update/import those two owners, initialize the idle player and refresh own clips. The BRB native action code is unchanged; this package only tightens the dependencies.
