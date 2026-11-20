# chat-core developer notes

## Implementation and migration reference

Live chat ingestion, moderation, pronouns and PluralMind without the deferred SQLite archive or the personal server. The chat renderer preserves the existing Izzy stream-chat design and first-party enrichment changes. First-party code is Sethani/MIT; upstream stream-chat (Izzy, MIT) and PluralMind 2.1.1 (leahinmoonlight, MIT) notices are included in third-party/.

Install through the catalogue and start Live Chatbox. No Streamer.bot action import is required. Default service port is **3136**, separate from the old Chat Archive on 3129 so it can remain open during testing. Streamer.bot must expose a local unauthenticated WebSocket (default ws://127.0.0.1:8080/). Twitch and YouTube messages/moderation are subscribed once per connection, with reconnect/heartbeat handling. Chat Routing remains a separate outgoing-message module.

Only configuration is persisted. The module never opens, migrates, deletes or packages the old archive database. No viewer history, profile cache, incoming message text or synthetic test state is written to disk or service logs. Existing archive data/automatic-start preferences remain untouched; the new service has its own host-managed automatic-start choice. Stop its own automatic-start separately when rolling back. Rollback: restore the previous Chatbox URL and restart the old Chat Core/archive if needed. Retiring the personal server still requires the other vital feature migrations.
