# Chat Archive

Keep optional, private chat history that you can search and export on this computer. Chat Archive receives messages from [Live Chatbox](../chat-core/README.md); it has no audience overlay and sends no chat messages.

## Enable capture

1. Install Live Chatbox and make sure its service is receiving the platforms you want. Chat Archive 1.2.1 requires Live Chatbox 1.4.1 or later and uses its local feed on port **3136**.
2. Install Chat Archive from **Catalogue**. Expand its **Installed** row, **Start** the service and choose **Open controls** or **Settings**. It is also available in [Universal Dock](../universal-dock/README.md).
3. Expand **Archive settings** and check **Archive incoming chat**. Capture starts disabled on a fresh installation.
4. Choose **Retention (days)**, whether to **Include announcements**, and whether to **Retain text after moderator deletion**. Press **Save settings**.

No Streamer.bot action import or OBS source is needed. The archive's local controls use port **3146**. Keep both services running for capture. Messages missed while capture is off or disconnected cannot be recovered: the feed has no replay or backfill.

## Exclude commands

In **Archive settings**, optionally enable **Exclude commands from the archive** and choose a literal **Command prefix** (default `!`). This defaults off and is independent of every chatbox filter. Classification uses original message text after leading whitespace, before enrichment.

When enabled, new matching messages are skipped and matching stored messages are hidden from searches, counts, pagination and both exports without deleting them. Turning exclusion off reveals stored messages again. Skipped messages cannot be recovered. Changing the prefix immediately changes which retained original texts match. Moderator text removal still takes precedence: once original text has been scrubbed, its old prefix cannot be reclassified.

## Search and export

Enter **Message contains**, **User or member**, Platform, date or Moderation filters, then **Search**. Use Previous and Next to move through results, and Clear filters to reset the search. Search matches literal substrings, not SQL or full-text expressions; case-insensitive matching mainly covers ASCII characters.

**From (UTC)** and **Through (UTC)** filter by UTC dates. Result timestamps are displayed in your computer's local timezone.

**Export CSV** and **Export JSON** use the last submitted search filters, including all matching rows up to **10,000** per export rather than just the displayed page. After changing filters, press Search before exporting. Split larger archives into narrower date/platform searches. CSV neutralizes spreadsheet formula prefixes; JSON retains exact stored values.

History remains searchable with capture disabled. Stopping capture or this service does not stop the live chat overlay. Twitch and YouTube identities remain separate. Account profiles and PluralMind member profiles are stored once and referenced by messages. Search and exports show their current known names/pronouns, so a later successful lookup also updates older entries. Original message text/times and the member associated with each message are preserved. Unknown lookups do not erase known pronouns; confirmed removals can clear them. Display names, member details and pronouns update when Live Chatbox supplies them; deleted messages cannot be restored by later enrichment. Synthetic Live Chatbox tests and synthetic clears are excluded.

## Retention and deleted text

Retention defaults to **30 days** and accepts 1–3650 days. Expired messages are cleaned at startup, hourly, when settings are saved, or with **Clean expired messages**. Shortening retention takes effect when saved.

Moderator-deleted messages remain marked as deleted, with their text removed by default. Retaining deleted text requires explicit opt-in. Turning that option off also scrubs previously retained deleted text. These are application-level deletions, not a guarantee of forensic erasure from disks or backups.

## Troubleshooting and private backups

If status says Waiting for Live Chatbox, check its service and connection. A connected local feed does not recover messages already missed. Do not rely on this archive as a complete moderation audit log across outages.

If settings changed in another window, use **Reload saved settings**, review the current values and reapply your edits. Unsaved edits require confirmation before reload. Failed mutations are not automatically retried.

The private module-data directory contains configuration and a SQLite database, `chat.sqlite`. **Stop Chat Archive before copying its database for a backup.** Do not copy a live SQLite file without its WAL; a lone live database file may omit recent changes. Keep the database, settings, WAL when present and exports private: they can contain viewer information. Package updates preserve module data.

Chat Archive has no Phone Deck contribution. Its history management stays in the local controls, protected by loopback/same-origin checks; the phone receives no archive rows or exports.

## Shared-profile database upgrade

The first start of 1.2.0 transactionally migrates the earlier per-message profile storage. It creates a consistent private `chat.before-v2-*.sqlite` backup first, checks row counts and references, and compacts the active database when possible. Ordinary current pronouns are backfilled from the latest known nonempty historical value; older empty fields cannot distinguish a missed lookup from a confirmed removal. New feed data supplies that distinction.

Older member entries lack stable member IDs. They remain separate legacy profiles within their original account instead of being guessed into a current member. New member messages use stable system/member IDs, so two members with the same name remain distinct. Unchanged original/displayed message text is stored once. Fixed table/index overhead means the size benefit depends on archive size; retained safety backups temporarily use additional space.

Migration backups contain private history and are outside normal message-retention cleanup. Keep them until you have verified the upgrade; remove unneeded backups deliberately afterward. Rolling back to an older module also requires restoring its compatible database backup while the service is stopped. Do not point an older module at the upgraded schema.
