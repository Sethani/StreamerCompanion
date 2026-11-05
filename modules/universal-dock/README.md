# Universal Dock

Installed module controls, shared Streamer.bot transport, and operator tests.

Requires Companion 1.3.0 or later. Install through the catalogue so dependencies are included. Browser assets are served by Companion; no personal server or static tree is required.

Open controls in Companion; Tests is a separate link. Tests run only on operator clicks and state-changing tests ask for confirmation. Streamer.bot must expose its local WebSocket without authentication (the current shared transport does not implement authentication). No feature action runs automatically.

Version 1.1.0 adds an alphabetical, category-grouped searchable picker and favorites shared with the Companion desktop. Select a module explicitly; filtering and refreshes keep its controls intact. Your selection is remembered locally. Favorites are stored privately by Companion and synchronize between docks. No API installation token is embedded in the page.
