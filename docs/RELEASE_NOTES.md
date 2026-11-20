## Companion 1.4.1 — usability polish preview

Built-in Help provides getting-started instructions and module configuration guides in Companion and Universal Dock. Installed modules show clearer names, categories and optional integrations. Developer tools and engineering documentation stay hidden unless explicitly enabled.

Independent module updates include Sound Player, the visual Live Chatbox normal/ticker URL designer and isolated sample preview, and separate command exclusion in Chat Archive. Existing copied chatbox URLs remain unchanged. Phone Deck integrations preserve existing cards; new cards are added explicitly.

Upgrade Companion before Universal Dock 1.1.4, which requires Companion 1.4.1 for Help. Module updates remain independent of the application. Guide/label-only updates need no Streamer.bot reimport; functional Sound Player/Walk Ons adoption has its own documented action/import steps. Keep existing OBS URLs until deliberately adopting alternatives.

Back up application settings, module data and the chat archive before adoption. Close the old Companion before replacing the application. Any active Widgets renderer must complete its documented ownership handoff before a host restart; a timeout is not proof that a renderer has closed. Preserve phone pairing/TLS, cards, favorites and automatic-start choices. No stream, recording, outgoing chat or real redeem test is required for this upgrade.

This is an experimental preview. Named Raffles and personal checklist/Wheel-result integration remain planned features and are not included.

## Previous previews

Experimental application release by Sethani, under MIT for first-party code.

Companion 1.3.3 removes the retired legacy settings-import desktop hook. Controller 1.1.2 removes its personal-layout JSON picker and reader. Existing module data, automatic starts, pairing and normal installed-data upgrades are preserved. Streamer.bot action imports, media imports and Video/Wheel backup import/export stay available. No Streamer.bot reimport is needed.

Companion 1.3.2 distinguishes missing packages from installed dependencies waiting for Streamer.bot/import verification. Automatic services blocked during boot remain pending and start once their dependencies are ready. Manual Stop/Stop all is retained. Browser assets remain available while native verification waits. Native availability is checked in the background; you do not need to race Companion and Streamer.bot. Navigation reload uses its saved scroll position without competing browser history restoration.

Related independent module repairs: Spotify 2.0.4 adds per-scene entry autoplay without changing stream-launch music; Universal Dock 1.1.2/Universal Overlay 1.0.1 reconcile current-scene routing; Phone Deck 2.0.3 recovers failed initial page loads and stalled OBS/native read connections without retrying commands. Existing module settings, actions, pairing/TLS, cards and automatic-start preferences are preserved. No Streamer.bot import/restart is required for these fixes.

Companion 1.3.1 adds private audio media imports for static modules. Audio files are copied under module data, never included in packages, and served only from the loopback public-media route with range support. Installed rows identify audio modules with an **Import audio** control. Existing Video media behavior is unchanged.

Universal Dock 1.1.1 supports more than one state/action transport in a single installed module. Walk Ons 2.1.0 uses that support for its roster and audio player while retaining the same stable Streamer.bot actions, commands and persisted globals. Upgrade Companion first, then Universal Dock. Existing favorites, navigation, service data and automatic-start choices are retained.

Companion 1.3.0 replaces the stacked desktop lists with Installed, Catalogue and Settings tabs. Installed modules appear once, with their service controls attached. Alphabetical category groups, compact expandable rows, accent-insensitive search, status filters and attention/update counts keep larger libraries manageable. Navigation and scroll are remembered locally. Favorites are shared with Universal Dock 1.1.0 through a narrowly scoped local preferences API; the installation bearer token is never exposed to browser pages.

Upgrade the application first, then update Universal Dock to 1.1.0. Its new searchable alphabetical picker preserves the selected controls while browsing or starring modules. Existing OBS dock URLs remain valid. No Streamer.bot reimport is required for this navigation update. Close the previous Companion before opening the new build; installed modules, private data and automatic-start choices use the same preview profile.

Companion 1.2.2 supports service-backed packaged overlay replacements without automatically embedding them into the old legacy aggregate. The new independently distributed Archipelago 1.0.0 module offers a Controller-populated room dropdown, per-room slot checkboxes and one stable OBS URL. Progress, goals, fresh logic and selected live activity follow saved choices; SlotLock filtering defaults on. Room passwords, YAML setup, parsing and analysis remain in Controller. No Streamer.bot export is required for Archipelago. Optional authenticated Wake/Refresh/Recalculate actions are explicit user controls, never automatic.

Companion 1.2.1 carries over the existing Companion icon for the application window and Windows executable. **Import into Streamer.bot…** now explains the manual import process and offers **Copy import code** or **Show import file**, avoiding Windows file-association prompts. Paste the code into Streamer.bot's Import String field, review the actions and complete the import there. No actions are imported automatically. Module releases and saved module data are unchanged.

Application downloads are now separate from [module distribution](https://github.com/Sethani/StreamerCompanion-Modules). Click Check for updates to read that repository's catalogue folder. Each module has an independent release; updating one does not rebuild/publish the application or unrelated modules. This app release contains only the portable Windows app and its checksum.

Companion 1.2.0 hosts packaged browser assets and explicitly selected private media. Universal Dock (including Tests), Universal Overlay and Source Modules are independent modules. Video 2.2.0 includes its own editor/renderer and installs those dependencies together. No personal static tree or monolithic server is included.

Upgrade the host before installing browser modules. Imports remain explicit even when old action names already show as verified. Back up, import Source Modules and Video, initialize both, configure routing and relink legacy media before a controlled cutover. See the Video README. Hash verification, private-data preservation and rollback remain supported.

Preview 2 keeps the Streamer.bot import button available for modules that already show Ready, so existing named actions can receive updated code. Module packages are unchanged from preview 1.

Preview 3 preserves the old UI registry shape and prevents legacy cross-origin overlays from automatically embedding the new aggregate/Video renderer. This keeps installation separate from an explicit OBS cutover. Module packages remain unchanged.

Host self-update and silent installation are not supported. Keep backups, retain the complete Windows application directory and close another Companion instance before launching. Streamer.bot imports remain an explicit user operation. Legacy features not yet migrated remain in the personal integration project.
