# Scene Links

## Optional Phone Deck controls

Version 2.0.3 adds Apply saved scene link and a status widget. Select an exact saved binding; applying it requires confirmation and executes that binding's saved category/focus behavior without switching OBS scenes or editing mappings. It does not offer arbitrary categories/windows, draft tests or automatic scene handling. Completion uses the existing durable request acknowledgement; partial failures remain partial. Removed bindings stay unavailable. Native action data is unchanged, so no reimport, service, Phone Deck dependency or automatic card is required.

Scene Links 2.0.3 preserves the existing dock editor, Twitch category updates and Windows application focus. First-party code: Sethani, MIT. It requires Companion 1.3.1, Universal Dock and Streamer.bot; Windows focus additionally requires Windows PowerShell. No overlay, service or extra port is installed.

Import the nine actions through Companion. The inventory retains all nine identities; the old Monitor action and queue remain disabled/inert compatibility records. Initialize has native startup/OBS connection registrations. Fresh installations start with empty bindings. Existing version-1 `portable.sceneBindings.config` and state globals are retained without personal fallback seeds. Scene names match exactly; missing scenes and unavailable window targets remain saved.

Save persists only. Actual OBS program-scene changes apply saved links after 350 ms debounce, independently attempting category and focus. Initialize, Refresh and reconnect establish inventory/baselines without applying the current binding. Apply explicitly executes a saved scene; Test Focus and Test Category affect only their respective draft value. Empty fields do nothing. Window focus restores an existing window and attempts foreground activation; it does not launch applications or resize/reposition them. The existing helper is embedded, with no personal filesystem path.

Arguments remain `sceneBindingsMode`, `configJson`, `sceneName`/`obs.sceneName`, `windowJson` and `category`. An optional unique `requestId` correlates persisted terminal `operation` acknowledgements. Dispatch is not completion. Partial failures and unknown outcomes are visible; clients never retry mutations automatically. Twitch category results describe API acceptance, rather than claiming independent remote confirmation. Windows may refuse foreground activation.

Version 2.0.2 retains the latest 32 completed request results in `completedOperations`, including their execution details. Later inventory/events preserve those acknowledgements; request arguments are frozen for the invocation. Older request IDs outside this bounded window are not a permanent transaction journal. Use new IDs for new operations. This release supersedes 2.0.0 and 2.0.1.

Private mappings, window titles, account credentials and OBS snapshots are not distributed. Removing the module does not delete saved globals. The private handoff guards old Node callers and retains their original configuration only for rollback. Full Phone Deck extraction is separate. Back up Streamer.bot before replacing actions and restore files only while it is closed.
