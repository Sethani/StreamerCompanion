# Spotify Music

Control Spotify playback and optional scene/countdown music automation. Viewer commands and now-playing announcements use [Bot Chat Routing](../chat-routing/README.md); the playback service does not send chat directly.

## Connect your account and device

1. Use Companion 1.3.1 or newer, Streamer.bot's local WebSocket server and a Spotify application/account with playback-control access. Spotify's [playback API](https://developer.spotify.com/documentation/web-api/reference/start-a-users-playback) requires Premium for start/resume operations.
2. Install Spotify Music from **Catalogue**. Expand its **Installed** row and choose **Import into Streamer.bot…** for the four supplied actions if missing. Install/import Bot Chat Routing for viewer-facing replies. Existing current imports need no reimport for this guide patch.
3. **Start** Spotify Music and open **Settings** or **Open controls**, also under Media in [Universal Dock](../universal-dock/README.md). Its local service uses port **3127**.
4. Enter the application's **Client ID** and **Client secret**. Register the exact displayed **Callback URL** in the Spotify application's redirect URIs. Spotify allows HTTP for explicit loopback IPs, but not localhost redirects; see its [redirect URI requirements](https://developer.spotify.com/documentation/web-api/concepts/redirect_uri).
5. Press **Save Spotify settings**, then **Authorize Spotify** and complete the browser authorization. A blank Client secret field keeps the saved secret.
6. Open Spotify on the intended computer/device, **Refresh devices**, choose **Playback device**, then save. Use the active device leaves selection to Spotify's current active device.
7. Set **Playlist URL, URI, or ID**, Starting volume, Normal volume and Fade duration in seconds. Save before using them in automation.

Authorization and device availability are separate checks. **Read current song** reads playback without starting a playlist. A successful API request does not prove the audio is audible in OBS.

## Scene-owned music

Under **Scene automation**, enable scene-owned music and **Add scene**. Configure its OBS scene, playlist/volumes/fade and On leaving behavior, then Save Spotify settings. **Autoplay on entering** starts enabled for existing bindings. Turn it off for Starting Soon if you do not want selecting that scene to start music. Guided Stream Launch/countdown playback remains independent.

A configured scene starts music only if it is not already playing. On leaving, Pause if started here pauses only a session this automation started; Keep playing leaves it alone. Already playing music is preserved on entry.

Scene and countdown requests share ownership so leaving Starting Soon does not interrupt an active countdown handoff. If music is manually paused after scene entry, the later guided launch observes that and can start the configured playlist before arming its fade. Default playlist/device/fade settings remain here; [Stream Launch](../stream-launch/README.md) decides when to request them.

## Viewer chat and Phone Deck

Under **Viewer chat**, independently enable !song, !playlist and **Announce each newly playing song**, then save. The imported actions send messages through Chat - All Platforms in Bot Chat Routing. Enabled announcements can send real chat automatically; service errors remain private.

[Phone Deck](../phone-deck/README.md) optionally offers Resume playback, Pause playback, Play / pause, Next/Previous, volume controls/presets and playback status. Add cards in its editor; no cards appear automatically. The service must be running and authorized. The phone uses server-side credentials and the saved device; it cannot edit credentials/playlists/scene bindings.

Manual Resume continues the current Spotify context instead of starting the countdown playlist. Manual Pause/Resume releases the service's scene/countdown ownership and fade. Manual volume cancels the active fade; Next/Previous retain ownership. Saved automation settings stay intact.

Commands report Requested when Spotify accepts them, with no automatic retry. Status reports track/artist/playback/volume but does not prove audible output. Check the device before retrying an uncertain result.

## Troubleshooting, updates and backup

For authorization failures, check application credentials, the exact allowed callback and account access. For a missing device, open Spotify there and refresh devices. For missing chat replies, check the optional chat switches/native imports and Bot Chat Routing. Avoid changing scenes as a diagnostic unless you intend their saved automation to run.

Update between sessions when no fade or scene/countdown ownership needs preserving: package installation restarts this service. It does not overwrite private settings, but in-memory automation ownership is temporary. No Companion rebuild is needed.

Client credentials, refresh tokens, device IDs, playlists and scene preferences are private in `module-data/spotify`. Back up that directory with the service stopped; do not share it. Health responses omit secrets and packages contain no personal data. Restarts should not be used as a playback test.
