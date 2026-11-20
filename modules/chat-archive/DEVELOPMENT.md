# chat-archive developer notes

Stopping/disabling Archive does not affect live rendering. Existing history remains searchable when capture is off. Messages during disconnection or while disabled cannot be recovered: the live feed has no replay/backfill. Reconnect resumes future events without re-sending chat. Do not rely on it as a complete moderation audit log across outages. The original private prototype/history is not imported, modified or bundled. There is no legacy-settings import control.

