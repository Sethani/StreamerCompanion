# Update Probe

A first-party test module by Sethani, under MIT. It provides a local version/health page and has no streaming integrations, credentials, chat, playback or overlays.

Use it to test catalogue installation, service restart, updates and private-data preservation before migrating a production module. The default loopback port is 3140. Installation leaves the service stopped; start it explicitly if desired. Module data lives in Companion's private `module-data/update-probe` folder and is retained across updates.
