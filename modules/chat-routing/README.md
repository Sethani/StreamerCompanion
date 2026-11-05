# Chat Routing

Shared outgoing bot messages and replies for modules such as Spotify, Reminders and announcements. First-party code: Sethani, MIT. This is separate from incoming chat ingestion/rendering and from the deferred chat archive.

Import the four actions through Companion. No service, overlay, command, startup trigger, credential or automatic send is installed. Streamer.bot owns account authentication. Installation/verification does not send a message. A live message test requires an explicit operator action; automated tests use synthetic sinks only.

`Chat - All Platforms` and `Chat - Twitch` preserve their existing action IDs and caller arguments: `chatMessage`, `chatTargets`, `chatIsReply`, `chatReplyId` and `chatReplyUser`. Internal Engine and Twitch Send actions are part of the same self-contained export. Other action groups are not rewritten by the module build/import. Existing name-based callers keep their entry points.

The available adapter is currently Twitch. An empty target or `all` selects the available Twitch adapter; explicit `twitch` does the same. Unsupported target names are rejected privately instead of silently posting to the wrong platform. The compatibility name does not claim that other platform adapters exist.

Native Twitch sends preserve the existing `useBot: true` and `fallback: true` configuration. Account selection and fallback behavior remain Streamer.bot's native responsibility. Replies require both a true reply flag and a nonempty resolved reply ID; otherwise a plain message is used. Empty messages and a standalone unresolved argument placeholder are not sent. Message contents are not echoed in diagnostic logs. Platform message-length rules remain the native adapter's responsibility.

There is no public test button that sends chat on page load or installation. Verify bot account/reply behavior through your normal caller only when ready for a controlled live message. Reminders privacy and launch announcements remain separate acceptance scopes.
