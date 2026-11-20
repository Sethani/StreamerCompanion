# spotify developer notes

## Implementation and migration reference

Commands show **Requested** after Spotify accepts the API request. The widget independently reads playback, track, artist and volume; it does not prove audible output. No automatic mutation retry occurs. The owner stores recent request IDs privately to prevent duplicate dispatch after a lost response or service restart. Its narrow `/api/spotify/phone-deck/` endpoints enforce exact loopback Host/Origin and a session CSRF token. Existing native exports are unchanged; no Streamer.bot reimport is needed for this patch.
