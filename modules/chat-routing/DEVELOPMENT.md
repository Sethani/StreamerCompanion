# chat-routing developer notes

## Implementation and migration reference

Import the four actions through Companion. No service, overlay, command, startup trigger, credential or automatic send is installed. Streamer.bot owns account authentication. Installation/verification does not send a message. A live message test requires an explicit operator action; automated tests use synthetic sinks only.

There is no public test button that sends chat on page load or installation. Verify bot account/reply behavior through your normal caller only when ready for a controlled live message. Reminders privacy and launch announcements remain separate acceptance scopes.

